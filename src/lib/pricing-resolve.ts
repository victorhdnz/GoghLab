/**
 * Resolve features dos planos Essencial/Pro a partir de products + plan_products (fonte da verdade).
 * Usado na página de preços e onde os planos são exibidos.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function resolvePricingFeaturesFromProducts(
  supabase: SupabaseClient,
  homepageContent: any
): Promise<any> {
  const pricing = homepageContent?.pricing
  if (!pricing?.pricing_plans?.length) return homepageContent
  try {
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true })
    const { data: planProductsData } = await supabase
      .from('plan_products')
      .select('plan_id, product_id')
    const products = productsData || []
    const planProducts = planProductsData || []
    const planIdToDb = (id: string) =>
      id === 'gogh-essencial' ? 'gogh_essencial' : id === 'gogh-pro' ? 'gogh_pro' : id
    const plans = pricing.pricing_plans.map((plan: any) => {
      if (plan.id !== 'gogh-essencial' && plan.id !== 'gogh-pro') return plan
      const dbPlanId = planIdToDb(plan.id)
      const productIdSet = new Set(
        planProducts.filter((pp: any) => pp.plan_id === dbPlanId).map((pp: any) => pp.product_id)
      )
      const features = products
        .filter((p: any) => productIdSet.has(p.id))
        .map((p: any) => ({ name: p.name, isIncluded: true, iconUrl: p.icon_url ?? undefined }))
      return { ...plan, features }
    })
    return { ...homepageContent, pricing: { ...pricing, pricing_plans: plans } }
  } catch (e) {
    console.error('[pricing-resolve] Erro ao resolver features a partir de produtos:', e)
    return homepageContent
  }
}
