'use client'

import { usePathname } from 'next/navigation'
import { WhatsAppFloat } from '@/components/ui/WhatsAppFloat'

/**
 * Renderiza o WhatsAppFloat apenas em páginas que não sejam landing pages
 * Landing pages têm seus próprios botões WhatsApp configuráveis
 */
export function ConditionalWhatsAppFloat() {
  const pathname = usePathname()
  
  // Não mostrar o botão global nas landing pages, catálogos e suporte
  const isLandingPage = pathname?.startsWith('/lp/')
  const isCatalog = pathname?.startsWith('/catalogo')
  const isSupport = pathname?.startsWith('/suporte')
  
  if (isLandingPage || isCatalog || isSupport) {
    return null
  }
  
  return <WhatsAppFloat />
}

