'use client'

import { ServiceDetailContent, BenefitItem } from '@/types/service-detail'
import Image from 'next/image'

interface ServiceBenefitsProps {
  content: ServiceDetailContent
}

export function ServiceBenefits({ content }: ServiceBenefitsProps) {
  if (!content.benefits_enabled) return null

  const hasItems = content.benefits_items && content.benefits_items.length > 0

  // Cores de destaque estratégicas
  const accentColors = [
    { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', icon: 'bg-orange-500/30' },
    { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', icon: 'bg-red-500/30' },
    { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', icon: 'bg-yellow-500/30' },
    { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-300', icon: 'bg-gray-500/30' },
  ]

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-black via-gray-950 to-black text-white relative">
      <div className="container mx-auto max-w-5xl">
        {content.benefits_title && (
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            {content.benefits_title}
          </h2>
        )}

        {!hasItems ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum benefício adicionado ainda</p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {(content.benefits_items || []).map((item, index) => {
              const colors = accentColors[index % accentColors.length]
              const isLast = index === (content.benefits_items || []).length - 1

              return (
                <div key={item.id} className="relative">
                  {/* Linha da trilha */}
                  {!isLast && (
                    <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-gray-700/50 via-gray-600/30 to-transparent" />
                  )}

                  <div className="flex items-start gap-6 md:gap-8 group">
                    {/* Ícone destacado */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                        {item.icon ? (
                          item.icon.startsWith('http') ? (
                            <Image
                              src={item.icon}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          ) : (
                            <span className="text-3xl md:text-4xl">{item.icon}</span>
                          )
                        ) : (
                          <span className="text-3xl md:text-4xl">✓</span>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 pt-2">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white leading-tight">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light">
                          {item.description}
                        </p>
                      )}
                    </div>
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

