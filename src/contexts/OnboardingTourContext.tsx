'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PostPurchaseOnboardingTour } from '@/components/layout/PostPurchaseOnboardingTour'

const TOUR_DISMISSED_LOCAL_KEY = 'gogh_purchase_notification_dismissed_local'

type TourStep = { selector: string; title: string; description: string }

// Textos unificados (baseados no mobile) para todos os dispositivos
const unifiedStepsDesktop: TourStep[] = [
  { selector: '[data-tour="nav-home-desktop"]', title: 'Início', description: 'Este ícone leva para a página inicial.' },
  { selector: '[data-tour="nav-create-desktop"]', title: 'Criar (Agenda IA)', description: 'Toque aqui para abrir o planejador e criar estruturas completas de vídeo com IA (roteiros, legendas, hashtags).' },
  { selector: '[data-tour="nav-product-desktop"]', title: 'Produto', description: 'Aqui você abre o menu com Ferramentas e Cursos.' },
  { selector: '[data-tour="nav-plans-desktop"]', title: 'Planos e assinatura', description: 'Aqui você consulta os planos e faz upgrade quando quiser.' },
  { selector: '[data-tour="nav-account-desktop"]', title: 'Sua conta', description: 'Nesta área você gerencia perfil, assinatura e recursos ativos.' },
]

const unifiedStepsMobile: TourStep[] = [
  { selector: '[data-tour="nav-home-mobile"]', title: 'Início', description: 'Este ícone leva para a página inicial.' },
  { selector: '[data-tour="nav-create-mobile"]', title: 'Criar (Agenda IA)', description: 'Toque aqui para abrir o planejador e criar estruturas completas de vídeo com IA (roteiros, legendas, hashtags).' },
  { selector: '[data-tour="nav-product-mobile"]', title: 'Produto', description: 'Aqui você abre o menu com Ferramentas e Cursos.' },
  { selector: '[data-tour="nav-plans-mobile"]', title: 'Planos e assinatura', description: 'Aqui você consulta os planos e faz upgrade quando quiser.' },
  { selector: '[data-tour="nav-account-mobile"]', title: 'Sua conta', description: 'Nesta área você gerencia perfil, assinatura e recursos ativos.' },
]

type OnboardingTourContextValue = {
  openTour: (onFinishExtra?: () => void) => void
  closeTour: () => void
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null)

export function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  const [tourOpen, setTourOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const onFinishExtraRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => setIsMobile(window.innerWidth < 1024)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const steps = useMemo(
    () => (isMobile ? unifiedStepsMobile : unifiedStepsDesktop),
    [isMobile]
  )

  const closeTour = useCallback(() => {
    setTourOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_DISMISSED_LOCAL_KEY, '1')
    }
    const fn = onFinishExtraRef.current
    onFinishExtraRef.current = null
    fn?.()
  }, [])

  const openTour = useCallback((onFinishExtra?: () => void) => {
    onFinishExtraRef.current = onFinishExtra ?? null
    setTourOpen(true)
  }, [])

  const value = useMemo(() => ({ openTour, closeTour }), [openTour, closeTour])

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
      <PostPurchaseOnboardingTour
        open={tourOpen}
        steps={steps}
        onClose={closeTour}
        onFinish={closeTour}
      />
    </OnboardingTourContext.Provider>
  )
}

export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext)
  if (!ctx) throw new Error('useOnboardingTour must be used within OnboardingTourProvider')
  return ctx
}
