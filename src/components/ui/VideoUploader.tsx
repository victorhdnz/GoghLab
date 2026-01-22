'use client'

import { useState, useEffect } from 'react'
import { X, Video as VideoIcon, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

interface VideoUploaderProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
}

// Função para detectar se é YouTube e extrair ID (suporta todos os formatos)
function getYouTubeId(url: string): string | null {
  if (!url) return null
  // Regex mais completa que funciona com todos os formatos:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - https://www.youtube.com/watch?v=VIDEO_ID&t=30s
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2] && match[2].length === 11) ? match[2] : null
}

// Função para gerar URL de embed do YouTube
function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeId(url)
  if (!videoId) return null
  return `https://www.youtube.com/embed/${videoId}`
}

// Função para gerar URL de thumbnail do YouTube
function getYouTubeThumbnail(url: string): string | null {
  const videoId = getYouTubeId(url)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

export function VideoUploader({ 
  value, 
  onChange, 
  placeholder = "Cole a URL do vídeo do YouTube",
  className = ""
}: VideoUploaderProps) {
  const [url, setUrl] = useState(value || '')
  const [isValid, setIsValid] = useState(false)

  // Atualizar quando value mudar externamente
  useEffect(() => {
    setUrl(value || '')
    setIsValid(!!getYouTubeId(value || ''))
  }, [value])

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    const valid = !!getYouTubeId(newUrl)
    setIsValid(valid)
    
    if (valid) {
      onChange(newUrl)
      toast.success('URL do YouTube válida!')
    } else if (newUrl.trim() !== '') {
      toast.error('URL do YouTube inválida. Use um link do YouTube (youtube.com ou youtu.be)')
    }
  }

  const handleRemove = () => {
    setUrl('')
    setIsValid(false)
    onChange('')
  }

  const youtubeId = getYouTubeId(url)
  const embedUrl = youtubeId ? getYouTubeEmbedUrl(url) : null
  const thumbnailUrl = youtubeId ? getYouTubeThumbnail(url) : null

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input de URL */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          URL do Vídeo do YouTube
        </label>
        <div className="flex gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 ${isValid ? 'border-green-500' : url.trim() !== '' ? 'border-red-500' : ''}`}
          />
          {url && (
            <button
              onClick={handleRemove}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Cole o link completo do vídeo do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)
        </p>
      </div>

      {/* Preview do YouTube - Formato Vertical */}
      {youtubeId && embedUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <VideoIcon size={16} />
            <span>Preview do vídeo:</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Abrir no YouTube
              <ExternalLink size={14} />
            </a>
          </div>
          <div className="relative max-w-[360px] mx-auto">
            {/* Container com gradiente sutil */}
            <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
              <div className="bg-black rounded-lg overflow-hidden">
                {/* Container vertical 9:16 */}
                <div className="relative aspect-[9/16] bg-black">
                  <iframe
                    src={embedUrl}
                    title="Preview do vídeo"
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder quando não há URL */}
      {!url && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <VideoIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">{placeholder}</p>
          <p className="text-xs text-gray-500">
            Exemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ
          </p>
        </div>
      )}
    </div>
  )
}
