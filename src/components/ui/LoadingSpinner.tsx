'use client'

import { LumaSpin } from '@/components/ui/luma-spin'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const lumaSizeMap = {
  sm: 'sm' as const,
  md: 'default' as const,
  lg: 'lg' as const,
}

export function LoadingSpinner({ size = 'md', showText = false, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LumaSpin size={lumaSizeMap[size]} />
      {showText && (
        <p className="mt-6 text-gray-600 font-medium">Carregando...</p>
      )}
    </div>
  )
}
