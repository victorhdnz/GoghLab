'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PostPurchaseOnboardingTour } from '@/components/layout/PostPurchaseOnboardingTour'

type TourStep = { selector: string; title: string; description: string }

const commonSteps: TourStep[] = [
  {
    selector: '[data-tour="nav-plans-desktop"], [data-tour="nav-plans-mobile"]',
    title: 'Planos e assinatura',
    description: 'Aqui você consulta os planos e faz upgrade quando quiser.',
  },
  {
    selector: '[data-tour="nav-account-desktop"], [data-tour="nav-account-mobile"]',
    title: 'Sua conta',
    description: 'Nesta área você gerencia perfil, assinatura e recursos ativos.',
  },
]

const desktopSteps: TourStep[] = [
  { selector: '[data-tour="nav-home-desktop"]', title: 'Início', description: 'Volte para a Home sempre que quiser ver novidades e atalhos.' },
  { selector: '[data-tour="nav-create-desktop"]', title: 'Criar (Agenda IA)', description: 'Aqui você planeja conteúdos e gera roteiros com IA.' },
  { selector: '[data-tour="nav-product-desktop"]', title: 'Produto', description: 'Abra esse menu para acessar Ferramentas e Cursos do seu plano.' },
  ...commonSteps,
]

const mobileSteps: TourStep[] = [
  { selector: '[data-tour="nav-home-mobile"]', title: 'Início', description: 'Este ícone leva para a página inicial.' },
  { selector: '[data-tour="nav-create-mobile"]', title: 'Criar (Agenda IA)', description: 'Toque aqui para abrir o planejador e criar conteúdo com IA.' },
  { selector: '[data-tour="nav-product-mobile"]', title: 'Produto', description: 'Aqui você abre o menu com Ferramentas e Cursos.' },
  ...commonSteps,
]

const contextualSteps: TourStep[] = [
  { selector: '[data-tour="account-tab-plan"]', title: 'Plano & Uso', description: 'Nesta aba você confere seu plano e benefícios atuais.' },
  { selector: '[data-tour="manage-subscription"]', title: 'Gerenciar assinatura', description: 'Use este botão para abrir o portal Stripe e gerenciar cobrança.' },
  { selector: '[data-tour="plan-features"]', title: 'Recursos do plano', description: 'Veja aqui tudo o que está liberado para seu acesso.' },
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
    () => [...(isMobile ? mobileSteps : desktopSteps), ...contextualSteps],
    [isMobile]
  )

  const closeTour = useCallback(() => {
    setTourOpen(false)
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
