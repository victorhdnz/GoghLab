'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface StorySectionProps {
  title?: string
  content?: string
  images?: string[] // Array de imagens
  image?: string // Mantido para compatibilidade
  foundersNames?: string
  backgroundColor?: string
  textColor?: string
  elementVisibility?: {
    title?: boolean
    content?: boolean
    images?: boolean
  }
}

export const StorySection = ({
  title = '✍️ NOSSA HISTÓRIA',
  content = 'A MV Company nasceu com o propósito de transformar negócios através de serviços digitais de alta qualidade.\n\nSomos especialistas em criação de sites, tráfego pago, criação de conteúdo e gestão de redes sociais.',
  images,
  image, // Compatibilidade com versão antiga
  foundersNames,
  backgroundColor = '#000000',
  textColor = '#ffffff',
  elementVisibility = {
    title: true,
    content: true,
    images: true,
  },
}: StorySectionProps) => {
  const [siteName, setSiteName] = useState<string>('MV Company')

  useEffect(() => {
    const loadSiteName = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('site_settings')
          .select('site_name')
          .limit(1)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar nome do site:', error)
          return
        }

        if (data?.site_name) {
          setSiteName(data.site_name)
        }
      } catch (error) {
        console.error('Erro ao carregar nome do site:', error)
      }
    }
    loadSiteName()
  }, [])
  // Usar images se disponível, senão usar image como fallback
  const displayImages = images && images.length > 0 
    ? images 
    : (image ? [image] : [])
  
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    if (displayImages.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % displayImages.length)
  }

  const prevSlide = () => {
    if (displayImages.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }

  // Resetar índice quando as imagens mudarem
  useEffect(() => {
    setCurrentIndex(0)
  }, [displayImages])

  // Auto-play do carrossel
  useEffect(() => {
    if (displayImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % displayImages.length
        return nextIndex
      })
    }, 4000) // Troca a cada 4 segundos

    return () => clearInterval(interval)
  }, [displayImages, displayImages.length])

  return (
    <section className="py-20" style={{ backgroundColor, color: textColor }}>
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

        <div className={`grid grid-cols-1 ${elementVisibility.content && elementVisibility.images ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-12 items-center max-w-6xl mx-auto`}>
          {/* Texto */}
          {elementVisibility.content && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={!elementVisibility.images ? 'lg:col-span-1 max-w-2xl mx-auto' : ''}
            >
              <div className="text-lg md:text-xl text-gray-700 whitespace-pre-line leading-relaxed">
                {content}
              </div>
            {foundersNames && (
              <div className="mt-6 pt-6 border-t border-gray-300">
                <p className="text-lg font-semibold text-gray-900">
                  {foundersNames}
                </p>
                <p className="text-sm text-gray-600 mt-1">Fundadores da {siteName}</p>
              </div>
            )}
            </motion.div>
          )}

          {/* Carrossel de Imagens - Estilo Modal */}
          {elementVisibility.images && (
            <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`relative ${!elementVisibility.content ? 'lg:col-span-1 max-w-2xl mx-auto' : ''}`}
          >
            {displayImages.length > 0 ? (
              <div className="relative group z-0">
                {/* Imagem Principal */}
                <div className="relative aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden shadow-2xl z-0">
                  <Image
                    key={currentIndex}
                    src={displayImages[currentIndex]}
                    alt={`Nossa história - Foto ${currentIndex + 1}`}
                    fill
                    className="object-cover"
                    priority={currentIndex === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={false}
                  />
                </div>

                {/* Botões de Navegação */}
                {displayImages.length > 1 && (
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
                {displayImages.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {displayImages.map((_, index) => (
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
                {displayImages.length > 1 && (
                  <div className={`grid gap-2 mt-4 relative z-10 ${displayImages.length <= 4 ? 'grid-cols-4' : 'grid-cols-4 overflow-x-auto pb-2'}`}>
                    {displayImages.map((img, index) => (
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
                          src={img}
                          alt={`Nossa história - Miniatura ${index + 1}`}
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
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-gray-600">Foto dos donos na loja</p>
                </div>
              </div>
            )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

