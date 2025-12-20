'use client'

import { ServiceDetailContent } from '@/types/service-detail'

interface ServiceHeroVideoProps {
  content: ServiceDetailContent
  serviceName: string
}

// Função para detectar se é YouTube e extrair ID
function getYouTubeId(url: string): string | null {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(youtubeRegex)
  return match ? match[1] : null
}

export function ServiceHeroVideo({ content, serviceName }: ServiceHeroVideoProps) {
  if (!content.hero_enabled) return null

  const titleParts = content.hero_title?.split(content.hero_title_highlight || '') || [content.hero_title || serviceName]
  const highlightWord = content.hero_title_highlight || ''
  const highlightColor = content.hero_title_highlight_color || '#00D9FF'
  
  const isYouTube = content.hero_video_url ? !!getYouTubeId(content.hero_video_url) : false
  const youtubeId = content.hero_video_url ? getYouTubeId(content.hero_video_url) : null

  return (
    <section className="relative bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-12 md:py-20 px-4 overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Título com destaque - Antes do vídeo */}
        <div className="text-center space-y-4 mb-8">
          {content.hero_title && (
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm inline-block">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                {titleParts[0]}
                {highlightWord && (
                  <span style={{ color: highlightColor }} className="font-extrabold drop-shadow-lg">
                    {highlightWord}
                  </span>
                )}
                {titleParts[1]}
              </h1>
            </div>
          )}
          {content.hero_subtitle && (
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4 max-w-3xl mx-auto backdrop-blur-sm">
              <p className="text-lg md:text-xl text-gray-300">
                {content.hero_subtitle}
              </p>
            </div>
          )}
        </div>

        {/* Vídeo Principal - Sempre mostrar placeholder */}
        <div className="mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-800 border-2 border-gray-700/50 shadow-2xl">
            {content.hero_video_url ? (
              isYouTube && youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}${content.hero_video_autoplay ? '?autoplay=1&mute=1' : ''}`}
                  title={content.hero_title || serviceName}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={content.hero_video_url}
                  autoPlay={content.hero_video_autoplay}
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-gray-400 text-lg">Vídeo não adicionado</p>
                  <p className="text-gray-500 text-sm mt-2">Adicione um vídeo no editor</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

