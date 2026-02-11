'use client'

import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'
import { FadeInElement } from '@/components/ui/FadeInElement'
import { useInView } from 'react-intersection-observer'
import { useState, useEffect, memo } from 'react'

interface SplineSectionProps {
  enabled?: boolean
  title?: string
  description?: string
  sceneUrl?: string
}

export const SplineSection = memo(function SplineSection({
  enabled = true,
  title,
  description,
  sceneUrl = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode',
}: SplineSectionProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  
  const { ref, inView } = useInView({
    threshold: 0.3, // Só carrega quando 30% visível
    triggerOnce: true, // Só dispara uma vez
    rootMargin: '100px', // Começa a observar 100px antes de entrar na viewport
  })

  useEffect(() => {
    if (inView && !hasLoaded) {
      // Delay maior para carregar apenas quando realmente necessário
      const timer = setTimeout(() => {
        setShouldLoad(true)
        setHasLoaded(true)
      }, 1000) // Aumentado para 1 segundo
      return () => clearTimeout(timer)
    }
  }, [inView, hasLoaded])

  if (enabled === false) return null

  return (
    <section 
      ref={ref}
      className="relative bg-[#F5F1E8] text-[#0A0A0A] py-10 md:py-14 px-4"
      style={{ minHeight: '360px' }}
    >
      <div className="container mx-auto max-w-6xl overflow-hidden">
        <FadeInElement>
          <div className="w-full h-[340px] sm:h-[380px] md:h-[500px] bg-[#0A0A0A] relative overflow-hidden rounded-2xl border border-[#F7C948]/30 shadow-xl">
            <Spotlight
              className="-top-40 left-0 md:left-60 md:-top-20"
              fill="#F7C948"
            />
            
            <div className="flex h-full flex-col md:flex-row relative z-10">
              {/* Left content - Texto */}
              <div className="flex-1 p-5 md:p-8 relative z-10 flex flex-col justify-center min-w-0">
                <h2 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 mb-3">
                  {title || 'O Futuro da Sua Empresa'}
                </h2>
                <p className="text-sm md:text-base text-gray-300 max-w-xl leading-relaxed">
                  {description || 'Estamos aqui para ajudar sua empresa a evoluir e crescer no mundo digital. Com tecnologia de ponta e soluções inovadoras, transformamos sua presença online e impulsionamos seus resultados.'}
                </p>
              </div>

              {/* Right content - Spline Scene - mais altura para o robô não cortar */}
              <div 
                className="flex-1 relative min-h-[220px] sm:min-h-[260px] md:min-h-0" 
                style={{ 
                  willChange: 'auto',
                  // SEMPRE permitir scroll vertical no mobile
                  touchAction: 'pan-y pinch-zoom',
                  pointerEvents: 'auto'
                }}
              >
                {shouldLoad && inView ? (
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      contain: 'layout style paint',
                      // SEMPRE permitir scroll vertical mesmo quando Spline está carregado
                      touchAction: 'pan-y pinch-zoom',
                      pointerEvents: 'auto'
                    }}
                  >
                    <SplineScene 
                      scene={sceneUrl}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <LumaSpin size="default" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeInElement>
      </div>
    </section>
  )
})

