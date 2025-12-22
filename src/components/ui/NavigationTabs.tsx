'use client'

import { useRouter } from 'next/navigation'
import { DollarSign, MessageCircle, GitCompare, Home } from 'lucide-react'
import { ExpandableTabs } from './expandable-tabs'

interface NavigationTabsProps {
  variant: 'homepage' | 'service'
  className?: string
}

export function NavigationTabs({ variant, className }: NavigationTabsProps) {
  const router = useRouter()

  const handleTabChange = (index: number | null) => {
    if (index === null) return

    if (variant === 'homepage') {
      // Homepage tabs: Preço (0), Contato (1), Comparador (2)
      switch (index) {
        case 0: // Preço
          const pricingSection = document.getElementById('pricing-section')
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          break
        case 1: // Contato
          const contactSection = document.getElementById('contact-section')
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          break
        case 2: // Comparador
          router.push('/comparar')
          break
      }
    } else {
      // Service page tabs: Preço (0), Contato (1), Homepage (2)
      switch (index) {
        case 0: // Preço
          const pricingSection = document.getElementById('pricing-section')
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          break
        case 1: // Contato
          const contactSection = document.getElementById('contact-section')
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          break
        case 2: // Homepage
          router.push('/')
          break
      }
    }
  }

  const homepageTabs = [
    { title: 'Preço', icon: DollarSign },
    { title: 'Contato', icon: MessageCircle },
    { type: 'separator' as const },
    { title: 'Comparador', icon: GitCompare },
  ]

  const serviceTabs = [
    { title: 'Preço', icon: DollarSign },
    { title: 'Contato', icon: MessageCircle },
    { type: 'separator' as const },
    { title: 'Homepage', icon: Home },
  ]

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] ${className || ''}`}>
      <ExpandableTabs
        tabs={variant === 'homepage' ? homepageTabs : serviceTabs}
        onChange={handleTabChange}
        activeColor="text-white"
        className="bg-gray-900 border-gray-700"
      />
    </div>
  )
}

