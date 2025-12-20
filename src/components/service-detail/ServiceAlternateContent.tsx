'use client'

import { ServiceDetailContent, AlternateContentItem } from '@/types/service-detail'
import Image from 'next/image'

interface ServiceAlternateContentProps {
  content: ServiceDetailContent
}

export function ServiceAlternateContent({ content }: ServiceAlternateContentProps) {
  if (!content.alternate_content_enabled) return null

  const hasItems = content.alternate_content_items && content.alternate_content_items.length > 0

  return (
    <section className="py-16 md:py-24 px-4 bg-black text-white">
      <div className="container mx-auto max-w-7xl space-y-16">
        {!hasItems ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/40 border-2 border-dashed border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm">
              <p className="text-gray-400 text-lg">Nenhum conteúdo alternado adicionado ainda</p>
            </div>
          </div>
        ) : (
          (content.alternate_content_items || []).map((item) => {
          const isImageLeft = item.image_position === 'left' || (item.image_position !== 'right' && item.position === 'left')
          const isImageRight = item.image_position === 'right' || (item.image_position !== 'left' && item.position === 'right')

          const titleParts = item.title?.split(item.title_highlight || '') || [item.title || '']
          const highlightWord = item.title_highlight || ''
          const highlightColor = item.title_highlight_color || '#00D9FF'

          return (
            <div
              key={item.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                isImageLeft ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Image - Sempre mostrar placeholder */}
              <div
                className={`relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-700/50 ${
                  isImageLeft ? 'lg:col-start-1' : 'lg:col-start-2'
                }`}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title || 'Content'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-gray-400 text-lg">Imagem não adicionada</p>
                      <p className="text-gray-500 text-sm mt-2">Adicione uma imagem no editor</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Content */}
              <div className={`space-y-4 ${isImageLeft ? 'lg:col-start-2' : 'lg:col-start-1'}`}>
                {item.title && (
                  <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-2xl md:text-4xl font-bold text-white">
                      {titleParts[0]}
                      {highlightWord && (
                        <span style={{ color: highlightColor }} className="font-extrabold">
                          {highlightWord}
                        </span>
                      )}
                      {titleParts[1]}
                    </h3>
                  </div>
                )}
                {item.description && (
                  <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
                    <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
          })
        )}
      </div>
    </section>
  )
}

