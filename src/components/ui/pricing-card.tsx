'use client'

import * as React from 'react'
import { useState } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/Modal"
import { Check, X, BarChart3 } from "lucide-react"

// --- 1. Typescript Interfaces (API) ---

export type BillingCycle = 'monthly' | 'annually'

export interface Feature {
  name: string
  isIncluded: boolean
  tooltip?: string
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
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)
  const [selectedServiceOptions, setSelectedServiceOptions] = useState<Record<string, string[]>>({})

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

  // --- 3.1. Billing Toggle ---
  const CycleToggle = (
    <div className="flex justify-center mb-10 mt-2">
      <ToggleGroup
        type="single"
        value={billingCycle}
        onValueChange={(value) => {
          if (value && (value === 'monthly' || value === 'annually')) {
            onCycleChange(value)
          }
        }}
        aria-label="Select billing cycle"
        className="border border-[#F7C948]/30 rounded-lg p-1 bg-white/80"
      >
        <ToggleGroupItem
          value="monthly"
          aria-label="Cobrança Mensal"
          className="px-6 py-1.5 text-sm font-medium text-gray-600 data-[state=on]:bg-[#F7C948] data-[state=on]:text-[#0A0A0A] data-[state=on]:shadow-sm data-[state=on]:border data-[state=on]:border-[#E5A800] rounded-md transition-colors"
        >
          Mensal
        </ToggleGroupItem>
        <ToggleGroupItem
          value="annually"
          aria-label="Cobrança Anual"
          className="px-6 py-1.5 text-sm font-medium text-gray-600 data-[state=on]:bg-[#F7C948] data-[state=on]:text-[#0A0A0A] data-[state=on]:shadow-sm data-[state=on]:border data-[state=on]:border-[#E5A800] rounded-md transition-colors relative"
        >
          Anual
          <span className="absolute -top-3 right-0 text-xs font-semibold text-[#0A0A0A] bg-[#F7C948] border border-[#E5A800] px-1.5 rounded-full whitespace-nowrap">
            Economize {annualDiscountPercent}%
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )

  // --- 3.2. Pricing Cards & Comparison Table Data ---

  // Usar categorias se disponíveis, senão usar features dos planos
  const allCategories = featureCategories.length > 0
    ? featureCategories.map(c => c.name)
    : []
  
  // Render the list of pricing cards
  const gridCols = plans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'
  const PricingCards = (
    <div className={`grid gap-8 ${gridCols} md:gap-6 lg:gap-8`}>
      {plans.map((plan) => {
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
        const priceSuffix = billingCycle === 'monthly' ? '/mês' : '/ano'

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col transition-all duration-300 shadow-md hover:shadow-xl bg-white border border-[#F7C948]/30 text-[#0A0A0A]",
              "transform hover:scale-[1.02] hover:-translate-y-1",
              isFeatured && "ring-2 ring-[#F7C948] shadow-xl md:scale-[1.02] hover:scale-[1.05] border-[#F7C948]"
            )}
          >
            <CardHeader className="p-6 pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-[#0A0A0A]">{plan.name}</CardTitle>
                {isFeatured && (
                  <span className="text-xs font-semibold px-3 py-1 bg-[#F7C948] text-[#0A0A0A] rounded-full">
                    Mais Popular
                  </span>
                )}
              </div>
              <CardDescription className="text-sm mt-1 text-gray-600">{plan.description}</CardDescription>
              
              {/* Recursos do Plano - Baseado nas categorias da comparação */}
              {plan.planType !== 'service' && featureCategories.length > 0 && plan.category_values && (
                <div className="mt-6 border-t border-[#F7C948]/20 pt-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">Recursos Inclusos:</h4>
                  <ul className="space-y-2">
                    {featureCategories
                      .sort((a, b) => a.order - b.order)
                      .map((category) => {
                        const categoryValue = (plan.category_values || []).find(cv => cv.category_id === category.id)
                        const hasResource = !!(categoryValue?.text && categoryValue.text.trim() !== '')
                        
                        // Mostrar apenas recursos que o plano possui
                        if (!hasResource) return null
                        
                        return (
                          <li key={category.id} className="flex items-start gap-2">
                            <Check className="h-4 w-4 flex-shrink-0 text-[#F7C948] mt-0.5" aria-hidden="true" />
                            <span className="text-sm text-[#0A0A0A]">
                              {category.name}
                            </span>
                          </li>
                        )
                      })}
                  </ul>
                </div>
              )}
              
              <div className="mt-4">
                {billingCycle === 'monthly' ? (
                  <>
                    <p className="text-4xl font-extrabold text-[#0A0A0A]">
                      R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-base font-normal text-gray-500 ml-1">/mês</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Economize {annualDiscountPercent}% com o plano anual
                    </p>
                  </>
                ) : (
                  <>
                    {/* Destaque: parcela mensal equivalente */}
                    <p className="text-4xl font-extrabold text-[#0A0A0A]">
                      R$ {(plan.planType === 'service' && serviceSelection
                        ? (serviceSelection.totalPrice / 12)
                        : (plan.priceAnnually / 12)
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-base font-normal text-gray-500 ml-1">/mês</span>
                    </p>
                    {/* Preço mensal original riscado - apenas se não for serviço */}
                    {plan.planType !== 'service' && (
                      <p className="text-sm text-gray-400 line-through mt-1">
                        R$ {originalMonthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                      </p>
                    )}
                    {/* Total anual menor */}
                    <p className="text-xs text-gray-500 mt-2">
                      Cobrado anualmente: R$ {(plan.planType === 'service' && serviceSelection
                        ? serviceSelection.totalPrice
                        : plan.priceAnnually
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {/* Economia - apenas se não for serviço */}
                    {plan.planType !== 'service' && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        Economia de R$ {((originalMonthlyPrice * 12) - plan.priceAnnually).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano
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
            <CardFooter className="p-6 pt-0">
              <Button
                onClick={() => {
                  if (plan.planType === 'service') {
                    const selection = getServiceSelectionSummary(plan, billingCycle)
                    // Validar se pelo menos um serviço foi selecionado
                    if (!selection || selection.selectedServiceOptions.length === 0) {
                      return // Não fazer nada se nenhum serviço estiver selecionado
                    }
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
        )
      })}
    </div>
  )

  // --- 3.3. Comparison Table (Mobile hidden, Tablet/Desktop visible) ---
  // Ordenar categorias
  const sortedCategories = React.useMemo(() => {
    if (featureCategories.length === 0) {
      return []
    }
    return featureCategories
      .sort((a, b) => a.order - b.order)
  }, [featureCategories])

  // Separar planos de assinatura e serviços
  const subscriptionPlans = plans.filter(p => p.planType !== 'service')
  const servicePlans = plans.filter(p => p.planType === 'service')

  const ComparisonTable = (
    <div className="mt-16 hidden md:block">
      {/* Tabela de Planos de Assinatura */}
      {subscriptionPlans.length > 0 && (
        <div className="border border-[#F7C948]/30 rounded-lg overflow-x-auto shadow-sm bg-white mb-8">
          <table className="min-w-full divide-y divide-[#F7C948]/20">
            <thead>
              <tr className="bg-[#F7C948]/10">
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[#0A0A0A] w-[200px] whitespace-nowrap">
                  Recurso
                </th>
                {subscriptionPlans.map((plan) => (
                  <th
                    key={`th-${plan.id}`}
                    scope="col"
                    className={cn(
                      "px-6 py-4 text-center text-sm font-semibold text-[#0A0A0A] whitespace-nowrap",
                      plan.isPopular && "bg-[#F7C948]/20"
                    )}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7C948]/10 bg-white">
              {sortedCategories.length > 0 ? (
                // Renderizar categorias
                sortedCategories.map((category, index) => {
                  // Verificar valores de cada plano de assinatura para esta categoria
                  const planValues = subscriptionPlans.map(plan => {
                    const categoryValue = (plan.category_values || []).find(cv => cv.category_id === category.id)
                    return {
                      plan,
                      hasCategory: !!(categoryValue?.text && categoryValue.text.trim() !== ''),
                      text: categoryValue?.text || ''
                    }
                  })
              
              const allHaveCategory = planValues.every(pv => pv.hasCategory)

              return (
                <tr key={category.id} className={cn("transition-colors hover:bg-[#F7C948]/5", index % 2 === 0 ? "bg-white" : "bg-[#F5F1E8]/50")}>
                  {/* Nome da categoria (título principal) */}
                  <td className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">
                    {category.name}
                  </td>
                  {planValues.map(({ plan, hasCategory, text }) => {
                    if (allHaveCategory) {
                      // TODOS os planos têm texto: mostrar ✓ + texto específico de cada plano
                      return (
                        <td
                          key={`${plan.id}-${category.id}`}
                          className={cn(
                            "px-6 py-3 text-left transition-all duration-150",
                            plan.isPopular && "bg-[#F7C948]/10"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 flex-shrink-0 text-[#F7C948] mt-0.5" aria-hidden="true" />
                            <span className="text-sm text-gray-600 leading-relaxed">{text}</span>
                          </div>
                        </td>
                      )
                    } else {
                      // APENAS ALGUNS planos têm: mostrar ✓ + texto para quem tem, ✗ para quem não tem
                      return (
                        <td
                          key={`${plan.id}-${category.id}`}
                          className={cn(
                            "px-6 py-3 transition-all duration-150",
                            hasCategory ? "text-left" : "text-center",
                            plan.isPopular && "bg-[#F7C948]/10"
                          )}
                        >
                          {hasCategory && text ? (
                            <div className="flex items-start gap-2">
                              <Check className="h-4 w-4 flex-shrink-0 text-[#F7C948] mt-0.5" aria-hidden="true" />
                              <span className="text-sm text-gray-600 leading-relaxed">{text}</span>
                            </div>
                          ) : (
                            <X className="h-5 w-5 mx-auto text-gray-400" aria-hidden="true" />
                          )}
                        </td>
                      )
                    }
                  })}
                </tr>
              )
            })
          ) : (
            // Fallback: mostrar lista simples sem categorias (features antigas)
            allCategories.length > 0 ? (
              allCategories.map((categoryName, index) => (
                <tr key={categoryName} className={cn("transition-colors hover:bg-[#F7C948]/5", index % 2 === 0 ? "bg-white" : "bg-[#F5F1E8]/50")}>
                  <td className="px-6 py-3 text-left text-sm font-medium text-[#0A0A0A]">
                    {categoryName}
                  </td>
                  {subscriptionPlans.map((plan) => {
                    const category = featureCategories.find(c => c.name === categoryName)
                    const categoryValue = category ? (plan.category_values || []).find(cv => cv.category_id === category.id) : null
                    const isIncluded = !!(categoryValue?.text && categoryValue.text.trim() !== '')
                    
                    const Icon = isIncluded ? Check : X
                    const iconColor = isIncluded ? "text-[#F7C948]" : "text-gray-500"

                    return (
                      <td
                        key={`${plan.id}-${categoryName}`}
                        className={cn(
                          "px-6 py-3 text-center transition-all duration-150",
                          plan.isPopular && "bg-[#F7C948]/10"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 mx-auto", iconColor)} aria-hidden="true" />
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={subscriptionPlans.length + 1} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhuma categoria configurada
                </td>
              </tr>
            )
          )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela de Serviços Personalizados */}
      {servicePlans.length > 0 && servicePlans[0].serviceOptions && servicePlans[0].serviceOptions.length > 0 && (
        <div className="border border-[#F7C948]/30 rounded-lg overflow-x-auto shadow-sm bg-white">
          <h3 className="text-lg font-semibold text-[#0A0A0A] px-6 py-4 bg-[#F7C948]/10 border-b border-[#F7C948]/20">
            Serviços Disponíveis
          </h3>
          <table className="min-w-full divide-y divide-[#F7C948]/20">
            <thead>
              <tr className="bg-[#F7C948]/10">
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[#0A0A0A]">
                  Serviço
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[#0A0A0A]">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-[#0A0A0A]">
                  Preço Mensal
                </th>
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-[#0A0A0A]">
                  Preço Anual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7C948]/10 bg-white">
              {servicePlans[0].serviceOptions.map((service, index) => (
                <tr key={service.id} className={cn("transition-colors hover:bg-[#F7C948]/5", index % 2 === 0 ? "bg-white" : "bg-[#F5F1E8]/50")}>
                  <td className="px-6 py-3 text-left text-sm font-medium text-[#0A0A0A]">
                    {service.name}
                  </td>
                  <td className="px-6 py-3 text-left text-sm text-gray-600">
                    {service.description || '—'}
                  </td>
                  <td className="px-6 py-3 text-center text-sm font-semibold text-[#0A0A0A]">
                    R$ {service.priceMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-center text-sm font-semibold text-[#0A0A0A]">
                    R$ {(service.priceAnnually / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="block text-xs text-gray-500 mt-1">/mês</span>
                    <span className="block text-xs text-green-600 mt-1">Economia de 20%</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      Total anual: R$ {service.priceAnnually.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  // --- 3.4. Final Render ---
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

      {/* Comparison Table (Desktop/Tablet visibility) */}
      <section aria-label="Feature Comparison Table" className="mt-16">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h3 className="text-2xl font-bold hidden md:block text-center text-[#0A0A0A] w-full">
            Comparação Detalhada de Recursos
          </h3>
          {/* Botão para mobile */}
          <Button
            onClick={() => setIsComparisonModalOpen(true)}
            variant="outline"
            className="md:hidden w-full max-w-sm bg-[#F7C948] border-[#E5A800] text-[#0A0A0A] hover:bg-[#E5A800] font-semibold"
          >
            <BarChart3 size={18} className="mr-2" />
            Ver Comparação Detalhada
          </Button>
        </div>
        {ComparisonTable}
      </section>

      {/* Modal para mobile com tabela de comparação */}
      <Modal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        title="Comparação Detalhada de Recursos"
        size="xl"
      >
        <div className="space-y-6">
          {/* Tabela de Planos de Assinatura */}
          {subscriptionPlans.length > 0 && (
            <div className="border border-[#F7C948]/30 rounded-lg overflow-x-auto shadow-sm bg-white">
              <table className="min-w-full divide-y divide-[#F7C948]/20">
                <thead>
                  <tr className="bg-[#F7C948]/10">
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-[#0A0A0A] w-[150px] whitespace-nowrap">
                      Recurso
                    </th>
                    {subscriptionPlans.map((plan) => (
                      <th
                        key={`th-modal-${plan.id}`}
                        scope="col"
                        className={cn(
                          "px-4 py-3 text-center text-sm font-semibold text-[#0A0A0A] whitespace-nowrap",
                          plan.isPopular && "bg-[#F7C948]/20"
                        )}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7C948]/10 bg-white">
                  {sortedCategories.length > 0 ? (
                    sortedCategories.map((category, index) => {
                      const planValues = subscriptionPlans.map(plan => {
                        const categoryValue = (plan.category_values || []).find(cv => cv.category_id === category.id)
                        return {
                          plan,
                          hasCategory: !!(categoryValue?.text && categoryValue.text.trim() !== ''),
                          text: categoryValue?.text || ''
                        }
                      })
                      
                      const allHaveCategory = planValues.length > 0 && planValues.every(pv => pv.hasCategory)

                      return (
                        <tr key={`modal-${category.id}`} className={cn("transition-colors hover:bg-[#F7C948]/5", index % 2 === 0 ? "bg-white" : "bg-[#F5F1E8]/50")}>
                          <td className="px-4 py-3 text-left text-sm font-semibold text-[#0A0A0A]">
                            {category.name}
                          </td>
                          {planValues.map(({ plan, hasCategory, text }) => {
                            if (allHaveCategory) {
                              return (
                                <td
                                  key={`modal-${plan.id}-${category.id}`}
                                  className={cn(
                                    "px-4 py-3 text-left transition-all duration-150",
                                    plan.isPopular && "bg-[#F7C948]/10"
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <Check className="h-4 w-4 flex-shrink-0 text-[#F7C948] mt-0.5" aria-hidden="true" />
                                    <span className="text-sm text-gray-600 leading-relaxed">{text}</span>
                                  </div>
                                </td>
                              )
                            } else {
                              return (
                                <td
                                  key={`modal-${plan.id}-${category.id}`}
                                  className={cn(
                                    "px-4 py-3 transition-all duration-150",
                                    hasCategory ? "text-left" : "text-center",
                                    plan.isPopular && "bg-[#F7C948]/10"
                                  )}
                                >
                                  {hasCategory && text ? (
                                    <div className="flex items-start gap-2">
                                      <Check className="h-4 w-4 flex-shrink-0 text-[#F7C948] mt-0.5" aria-hidden="true" />
                                      <span className="text-sm text-gray-600 leading-relaxed">{text}</span>
                                    </div>
                                  ) : (
                                    <X className="h-5 w-5 mx-auto text-gray-400" aria-hidden="true" />
                                  )}
                                </td>
                              )
                            }
                          })}
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={subscriptionPlans.length + 1} className="px-4 py-4 text-center text-sm text-gray-500">
                        Nenhuma categoria configurada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela de Serviços Personalizados */}
          {servicePlans.length > 0 && servicePlans[0].serviceOptions && servicePlans[0].serviceOptions.length > 0 && (
            <div className="border border-[#F7C948]/30 rounded-lg overflow-x-auto shadow-sm bg-white">
              <h3 className="text-lg font-semibold text-[#0A0A0A] px-4 py-3 bg-[#F7C948]/10 border-b border-[#F7C948]/20">
                Serviços Disponíveis
              </h3>
              <table className="min-w-full divide-y divide-[#F7C948]/20">
                <thead>
                  <tr className="bg-[#F7C948]/10">
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-[#0A0A0A]">
                      Serviço
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-[#0A0A0A]">
                      Descrição
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-sm font-semibold text-[#0A0A0A]">
                      Preço Mensal
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-sm font-semibold text-[#0A0A0A]">
                      Preço Anual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7C948]/10 bg-white">
                  {servicePlans[0].serviceOptions.map((service, index) => (
                    <tr key={service.id} className={cn("transition-colors hover:bg-[#F7C948]/5", index % 2 === 0 ? "bg-white" : "bg-[#F5F1E8]/50")}>
                      <td className="px-4 py-3 text-left text-sm font-medium text-[#0A0A0A]">
                        {service.name}
                      </td>
                      <td className="px-4 py-3 text-left text-sm text-gray-600">
                        {service.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-[#0A0A0A]">
                        R$ {service.priceMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-[#0A0A0A]">
                        R$ {(service.priceAnnually / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="block text-xs text-gray-500 mt-1">/mês</span>
                        <span className="block text-xs text-green-600 mt-1">Economia de 20%</span>
                        <span className="block text-xs text-gray-400 mt-0.5">
                          Total anual: R$ {service.priceAnnually.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

