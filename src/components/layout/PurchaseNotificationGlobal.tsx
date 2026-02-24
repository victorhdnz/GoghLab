'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { PostPurchaseOnboardingTour } from '@/components/layout/PostPurchaseOnboardingTour'

const PURCHASE_PENDING_KEY = 'gogh_purchase_notification_pending'
const PURCHASE_DISMISSED_KEY = 'gogh_purchase_notification_dismissed'

interface PendingData {
  planName?: string
  isServiceSubscription?: boolean
}

export function PurchaseNotificationGlobal() {
  const [pending, setPending] = useState<PendingData | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [tourOpen, setTourOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
    if (typeof window === 'undefined') return
    const update = () => setIsMobile(window.innerWidth < 1024)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const dismiss = () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(PURCHASE_PENDING_KEY)
    sessionStorage.setItem(PURCHASE_DISMISSED_KEY, '1')
    sessionStorage.setItem('gogh_purchase_notification_dismissed', '1') // mesma chave da página de success
    setPending(null)
    setDismissed(true)
  }

  if (!pending || dismissed) return null

  const commonSteps = [
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

  const desktopSteps = [
    {
      selector: '[data-tour="nav-home-desktop"]',
      title: 'Início',
      description: 'Volte para a Home sempre que quiser ver novidades e atalhos.',
    },
    {
      selector: '[data-tour="nav-create-desktop"]',
      title: 'Criar (Agenda IA)',
      description: 'Aqui você planeja conteúdos e gera roteiros com IA.',
    },
    {
      selector: '[data-tour="nav-product-desktop"]',
      title: 'Produto',
      description: 'Abra esse menu para acessar Ferramentas e Cursos do seu plano.',
    },
    ...commonSteps,
  ]

  const mobileSteps = [
    {
      selector: '[data-tour="nav-home-mobile"]',
      title: 'Início',
      description: 'Este ícone leva para a página inicial.',
    },
    {
      selector: '[data-tour="nav-create-mobile"]',
      title: 'Criar (Agenda IA)',
      description: 'Toque aqui para abrir o planejador e criar conteúdo com IA.',
    },
    {
      selector: '[data-tour="nav-product-mobile"]',
      title: 'Produto',
      description: 'Aqui você abre o menu com Ferramentas e Cursos.',
    },
    ...commonSteps,
  ]

  const contextualSteps = [
    {
      selector: '[data-tour="account-tab-plan"]',
      title: 'Plano & Uso',
      description: 'Nesta aba você confere seu plano e benefícios atuais.',
    },
    {
      selector: '[data-tour="manage-subscription"]',
      title: 'Gerenciar assinatura',
      description: 'Use este botão para abrir o portal Stripe e gerenciar cobrança.',
    },
    {
      selector: '[data-tour="plan-features"]',
      title: 'Recursos do plano',
      description: 'Veja aqui tudo o que está liberado para seu acesso.',
    },
  ]

  const tourSteps = [...(isMobile ? mobileSteps : desktopSteps), ...contextualSteps]

  return (
    <div className="fixed top-4 left-3 right-3 sm:left-4 sm:right-4 z-[120] max-w-2xl mx-auto pointer-events-auto">
      <Banner
        show
        variant="gradient"
        title="Compra confirmada! Seu acesso foi liberado."
        description={`${
          pending.planName ? `Plano ${pending.planName} ativo. ` : ''
        }Quer uma visão rápida da plataforma? Inicie o tour guiado e veja onde fica cada área.`}
        showShade
        closable
        onHide={dismiss}
        icon={<Rocket className="h-4 w-4 text-[#0A0A0A]" />}
        className="border-[#F7C948]/50 bg-white/95 backdrop-blur-md"
        action={
          <Button
            size="sm"
            onClick={() => setTourOpen(true)}
            className="inline-flex items-center gap-1 rounded-md bg-black/10 px-3 py-1.5 text-sm font-medium text-[#0A0A0A] transition-colors hover:bg-black/20"
            variant="ghost"
          >
            Começar tour
            <ArrowRight className="h-3 w-3" />
          </Button>
        }
      />

      <PostPurchaseOnboardingTour
        open={tourOpen}
        steps={tourSteps}
        onClose={() => setTourOpen(false)}
        onFinish={() => {
          setTourOpen(false)
          dismiss()
        }}
      />
    </div>
  )
}
