'use client'

import { useRouter } from 'next/navigation'
import { DollarSign, MessageCircle, User } from 'lucide-react'
import { ExpandableTabs } from './expandable-tabs'
import { useAuth } from '@/contexts/AuthContext'

interface NavigationTabsProps {
  variant: 'homepage' | 'service'
  pricingEnabled?: boolean
  className?: string
}

export function NavigationTabs({ variant, pricingEnabled = true, className }: NavigationTabsProps) {
  const router = useRouter()
  const { isAuthenticated, hasActiveSubscription, loading } = useAuth()

  const handleTabChange = (index: number | null) => {
    if (index === null) return

    // Determinar quais tabs estão disponíveis
    const availableTabs = buildAvailableTabs()

    // Mapear índice para seção baseado nas tabs disponíveis
    const section = availableTabs[index]
    
    if (!section) return

    if (section === 'pricing') {
      router.push('/precos')
    } else if (section === 'contact') {
      setTimeout(() => {
        const contactSection = document.getElementById('contact-section')
        if (contactSection) {
          const headerOffset = 100
          const elementPosition = contactSection.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    } else if (section === 'account') {
      if (isAuthenticated) {
        router.push('/conta')
      } else {
        router.push('/login')
      }
    }
  }

  // Construir array de sections disponíveis
  const buildAvailableTabs = () => {
    const sections: string[] = []
    if (pricingEnabled) sections.push('pricing')
    sections.push('contact')
    sections.push('account')
    return sections
  }

  // Construir tabs dinamicamente
  const buildTabs = () => {
    const tabs: { title: string; icon: any }[] = []
    
    if (pricingEnabled) {
      tabs.push({ title: 'Preço', icon: DollarSign })
    }
    tabs.push({ title: 'Contato', icon: MessageCircle })
    
    // Adicionar tab de conta com título dinâmico
    if (!loading) {
      if (isAuthenticated) {
        // Sempre mostrar "Minha Conta" para usuários autenticados
        tabs.push({ title: 'Minha Conta', icon: User })
      } else {
        tabs.push({ title: 'Entrar', icon: User })
      }
    } else {
      tabs.push({ title: 'Conta', icon: User })
    }
    
    return tabs
  }

  const tabs = buildTabs()
  if (tabs.length === 0) return null

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] ${className || ''}`}>
      <ExpandableTabs
        tabs={tabs}
        onChange={handleTabChange}
        className="bg-gogh-beige border-gogh-yellow/30 shadow-lg"
      />
    </div>
  )
}

