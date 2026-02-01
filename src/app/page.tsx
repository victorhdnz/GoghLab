import { createServerClient } from '@/lib/supabase/server'
import { Service } from '@/types'
import { HomepageTracker } from '@/components/analytics/HomepageTracker'
import { HomepageSections } from '@/components/homepage/HomepageSections'
import { FixedLogo } from '@/components/layout/FixedLogo'
import { NavigationTabs } from '@/components/ui/NavigationTabs'

// Forçar renderização dinâmica porque usamos cookies
export const dynamic = 'force-dynamic'

async function getServices(): Promise<Service[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar serviços:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
    return []
  }
}

async function getSiteSettings() {
  try {
    const supabase = createServerClient()
    type SiteSettingsData = {
      site_name: string | null
      site_description: string | null
      contact_email: string | null
      contact_whatsapp: string | null
      instagram_url: string | null
      site_logo: string | null
      homepage_content: any
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('site_name, site_description, contact_email, contact_whatsapp, instagram_url, site_logo, homepage_content')
      .eq('key', 'general')
      .maybeSingle()

    const dataTyped = data as SiteSettingsData | null

    if (error) {
      console.error('[Homepage] Erro ao buscar site_settings:', error)
      console.error('[Homepage] Detalhes do erro:', JSON.stringify(error, null, 2))
      return null
    }

    if (!dataTyped) {
      console.warn('[Homepage] Nenhum dado encontrado em site_settings para key="general"')
      return null
    }

    // Garantir que homepage_content seja um objeto válido
    let homepageContent: any = {}
    if (dataTyped && dataTyped.homepage_content && typeof dataTyped.homepage_content === 'object') {
      homepageContent = dataTyped.homepage_content
    }

    // Garantir que todos os arrays sejam sempre arrays válidos
    if (homepageContent) {
      if (!Array.isArray(homepageContent.services_cards)) {
        homepageContent.services_cards = []
      }
      if (!Array.isArray(homepageContent.notifications_items)) {
        homepageContent.notifications_items = []
      }
      if (!Array.isArray(homepageContent.testimonials_items)) {
        homepageContent.testimonials_items = []
      }
      if (!Array.isArray(homepageContent.section_order)) {
        homepageContent.section_order = ['hero', 'services', 'comparison', 'notifications', 'testimonials', 'contact']
      }
    }

    return {
      ...dataTyped,
      homepage_content: homepageContent
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return null
  }
}

/** Resolve features dos planos Essencial/Pro a partir de products + plan_products (fonte da verdade). */
async function resolvePricingFeaturesFromProducts(homepageContent: any) {
  const pricing = homepageContent?.pricing
  if (!pricing?.pricing_plans?.length) return homepageContent
  try {
    const supabase = createServerClient() as any
    const { data: productsData } = await supabase.from('products').select('*').eq('is_active', true).order('order_position', { ascending: true })
    const { data: planProductsData } = await supabase.from('plan_products').select('plan_id, product_id')
    const products = productsData || []
    const planProducts = planProductsData || []
    const planIdToDb = (id: string) => (id === 'gogh-essencial' ? 'gogh_essencial' : id === 'gogh-pro' ? 'gogh_pro' : id)
    const plans = pricing.pricing_plans.map((plan: any) => {
      if (plan.id !== 'gogh-essencial' && plan.id !== 'gogh-pro') return plan
      const dbPlanId = planIdToDb(plan.id)
      const productIds = planProducts.filter((pp: any) => pp.plan_id === dbPlanId).map((pp: any) => pp.product_id)
      const features = productIds
        .map((pid: string) => products.find((p: any) => p.id === pid))
        .filter(Boolean)
        .map((p: any) => ({ name: p.name, isIncluded: true, iconUrl: p.icon_url ?? undefined }))
      return { ...plan, features }
    })
    return { ...homepageContent, pricing: { ...pricing, pricing_plans: plans } }
  } catch (e) {
    console.error('[Homepage] Erro ao resolver features de pricing a partir de produtos:', e)
    return homepageContent
  }
}

export default async function Home() {
  const services = await getServices()
  const siteSettings = await getSiteSettings()
  let homepageContent = siteSettings?.homepage_content || {}
  homepageContent = await resolvePricingFeaturesFromProducts(homepageContent)

  // Garantir que arrays sejam sempre arrays válidos
  if (!Array.isArray(homepageContent.notifications_items)) {
    homepageContent.notifications_items = []
  }
  if (!Array.isArray(homepageContent.testimonials_items)) {
    homepageContent.testimonials_items = []
  }
  if (!Array.isArray(homepageContent.services_cards)) {
    homepageContent.services_cards = []
  }

  // Ordem padrão das seções
  let sectionOrder = homepageContent.section_order || ['hero', 'video', 'services', 'comparison', 'notifications', 'testimonials', 'spline', 'pricing', 'contact']
  // Garantir que 'video', 'notifications', 'testimonials', 'spline' e 'pricing' estejam na ordem se não estiverem
  if (Array.isArray(sectionOrder)) {
    if (!sectionOrder.includes('video')) {
      const heroIndex = sectionOrder.indexOf('hero')
      if (heroIndex >= 0) {
        sectionOrder = [...sectionOrder]
        sectionOrder.splice(heroIndex + 1, 0, 'video')
      } else {
        sectionOrder = ['video', ...sectionOrder]
      }
    }
    if (!sectionOrder.includes('notifications')) {
      const contactIndex = sectionOrder.indexOf('contact')
      if (contactIndex >= 0) {
        sectionOrder = [...sectionOrder]
        sectionOrder.splice(contactIndex, 0, 'notifications')
      } else {
        sectionOrder = [...sectionOrder, 'notifications']
      }
    }
    if (!sectionOrder.includes('testimonials')) {
      const contactIndex = sectionOrder.indexOf('contact')
      if (contactIndex >= 0) {
        sectionOrder = [...sectionOrder]
        sectionOrder.splice(contactIndex, 0, 'testimonials')
      } else {
        sectionOrder = [...sectionOrder, 'testimonials']
      }
    }
    if (!sectionOrder.includes('spline')) {
      const contactIndex = sectionOrder.indexOf('contact')
      if (contactIndex >= 0) {
        sectionOrder = [...sectionOrder]
        sectionOrder.splice(contactIndex, 0, 'spline')
      } else {
        sectionOrder = [...sectionOrder, 'spline']
      }
    }
    if (!sectionOrder.includes('pricing')) {
      const contactIndex = sectionOrder.indexOf('contact')
      if (contactIndex >= 0) {
        sectionOrder = [...sectionOrder]
        sectionOrder.splice(contactIndex, 0, 'pricing')
      } else {
        sectionOrder = [...sectionOrder, 'pricing']
      }
    }
  }

  let sectionVisibility = homepageContent.section_visibility || {
    hero: true,
    video: false,
    services: true,
    comparison: true,
    notifications: true,
    testimonials: true,
    spline: true,
    pricing: false, // Desabilitado por padrão até ser configurado
    contact: true,
  }
  // Garantir que 'video', 'notifications', 'testimonials', 'spline' e 'pricing' tenham visibilidade definida
  if (sectionVisibility.video === undefined) {
    sectionVisibility = { ...sectionVisibility, video: false }
  }
  if (sectionVisibility.notifications === undefined) {
    sectionVisibility = { ...sectionVisibility, notifications: true }
  }
  if (sectionVisibility.testimonials === undefined) {
    sectionVisibility = { ...sectionVisibility, testimonials: true }
  }
  if (sectionVisibility.spline === undefined) {
    sectionVisibility = { ...sectionVisibility, spline: true }
  }
  if (sectionVisibility.pricing === undefined) {
    sectionVisibility = { ...sectionVisibility, pricing: false }
  }

  // Verificar se pricing está habilitado (sectionVisibility.pricing E pricing.pricing_enabled)
  const pricing = homepageContent.pricing || {}
  const pricingEnabled = sectionVisibility.pricing === true && pricing.pricing_enabled === true

  // Extrair logo do siteSettings para passar como prop (carregamento imediato)
  let siteLogo = siteSettings?.site_logo || null
  if (!siteLogo && homepageContent?.hero_logo) {
    siteLogo = homepageContent.hero_logo
  }
  const siteName = siteSettings?.site_name || 'Gogh Lab'

  return (
    <HomepageTracker>
      <FixedLogo logo={siteLogo} siteName={siteName} />
      <div className="min-h-screen bg-black">
        <HomepageSections
          homepageContent={homepageContent}
          siteSettings={siteSettings}
          services={services}
          sectionVisibility={sectionVisibility}
          sectionOrder={sectionOrder}
        />
        <NavigationTabs variant="homepage" pricingEnabled={pricingEnabled} />
      </div>
    </HomepageTracker>
  )
}
