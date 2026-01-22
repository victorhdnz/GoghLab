'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Video as VideoIcon, Play, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaManager } from '@/components/dashboard/MediaManager'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface VideoUploaderProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  showMediaManager?: boolean
  orientation?: 'horizontal' | 'vertical'
  onOrientationChange?: (orientation: 'horizontal' | 'vertical') => void
}

export function VideoUploader({ 
  value, 
  onChange, 
  placeholder = "Clique para fazer upload de um vídeo",
  className = "",
  showMediaManager = true,
  orientation = 'horizontal',
  onOrientationChange
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { isAuthenticated, isEditor } = useAuth()

  // Atualizar preview quando value mudar externamente
  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar se é um vídeo
    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione apenas arquivos de vídeo')
      return
    }

    // Sem limite de tamanho para vídeos (removido para permitir alta qualidade)

    // Verificar autenticação e permissões
    if (!isAuthenticated) {
      toast.error('Faça login para fazer upload de vídeos')
      return
    }

    if (!isEditor) {
      toast.error('Você não tem permissão para fazer upload de vídeos')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Gerar nome único para o arquivo (sanitizado)
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase()
      
      const fileExt = sanitizedName.split('.').pop() || 'mp4'
      const validExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
      const finalExt = validExtensions.includes(fileExt.toLowerCase()) ? fileExt.toLowerCase() : 'mp4'
      
      // Gerar nome único: timestamp + random + extensão
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${finalExt}`
      const filePath = fileName

      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Faça login para fazer upload de vídeos')
      }

      // Verificar permissões (admin ou editor)
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Erro ao verificar permissões')
      }

      if ((profile as any).role !== 'admin' && (profile as any).role !== 'editor') {
        throw new Error('Apenas administradores e editores podem fazer upload de vídeos')
      }

      // Fazer upload DIRETO para Supabase Storage (seguindo o guia)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos') // Nome do bucket
        .upload(filePath, file, {
          cacheControl: '3600', // Cache de 1 hora
          upsert: false, // Não sobrescrever se existir
          contentType: file.type || `video/${finalExt}`, // Tipo MIME
        })

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        
        // Tratar erros comuns
        let errorMessage = uploadError.message || 'Erro ao fazer upload do vídeo'
        
        if (errorMessage.includes('pattern') || errorMessage.includes('match')) {
          errorMessage = 'Formato de arquivo inválido. Verifique se o arquivo é um vídeo válido.'
        } else if (errorMessage.includes('duplicate') || errorMessage.includes('exists')) {
          errorMessage = 'Um arquivo com este nome já existe. Tente novamente.'
        } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
          errorMessage = 'Erro ao fazer upload do vídeo. Verifique sua conexão e tente novamente.'
        } else if (errorMessage.includes('new row violates row-level security') || errorMessage.includes('row-level security')) {
          errorMessage = 'Erro de permissão. Verifique as políticas RLS do bucket. Execute o SQL em supabase/storage_videos_rls.sql'
        }
        
        throw new Error(errorMessage)
      }

      // Obter URL pública do vídeo
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao obter URL do vídeo')
      }

      setUploadProgress(100)

      setPreview(urlData.publicUrl)
      onChange(urlData.publicUrl)
      toast.success('Vídeo carregado com sucesso!')
    } catch (error: any) {
      console.error('Erro no upload:', error)
      toast.error(error.message || 'Erro ao fazer upload do vídeo')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleMediaSelect = (url: string) => {
    setPreview(url)
    onChange(url)
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Seletor de Orientação */}
      {onOrientationChange && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
          <span className="text-sm font-medium text-gray-700">Orientação do Vídeo:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOrientationChange('horizontal')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                orientation === 'horizontal'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Maximize2 size={16} />
              Horizontal
            </button>
            <button
              type="button"
              onClick={() => onOrientationChange('vertical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                orientation === 'vertical'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Minimize2 size={16} />
              Vertical
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        {preview ? (
          <div className="relative group bg-black rounded-lg overflow-hidden max-w-sm mx-auto">
            <video
              src={preview}
              controls
              className="w-full rounded-lg border aspect-[9/16] object-contain"
              style={{ backgroundColor: '#000000' }}
            />
            <div className="absolute top-2 right-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="bg-white text-black hover:bg-gray-100"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <VideoIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">{placeholder}</p>
            
            {/* Recomendação de Dimensões */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                📐 Dimensões Recomendadas
              </p>
              <p className="text-xs text-blue-700">
                <strong>Vertical:</strong> 1080 x 1920px (9:16)
              </p>
            </div>
            
            <div className="flex gap-2 justify-center flex-col items-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploading}
                disabled={uploading}
              >
                <Upload size={16} className="mr-2" />
                {uploading ? 'Carregando...' : 'Upload'}
              </Button>
              {uploading && uploadProgress > 0 && (
                <div className="w-full max-w-xs mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {uploadProgress}% completo
                  </p>
                </div>
              )}
              {showMediaManager && (
                <MediaManager
                  onSelectMedia={handleMediaSelect}
                  acceptedTypes={['video/*']}
                  maxSizeMB={10000}
                  folder="videos"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

