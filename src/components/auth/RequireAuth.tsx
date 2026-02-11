'use client'

import { useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LumaSpin } from '@/components/ui/luma-spin'

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) {
      router.replace('/login?redirect=' + encodeURIComponent(pathname || ''))
    }
  }, [loading, isAuthenticated, router, pathname])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LumaSpin size="sm" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
