import { createServerClient } from '@/lib/supabase/server'
import { Service } from '@/types'
import { HomepageTracker } from '@/components/analytics/HomepageTracker'
import { HomepageSections } from '@/components/homepage/HomepageSections'
import { FixedLogo } from '@/components/layout/FixedLogo'
import { NavigationTabs } from '@/components/ui/NavigationTabs'

// Forçar renderização dinâmica (usa cookies)
export const dynamic = 'force-dynamic'

async function getServices(): Promise<Service[]> {
  try {
    const supabase = createServerClient()
    
    // Query com timeout de 3 segundos
    const queryPromise = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    const timeoutPromise = new Promise<{ data: Service[] | null; error: { message: string } }>((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ Timeout ao buscar serviços - retornando array vazio')
        resolve({ data: [], error: { message: 'Timeout' } })
      }, 3000) // 3 segundos de timeout
    })

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    if (error && error.message !== 'Timeout') {
      console.error('Erro ao buscar serviços:', error)
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
    
    // Query com timeout de 3 segundos
    const queryPromise = supabase
      .from('site_settings')
      .select('site_name, site_description, contact_email, contact_whatsapp, instagram_url, site_logo, homepage_content')
      .eq('key', 'general')
      .maybeSingle()

    // Valores padrão caso dê timeout ou erro
    const defaultSettings = {
      site_name: 'Gogh Lab',
      site_description: 'Plataforma inteligente e autônoma baseada em agentes de IA',
      contact_email: 'contato.goghlab@gmail.com',
      contact_whatsapp: null,
      instagram_url: null,
      site_logo: null,
      homepage_content: {}
    }

    const timeoutPromise = new Promise<{ data: typeof defaultSettings | null; error: { message: string } }>((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ Timeout ao buscar configurações - usando valores padrão')
        resolve({ data: defaultSettings, error: { message: 'Timeout' } })
      }, 3000) // 3 segundos de timeout
    })

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    // Se deu timeout, retornar valores padrão
    if (error?.message === 'Timeout') {
      console.warn('⚠️ Timeout ao buscar site_settings - usando valores padrão')
      return defaultSettings
    }

    // Se houver erro (não timeout), retornar valores padrão
    if (error) {
      console.error('Error fetching site settings:', error)
      return defaultSettings
    }

    // Se não há dados, retornar valores padrão
    if (!data) {
      return defaultSettings
    }
    
    // Garantir que homepage_content seja um objeto válido
    let homepageContent: any = {}
    if (data && data.homepage_content && typeof data.homepage_content === 'object') {
      homepageContent = data.homepage_content
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
      ...data,
      homepage_content: homepageContent
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    // Retornar valores padrão em caso de erro
    return {
      site_name: 'Gogh Lab',
      site_description: 'Plataforma inteligente e autônoma baseada em agentes de IA',
      contact_email: 'contato.goghlab@gmail.com',
      contact_whatsapp: null,
      instagram_url: null,
      site_logo: null,
      homepage_content: {}
    }
  }
}

export default async function Home() {
  const services = await getServices()
  const siteSettings = await getSiteSettings()
  
  // Garantir que siteSettings nunca seja null
  const safeSiteSettings = siteSettings || {
    site_name: 'Gogh Lab',
    site_description: 'Plataforma inteligente e autônoma baseada em agentes de IA',
    contact_email: 'contato.goghlab@gmail.com',
    contact_whatsapp: null,
    instagram_url: null,
    site_logo: null,
    homepage_content: {}
  }
  
  const homepageContent = safeSiteSettings.homepage_content || {}
  
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
  let siteLogo = safeSiteSettings.site_logo || null
  if (!siteLogo && homepageContent?.hero_logo) {
    siteLogo = homepageContent.hero_logo
  }
  const siteName = safeSiteSettings.site_name || 'Gogh Lab'

  return (
    <HomepageTracker>
      <FixedLogo logo={siteLogo} siteName={siteName} />
      <div className="min-h-screen bg-black">
        <HomepageSections
          homepageContent={homepageContent}
          siteSettings={safeSiteSettings}
          services={services}
          sectionVisibility={sectionVisibility}
          sectionOrder={sectionOrder}
        />
        <NavigationTabs variant="homepage" pricingEnabled={pricingEnabled} />
      </div>
    </HomepageTracker>
  )
}
