'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PricingComponent, PriceTier, BillingCycle, FeatureCategory, PlanSelection } from '@/components/ui/pricing-card'
import { FadeInElement } from '@/components/ui/FadeInElement'

interface PricingSectionProps {
  enabled?: boolean
  title?: string
  description?: string
  annualDiscount?: number
  plans?: PriceTier[]
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
  const hasServicePlan = plans?.some(plan => plan.planType === 'service') ?? false

  if (!enabled || !plans) return null

  // Disparar evento ViewContent quando a seção de preços for visualizada
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'ViewContent', {
        content_name: 'Planos e Preços',
        content_category: 'Pricing'
      })
    }
  }, [])

  const handlePlanSelect = async (planId: string, cycle: BillingCycle, plan: PriceTier, selection?: PlanSelection) => {
    if (plan.planType === 'service') {
      try {
        if (typeof window !== 'undefined' && (window as any).fbq) {
          const total = selection?.totalPrice || 0
          ;(window as any).fbq('track', 'InitiateCheckout', {
            value: total,
            currency: 'BRL',
            content_name: plan.name
          })
        }

        const response = await fetch('/api/checkout/service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            planId,
            planName: plan.name,
            billingCycle: cycle,
            selectedServiceIds: selection?.selectedServiceOptions.map(option => option.id) || [],
          }),
        })

        const data = await response.json()

        if (data.url) {
          window.location.href = data.url
          return
        }

        if (data.requiresAuth) {
          alert('Você precisa estar logado para contratar este serviço. Redirecionando para login...')
          window.location.href = `/login?redirect=${encodeURIComponent('/precos')}&plan=${planId}&cycle=${cycle}`
          return
        }

        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank')
          return
        }

        console.error('Erro ao criar sessão de checkout:', data.error)
        alert(data.error || 'Erro ao processar contratação. Tente novamente.')
      } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error)
        alert('Erro ao processar contratação. Tente novamente.')
      }
      return
    }

    // Obter o Price ID do Stripe baseado no ciclo
    const priceId = cycle === 'monthly' 
      ? plan.stripePriceIdMonthly 
      : plan.stripePriceIdAnnually

    // Disparar evento InitiateCheckout do Meta Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnually
      ;(window as any).fbq('track', 'InitiateCheckout', {
        value: price,
        currency: 'BRL',
        content_name: plan.name
      })
    }

    // Se tiver Price ID configurado, verificar login primeiro
    if (priceId) {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            priceId,
            planId,
            planName: plan.name,
            billingCycle: cycle,
          }),
        })

        const data = await response.json()

        if (data.url) {
          window.location.href = data.url
        } else if (data.requiresAuth) {
          // Se precisar de autenticação, redirecionar para login
          alert('Você precisa estar logado para comprar um plano. Redirecionando para login...')
          window.location.href = `/login?redirect=${encodeURIComponent('/precos')}&plan=${planId}&cycle=${cycle}`
        } else {
          console.error('Erro ao criar sessão de checkout:', data.error)
          alert(data.error || 'Erro ao processar pagamento. Tente novamente.')
        }
      } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error)
        alert('Erro ao processar pagamento. Tente novamente.')
      }
    } else {
      // Fallback: redirecionar para página de login/cadastro se não tiver Stripe configurado
      window.location.href = `/login?redirect=${encodeURIComponent('/precos')}&plan=${planId}&cycle=${cycle}`
    }
  }

  return (
    <section id="pricing-section" className="pt-5 pb-10 md:pt-8 md:pb-14 px-3 sm:px-4 bg-[#F5F1E8] overflow-visible">
      <FadeInElement>
        <div className="max-w-5xl mx-auto overflow-visible">
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
        </div>
        
        {/* Terms - Assinatura de Planos (resumido) */}
        <div className="max-w-5xl mx-auto mt-6 p-4 sm:p-5 bg-white/50 rounded-lg border border-[#F7C948]/20">
          <p className="text-center text-sm text-gray-700">
            Ao assinar qualquer plano, você concorda expressamente com os{' '}
            <Link 
              href="/termos-assinatura-planos" 
              className="underline hover:text-[#F7C948] font-semibold text-[#0A0A0A]"
            >
              Termos de Assinatura e Planos
            </Link>
            .
            {hasServicePlan && (
              <>
                {' '}
                Para serviços personalizados, consulte também os{' '}
                <Link
                  href="/termos?termo=termos-servicos"
                  className="underline hover:text-[#F7C948] font-semibold text-[#0A0A0A]"
                >
                  Termos de Serviços Personalizados
                </Link>
                .
              </>
            )}
          </p>
          <p className="text-center text-xs text-gray-500 mt-3">
            Leia os termos antes de assinar. Dúvidas? Entre em contato.
          </p>
        </div>
      </FadeInElement>
    </section>
  )
}

