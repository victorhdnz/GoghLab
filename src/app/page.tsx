import { createServerClient } from '@/lib/supabase/server'
import { Service } from '@/types'
import { HomepageTracker } from '@/components/analytics/HomepageTracker'
import { HomepageSections } from '@/components/homepage/HomepageSections'
import { FixedLogo } from '@/components/layout/FixedLogo'
import { NavigationTabs } from '@/components/ui/NavigationTabs'

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
    const { data, error } = await supabase
      .from('site_settings')
      .select('site_name, site_description, contact_email, contact_whatsapp, instagram_url, site_logo, homepage_content')
      .eq('key', 'general')
      .maybeSingle()

    if (error) {
      console.error('Error fetching site settings:', error)
      return null
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
    return null
  }
}

export default async function Home() {
  const services = await getServices()
  const siteSettings = await getSiteSettings()
  const homepageContent = siteSettings?.homepage_content || {}
  
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
  let sectionOrder = homepageContent.section_order || ['hero', 'services', 'comparison', 'notifications', 'testimonials', 'spline', 'pricing', 'contact']
  // Garantir que 'notifications', 'testimonials', 'spline' e 'pricing' estejam na ordem se não estiverem
  if (Array.isArray(sectionOrder)) {
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
    services: true,
    comparison: true,
    notifications: true,
    testimonials: true,
    spline: true,
    pricing: false, // Desabilitado por padrão até ser configurado
    contact: true,
  }
  // Garantir que 'notifications', 'testimonials', 'spline' e 'pricing' tenham visibilidade definida
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

  return (
    <HomepageTracker>
      <FixedLogo />
      <div className="min-h-screen bg-black">
        <HomepageSections
          homepageContent={homepageContent}
          siteSettings={siteSettings}
          services={services}
          sectionVisibility={sectionVisibility}
          sectionOrder={sectionOrder}
        />
        <NavigationTabs variant="homepage" />
      </div>
    </HomepageTracker>
  )
}
