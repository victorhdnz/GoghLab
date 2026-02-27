'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { useOnboardingTour } from '@/contexts/OnboardingTourContext'
import { useAuth } from '@/contexts/AuthContext'

const PURCHASE_PENDING_KEY = 'gogh_purchase_notification_pending'
const PURCHASE_DISMISSED_KEY = 'gogh_purchase_notification_dismissed'
const PURCHASE_DISMISSED_KEY_LOCAL = 'gogh_purchase_notification_dismissed_local'

interface PendingData {
  planName?: string
  isServiceSubscription?: boolean
  manualOrFirstAccess?: boolean
}

export function PurchaseNotificationGlobal() {
  const [pending, setPending] = useState<PendingData | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const { openTour } = useOnboardingTour()
  const { loading: authLoading, isAuthenticated, hasActiveSubscription } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem(PURCHASE_PENDING_KEY)
    const alreadyDismissed =
      sessionStorage.getItem(PURCHASE_DISMISSED_KEY) === '1' ||
      localStorage.getItem(PURCHASE_DISMISSED_KEY_LOCAL) === '1'
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
    const alreadyDismissed =
      sessionStorage.getItem(PURCHASE_DISMISSED_KEY) === '1' ||
      localStorage.getItem(PURCHASE_DISMISSED_KEY_LOCAL) === '1'
    if (raw || alreadyDismissed) return
    sessionStorage.setItem(PURCHASE_PENDING_KEY, JSON.stringify({ manualOrFirstAccess: true }))
    setPending({ manualOrFirstAccess: true })
    setDismissed(false)
  }, [authLoading, isAuthenticated, hasActiveSubscription])

  const dismiss = () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(PURCHASE_PENDING_KEY)
    sessionStorage.setItem(PURCHASE_DISMISSED_KEY, '1')
    localStorage.setItem(PURCHASE_DISMISSED_KEY_LOCAL, '1')
    setPending(null)
    setDismissed(true)
  }

  const handleStartTour = () => {
    dismiss()
    openTour()
  }

  if (!pending || dismissed) return null

  const shortTitle = pending.manualOrFirstAccess ? 'Acesso liberado!' : 'Compra confirmada!'
  const shortDescription = pending.planName
    ? 'Plano ativo. Inicie o tour e veja cada área.'
    : 'Inicie o tour e veja onde fica cada área.'

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:top-4 z-[120] w-auto max-w-[min(100vw-1.5rem,300px)] sm:max-w-[340px] md:max-w-[380px] pointer-events-auto">
      <Banner
        show
        variant="gradient"
        title={shortTitle}
        description={shortDescription}
        showShade
        closable
        onHide={dismiss}
        icon={<Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0A0A0A] shrink-0" />}
        className="border-[#F7C948]/50 bg-white/95 backdrop-blur-md text-xs sm:text-sm py-2 px-3 sm:py-2.5 sm:px-4"
        action={
          <Button
            size="sm"
            onClick={handleStartTour}
            className="inline-flex items-center gap-0.5 rounded-md bg-black/10 px-2 py-1 text-xs font-medium text-[#0A0A0A] transition-colors hover:bg-black/20 sm:px-3 sm:py-1.5 sm:text-sm shrink-0"
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
