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

  // Dashboard admin: sem nav, só fundo e conteúdo
  if (isDashboard) {
    return (
      <>
        <MainBackground />
        <div className="min-h-screen">{children}</div>
        <ConditionalWhatsAppFloat />
      </>
    )
  }

  // Layout normal com Header (footer preto antigo removido); pt para não ficar atrás do nav fixo
  return (
    <>
      <MainBackground />
      <FloatingHeader />
      <div className="pt-16 sm:pt-20 md:pt-24">{children}</div>
      <ConditionalWhatsAppFloat />
    </>
  )
}

