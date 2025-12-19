'use client'

import { motion } from 'framer-motion'
import { Play, Star, Clock, ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface LandingSettings {
  hero_title: string
  hero_subtitle: string
  hero_cta_text: string
  about_title: string
  about_description: string
  about_image: string
  contact_title: string
  contact_description: string
  showcase_image_1: string
  showcase_image_2: string
  showcase_image_3: string
  showcase_image_4: string
  showcase_video_url: string
  theme_colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
}

interface LandingPreviewProps {
  settings: LandingSettings
  isOpen: boolean
  onClose: () => void
}

export function LandingPreview({ settings, isOpen, onClose }: LandingPreviewProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden">
        {/* Header do Preview */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Pré-visualização da Landing Page</h3>
            <p className="text-sm text-gray-600">Veja como suas alterações ficam na página inicial</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Conteúdo do Preview */}
        <div className="h-full overflow-y-auto" style={{ backgroundColor: settings.theme_colors.background }}>
          {/* Hero Section Preview */}
          <section 
            className="relative min-h-[600px] flex items-center justify-center text-center px-4"
            style={{ 
              backgroundColor: settings.theme_colors.primary,
              color: settings.theme_colors.secondary 
            }}
          >
            <div className="max-w-4xl mx-auto">
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {settings.hero_title || 'Título Principal'}
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl mb-8 opacity-90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {settings.hero_subtitle || 'Subtítulo da seção principal'}
              </motion.p>
              
              <motion.button
                className="px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                style={{ 
                  backgroundColor: settings.theme_colors.accent,
                  color: settings.theme_colors.primary 
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {settings.hero_cta_text || 'Botão de Ação'}
                <ArrowRight className="ml-2 inline" size={20} />
              </motion.button>
            </div>
          </section>

          {/* Galeria de Destaques Preview */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12" style={{ color: settings.theme_colors.primary }}>
                Produtos em Destaque
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Imagens do showcase */}
                {[settings.showcase_image_1, settings.showcase_image_2, settings.showcase_image_3, settings.showcase_image_4].map((image, index) => (
                  <div key={index} className="group cursor-pointer">
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                      {image ? (
                        <Image
                          src={image}
                          alt={`Produto ${index + 1}`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Imagem {index + 1}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2" style={{ color: settings.theme_colors.primary }}>
                      Produto Premium {index + 1}
                    </h3>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">(4.9)</span>
                    </div>
                    <p className="font-bold" style={{ color: settings.theme_colors.accent }}>
                      R$ 299,90
                    </p>
                  </div>
                ))}
              </div>

              {/* Vídeo Preview */}
              {settings.showcase_video_url && (
                <div className="mt-12 text-center">
                  <h3 className="text-2xl font-bold mb-6" style={{ color: settings.theme_colors.primary }}>
                    Vídeo em Destaque
                  </h3>
                  <div className="max-w-md mx-auto">
                    <div className="aspect-[9/16] bg-gray-200 rounded-lg overflow-hidden relative">
                      <video
                        src={settings.showcase_video_url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <Play size={48} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Seção Sobre Preview */}
          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6" style={{ color: settings.theme_colors.primary }}>
                    {settings.about_title || 'Sobre Nós'}
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {settings.about_description || 'Descrição sobre a empresa e seus valores...'}
                  </p>
                </div>
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  {settings.about_image ? (
                    <Image
                      src={settings.about_image}
                      alt="Sobre nós"
                      width={500}
                      height={500}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Imagem Sobre
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Cronômetro Preview */}
          <section 
            className="py-12 px-4"
            style={{ backgroundColor: settings.theme_colors.primary }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-6" style={{ color: settings.theme_colors.secondary }}>
                Oferta por Tempo Limitado!
              </h3>
              <div className="flex justify-center gap-4">
                {['23', '59', '45'].map((time, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold"
                      style={{ 
                        backgroundColor: settings.theme_colors.accent,
                        color: settings.theme_colors.primary 
                      }}
                    >
                      {time}
                    </div>
                    <p className="text-sm mt-2" style={{ color: settings.theme_colors.secondary }}>
                      {['Horas', 'Min', 'Seg'][index]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contato Preview */}
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6" style={{ color: settings.theme_colors.primary }}>
                {settings.contact_title || 'Entre em Contato'}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {settings.contact_description || 'Estamos aqui para ajudar você...'}
              </p>
              <button
                className="px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                style={{ 
                  backgroundColor: settings.theme_colors.accent,
                  color: settings.theme_colors.primary 
                }}
              >
                Falar no WhatsApp
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}