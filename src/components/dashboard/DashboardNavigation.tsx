'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardNavigationProps {
  title: string
  subtitle?: string
  backUrl?: string
  backLabel?: string
  showHomeButton?: boolean
  actions?: React.ReactNode
}

export function DashboardNavigation({
  title,
  subtitle,
  backUrl,
  backLabel = 'Voltar',
  showHomeButton = true,
  actions
}: DashboardNavigationProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  const handleHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </Button>
        
        {showHomeButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleHome}
            className="flex items-center gap-2"
          >
            <Home size={16} />
            Dashboard
          </Button>
        )}
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}