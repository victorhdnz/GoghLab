'use client'

import { ServiceDetailContent } from '@/types/service-detail'
import Image from 'next/image'

interface ServiceAboutProps {
  content: ServiceDetailContent
}

export function ServiceAbout({ content }: ServiceAboutProps) {
  if (!content.about_enabled) return null

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-black via-gray-950 to-black text-white">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image - Sempre mostrar placeholder */}
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gray-900/30">
            {content.about_image ? (
              <>
                <Image
                  src={content.about_image}
                  alt="Quem somos nós"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center border border-gray-800/50 rounded-2xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-400 text-lg">Imagem não adicionada</p>
                  <p className="text-gray-500 text-sm mt-2">Adicione uma imagem no editor</p>
                </div>
              </div>
            )}
          </div>

          {/* Text Content - Sem cards, texto direto */}
          <div className="space-y-6">
            {content.about_title && (
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                {content.about_title}
              </h2>
            )}
            {content.about_text && (
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed whitespace-pre-line font-light">
                {content.about_text}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

