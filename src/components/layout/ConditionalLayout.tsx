'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { FloatingHeader } from '@/components/ui/floating-header'
import { MainBackground } from './MainBackground'
import { ConditionalWhatsAppFloat } from './ConditionalWhatsAppFloat'

interface ConditionalLayoutProps {
  children: ReactNode
}

// Rotas que não devem exibir Header/Footer padrão
const hiddenLayoutRoutes = ['/membro', '/login', '/auth', '/termos', '/termos-login-google', '/termos-assinatura-planos']

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  const shouldHideLayout = hiddenLayoutRoutes.some(route => pathname.startsWith(route))
  const isDashboard = pathname.startsWith('/dashboard')

  if (shouldHideLayout) {
    // Área de membros - sem Header/Footer padrão
    return <>{children}</>
  }

  // Dashboard admin: sem nav, só fundo e conteúdo. No mobile: área arrastável para os lados (overflow-x) para poder ver e clicar em tudo.
  if (isDashboard) {
    return (
      <>
        <MainBackground />
        <div
          className="min-h-screen w-full overflow-x-auto overflow-y-visible md:overflow-visible md:overflow-x-visible"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <div className="min-w-max min-h-full md:min-w-0 md:w-full">
            {children}
          </div>
        </div>
        <ConditionalWhatsAppFloat />
      </>
    )
  }

  // Layout normal com Header (footer preto antigo removido); pt para não ficar atrás do nav fixo
  return (
    <>
      <MainBackground />
      <FloatingHeader />
      <div className="pt-16 sm:pt-20 md:pt-24 pb-24 lg:pb-0">{children}</div>
      <ConditionalWhatsAppFloat />
    </>
  )
}

