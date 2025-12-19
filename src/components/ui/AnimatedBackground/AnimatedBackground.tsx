'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Lazy load dos efeitos para melhor performance
const Prism = dynamic(() => import('@/components/ui/Prism/Prism'), {
  ssr: false,
  loading: () => null
})

// Adicione outros efeitos aqui conforme forem instalados
// const Grid = dynamic(() => import('@/components/ui/Grid/Grid'), { ssr: false })
// const Particles = dynamic(() => import('@/components/ui/Particles/Particles'), { ssr: false })

export type BackgroundEffectType = 'prism' | 'none' | 'grid' | 'particles' // Adicione mais tipos conforme necessário
export type PrismAnimationType = 'rotate' | 'hover' | '3drotate'

interface AnimatedBackgroundProps {
  effectType?: BackgroundEffectType
  opacity?: number
  className?: string
  children?: ReactNode
  // Props específicas do Prism
  prismAnimationType?: PrismAnimationType
  prismTimeScale?: number
  prismHeight?: number
  prismBaseWidth?: number
  prismScale?: number
  prismHueShift?: number
  prismColorFrequency?: number
  prismNoise?: number
  prismGlow?: number
  // Props para outros efeitos podem ser adicionadas aqui
}

export const AnimatedBackground = ({
  effectType = 'none',
  opacity = 0.3, // Mantido para compatibilidade, mas não será usado
  className = '',
  children,
  prismAnimationType = 'rotate',
  prismTimeScale = 0.5, // Valor fixo padrão
  prismHeight = 3.5,
  prismBaseWidth = 5.5,
  prismScale = 3.6,
  prismHueShift = 0,
  prismColorFrequency = 1,
  prismNoise = 0.5,
  prismGlow = 1,
}: AnimatedBackgroundProps) => {
  const renderEffect = () => {
    if (effectType === 'none') return null

    switch (effectType) {
      case 'prism':
        return (
          <div className={`absolute inset-0 z-0 ${className}`}>
            <Prism
              animationType={prismAnimationType}
              timeScale={prismTimeScale}
              height={prismHeight}
              baseWidth={prismBaseWidth}
              scale={prismScale}
              hueShift={prismHueShift}
              colorFrequency={prismColorFrequency}
              noise={prismNoise}
              glow={prismGlow}
              transparent={true}
            />
          </div>
        )
      
      // Adicione outros casos conforme instalar novos efeitos
      // case 'grid':
      //   return <Grid {...gridProps} />
      // case 'particles':
      //   return <Particles {...particlesProps} />
      
      default:
        return null
    }
  }

  return (
    <>
      {renderEffect()}
      {children}
    </>
  )
}

