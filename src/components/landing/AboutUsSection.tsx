'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface AboutUsSectionProps {
  title?: string
  description?: string
  storeImages?: string[] // Array de imagens
  storeImage?: string // Mantido para compatibilidade
  foundersNames?: string
  location?: string
  backgroundColor?: string
  textColor?: string
  elementVisibility?: {
    title?: boolean
    description?: boolean
    images?: boolean
    location?: boolean
  }
}

export const AboutUsSection = ({
  title = '🏢 SOBRE A MV COMPANY',
  description = 'A MV Company é uma prestadora de serviços digitais especializada em transformar a presença online de empresas.\n\nOferecemos criação de sites profissionais, gestão de tráfego pago, criação de conteúdo estratégico e gestão completa de redes sociais.',
  storeImages,
  storeImage, // Compatibilidade com versão antiga
  foundersNames,
  location = 'Shopping Planalto, Uberlândia/MG',
  backgroundColor = '#000000',
  textColor = '#ffffff',
  elementVisibility = {
    title: true,
    description: true,
    images: true,
    location: true,
  },
}: AboutUsSectionProps) => {
  // Usar storeImages se disponível, senão usar storeImage como fallback
  const images = storeImages && storeImages.length > 0 
    ? storeImages 
    : (storeImage ? [storeImage] : [])
  
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Resetar índice quando as imagens mudarem
  useEffect(() => {
    setCurrentIndex(0)
  }, [images])

  // Auto-play do carrossel
  useEffect(() => {
    if (images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % images.length
        return nextIndex
      })
    }, 4000) // Troca a cada 4 segundos

    return () => clearInterval(interval)
  }, [images, images.length])

  return (
    <section id="about-us" className="py-20" style={{ backgroundColor, color: textColor }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {elementVisibility.title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{title}</h2>
            <div className="w-24 h-1 bg-gray-900 mx-auto" />
          </motion.div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Descrição */}
          {elementVisibility.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-lg md:text-xl text-gray-700 whitespace-pre-line leading-relaxed">
                {description}
              </p>
            </motion.div>
          )}

          {/* Carrossel de Imagens - Estilo Modal */}
          {elementVisibility.images && (
            <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative max-w-2xl mx-auto"
          >
            {images.length > 0 ? (
              <div className="relative group z-0">
                {/* Imagem Principal */}
                <div className="relative aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden shadow-2xl z-0">
                  <Image
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={`MV Company - Foto ${currentIndex + 1}`}
                    fill
                    className="object-cover"
                    priority={currentIndex === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    quality={95}
                    unoptimized={false}
                  />
                </div>

                {/* Botões de Navegação */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Indicadores */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-3 rounded-full transition-all ${
                          index === currentIndex
                            ? 'bg-black w-8'
                            : 'bg-gray-400 w-3 hover:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Miniaturas - apenas se houver mais de 1 imagem */}
                {images.length > 1 && (
                  <div className={`grid gap-2 mt-4 relative z-10 ${images.length <= 4 ? 'grid-cols-4' : 'grid-cols-4 overflow-x-auto pb-2'}`}>
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          index === currentIndex
                            ? 'border-black scale-105 z-10'
                            : 'border-gray-300 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`MV Company - Miniatura ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 25vw"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏪</div>
                  <p className="text-gray-600">Foto da loja</p>
                </div>
              </div>
            )}
            </motion.div>
          )}

          {/* Localização */}
          {elementVisibility.location && location && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md border border-gray-200">
                <span className="text-2xl">📍</span>
                <p className="text-lg font-semibold text-gray-900">{location}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

