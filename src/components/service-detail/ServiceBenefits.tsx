'use client'

import { ServiceDetailContent, BenefitItem } from '@/types/service-detail'
import Image from 'next/image'

interface ServiceBenefitsProps {
  content: ServiceDetailContent
}

export function ServiceBenefits({ content }: ServiceBenefitsProps) {
  if (!content.benefits_enabled) return null

  const hasItems = content.benefits_items && content.benefits_items.length > 0

  return (
    <section className="py-16 md:py-24 px-4 bg-black text-white">
      <div className="container mx-auto max-w-6xl">
        {content.benefits_title && (
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
            {content.benefits_title}
          </h2>
        )}

        {!hasItems ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/40 border-2 border-dashed border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm">
              <p className="text-gray-400 text-lg">Nenhum benefício adicionado ainda</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {content.benefits_items.map((item, index) => {
            // Cores de destaque estratégicas baseadas no índice
            const accentColors = [
              'bg-orange-500/20 border-orange-500/30 text-orange-400', // Laranja
              'bg-red-500/20 border-red-500/30 text-red-400', // Vermelho
              'bg-yellow-500/20 border-yellow-500/30 text-yellow-400', // Amarelo
              'bg-blue-500/20 border-blue-500/30 text-blue-400', // Azul
            ]
            const accentColor = accentColors[index % accentColors.length]

            return (
              <div
                key={item.id}
                className="relative flex items-start gap-6 p-6 rounded-2xl bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all backdrop-blur-sm"
              >
                {/* Timeline Indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${accentColor} border-2 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    {item.icon ? (
                      item.icon.startsWith('http') ? (
                        <Image
                          src={item.icon}
                          alt={item.title}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-2xl">{item.icon}</span>
                      )
                    ) : (
                      <span className="text-2xl">✓</span>
                    )}
                  </div>
                  {index < content.benefits_items!.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-600/50 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-300 text-base md:text-lg">{item.description}</p>
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

