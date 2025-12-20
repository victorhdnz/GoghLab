'use client'

import { ServiceDetailContent } from '@/types/service-detail'
import Image from 'next/image'

interface ServiceAboutProps {
  content: ServiceDetailContent
}

export function ServiceAbout({ content }: ServiceAboutProps) {
  if (!content.about_enabled) return null

  return (
    <section className="py-16 md:py-24 px-4 bg-black text-white">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image - Sempre mostrar placeholder */}
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-700/50 shadow-2xl">
            {content.about_image ? (
              <>
                <Image
                  src={content.about_image}
                  alt="Quem somos nós"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
                <div className="text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-400 text-lg">Imagem não adicionada</p>
                  <p className="text-gray-500 text-sm mt-2">Adicione uma imagem no editor</p>
                </div>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            {content.about_title && (
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-3xl md:text-5xl font-bold text-white">{content.about_title}</h2>
              </div>
            )}
            {content.about_text && (
              <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                  {content.about_text}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

