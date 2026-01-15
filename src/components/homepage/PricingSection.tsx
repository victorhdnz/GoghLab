'use client'

import { useState } from 'react'
import { PricingComponent, PriceTier, BillingCycle, FeatureCategory } from '@/components/ui/pricing-card'
import { FadeInSection } from '@/components/ui/FadeInSection'

interface PricingSectionProps {
  enabled?: boolean
  title?: string
  description?: string
  annualDiscount?: number
  plans?: [PriceTier, PriceTier, PriceTier]
  whatsappNumber?: string
  featureCategories?: FeatureCategory[]
}

export function PricingSection({
  enabled = false,
  title,
  description,
  annualDiscount = 20,
  plans,
  whatsappNumber,
  featureCategories = [],
}: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annually')

  if (!enabled || !plans) return null

  const handlePlanSelect = (planId: string, cycle: BillingCycle, plan: PriceTier) => {
    // Obter a mensagem apropriada baseada no ciclo de cobrança
    const message = cycle === 'monthly' 
      ? (plan.whatsappMessageMonthly || `Olá! Gostaria de contratar o plano ${plan.name} no plano mensal.`)
      : (plan.whatsappMessageAnnually || `Olá! Gostaria de contratar o plano ${plan.name} no plano anual.`)
    
    // Obter número do WhatsApp (priorizar o configurado, senão usar padrão)
    const phoneNumber = whatsappNumber?.replace(/\D/g, '') || '5534984136291'
    
    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message)
    
    // Redirecionar para WhatsApp
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  return (
    <FadeInSection>
      <section id="pricing-section" className="py-16 md:py-24 px-4 bg-[#F5F1E8]">
        <PricingComponent
          plans={plans}
          billingCycle={billingCycle}
          onCycleChange={setBillingCycle}
          onPlanSelect={handlePlanSelect}
          title={title}
          description={description}
          annualDiscountPercent={annualDiscount}
          featureCategories={featureCategories}
        />
      </section>
    </FadeInSection>
  )
}

