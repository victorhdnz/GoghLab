'use client'

import { useState } from 'react'
import { PricingComponent, PriceTier, BillingCycle, ComparisonFeature, FeatureCategory } from '@/components/ui/pricing-card'
import { FadeInSection } from '@/components/ui/FadeInSection'

interface ServicePricingProps {
  enabled?: boolean
  title?: string
  description?: string
  annualDiscount?: number
  plans?: [PriceTier, PriceTier, PriceTier]
  whatsappNumber?: string
  serviceName?: string
  comparisonFeatures?: ComparisonFeature[]
  featureCategories?: FeatureCategory[]
}

export function ServicePricing({
  enabled = false,
  title,
  description,
  annualDiscount = 20,
  plans,
  whatsappNumber,
  serviceName,
  comparisonFeatures = [],
  featureCategories = [],
}: ServicePricingProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annually')

  if (!enabled || !plans) return null

  const handlePlanSelect = (planId: string, cycle: BillingCycle, plan: PriceTier) => {
    // Obter a mensagem apropriada baseada no ciclo de cobrança
    let message = cycle === 'monthly' 
      ? (plan.whatsappMessageMonthly || `Olá! Gostaria de contratar o plano ${plan.name} no plano mensal.`)
      : (plan.whatsappMessageAnnually || `Olá! Gostaria de contratar o plano ${plan.name} no plano anual.`)
    
    // Adicionar nome do serviço se disponível
    if (serviceName) {
      message = `${message} Serviço: ${serviceName}.`
    }
    
    // Obter número do WhatsApp (priorizar o configurado, senão usar padrão)
    const phoneNumber = whatsappNumber?.replace(/\D/g, '') || '5534984136291'
    
    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message)
    
    // Redirecionar para WhatsApp
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  return (
    <FadeInSection>
      <section className="py-16 md:py-24 px-4 bg-black">
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

