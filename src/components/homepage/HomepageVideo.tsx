'use client'

import { PointerHighlight } from '@/components/ui/pointer-highlight'
import { 
  getYouTubeId, 
  getYouTubeEmbedUrl,
  getYouTubeContainerClasses 
} from '@/lib/utils/youtube'

interface HomepageVideoProps {
  enabled?: boolean
  videoUrl?: string
  videoAutoplay?: boolean
  title?: string
  subtitle?: string
}

// Função para dividir o título e aplicar PointerHighlight na palavra "nós"
function renderTitleWithHighlight(title: string) {
  if (!title) return null

  // Procurar pela palavra "nós" (case insensitive, com acentuação)
  const regex = /(\b[nN]ós\b)/i
  const parts = title.split(regex)

  if (parts.length === 1) {
    // Se não encontrar "nós", retornar o título normal
    return <>{title}</>
  }

  return (
    <>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          // Aplicar PointerHighlight na palavra "nós"
          return (
            <PointerHighlight 
              key={index} 
              rectangleClassName="border-gogh-yellow" 
              pointerClassName="text-gogh-yellow"
            >
              <span className="inline">{part}</span>
            </PointerHighlight>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

export function HomepageVideo({ enabled = true, videoUrl, videoAutoplay = false, title, subtitle }: HomepageVideoProps) {
  if (!enabled) return null

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Título com animação Pointer Highlight - Antes do vídeo */}
      {title && (
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gogh-black tracking-tight mb-4 md:mb-6 leading-tight">
            {renderTitleWithHighlight(title)}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-gogh-grayDark mt-4 md:mt-6">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Vídeo Principal - apenas YouTube */}
      {youtubeId && videoUrl ? (() => {
        const containerClasses = getYouTubeContainerClasses(videoUrl)
        const embedUrl = getYouTubeEmbedUrl(videoUrl, videoAutoplay, videoAutoplay)
        return (
          <div className={`relative ${containerClasses.wrapper}`}>
            <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
              <div className="bg-black rounded-lg overflow-hidden">
                <div className={`relative ${containerClasses.aspectRatio} bg-black`}>
                  <iframe
                    src={embedUrl || ''}
                    title={title || 'Vídeo sobre nós'}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })() : (
        <div className="relative max-w-[400px] mx-auto">
          <div className="aspect-[9/16] w-full flex items-center justify-center bg-gogh-beige-light border border-gogh-yellow/20 rounded-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-gogh-grayDark text-lg">Vídeo não adicionado</p>
              <p className="text-gogh-grayDark/70 text-sm mt-2">Adicione uma URL do YouTube no editor</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
