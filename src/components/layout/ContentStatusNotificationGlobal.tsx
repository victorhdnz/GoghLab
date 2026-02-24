'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import CustomAlert from '@/components/ui/custom-alert'

type NotificationItem = {
  id: string
  variant: 'info' | 'warning' | 'success'
  title: string
  description: string
}

const DISMISSED_KEY = 'gogh_content_notifications_dismissed'

function readDismissed() {
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

export function ContentStatusNotificationGlobal() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, profile } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [index, setIndex] = useState(0)

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = profile?.role === 'admin' || profile?.role === 'editor'

  useEffect(() => {
    if (!isAuthenticated || isDashboard || isAdmin) {
      setItems([])
      setIndex(0)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/content/notifications', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok || cancelled) return
        const dismissed = readDismissed()
        const list: NotificationItem[] = (Array.isArray(data.notifications) ? data.notifications : []).filter(
          (item: NotificationItem) => !dismissed.has(item.id)
        )
        if (!cancelled) {
          setItems(list)
          setIndex(0)
        }
      } catch {
        if (!cancelled) {
          setItems([])
          setIndex(0)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isDashboard, isAdmin, pathname])

  const current = useMemo(() => items[index] || null, [items, index])

  if (!current) return null

  const closeCurrent = () => {
    const dismissed = readDismissed()
    dismissed.add(current.id)
    persistDismissed(dismissed)
    const next = items.filter((it) => it.id !== current.id)
    setItems(next)
    setIndex(0)
  }

  return (
    <div className="fixed top-20 left-3 right-3 sm:left-4 sm:right-4 z-[115] pointer-events-auto">
      <CustomAlert
        visible
        variant={current.variant === 'warning' ? 'warning' : current.variant === 'success' ? 'success' : 'info'}
        title={current.title}
        description={current.description}
        onClose={closeCurrent}
        actionLabel="Ir para planejamento"
        onAction={() => {
          closeCurrent()
          router.push('/planejamento')
        }}
      />
    </div>
  )
}

