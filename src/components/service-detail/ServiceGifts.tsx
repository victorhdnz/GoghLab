'use client'

import { ServiceDetailContent, GiftItem } from '@/types/service-detail'
import Image from 'next/image'

interface ServiceGiftsProps {
  content: ServiceDetailContent
}

export function ServiceGifts({ content }: ServiceGiftsProps) {
  if (!content.gifts_enabled) return null

  const hasItems = content.gifts_items && content.gifts_items.length > 0

  return (
    <section className="py-16 md:py-24 px-4 bg-black text-white">
      <div className="container mx-auto max-w-6xl">
        {content.gifts_title && (
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
            {content.gifts_title}
          </h2>
        )}

        {!hasItems ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/40 border-2 border-dashed border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm">
              <p className="text-gray-400 text-lg">Nenhum presente adicionado ainda</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {content.gifts_items.map((item, index) => {
            // Cores de destaque estratégicas para badges
            const badgeColors = [
              'bg-gray-800/90 border-orange-500/40 text-orange-300', // Laranja
              'bg-gray-800/90 border-red-500/40 text-red-300', // Vermelho
              'bg-gray-800/90 border-yellow-500/40 text-yellow-300', // Amarelo
              'bg-gray-800/90 border-blue-500/40 text-blue-300', // Azul
            ]
            const badgeColor = badgeColors[index % badgeColors.length]

            return (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all group backdrop-blur-sm"
              >
                {/* Badge Glassmorphism com cor fosco */}
                {item.badge_text && (
                  <div className={`absolute top-4 left-4 z-10 px-4 py-2 ${badgeColor} backdrop-blur-md border-2 rounded-full shadow-lg`}>
                    <span className="text-sm font-semibold">{item.badge_text}</span>
                  </div>
                )}

              {/* Image - Sempre mostrar placeholder */}
              <div className="relative aspect-video w-full border-2 border-gray-700/50">
                {item.image ? (
                  <>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎁</div>
                      <p className="text-gray-400 text-lg">Imagem não adicionada</p>
                      <p className="text-gray-500 text-sm mt-2">Adicione uma imagem no editor</p>
                    </div>
                  </div>
                )}
              </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-300 text-base">{item.description}</p>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        )}
      </div>
    </section>
  )
}

