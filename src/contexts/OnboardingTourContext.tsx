'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PostPurchaseOnboardingTour } from '@/components/layout/PostPurchaseOnboardingTour'

const TOUR_DISMISSED_LOCAL_KEY = 'gogh_purchase_notification_dismissed_local'

type TourStep = { selector: string; title: string; description: string }

// Textos unificados: mesmo início "Este ícone leva" e ordem igual à sequência visual dos ícones
// Desktop: Início → Criar → Produto → Ver planos → Conta
const unifiedStepsDesktop: TourStep[] = [
  { selector: '[data-tour="nav-home-desktop"]', title: 'Início', description: 'Este ícone leva para a página inicial.' },
  { selector: '[data-tour="nav-create-desktop"]', title: 'Criar (Agenda IA)', description: 'Este ícone leva ao planejador para criar estruturas de conteúdo completas com IA.' },
  { selector: '[data-tour="nav-product-desktop"]', title: 'Produto', description: 'Este ícone leva ao menu com Ferramentas e Cursos.' },
  { selector: '[data-tour="nav-plans-desktop"]', title: 'Planos e assinatura', description: 'Este ícone leva à página de planos e upgrade.' },
  { selector: '[data-tour="nav-account-desktop"]', title: 'Sua conta', description: 'Este ícone leva à sua conta (perfil, assinatura e recursos).' },
]

// Mobile: ordem da barra inferior — Início → Produto → Criar → Planos → Conta
const unifiedStepsMobile: TourStep[] = [
  { selector: '[data-tour="nav-home-mobile"]', title: 'Início', description: 'Este ícone leva para a página inicial.' },
  { selector: '[data-tour="nav-product-mobile"]', title: 'Produto', description: 'Este ícone leva ao menu com Ferramentas e Cursos.' },
  { selector: '[data-tour="nav-create-mobile"]', title: 'Criar (Agenda IA)', description: 'Este ícone leva ao planejador para criar estruturas de conteúdo completas com IA.' },
  { selector: '[data-tour="nav-plans-mobile"]', title: 'Planos e assinatura', description: 'Este ícone leva à página de planos e upgrade.' },
  { selector: '[data-tour="nav-account-mobile"]', title: 'Sua conta', description: 'Este ícone leva à sua conta (perfil, assinatura e recursos).' },
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
