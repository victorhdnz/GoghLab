'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useGlobalNotificationSlot } from '@/contexts/GlobalNotificationSlotContext'
import CustomAlert from '@/components/ui/custom-alert'

type NotificationItem = {
  id: string
  variant: 'info' | 'warning'
  title: string
  description: string
}

const DISMISSED_KEY = 'gogh_analytics_notifications_dismissed'

function readDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set<string>()
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set<string>()
  }
}

function persistDismissed(values: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(values)))
}

export function AnalyticsNotificationGlobal() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, hasActiveSubscription } = useAuth()
  const slotContext = useGlobalNotificationSlot()
  const [notification, setNotification] = useState<NotificationItem | null>(null)

  const isDashboard = pathname.startsWith('/dashboard')
  const isAnalyticsPage = pathname === '/analytics'
  const shouldRun = isAuthenticated && hasActiveSubscription && !isDashboard && !isAnalyticsPage

  useEffect(() => {
    if (!shouldRun) {
      setNotification(null)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/analytics/notifications', { credentials: 'include' })
        const data = await res.json()
        if (cancelled || !res.ok) return
        const list: NotificationItem[] = Array.isArray(data.notifications) ? data.notifications : []
        const dismissed = readDismissed()
        const first = list.find((item) => !dismissed.has(item.id)) ?? null
        if (!cancelled) setNotification(first)
      } catch {
        if (!cancelled) setNotification(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [shouldRun, pathname])

  useEffect(() => {
    if (notification && shouldRun && slotContext) slotContext.claimSlot('analytics')
  }, [notification, shouldRun, slotContext])

  const canShow = notification && shouldRun && (!slotContext || slotContext.slot === 'analytics')

  const handleClose = () => {
    if (!notification) return
    const dismissed = readDismissed()
    dismissed.add(notification.id)
    persistDismissed(dismissed)
    setNotification(null)
    slotContext?.releaseSlot()
  }

  const handleAction = () => {
    if (!notification) return
    const dismissed = readDismissed()
    dismissed.add(notification.id)
    persistDismissed(dismissed)
    setNotification(null)
    slotContext?.releaseSlot()
    router.push('/analytics')
  }

  if (!canShow || !notification) return null

  return (
    <div className="fixed top-16 right-3 sm:right-4 z-[110] w-[min(calc(100vw-1.5rem),320px)] sm:w-[340px] pointer-events-none">
      <div className="pointer-events-auto">
        <CustomAlert
          visible
          variant={notification.variant === 'warning' ? 'warning' : 'info'}
          title={notification.title}
          description={notification.description}
          className="!bg-[#121212] !text-white border-white/20 shadow-2xl"
          onClose={handleClose}
          action={
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={handleAction}
            >
              Ir para Analytics
            </Button>
          }
        />
      </div>
    </div>
  )
}
