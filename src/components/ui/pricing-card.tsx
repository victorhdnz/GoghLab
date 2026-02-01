'use client'

import * as React from 'react'
import { useState, useRef } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/Modal"
import { Switch } from "@/components/ui/Switch"
import { Check, X, Star } from "lucide-react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import NumberFlow from "@number-flow/react"
import { useMobile } from "@/hooks/useMobile"

// --- 1. Typescript Interfaces (API) ---

export type BillingCycle = 'monthly' | 'annually'

export interface Feature {
  name: string
  isIncluded: boolean
  tooltip?: string
  /** URL do ícone do produto (upload na aba Planos) */
  iconUrl?: string
}

export interface PlanCategoryValue {
  category_id: string
  text: string // Se vazio, significa que não tem o recurso
}

export interface ServiceOption {
  id: string
  name: string
  description?: string
  priceMonthly: number
  priceAnnually: number
}

export interface PriceTier {
  id: string
  name: string
  description: string
  priceMonthly: number
  priceAnnually: number
  isPopular: boolean
  buttonLabel: string
  features: Feature[]
  planType?: 'subscription' | 'service'
  serviceOptions?: ServiceOption[]
  // Valores das categorias de comparação (category_id -> text)
  category_values?: PlanCategoryValue[]
  // Mensagens personalizadas para WhatsApp (legado)
  whatsappMessageMonthly?: string
  whatsappMessageAnnually?: string
  // Stripe Price IDs para checkout
  stripePriceIdMonthly?: string
  stripePriceIdAnnually?: string
}

export interface FeatureCategory {
  id: string
  name: string
  order: number
}

export interface PlanSelection {
  selectedServiceOptions: ServiceOption[]
  totalPrice: number
}

export interface PricingComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The list of pricing tiers to display. Can contain 2 or 3 tiers. */
  plans: PriceTier[]
  /** The currently selected billing cycle. */
  billingCycle: BillingCycle
  /** Callback function when the user changes the billing cycle. */
  onCycleChange: (cycle: BillingCycle) => void
  /** Callback function when a user selects a plan. */
  onPlanSelect: (planId: string, cycle: BillingCycle, plan: PriceTier, selection?: PlanSelection) => void
  /** Título personalizado */
  title?: string
  /** Descrição personalizada */
  description?: string
  /** Percentual de desconto anual */
  annualDiscountPercent?: number
  /** Categorias de recursos para comparação detalhada */
  featureCategories?: FeatureCategory[]
}

// --- 2. Utility Components ---

/** Renders a single feature row with an icon. */
const FeatureItem: React.FC<{ feature: Feature }> = ({ feature }) => {
  const Icon = feature.isIncluded ? Check : X
  const iconColor = feature.isIncluded ? "text-[#F7C948]" : "text-gray-400" // Amarelo Gogh Lab

  return (
    <li className="flex items-start space-x-3 py-2">
      <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", iconColor)} aria-hidden="true" />
      <span className={cn("text-sm", feature.isIncluded ? "text-[#0A0A0A]" : "text-gray-400")}>
        {feature.name}
      </span>
    </li>
  )
}

// --- 3. Main Component: PricingComponent ---

