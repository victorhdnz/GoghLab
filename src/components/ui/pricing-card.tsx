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

export interface PriceTier {
  id: string
  name: string
  description: string
  priceMonthly: number
  priceAnnually: number
  isPopular: boolean
  buttonLabel: string
  features: Feature[]
  // Mensagens personalizadas para WhatsApp
  whatsappMessageMonthly?: string
  whatsappMessageAnnually?: string
}

export interface PricingComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The list of pricing tiers to display. Must contain exactly 3 tiers. */
  plans: [PriceTier, PriceTier, PriceTier]
  /** The currently selected billing cycle. */
  billingCycle: BillingCycle
  /** Callback function when the user changes the billing cycle. */
  onCycleChange: (cycle: BillingCycle) => void
  /** Callback function when a user selects a plan. */
  onPlanSelect: (planId: string, cycle: BillingCycle, plan: PriceTier) => void
  /** Título personalizado */
  title?: string
  /** Descrição personalizada */
  description?: string
  /** Percentual de desconto anual */
  annualDiscountPercent?: number
}

// --- 2. Utility Components ---

/** Renders a single feature row with an icon. */
const FeatureItem: React.FC<{ feature: Feature }> = ({ feature }) => {
  const Icon = feature.isIncluded ? Check : X
  const iconColor = feature.isIncluded ? "text-white" : "text-gray-500"

  return (
    <li className="flex items-start space-x-3 py-2">
      <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", iconColor)} aria-hidden="true" />
      <span className={cn("text-sm", feature.isIncluded ? "text-white" : "text-gray-500")}>
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
  description = "Soluções completas de gestão digital para impulsionar seu negócio. Do básico ao enterprise, temos o plano certo para você.",
  annualDiscountPercent = 20,
  className,
  ...props
}) => {
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)

  // Ensure exactly 3 plans are passed for the intended layout
  if (plans.length !== 3) {
    console.error("PricingComponent requires exactly 3 pricing tiers.")
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
        className="border border-gray-700 rounded-lg p-1 bg-gray-900/50"
      >
        <ToggleGroupItem
          value="monthly"
          aria-label="Cobrança Mensal"
          className="px-6 py-1.5 text-sm font-medium text-gray-300 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:shadow-sm data-[state=on]:border data-[state=on]:border-gray-600 rounded-md transition-colors"
        >
          Mensal
        </ToggleGroupItem>
        <ToggleGroupItem
          value="annually"
          aria-label="Cobrança Anual"
          className="px-6 py-1.5 text-sm font-medium text-gray-300 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:shadow-sm data-[state=on]:border data-[state=on]:border-gray-600 rounded-md transition-colors relative"
        >
          Anual
          <span className="absolute -top-3 right-0 text-xs font-semibold text-white bg-gray-800 border border-gray-700 px-1.5 rounded-full whitespace-nowrap">
            Economize {annualDiscountPercent}%
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )

  // --- 3.2. Pricing Cards & Comparison Table Data ---

  // Extract all unique feature names across all plans for the comparison table header
  const allFeatures = Array.from(new Set(plans.flatMap(p => p.features.map(f => f.name))))
  
  // Render the list of pricing cards
  const PricingCards = (
    <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
      {plans.map((plan) => {
        const isFeatured = plan.isPopular
        const currentPrice = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnually
        const originalMonthlyPrice = plan.priceMonthly
        const priceSuffix = billingCycle === 'monthly' ? '/mês' : '/ano'

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col transition-all duration-300 shadow-md hover:shadow-lg bg-gray-900 border border-gray-800 text-white",
              isFeatured && "ring-2 ring-white shadow-xl transform md:scale-[1.02] hover:scale-[1.04]"
            )}
          >
            <CardHeader className="p-6 pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                {isFeatured && (
                  <span className="text-xs font-semibold px-3 py-1 bg-white text-black rounded-full">
                    Mais Popular
                  </span>
                )}
              </div>
              <CardDescription className="text-sm mt-1 text-gray-300">{plan.description}</CardDescription>
              <div className="mt-4">
                <p className="text-4xl font-extrabold text-white">
                  R$ {currentPrice.toLocaleString('pt-BR')}
                  <span className="text-base font-normal text-gray-400 ml-1">{priceSuffix}</span>
                </p>
                {billingCycle === 'annually' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Cobrado anualmente (R$ {plan.priceAnnually.toLocaleString('pt-BR')})
                  </p>
                )}
                {billingCycle === 'annually' && (
                    <p className="text-xs text-gray-500 line-through opacity-70 mt-1">
                        R$ {originalMonthlyPrice.toLocaleString('pt-BR')}/mês
                    </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-6 pt-0">
              <h4 className="text-sm font-semibold mb-2 mt-4 text-gray-300">Recursos Incluídos:</h4>
              <ul className="list-none space-y-0">
                {plan.features.slice(0, 5).map((feature) => (
                  <FeatureItem key={feature.name} feature={feature} />
                ))}
                {plan.features.length > 5 && (
                    <li className="text-sm text-gray-400 mt-2">
                        + {plan.features.length - 5} more features
                    </li>
                )}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button
                onClick={() => onPlanSelect(plan.id, billingCycle, plan)}
                className={cn(
                  "w-full transition-all duration-200",
                  isFeatured
                    ? "bg-white hover:bg-gray-100 text-black shadow-lg"
                    : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                )}
                size="lg"
                aria-label={`Select ${plan.name} plan for ${currentPrice} ${priceSuffix}`}
              >
                {plan.buttonLabel}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )

  // --- 3.3. Comparison Table (Mobile hidden, Tablet/Desktop visible) ---
  const ComparisonTable = (
    <div className="mt-16 hidden md:block border border-gray-700 rounded-lg overflow-x-auto shadow-sm bg-gray-900">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr className="bg-gray-800">
            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white w-[200px] whitespace-nowrap">
              Recurso
            </th>
            {plans.map((plan) => (
              <th
                key={`th-${plan.id}`}
                scope="col"
                className={cn(
                  "px-6 py-4 text-center text-sm font-semibold text-white whitespace-nowrap",
                  plan.isPopular && "bg-gray-800"
                )}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-900">
          {allFeatures.map((featureName, index) => (
            <tr key={featureName} className={cn("transition-colors hover:bg-gray-800", index % 2 === 0 ? "bg-gray-900" : "bg-gray-800/50")}>
              <td className="px-6 py-3 text-left text-sm font-medium text-white whitespace-nowrap">
                {featureName}
              </td>
              {plans.map((plan) => {
                const feature = plan.features.find(f => f.name === featureName)
                const isIncluded = feature?.isIncluded ?? false
                const Icon = isIncluded ? Check : X
                const iconColor = isIncluded ? "text-white" : "text-gray-500"

                return (
                  <td
                    key={`${plan.id}-${featureName}`}
                    className={cn(
                      "px-6 py-3 text-center transition-all duration-150",
                      plan.isPopular && "bg-gray-800/30"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 mx-auto", iconColor)} aria-hidden="true" />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // --- 3.4. Final Render ---
  return (
    <div className={cn("w-full py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)} {...props}>
      <header className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
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
          <h3 className="text-2xl font-bold hidden md:block text-center text-white w-full">
            Comparação Detalhada de Recursos
          </h3>
          {/* Botão para mobile */}
          <Button
            onClick={() => setIsComparisonModalOpen(true)}
            variant="outline"
            className="md:hidden w-full max-w-sm bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
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
        <div className="border border-gray-700 rounded-lg overflow-x-auto shadow-sm bg-gray-900">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr className="bg-gray-800">
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-white w-[150px] whitespace-nowrap">
                  Recurso
                </th>
                {plans.map((plan) => (
                  <th
                    key={`th-modal-${plan.id}`}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-center text-sm font-semibold text-white whitespace-nowrap",
                      plan.isPopular && "bg-gray-800"
                    )}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-900">
              {allFeatures.map((featureName, index) => (
                <tr key={`modal-${featureName}`} className={cn("transition-colors hover:bg-gray-800", index % 2 === 0 ? "bg-gray-900" : "bg-gray-800/50")}>
                  <td className="px-4 py-3 text-left text-sm font-medium text-white">
                    {featureName}
                  </td>
                  {plans.map((plan) => {
                    const feature = plan.features.find(f => f.name === featureName)
                    const isIncluded = feature?.isIncluded ?? false
                    const Icon = isIncluded ? Check : X
                    const iconColor = isIncluded ? "text-white" : "text-gray-500"

                    return (
                      <td
                        key={`modal-${plan.id}-${featureName}`}
                        className={cn(
                          "px-4 py-3 text-center transition-all duration-150",
                          plan.isPopular && "bg-gray-800/30"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 mx-auto", iconColor)} aria-hidden="true" />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}

