'use client'

import { useRouter } from 'next/navigation'
import { DollarSign, MessageCircle, Home } from 'lucide-react'
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
      // Homepage tabs: Preço (0), Contato (1)
      switch (index) {
        case 0: // Preço
          setTimeout(() => {
            const pricingSection = document.getElementById('pricing-section')
            if (pricingSection) {
              const headerOffset = 100
              const elementPosition = pricingSection.getBoundingClientRect().top
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset
              
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              })
            }
          }, 100)
          break
        case 1: // Contato
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
          break
      }
    } else {
      // Service page tabs: Preço (0), Contato (1), Homepage (2)
      switch (index) {
        case 0: // Preço
          setTimeout(() => {
            const pricingSection = document.getElementById('pricing-section')
            if (pricingSection) {
              const headerOffset = 100
              const elementPosition = pricingSection.getBoundingClientRect().top
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset
              
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              })
            }
          }, 100)
          break
        case 1: // Contato
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
          break
        case 2: // Homepage
          // Usar window.location para garantir redirecionamento completo
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
          break
      }
    }
  }

  const homepageTabs = [
    { title: 'Preço', icon: DollarSign },
    { title: 'Contato', icon: MessageCircle },
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
        className="bg-gray-900 border-gray-700"
      />
    </div>
  )
}