export const PricingComponent: React.FC<PricingComponentProps> = ({
  plans,
  billingCycle,
  onCycleChange,
  onPlanSelect,
  title = "Escolha o plano ideal para sua empresa",
  description = "Soluções completas para sua presença digital: plataforma com IA + serviços de agência quando você precisar de execução.",
  annualDiscountPercent = 20,
  featureCategories = [],
  className,
  ...props
}) => {
  const [detailPlan, setDetailPlan] = useState<PriceTier | null>(null)
  const [selectedServiceOptions, setSelectedServiceOptions] = useState<Record<string, string[]>>({})
  const switchRef = useRef<HTMLDivElement>(null)
  const isDesktop = !useMobile(768)

  const getDefaultSelectedOptions = React.useCallback((plan: PriceTier): string[] => {
    // Começar sem nada selecionado - o usuário escolhe o que quer
    return []
  }, [])

  const getSelectedOptionsForPlan = React.useCallback((plan: PriceTier): string[] => {
    return selectedServiceOptions[plan.id] || getDefaultSelectedOptions(plan)
  }, [selectedServiceOptions, getDefaultSelectedOptions])

  const toggleServiceOption = React.useCallback((plan: PriceTier, optionId: string) => {
    setSelectedServiceOptions(prev => {
      const current = prev[plan.id] || getDefaultSelectedOptions(plan)
      const exists = current.includes(optionId)
      const next = exists ? current.filter(id => id !== optionId) : [...current, optionId]
      return {
        ...prev,
        [plan.id]: next
      }
    })
  }, [getDefaultSelectedOptions])

  const getServiceSelectionSummary = React.useCallback((plan: PriceTier, cycle: BillingCycle): PlanSelection => {
    if (!plan.serviceOptions || plan.serviceOptions.length === 0) {
      return { selectedServiceOptions: [], totalPrice: plan.priceMonthly }
    }
    const selectedIds = getSelectedOptionsForPlan(plan)
    const selectedServiceOptions = plan.serviceOptions.filter(option => selectedIds.includes(option.id))
    const basePrice = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnually
    const optionsTotal = selectedServiceOptions.reduce((sum, option) => {
      const optionPrice = cycle === 'monthly' ? option.priceMonthly : option.priceAnnually
      return sum + optionPrice
    }, 0)
    return {
      selectedServiceOptions,
      totalPrice: basePrice + optionsTotal
    }
  }, [getSelectedOptionsForPlan])

  // Ensure at least 1 plan is passed
  if (!plans || plans.length === 0) {
    console.error("PricingComponent requires at least 1 pricing tier.")
    return null
  }

  // --- 3.1. Billing Toggle (Switch + confetti ao ativar anual) ---
  const handleBillingToggle = (checked: boolean) => {
    onCycleChange(checked ? 'annually' : 'monthly')
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ['#F7C948', '#E5A800', '#0A0A0A', '#F5F1E8'],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['circle'],
      })
    }
  }
  const CycleToggle = (
    <div ref={switchRef} className="flex justify-center items-center gap-3 mb-10 mt-2">
      <Switch
        checked={billingCycle === 'annually'}
        onCheckedChange={handleBillingToggle}
        className="[&>div]:!flex [&>div]:!items-center [&>div]:!gap-0"
      />
      <span className="text-sm font-semibold text-[#0A0A0A]">
        Cobrança anual <span className="text-[#E5A800]">(Economize {annualDiscountPercent}%)</span>
      </span>
    </div>
  )

  // --- 3.2. Pricing Cards & Comparison Table Data ---

  // Render the list of pricing cards
  const gridCols = plans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'
  const priceFormat = { style: 'currency' as const, currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }

  const PricingCards = (
    <div className={`grid gap-8 ${gridCols} md:gap-6 lg:gap-8`}>
      {plans.map((plan, index) => {
        const isFeatured = plan.isPopular
        const serviceSelection = plan.planType === 'service'
          ? getServiceSelectionSummary(plan, billingCycle)
          : null
        // Para planos de serviço, usar o preço dinâmico baseado nas seleções
        const currentPrice = plan.planType === 'service' && serviceSelection
          ? serviceSelection.totalPrice
          : (billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnually)
        const originalMonthlyPrice = plan.planType === 'service' && serviceSelection
          ? serviceSelection.totalPrice
          : plan.priceMonthly
        const displayPriceMonthly = plan.planType === 'service' && serviceSelection
          ? serviceSelection.totalPrice
          : plan.priceMonthly
        const displayPriceAnnualMonthly = plan.planType === 'service' && serviceSelection
          ? serviceSelection.totalPrice / 12
          : plan.priceAnnually / 12
        const priceSuffix = billingCycle === 'monthly' ? '/mês' : '/ano'

        return (
          <motion.div
            key={plan.id}
            initial={isDesktop ? { y: 50, opacity: 0.8 } : {}}
            whileInView={
              isDesktop
                ? {
                    y: isFeatured ? -20 : 0,
                    opacity: 1,
                    x: index === plans.length - 1 ? -30 : index === 0 ? 30 : 0,
                    scale: index === 0 || index === plans.length - 1 ? 0.94 : 1,
                  }
                : {}
            }
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 1.6,
              type: 'spring',
              stiffness: 100,
              damping: 30,
              delay: 0.1 * index,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              'flex flex-col',
              !isFeatured && 'mt-5',
              index === 0 && 'origin-right',
              index === plans.length - 1 && 'origin-left',
            )}
          >
          <Card
            className={cn(
              "flex flex-col transition-all duration-300 text-[#0A0A0A] h-full",
              "bg-white/85 dark:bg-white/90 backdrop-blur-xl border border-white/60 dark:border-white/40",
              "shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
              "transform hover:scale-[1.02] hover:-translate-y-1",
              isFeatured && "ring-2 ring-[#F7C948] shadow-xl md:scale-[1.02] hover:scale-[1.05] border-[#F7C948]/70 bg-white/95 dark:bg-white/95"
            )}
          >
            <CardHeader className="p-6 pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-[#0A0A0A]">{plan.name}</CardTitle>
                {isFeatured && (
                  <div className="flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-[#F7C948] text-[#0A0A0A] rounded-bl-xl rounded-tr-xl">
                    <Star className="h-4 w-4 fill-current" />
                    <span>Popular</span>
                  </div>
                )}
              </div>
              <CardDescription className="text-sm mt-1 text-gray-600">{plan.description}</CardDescription>
              
              {/* Recursos do Plano - espelhados dos produtos atribuídos (plan.features) */}
              {plan.planType !== 'service' && plan.features && plan.features.length > 0 && (
                <div className="mt-6 border-t border-[#F7C948]/20 pt-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">Recursos Inclusos:</h4>
                  <ul className="space-y-2">
                    {plan.features
                      .filter(f => f.isIncluded)
                      .map((f, i) => (
                        <li key={i} className="flex items-center gap-3">
                          {f.iconUrl ? (
                            <img src={f.iconUrl} alt="" className="h-6 w-6 rounded object-cover flex-shrink-0 border border-gray-200" />
                          ) : (
                            <Check className="h-4 w-4 flex-shrink-0 text-[#F7C948] mt-0.5" aria-hidden="true" />
                          )}
                          <span className="text-sm text-[#0A0A0A]">{f.name}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4">
                {billingCycle === 'monthly' ? (
                  <>
                    <p className="text-4xl font-extrabold text-[#0A0A0A] flex flex-wrap items-baseline gap-1">
                      <NumberFlow
                        value={displayPriceMonthly}
                        format={priceFormat}
                        className="tabular-nums"
                      />
                      <span className="text-base font-normal text-gray-500">/mês</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Economize {annualDiscountPercent}% com o plano anual
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-extrabold text-[#0A0A0A] flex flex-wrap items-baseline gap-1">
                      <NumberFlow
                        value={displayPriceAnnualMonthly}
                        format={priceFormat}
                        className="tabular-nums"
                      />
                      <span className="text-base font-normal text-gray-500">/mês</span>
                    </p>
                    {plan.planType !== 'service' && (
                      <p className="text-sm text-gray-400 line-through mt-1">
                        <NumberFlow value={originalMonthlyPrice} format={priceFormat} className="tabular-nums" />/mês
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-6 pt-0">
              {plan.planType === 'service' && plan.serviceOptions && plan.serviceOptions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">Serviços inclusos na sua escolha:</h4>
                  <div className="space-y-2">
                    {plan.serviceOptions.map(option => {
                      const selectedIds = getSelectedOptionsForPlan(plan)
                      const isSelected = selectedIds.includes(option.id)
                      // Para anual, mostrar mensal equivalente em destaque
                      const optionPrice = billingCycle === 'monthly' ? option.priceMonthly : (option.priceAnnually / 12)
                      const priceSuffix = billingCycle === 'monthly' ? '/mês' : '/mês'
                      const annualTotal = option.priceAnnually

                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                            isSelected
                              ? "border-[#F7C948] bg-[#F7C948]/10"
                              : "border-gray-200 bg-white hover:border-[#F7C948]/50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#F7C948] focus:ring-[#F7C948]"
                              checked={isSelected}
                              onChange={() => toggleServiceOption(plan, option.id)}
                            />
                            <div>
                              <p className="text-sm font-medium text-[#0A0A0A]">{option.name}</p>
                              {option.description && (
                                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-[#0A0A0A] text-right">
                            <div>
                              R$ {optionPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-xs text-gray-500 ml-1">{priceSuffix}</span>
                            </div>
                            {billingCycle === 'annually' && (
                              <p className="text-xs text-gray-400 mt-0.5 font-normal">
                                Total anual: R$ {annualTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  {serviceSelection && (
                    <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[#0A0A0A]">
                      <span>Total com serviços selecionados:</span>
                      <div className="text-right">
                        {billingCycle === 'monthly' ? (
                          <span>
                            R$ {serviceSelection.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs text-gray-500 ml-1">/mês</span>
                          </span>
                        ) : (
                          <>
                            <span>
                              R$ {(serviceSelection.totalPrice / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-xs text-gray-500 ml-1">/mês</span>
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5 font-normal">
                              Total anual: R$ {serviceSelection.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Selecione os serviços que deseja contratar. O preço será calculado automaticamente.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-6 pt-0 flex flex-col gap-3">
              <Button
                onClick={() => {
                  if (plan.planType === 'service') {
                    const selection = getServiceSelectionSummary(plan, billingCycle)
                    if (!selection || selection.selectedServiceOptions.length === 0) return
                    onPlanSelect(plan.id, billingCycle, plan, selection)
                    return
                  }
                  onPlanSelect(plan.id, billingCycle, plan)
                }}
                disabled={plan.planType === 'service' && (!serviceSelection || serviceSelection.selectedServiceOptions.length === 0)}
                className={cn(
                  "w-full transition-all duration-200",
                  isFeatured
                    ? "bg-[#F7C948] hover:bg-[#E5A800] text-[#0A0A0A] shadow-lg font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                    : "bg-transparent text-[#0A0A0A] hover:bg-[#F7C948] hover:text-[#0A0A0A] border-2 border-[#F7C948]/50 hover:border-[#F7C948] disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                )}
                size="lg"
                aria-label={`Select ${plan.name} plan for ${currentPrice} ${priceSuffix}`}
              >
                {plan.buttonLabel || (plan.planType === 'service' ? 'Adquirir' : 'Assinar')}
              </Button>
              {plan.planType === 'service' && (!serviceSelection || serviceSelection.selectedServiceOptions.length === 0) && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Selecione pelo menos um serviço para continuar
                </p>
              )}
            </CardFooter>
          </Card>
          </motion.div>
        )
      })}
    </div>
  )

  // --- 3.3. Final Render ---
  return (
    <div className={cn("w-full py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)} {...props}>
      <header className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A0A]">
          {title}
        </h2>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          {description}
        </p>
      </header>
      
      {CycleToggle}
      
      {/* Pricing Cards (Mobile-first layout) */}
      <section aria-labelledby="pricing-plans">
        {PricingCards}
      </section>

      {/* Modal "Ver mais" com detalhes do plano */}
      <Modal
        isOpen={!!detailPlan}
        onClose={() => setDetailPlan(null)}
        title={detailPlan ? detailPlan.name : ''}
        size="md"
      >
        {detailPlan && (
          <div className="space-y-4">
            <p className="text-gray-600">{detailPlan.description}</p>
            {detailPlan.features && detailPlan.features.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#0A0A0A] mb-2">Recursos inclusos</h4>
                <ul className="space-y-2">
                  {detailPlan.features
                    .filter(f => f.isIncluded)
                    .map((f, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {f.iconUrl ? (
                          <img src={f.iconUrl} alt="" className="h-6 w-6 rounded object-cover flex-shrink-0 border border-gray-200" />
                        ) : (
                          <Check className="h-4 w-4 flex-shrink-0 text-[#F7C948] mt-0.5" aria-hidden="true" />
                        )}
                        <span className="text-sm text-gray-700">{f.name}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-2xl font-bold text-[#0A0A0A]">
                R$ {detailPlan.priceMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ou R$ {(detailPlan.priceAnnually / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês no plano anual (economia de {annualDiscountPercent}%)
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

