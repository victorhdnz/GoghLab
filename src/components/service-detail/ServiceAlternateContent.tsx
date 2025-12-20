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

          // Processar título com destaque, garantindo espaçamento adequado
          let titleParts: string[] = []
          let highlightWord = item.title_highlight || ''
          const highlightColor = item.title_highlight_color || '#00D9FF'
          
          if (item.title && highlightWord) {
            // Dividir o título pela palavra destacada
            const parts = item.title.split(highlightWord)
            if (parts.length === 2) {
              // Garantir que há espaço antes e depois da palavra destacada
              titleParts = [
                parts[0].trimEnd(), // Remove espaços no final da primeira parte
                parts[1].trimStart() // Remove espaços no início da segunda parte
              ]
            } else {
              // Se não encontrou a palavra, usar o título completo
              titleParts = [item.title]
              highlightWord = ''
            }
          } else {
            titleParts = [item.title || '']
            highlightWord = ''
          }

          return (
            <div
              key={item.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                isImageLeft ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Image - Sempre mostrar placeholder */}
              <div
                className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl ${
                  isImageLeft ? 'lg:col-start-1' : 'lg:col-start-2'
                }`}
              >
                {item.image ? (
                  <>
                    <Image
                      src={item.image}
                      alt={item.title || 'Content'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900/30 border border-gray-800/50 rounded-2xl">
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
                    {titleParts[0]}
                    {highlightWord && (
                      <>
                        {' '}
                        <span style={{ color: highlightColor }} className="font-extrabold">
                          {highlightWord}
                        </span>
                        {' '}
                      </>
                    )}
                    {titleParts[1]}
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

