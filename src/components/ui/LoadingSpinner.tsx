'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function LoadingSpinner({ size = 'md', showText = false, className = '' }: LoadingSpinnerProps) {
  const [loadingEmoji, setLoadingEmoji] = useState('⌚')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEmoji = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('site_settings')
          .select('loading_emoji')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data?.loading_emoji) {
          setLoadingEmoji(data.loading_emoji)
        }
      } catch (error) {
        console.error('Erro ao carregar emoji de loading:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEmoji()
  }, [])

  const sizeClasses = {
    sm: 'h-8 w-8 border-t-2 border-b-2',
    md: 'h-12 w-12 border-t-2 border-b-2',
    lg: 'h-20 w-20 border-t-4 border-b-4',
  }

  const emojiSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-black`}></div>
        {!isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={emojiSizes[size]}>{loadingEmoji}</span>
          </div>
        )}
      </div>
      {showText && (
        <p className="mt-6 text-gray-600 font-medium">Carregando...</p>
      )}
    </div>
  )
}

