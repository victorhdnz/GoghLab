import { unstable_noStore } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { resolvePricingFeaturesFromProducts } from '@/lib/pricing-resolve'
import { PricingSection } from '@/components/homepage/PricingSection'
import { getCreditsConfigKey } from '@/lib/credits'

export const dynamic = 'force-dynamic'

function planIdToCreditsKey(planId: string): string {
  if (planId === 'gogh-essencial') return 'gogh_essencial'
  if (planId === 'gogh-pro') return 'gogh_pro'
  return planId
}

export default async function PrecosPage() {
  unstable_noStore()

  const supabase = createServerClient()

  const [generalResult, creditsResult] = await Promise.all([
    supabase
      .from('site_settings')
      .select('site_name, site_logo, contact_whatsapp, instagram_url, homepage_content')
      .eq('key', 'general')
      .maybeSingle(),
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle(),
  ])
  const { data: row, error } = generalResult
  const { data: creditsRow } = creditsResult

  if (error || !row) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-muted-foreground">Não foi possível carregar os planos. Tente novamente mais tarde.</p>
      </div>
    )
  }

  type GeneralRow = {
    contact_whatsapp?: string | null
    site_name?: string | null
    site_logo?: string | null
    instagram_url?: string | null
    homepage_content?: unknown
  }
  const generalRow = row as GeneralRow
  const homepageContent: any =
    generalRow.homepage_content && typeof generalRow.homepage_content === 'object'
      ? generalRow.homepage_content
      : {}
  const resolvedContent = await resolvePricingFeaturesFromProducts(supabase, homepageContent)
  const pricing = resolvedContent?.pricing || {}

  const creditsData = creditsRow as { value?: unknown } | null
  const creditsConfig = creditsData?.value && typeof creditsData.value === 'object'
    ? (creditsData.value as { monthlyCreditsByPlan?: Record<string, number> })
    : null
  const monthlyCreditsByPlan = creditsConfig?.monthlyCreditsByPlan || {}

  if (Array.isArray(pricing.pricing_plans)) {
    const allowedPlanIds = new Set(['gogh-essencial', 'gogh-pro'])
    pricing.pricing_plans = pricing.pricing_plans
      .filter((plan: any) => allowedPlanIds.has(plan.id) && plan.planType !== 'service')
      .map((plan: any) => {
        const creditsKey = planIdToCreditsKey(plan.id)
        const credits = monthlyCreditsByPlan[creditsKey]
        return { ...plan, planType: 'subscription', monthlyCredits: typeof credits === 'number' ? credits : undefined }
      })
  }
  const siteSettings = {
    contact_whatsapp: generalRow.contact_whatsapp ?? null,
    site_name: generalRow.site_name ?? null,
    site_logo: generalRow.site_logo ?? null,
    instagram_url: generalRow.instagram_url ?? null,
  }

  const hasPlans = Array.isArray(pricing.pricing_plans) && pricing.pricing_plans.length > 0
  const enabled = pricing.pricing_enabled === true && hasPlans

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <PricingSection
        enabled={enabled}
        title={pricing.pricing_title}
        description={pricing.pricing_description}
        annualDiscount={pricing.pricing_annual_discount ?? 20}
        plans={pricing.pricing_plans}
        whatsappNumber={pricing.pricing_whatsapp_number || siteSettings.contact_whatsapp}
        featureCategories={pricing.feature_categories || []}
      />
      {!enabled && (
        <section className="py-24 px-4 bg-[#F5F1E8]">
          <div className="container mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Planos e preços</h1>
            <p className="text-gray-600">
              Os planos estão em configuração. Em breve você poderá ver as opções disponíveis aqui.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Se você é administrador, configure os planos em{' '}
              <a href="/dashboard/pricing" className="underline text-[#F7C948] font-medium">
                Dashboard → Planos
              </a>
              .
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
