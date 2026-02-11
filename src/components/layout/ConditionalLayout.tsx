'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { FloatingHeader } from '@/components/ui/floating-header'
import { Footer } from './Footer'
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

  if (shouldHideLayout) {
    // Área de membros - sem Header/Footer padrão
    return <>{children}</>
  }

  // Layout normal com Header e Footer
  return (
    <>
      <MainBackground />
      <FloatingHeader />
      {children}
      <Footer />
      <ConditionalWhatsAppFloat />
    </>
  )
}

