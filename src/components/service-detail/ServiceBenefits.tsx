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
    { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', iconBg: 'bg-orange-500/30' },
    { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', iconBg: 'bg-red-500/30' },
    { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', iconBg: 'bg-yellow-500/30' },
    { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-300', iconBg: 'bg-gray-500/30' },
  ]

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-black via-gray-950 to-black text-white relative">
      <div className="container mx-auto max-w-7xl">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {(content.benefits_items || []).map((item, index) => {
              const colors = accentColors[index % accentColors.length]

              return (
                <div
                  key={item.id}
                  className="relative group"
                >
                  {/* Card maior com design sofisticado */}
                  <div className={`h-full rounded-2xl ${colors.bg} ${colors.border} border-2 p-8 md:p-10 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
                    {/* Ícone centralizado no topo */}
                    <div className="mb-6">
                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl ${colors.iconBg} ${colors.border} border-2 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                        {item.icon ? (
                          item.icon.startsWith('http') ? (
                            <Image
                              src={item.icon}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          ) : (
                            <span className="text-4xl md:text-5xl">{item.icon}</span>
                          )
                        ) : (
                          <span className="text-4xl md:text-5xl">✓</span>
                        )}
                      </div>
                    </div>

                    {/* Título - Fonte bold e maior */}
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white leading-tight">
                      {item.title}
                    </h3>

                    {/* Descrição breve - Fonte light e menor */}
                    {item.description && (
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light flex-1">
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

