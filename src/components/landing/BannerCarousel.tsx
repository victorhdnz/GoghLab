'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface BannerCarouselProps {
  banners?: string[]
  autoPlayInterval?: number // em milissegundos, padrão 5000ms (5 segundos)
}

export const BannerCarousel = ({ 
  banners = [], 
  autoPlayInterval = 5000 
}: BannerCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalAutoPlay, setModalAutoPlay] = useState(true)

  // Resetar índice quando as imagens mudarem (antes do auto-play)
  useEffect(() => {
    if (banners.length > 0 && currentIndex >= banners.length) {
      setCurrentIndex(0)
    }
  }, [banners.length, currentIndex])

  // Auto-play no banner principal (fora do modal)
  useEffect(() => {
    // Só inicia auto-play se houver mais de 1 banner e modal estiver fechado
    if (banners.length <= 1 || showModal) {
      return
    }

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length
        return nextIndex
      })
    }, autoPlayInterval)

    // Limpar intervalo quando componente desmontar ou dependências mudarem
    return () => {
      clearInterval(interval)
    }
  }, [banners.length, autoPlayInterval, showModal])

  // Auto-play no modal
  useEffect(() => {
    if (!showModal || banners.length <= 1 || !modalAutoPlay) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [showModal, banners.length, autoPlayInterval, modalAutoPlay])

  const nextBanner = () => {
    setModalAutoPlay(false) // Pausar auto-play quando usuário navegar manualmente
    setCurrentIndex((prev) => (prev + 1) % banners.length)
    setTimeout(() => setModalAutoPlay(true), 5000) // Retomar após 5s
  }

  const prevBanner = () => {
    setModalAutoPlay(false) // Pausar auto-play quando usuário navegar manualmente
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
    setTimeout(() => setModalAutoPlay(true), 5000) // Retomar após 5s
  }

  // Se não houver banners, retornar placeholder com modal pronto
  if (!banners || banners.length === 0) {
    return (
      <>
        {/* Banner placeholder - clique abre modal */}
        <div 
          className="w-full relative cursor-pointer group" 
          style={{ aspectRatio: '1920/650', maxHeight: '400px' }}
          onClick={() => setShowModal(true)}
        >
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg flex flex-col items-center justify-center text-white border-2 border-dashed border-gray-700 hover:border-gray-600 transition-colors">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-xl font-bold mb-2">Adicione banners no Dashboard</p>
            <p className="text-gray-400 text-sm">Formato: 1920 x 650px (Banner Horizontal)</p>
          </div>
        </div>
        
        {/* Modal carcaça - estilo MediaShowcase */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-7xl max-h-[90vh] flex flex-col"
              >
                {/* Botão Fechar */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 z-20 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors"
                >
                  <X size={24} />
                </button>

                {/* Banner Principal no Modal */}
                <div className="relative w-full" style={{ aspectRatio: '1920/650', maxHeight: '70vh' }}>
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg flex flex-col items-center justify-center text-white">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-xl font-bold mb-2">Nenhum banner adicionado</p>
                    <p className="text-gray-400">Adicione banners no Dashboard para visualizá-los aqui</p>
                  </div>
                </div>

                {/* Thumbnails (placeholder vazio) */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
                  <div className="flex items-center justify-center w-32 h-16 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 text-gray-500 text-xs">
                    Sem thumbnails
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Se houver apenas 1 banner, exibir com modal funcional
  if (banners.length === 1) {
    return (
      <>
        <div 
          className="w-full relative cursor-pointer" 
          style={{ aspectRatio: '1920/650' }}
          onClick={() => setShowModal(true)}
        >
          <Image
            src={banners[0]}
            alt="Banner"
            fill
            className="object-cover"
            priority
            quality={100}
            sizes="(max-width: 768px) 100vw, 1920px"
            unoptimized={false}
          />
        </div>

        {/* Modal mesmo com 1 banner */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-7xl max-h-[90vh] flex flex-col"
              >
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 z-20 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="relative w-full" style={{ aspectRatio: '1920/650', maxHeight: '70vh' }}>
                  <Image
                    src={banners[0]}
                    alt="Banner"
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
                  <div
                    className="relative flex-shrink-0 rounded-lg overflow-hidden border-2 border-white"
                    style={{ aspectRatio: '1920/650', width: '120px' }}
                  >
                    <Image
                      src={banners[0]}
                      alt="Banner"
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Se houver múltiplos banners, exibir carrossel com modal
  return (
    <>
      {/* Banner Principal - Clique abre modal */}
      <div 
        className="relative w-full group cursor-pointer max-h-[400px] md:max-h-[500px] lg:max-h-[600px]" 
        style={{ 
          aspectRatio: '1920/650',
          height: 'auto'
        }}
        onClick={() => setShowModal(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={banners[currentIndex]}
              alt={`Banner ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              quality={100}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
              unoptimized={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Botões de navegação */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            prevBanner()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          aria-label="Banner anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            nextBanner()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          aria-label="Próximo banner"
        >
          <ChevronRight size={24} />
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Modal Full Screen - Estilo MediaShowcase com Auto-play */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-7xl max-h-[90vh] flex flex-col"
            >
              {/* Botão Fechar */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-20 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors"
              >
                <X size={24} />
              </button>

              {/* Banner Principal no Modal com Auto-play */}
              <div className="relative w-full" style={{ aspectRatio: '1920/650', maxHeight: '70vh' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={banners[currentIndex]}
                      alt={`Banner ${currentIndex + 1}`}
                      fill
                      className="object-contain"
                      quality={100}
                      sizes="(max-width: 768px) 100vw, 1920px"
                      unoptimized={false}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Botões de Navegação no Modal */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevBanner()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 text-black p-3 rounded-full hover:bg-white transition-opacity z-10 shadow-lg"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextBanner()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 text-black p-3 rounded-full hover:bg-white transition-opacity z-10 shadow-lg"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Indicadores no Modal */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setModalAutoPlay(false)
                        setCurrentIndex(index)
                        setTimeout(() => setModalAutoPlay(true), 5000)
                      }}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-8 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Ir para banner ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
                {banners.map((banner, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setModalAutoPlay(false)
                      setCurrentIndex(index)
                      setTimeout(() => setModalAutoPlay(true), 5000)
                    }}
                    className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-white scale-105 opacity-100'
                        : 'border-gray-600 opacity-60 hover:opacity-100'
                    }`}
                    style={{ aspectRatio: '1920/650', width: '120px' }}
                  >
                    <Image
                      src={banner}
                      alt={`Banner ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

