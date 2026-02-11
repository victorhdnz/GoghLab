'use client'

import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'scale-[0.37]',      // ~24px
  md: 'scale-[0.62]',      // ~40px
  default: 'scale-100',
  lg: 'scale-[0.98]',      // ~64px
}

export interface LumaSpinProps {
  className?: string
  /** Tamanho do loader: sm (~24px), md (~40px), default (65px), lg (~64px) */
  size?: 'sm' | 'md' | 'default' | 'lg'
}

export function LumaSpin({ className, size = 'default' }: LumaSpinProps) {
  return (
    <div
      className={cn('relative w-[65px] aspect-square inline-block', sizeMap[size], className)}
      aria-label="Carregando"
      role="status"
    >
      <span className="absolute rounded-[50px] animate-loader-anim shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100" />
      <span
        className="absolute rounded-[50px] animate-loader-anim shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100"
        style={{ animationDelay: '-1.25s' }}
      />
    </div>
  )
}
