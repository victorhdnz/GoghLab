'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { useOnboardingTour } from '@/contexts/OnboardingTourContext'
import { useAuth } from '@/contexts/AuthContext'

const PURCHASE_PENDING_KEY = 'gogh_purchase_notification_pending'
const PURCHASE_DISMISSED_KEY = 'gogh_purchase_notification_dismissed'

interface PendingData {
  planName?: string
  isServiceSubscription?: boolean
  manualOrFirstAccess?: boolean
}

const TOUR_OPEN_AFTER_NAV_KEY = 'gogh_open_tour_after_nav'

export function PurchaseNotificationGlobal() {
  const [pending, setPending] = useState<PendingData | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { openTour } = useOnboardingTour()
  const { loading: authLoading, isAuthenticated, hasActiveSubscription } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem(PURCHASE_PENDING_KEY)
    const alreadyDismissed = sessionStorage.getItem(PURCHASE_DISMISSED_KEY) === '1'
    if (raw && !alreadyDismissed) {
      try {
        const data = JSON.parse(raw) as PendingData
        setPending(data)
        setDismissed(false)
      } catch {
        sessionStorage.removeItem(PURCHASE_PENDING_KEY)
      }
    } else {
      setPending(null)
      setDismissed(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || authLoading || !isAuthenticated || !hasActiveSubscription) return
    const raw = sessionStorage.getItem(PURCHASE_PENDING_KEY)
    const alreadyDismissed = sessionStorage.getItem(PURCHASE_DISMISSED_KEY) === '1'
    if (raw || alreadyDismissed) return
    sessionStorage.setItem(PURCHASE_PENDING_KEY, JSON.stringify({ manualOrFirstAccess: true }))
    setPending({ manualOrFirstAccess: true })
    setDismissed(false)
  }, [authLoading, isAuthenticated, hasActiveSubscription])

  const dismiss = () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(PURCHASE_PENDING_KEY)
    sessionStorage.setItem(PURCHASE_DISMISSED_KEY, '1')
    sessionStorage.setItem('gogh_purchase_notification_dismissed', '1')
    setPending(null)
    setDismissed(true)
  }

  const handleStartTour = () => {
    dismiss()
    const onConta = pathname === '/conta' || pathname?.startsWith('/conta/')
    if (onConta) {
      openTour()
    } else {
      sessionStorage.setItem(TOUR_OPEN_AFTER_NAV_KEY, '1')
      router.push('/conta')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || pathname !== '/conta') return
    if (sessionStorage.getItem(TOUR_OPEN_AFTER_NAV_KEY) === '1') {
      sessionStorage.removeItem(TOUR_OPEN_AFTER_NAV_KEY)
      const t = setTimeout(() => openTour(), 600)
      return () => clearTimeout(t)
    }
  }, [pathname, openTour])

  if (!pending || dismissed) return null

  return (
    <div className="fixed top-4 right-3 sm:right-4 z-[120] w-[min(calc(100vw-1.5rem),320px)] sm:w-[380px] md:w-[420px] pointer-events-auto">
      <Banner
        show
        variant="gradient"
        title={pending.manualOrFirstAccess ? 'Acesso liberado!' : 'Compra confirmada! Seu acesso foi liberado.'}
        description={`${
          pending.planName ? `Plano ${pending.planName} ativo. ` : pending.manualOrFirstAccess ? 'Seu acesso à plataforma está ativo. ' : ''
        }Quer uma visão rápida da plataforma? Inicie o tour guiado e veja onde fica cada área.`}
        showShade
        closable
        onHide={dismiss}
        icon={<Rocket className="h-4 w-4 text-[#0A0A0A]" />}
        className="border-[#F7C948]/50 bg-white/95 backdrop-blur-md"
        action={
          <Button
            size="sm"
            onClick={handleStartTour}
            className="inline-flex items-center gap-1 rounded-md bg-black/10 px-3 py-1.5 text-sm font-medium text-[#0A0A0A] transition-colors hover:bg-black/20"
            variant="ghost"
          >
            Começar tour
            <ArrowRight className="h-3 w-3" />
          </Button>
        }
      />
    </div>
  )
}
