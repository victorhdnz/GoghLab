'use client'

import { ServiceDetailContent, GiftItem } from '@/types/service-detail'
import Image from 'next/image'

interface ServiceGiftsProps {
  content: ServiceDetailContent
}

export function ServiceGifts({ content }: ServiceGiftsProps) {
  if (!content.gifts_enabled) return null

  const hasItems = content.gifts_items && content.gifts_items.length > 0

  // Cores para badges transparentes
  const badgeColors = [
    { border: 'border-orange-500/30', text: 'text-orange-300' },
    { border: 'border-red-500/30', text: 'text-red-300' },
    { border: 'border-yellow-500/30', text: 'text-yellow-300' },
    { border: 'border-gray-500/30', text: 'text-gray-300' },
  ]

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
            <p className="text-gray-400 text-lg">Nenhum presente adicionado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {(content.gifts_items || []).map((item, index) => {
              const badgeColor = badgeColors[index % badgeColors.length]

              return (
                <div
                  key={item.id}
                  className="relative group"
                >
                  {/* Badge transparente no topo */}
                  {item.badge_text && (
                    <div className={`absolute top-4 left-4 z-20 px-4 py-1.5 bg-black/40 backdrop-blur-md ${badgeColor.border} border rounded-full shadow-lg`}>
                      <span className={`text-xs font-semibold ${badgeColor.text} uppercase tracking-wide`}>
                        {item.badge_text}
                      </span>
                    </div>
                  )}

                  {/* Image Container */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden mb-4">
                    {item.image ? (
                      <>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900/30 border border-gray-800/50 rounded-xl">
                        <div className="text-center">
                          <div className="text-5xl mb-3">🎁</div>
                          <p className="text-gray-500 text-sm">Imagem não adicionada</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content - Título e Descrição com fontes diferentes */}
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed font-light">
                        {item.description}
                      </p>
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

