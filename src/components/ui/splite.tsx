'use client'

import { Suspense, lazy } from 'react'
import { LumaSpin } from '@/components/ui/luma-spin'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <LumaSpin size="sm" />
        </div>
      }
    >
      <div 
        style={{ 
          width: '100%', 
          height: '100%',
          // Permitir scroll vertical mesmo quando Spline está interativo
          touchAction: 'pan-y pinch-zoom',
          // Garantir que não bloqueie eventos de scroll
          pointerEvents: 'auto'
        }}
      >
        <Spline
          scene={scene}
          className={className}
        />
      </div>
    </Suspense>
  )
}

