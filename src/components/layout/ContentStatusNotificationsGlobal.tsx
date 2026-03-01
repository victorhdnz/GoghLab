'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useTourBannerVisible } from '@/contexts/TourBannerVisibleContext'
import { useOnboardingTour } from '@/contexts/OnboardingTourContext'
import CustomAlert from '@/components/ui/custom-alert'

type CalendarItem = {
  id: string
  date: string
  topic: string | null
}

type Notice = {
  id: string
  variant: 'info' | 'warning'
  title: string
  description: string
}

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function ContentStatusNotificationsGlobal() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, hasActiveSubscription } = useAuth()
  const { isTourBannerVisible } = useTourBannerVisible() ?? {}
  const { isTourOpen } = useOnboardingTour() ?? {}
  const [items, setItems] = useState<CalendarItem[]>([])
  const [notice, setNotice] = useState<Notice | null>(null)

  const isDashboard = pathname.startsWith('/dashboard')
  const tourOrBannerActive = Boolean(isTourBannerVisible || isTourOpen)
  const shouldRun = isAuthenticated && hasActiveSubscription && !isDashboard && !tourOrBannerActive

  useEffect(() => {
    if (!shouldRun) return
    let mounted = true

    const load = async () => {
      const now = new Date()
      const start = toYmd(now)
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 2)
      const end = toYmd(endDate)

      try {
        const res = await fetch(`/api/content/calendar?start=${start}&end=${end}`, { credentials: 'include' })
        const data = await res.json()
        if (mounted && res.ok) {
          setItems(Array.isArray(data.items) ? data.items : [])
        }
      } catch {
        // silencioso
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [shouldRun, pathname])

  const nextNotice = useMemo(() => {
    if (!shouldRun) return null
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    if (items.length === 0) {
      return {
        id: `no-content-${yearMonth}`,
        variant: 'info' as const,
        title: 'Sua agenda está vazia',
        description: 'Crie seus próximos conteúdos para não perder consistência esta semana.',
      }
    }

    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
    const upcoming = sorted[0]
    const upcomingDate = new Date(`${upcoming.date}T00:00:00`)
    const diffDays = Math.floor((upcomingDate.getTime() - new Date(now.toDateString()).getTime()) / 86400000)
    if (diffDays <= 2) {
      return {
        id: `upcoming-${upcoming.id}`,
        variant: 'warning' as const,
        title: 'Lembrete de gravação',
        description: `Você tem conteúdo em ${upcomingDate.toLocaleDateString('pt-BR')}${upcoming.topic ? `: ${upcoming.topic}` : ''}.`,
      }
    }

    return null
  }, [items, shouldRun])

  useEffect(() => {
    if (!nextNotice) {
      setNotice(null)
      return
    }

    const dismissed = typeof window !== 'undefined' && localStorage.getItem(`content_notice_dismissed:${nextNotice.id}`) === '1'
    if (!dismissed) setNotice(nextNotice)
    else setNotice(null)
  }, [nextNotice])

  if (!notice || !shouldRun) return null

  return (
    <div className="fixed top-16 right-3 sm:right-4 z-[110] w-[min(calc(100vw-1.5rem),320px)] sm:w-[340px] pointer-events-none">
      <div className="pointer-events-auto">
        <CustomAlert
          visible
          variant={notice.variant}
          title={notice.title}
          description={notice.description}
          className="!bg-[#121212] !text-white border-white/20 shadow-2xl"
          onClose={() => {
            localStorage.setItem(`content_notice_dismissed:${notice.id}`, '1')
            setNotice(null)
          }}
          action={
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => {
                router.push('/planejamento')
                localStorage.setItem(`content_notice_dismissed:${notice.id}`, '1')
                setNotice(null)
              }}
            >
              Ir para agenda
            </Button>
          }
        />
      </div>
    </div>
  )
}

