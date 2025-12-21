'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from './Button'
import { ImageEditor } from './ImageEditor'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  showMediaManager?: boolean
  cropType?: 'banner' | 'square' | 'custom' // Tipo de crop: banner = horizontal, square = Instagram, custom = livre
  aspectRatio?: number // Razão de aspecto (1 = quadrado, 1920/650 = banner, etc)
  targetSize?: { width: number; height: number } // Tamanho alvo final
  recommendedDimensions?: string // Texto com dimensões recomendadas
}

export function ImageUploader({ 
  value, 
  onChange, 
  placeholder = "Clique para fazer upload de uma imagem",
  className = "",
  showMediaManager = true,
  cropType = 'square',
  aspectRatio,
  targetSize,
  recommendedDimensions
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar se é uma imagem - verificar múltiplos formatos
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    const isValidImage = imageTypes.includes(file.type) || file.type.startsWith('image/')
    
    // Verificar extensão do arquivo também (para casos onde MIME type pode estar incorreto)
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
    
    if (!isValidImage && !hasValidExtension) {
      toast.error('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, WEBP, SVG)')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    // Mostrar editor ao invés de fazer upload direto
    setSelectedFile(file)
    setShowEditor(true)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEditorSave = (url: string) => {
    setPreview(url)
    onChange(url)
    setShowEditor(false)
    setSelectedFile(null)
  }

  const handleEditorCancel = () => {
    setShowEditor(false)
    setSelectedFile(null)
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
      <div className="relative">
        {preview ? (
          <div className="relative group rounded-lg border overflow-hidden bg-transparent">
            <div className="relative w-full h-48 bg-transparent">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="bg-white text-black hover:bg-gray-100"
              >
                <X size={16} className="mr-2" />
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">{placeholder}</p>
            
            {/* Recomendação de Dimensões */}
            {recommendedDimensions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  📐 Dimensões Recomendadas
                </p>
                <p className="text-xs text-blue-700">
                  {recommendedDimensions}
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={16} className="mr-2" />
                {uploading ? 'Carregando...' : 'Upload e Editar'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showEditor && selectedFile && (
        <ImageEditor
          file={selectedFile}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
          cropType={cropType}
          aspectRatio={aspectRatio}
          targetSize={targetSize}
        />
      )}
    </div>
  )
}

