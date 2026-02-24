'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import CustomAlert from '@/components/ui/custom-alert'
import { useAuth } from '@/contexts/AuthContext'

type CalendarItem = {
  id: string
  date: string
  topic: string | null
}

type StatusNotification = {
  id: string
  variant: 'info' | 'warning'
  title: string
  description: string
  cta?: string
}

const DISMISS_PREFIX = 'gogh_content_notification_dismissed:'

function toDateOnly(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function ContentStatusNotifications() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, hasActiveSubscription } = useAuth()
  const [notifications, setNotifications] = useState<StatusNotification[]>([])

  const hidden = useMemo(() => {
    if (!pathname) return true
    if (pathname.startsWith('/dashboard')) return true
    if (pathname.startsWith('/login')) return true
    return false
  }, [pathname])

  useEffect(() => {
    if (hidden || !isAuthenticated || !hasActiveSubscription) {
      setNotifications([])
      return
    }

    const load = async () => {
      try {
        const today = toDateOnly(new Date())
        const end = new Date(today)
        end.setDate(end.getDate() + 14)

        const res = await fetch(`/api/content/calendar?start=${formatDate(today)}&end=${formatDate(end)}`, {
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok) return
        const items: CalendarItem[] = Array.isArray(data.items) ? data.items : []

        const nextNotifications: StatusNotification[] = []

        if (items.length === 0) {
          const id = `no-content-${formatDate(today)}`
          if (localStorage.getItem(`${DISMISS_PREFIX}${id}`) !== '1') {
            nextNotifications.push({
              id,
              variant: 'info',
              title: 'Você ainda não planejou conteúdos',
              description: 'Crie sua agenda para os próximos dias e mantenha constância nas postagens.',
              cta: 'Abrir planejamento',
            })
          }
        }

        for (const item of items) {
          const contentDate = toDateOnly(new Date(`${item.date}T00:00:00`))
          const diffDays = Math.round((contentDate.getTime() - today.getTime()) / 86400000)
          if (diffDays !== 1 && diffDays !== 2) continue

          const id = `upcoming-${item.id}-${item.date}`
          if (localStorage.getItem(`${DISMISS_PREFIX}${id}`) === '1') continue

          nextNotifications.push({
            id,
            variant: 'warning',
            title: `Lembrete: gravação em ${diffDays} dia${diffDays > 1 ? 's' : ''}`,
            description: item.topic
              ? `Seu conteúdo "${item.topic}" está próximo. Reserve um horário para gravar.`
              : 'Você tem um conteúdo planejado próximo. Revise roteiro, legenda e horário recomendado.',
            cta: 'Ver conteúdo',
          })
        }

        setNotifications(nextNotifications.slice(0, 3))
      } catch {
        // silencioso
      }
    }

    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [hidden, isAuthenticated, hasActiveSubscription])

  const current = notifications[0]
  if (!current) return null

  const dismiss = () => {
    localStorage.setItem(`${DISMISS_PREFIX}${current.id}`, '1')
    setNotifications((prev) => prev.filter((n) => n.id !== current.id))
  }

  return (
    <div className="fixed top-20 sm:top-24 left-3 right-3 z-[115] pointer-events-none">
      <div className="pointer-events-auto">
        <CustomAlert
          variant={current.variant}
          title={current.title}
          description={current.description}
          onClose={dismiss}
          action={
            current.cta ? (
              <Button
                size="sm"
                variant="ghost"
                className="bg-black/10 hover:bg-black/20 text-black dark:text-white"
                onClick={() => {
                  dismiss()
                  router.push('/planejamento')
                }}
              >
                {current.cta}
              </Button>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}

