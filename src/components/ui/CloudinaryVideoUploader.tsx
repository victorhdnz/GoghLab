'use client'

import { useState, useRef, useId } from 'react'
import { Upload, X, Video as VideoIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface CloudinaryVideoUploaderProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  /** Pasta no Cloudinary (ex: gallery-videos) */
  folder?: string
  /** ID único do input (obrigatório quando há vários uploaders na mesma página para não abrir sempre o primeiro) */
  inputId?: string
}

// Tipos e extensões para validação no JS (não usar accept no input para evitar erro no iOS)
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo']
const VIDEO_EXT = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi', '.mkv']

export function CloudinaryVideoUploader({
  value,
  onChange,
  placeholder = 'Envie um vídeo (MP4, WebM, etc.)',
  className = '',
  folder = 'gallery-videos',
  inputId: inputIdProp,
}: CloudinaryVideoUploaderProps) {
  const fallbackId = useId()
  const inputId = inputIdProp ?? `cloudinary-video-${fallbackId.replace(/:/g, '')}`
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isValidVideo = (file: File): boolean => {
    if (file.type && VIDEO_TYPES.includes(file.type)) return true
    const name = (file.name || '').toLowerCase()
    return VIDEO_EXT.some((ext) => name.endsWith(ext))
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isValidVideo(file)) {
      toast.error('Selecione um vídeo (MP4, WebM, OGG, MOV, AVI, MKV).')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const text = await res.text()
      let data: { error?: string; url?: string }
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        if (res.status === 413) {
          throw new Error('Vídeo muito grande para upload direto. Tente um arquivo menor ou comprima o vídeo.')
        }
        throw new Error(`Erro no servidor (status ${res.status}). Tente novamente.`)
      }
      if (!res.ok) {
        throw new Error(data.error || 'Erro no upload')
      }
      if (data.url) {
        onChange(data.url)
        toast.success('Vídeo enviado com sucesso!')
      } else {
        throw new Error('Resposta sem URL')
      }
    } catch (err: any) {
      console.error('Upload vídeo:', err)
      toast.error(err.message || 'Erro ao enviar vídeo. Tente novamente.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUrlSubmit = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      toast.error('Cole uma URL válida (ex: https://res.cloudinary.com/...)')
      return
    }
    onChange(trimmed)
    toast.success('URL do vídeo definida.')
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Vídeo (Cloudinary)
      </label>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFile}
        disabled={uploading}
        className="hidden"
        id={inputId}
      />
      {value ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <VideoIcon className="h-5 w-5 text-gray-500 shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1" title={value}>
            Vídeo enviado
          </span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Abrir
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 text-gray-500 hover:text-red-600"
            title="Remover vídeo"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <label
            htmlFor={inputId}
            className={`flex flex-col items-center justify-center gap-2 w-full min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-600 text-center px-2">
              {uploading ? 'Enviando vídeo...' : placeholder}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Ou cole a URL:</span>
            <input
              type="url"
              placeholder="https://res.cloudinary.com/..."
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onBlur={(e) => handleUrlSubmit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleUrlSubmit((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
