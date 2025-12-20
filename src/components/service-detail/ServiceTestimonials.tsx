'use client'

import { ServiceDetailContent } from '@/types/service-detail'
import { ServiceTestimonial } from '@/types'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ServiceTestimonialsProps {
  content: ServiceDetailContent
  testimonials: ServiceTestimonial[]
}

export function ServiceTestimonials({ content, testimonials }: ServiceTestimonialsProps) {
  if (!content.testimonials_enabled) return null

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play carrossel
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000) // Muda a cada 5 segundos

    return () => clearInterval(interval)
  }, [isAutoPlaying, testimonials.length])

  if (testimonials.length === 0) {
    return (
      <section className="py-16 md:py-24 px-4 bg-black text-white">
        <div className="container mx-auto max-w-6xl">
          {content.testimonials_title && (
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              {content.testimonials_title}
            </h2>
          )}
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum depoimento disponível ainda</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-24 px-4 bg-black text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-black to-black" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {content.testimonials_title && (
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            {content.testimonials_title}
          </h2>
        )}

        {/* Stats */}
        {content.testimonials_stats && (
          <p className="text-center text-xl text-gray-300 mb-12">
            {content.testimonials_stats}
          </p>
        )}

        {/* Carrossel de Depoimentos */}
        <div 
          className="relative h-[500px] md:h-[600px]"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {testimonials.map((testimonial, index) => {
            const isActive = index === currentIndex
            const offset = index - currentIndex
            const absOffset = Math.abs(offset)
            
            return (
              <div
                key={testimonial.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  isActive
                    ? 'opacity-100 scale-100 z-10'
                    : absOffset === 1
                    ? 'opacity-30 scale-95 z-0'
                    : 'opacity-0 scale-90 z-0'
                }`}
                style={{
                  transform: isActive
                    ? 'translateX(0)'
                    : offset > 0
                    ? `translateX(${absOffset * 20}%)`
                    : `translateX(${-absOffset * 20}%)`,
                }}
              >
                <div className="max-w-2xl mx-auto h-full flex items-center">
                  <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    {/* Rating */}
                    {testimonial.rating && (
                      <div className="flex gap-1 mb-6 justify-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            className={`transition-all duration-300 ${
                              i < testimonial.rating!
                                ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg scale-110'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Text */}
                    <p className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center italic">
                      "{testimonial.testimonial_text}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center justify-center gap-4">
                      {testimonial.client_photo && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/20">
                          <Image
                            src={testimonial.client_photo}
                            alt={testimonial.client_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-bold text-white text-lg">{testimonial.client_name}</p>
                        {testimonial.client_company && (
                          <p className="text-sm text-gray-400">{testimonial.client_company}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicadores */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                  setTimeout(() => setIsAutoPlaying(true), 3000)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

