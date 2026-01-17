'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PricingComponent, PriceTier, BillingCycle, FeatureCategory } from '@/components/ui/pricing-card'
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

  if (!enabled || !plans) return null

  const handlePlanSelect = async (planId: string, cycle: BillingCycle, plan: PriceTier) => {
    // Obter o Price ID do Stripe baseado no ciclo
    const priceId = cycle === 'monthly' 
      ? plan.stripePriceIdMonthly 
      : plan.stripePriceIdAnnually

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
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + '#pricing-section')}&plan=${planId}&cycle=${cycle}`
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
      window.location.href = `/login?plan=${planId}&cycle=${cycle}`
    }
  }

  return (
    <section id="pricing-section" className="py-16 md:py-24 px-4 bg-[#F5F1E8]">
      <FadeInElement>
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
        
        {/* Terms - Assinatura de Planos */}
        <div className="max-w-6xl mx-auto mt-12 p-6 bg-white/50 rounded-lg border border-[#F7C948]/20">
          <p className="text-center text-sm text-gray-700 mb-3">
            <strong>Importante:</strong> Ao assinar qualquer plano, você concorda expressamente com os{' '}
            <Link 
              href="/termos-assinatura-planos" 
              className="underline hover:text-[#F7C948] font-semibold text-[#0A0A0A]"
            >
              Termos de Assinatura e Planos
            </Link>
            , que incluem informações detalhadas sobre:
          </p>
          <ul className="text-center text-xs text-gray-600 space-y-1 max-w-2xl mx-auto">
            <li>• Limites de uso mensais de cada recurso (mensagens de IA, cursos, ferramentas Pro, etc.)</li>
            <li>• Política de cancelamento e reembolso (7 dias de arrependimento conforme CDC)</li>
            <li>• Renovação automática e alterações nos planos</li>
            <li>• Limitação de responsabilidade e isenção de garantias</li>
            <li>• Propriedade intelectual e uso adequado dos recursos</li>
          </ul>
          <p className="text-center text-xs text-gray-500 mt-4">
            Leia atentamente os termos antes de realizar a assinatura. Dúvidas? Entre em contato conosco.
          </p>
        </div>
      </FadeInElement>
    </section>
  )
}

