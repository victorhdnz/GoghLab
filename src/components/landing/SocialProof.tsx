'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Review } from '@/types'
import { useEffect, useState } from 'react'

interface SocialProofProps {
  reviews: Review[]
  title?: string
  googleIcon?: boolean
  allowPhotos?: boolean
  testimonialCount?: string
  backgroundColor?: string
  textColor?: string
  elementVisibility?: {
    title?: boolean
    reviews?: boolean
  }
}

export const SocialProof = ({
  reviews,
  title = '⭐ CLIENTES DE UBERLÂNDIA QUE JÁ ESTÃO USANDO',
  googleIcon = true,
  allowPhotos = true,
  testimonialCount = '💬 Mais de 1.000 smartwatches entregues em Uberlândia.',
  backgroundColor = '#000000',
  textColor = '#ffffff',
  elementVisibility = {
    title: true,
    reviews: true,
  },
}: SocialProofProps) => {
  // Avaliações padrão (Uberlândia)
  const defaultReviews: Review[] = [
      {
        id: '1',
        customer_name: 'Maria C., Planalto',
        rating: 5,
        comment: 'Chegou em menos de 1 dia! Atendimento excelente.',
        product_id: '',
        user_id: null,
        is_approved: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        customer_name: 'Juliana R., Santa Mônica',
        rating: 5,
        comment: 'Comprei pro meu marido, ele amou.',
        product_id: '',
        user_id: null,
        is_approved: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        customer_name: 'Carlos S., Tibery',
        rating: 5,
        comment: 'Produto top e suporte pelo WhatsApp super rápido.',
        product_id: '',
        user_id: null,
        is_approved: true,
        created_at: new Date().toISOString(),
      },
    ]
  
  // Usar reviews do banco ou padrão
  const reviewsToUse = reviews.length > 0 ? reviews : defaultReviews
  
  // Duplicar reviews para efeito infinito (3x para loop contínuo)
  const duplicatedReviews = [...reviewsToUse, ...reviewsToUse, ...reviewsToUse]

  return (
    <section className="py-20 overflow-hidden" style={{ backgroundColor, color: textColor }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {elementVisibility.title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">{title}</h2>
            {testimonialCount && (
              <p className="text-gray-400 text-lg mb-2">{testimonialCount}</p>
            )}
            <div className="w-24 h-1 bg-accent mx-auto mt-6" />
          </motion.div>
        )}

        {/* Carrossel Infinito */}
        {elementVisibility.reviews && (
          <div className="relative overflow-hidden">
          {/* Gradiente Esquerda - apenas borda */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          
          {/* Gradiente Direita - apenas borda */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <motion.div
            animate={{
              x: [0, -(duplicatedReviews.length / 3) * 320], // Valor médio: mobile ~300px (w-72 + gap-3), desktop 336px (w-80 + gap-4)
            }}
            transition={{
              duration: duplicatedReviews.length * 4, // 4 segundos por review
              repeat: Infinity,
              ease: 'linear',
            }}
            className="flex gap-3 sm:gap-4"
          >
            {duplicatedReviews.map((review, index) => {
              const googleReviewLink = (review as any).google_review_link
              
              return (
                <div
                  key={`${review.id}-${index}`}
                  className="flex-shrink-0 w-72 sm:w-80 bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-5 hover:bg-white/20 transition-colors flex flex-col"
                >
                  {/* Rating */}
                  <div className="flex mb-2 sm:mb-3 justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`sm:w-[18px] sm:h-[18px] ${
                          i < review.rating
                            ? 'fill-accent text-accent'
                            : 'text-gray-500'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-gray-200 mb-3 sm:mb-4 text-xs sm:text-sm text-center line-clamp-4 flex-grow">
                    "{review.comment}"
                  </p>

                  {/* Customer */}
                  <div className="flex items-center justify-center relative mt-auto">
                    {allowPhotos && (review as any).photo ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={(review as any).photo}
                          alt={review.customer_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent flex items-center justify-center text-black font-bold text-xs sm:text-sm flex-shrink-0">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {googleIcon && (
                      <div className="absolute bottom-0 -right-1 bg-white rounded-full p-0.5 shadow-lg z-10 border border-gray-200">
                        <svg width="12" height="12" className="sm:w-[14px] sm:h-[14px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                    )}
                    <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm truncate">{review.customer_name}</p>
                      {googleReviewLink ? (
                        <a
                          href={googleReviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                        >
                          Cliente Verificado
                        </a>
                      ) : (
                        <p className="text-[10px] sm:text-xs text-gray-400">Cliente Verificado</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
          </div>
        )}
      </div>
    </section>
  )
}

