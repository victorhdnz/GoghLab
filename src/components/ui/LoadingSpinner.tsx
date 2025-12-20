'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function LoadingSpinner({ size = 'md', showText = false, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 border-t-2 border-b-2',
    md: 'h-12 w-12 border-t-2 border-b-2',
    lg: 'h-20 w-20 border-t-4 border-b-4',
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-black`}></div>
      {showText && (
        <p className="mt-6 text-gray-600 font-medium">Carregando...</p>
      )}
    </div>
  )
}

