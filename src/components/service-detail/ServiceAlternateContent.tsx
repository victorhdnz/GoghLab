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
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-black via-gray-950 to-black text-white">
      <div className="container mx-auto max-w-7xl space-y-20 md:space-y-24">
        {!hasItems ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum conteúdo alternado adicionado ainda</p>
          </div>
        ) : (
          (content.alternate_content_items || []).map((item) => {
          const isImageLeft = item.image_position === 'left' || (item.image_position !== 'right' && item.position === 'left')
          const isImageRight = item.image_position === 'right' || (item.image_position !== 'left' && item.position === 'right')


          return (
            <div
              key={item.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                isImageLeft ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Image - Sempre mostrar placeholder */}
              <div
                className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-900/30 ${
                  isImageLeft ? 'lg:col-start-1' : 'lg:col-start-2'
                }`}
              >
                {item.image ? (
                  <>
                    <Image
                      src={item.image}
                      alt={item.title || 'Content'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center border border-gray-800/50 rounded-2xl">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-gray-400 text-lg">Imagem não adicionada</p>
                      <p className="text-gray-500 text-sm mt-2">Adicione uma imagem no editor</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Content - Sem cards, texto direto */}
              <div className={`space-y-6 ${isImageLeft ? 'lg:col-start-2' : 'lg:col-start-1'}`}>
                {item.title && (
                  <h3 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                    {item.title}
                  </h3>
                )}
                {item.description && (
                  <p className="text-gray-300 text-lg md:text-xl leading-relaxed whitespace-pre-line font-light">
                    {item.description}
                  </p>
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

