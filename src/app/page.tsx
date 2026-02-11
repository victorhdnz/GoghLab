import { unstable_noStore } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { Service } from '@/types'
import { HomepageTracker } from '@/components/analytics/HomepageTracker'
import { HomepageSections } from '@/components/homepage/HomepageSections'

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
      if (!Array.isArray(homepageContent.team_members)) {
        homepageContent.team_members = []
      }
      if (!Array.isArray(homepageContent.section_order)) {
        homepageContent.section_order = ['hero', 'services', 'comparison', 'notifications', 'testimonials', 'contact']
      }
      if (homepageContent.gallery_carousel && !Array.isArray(homepageContent.gallery_carousel.items)) {
        homepageContent.gallery_carousel = { ...homepageContent.gallery_carousel, items: [] }
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

export default async function Home() {
  unstable_noStore()
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

  // Ordem padrão das seções (pricing está em página própria /precos)
  let sectionOrder = homepageContent.section_order || ['hero', 'typewriter', 'video', 'trusted_by', 'features', 'gallery', 'services', 'comparison', 'notifications', 'testimonials', 'team', 'spline', 'contact']
  // Garantir que 'video', 'notifications', 'testimonials', 'spline' estejam na ordem se não estiverem
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
    if (!sectionOrder.includes('team')) {
      const contactIndex = sectionOrder.indexOf('contact')
      if (contactIndex >= 0) {
        sectionOrder = [...sectionOrder]
        sectionOrder.splice(contactIndex, 0, 'team')
      } else {
        sectionOrder = [...sectionOrder, 'team']
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
  }

  let sectionVisibility = homepageContent.section_visibility || {
    hero: true,
    typewriter: true,
    video: false,
    services: true,
    comparison: true,
    notifications: true,
    testimonials: true,
    team: true,
    spline: true,
    contact: true,
    gallery: true,
  }
  // Garantir que 'video', 'notifications', 'testimonials', 'team', 'spline' e 'gallery' tenham visibilidade definida
  if (sectionVisibility.video === undefined) {
    sectionVisibility = { ...sectionVisibility, video: false }
  }
  if (sectionVisibility.notifications === undefined) {
    sectionVisibility = { ...sectionVisibility, notifications: true }
  }
  if (sectionVisibility.testimonials === undefined) {
    sectionVisibility = { ...sectionVisibility, testimonials: true }
  }
  if (sectionVisibility.team === undefined) {
    sectionVisibility = { ...sectionVisibility, team: true }
  }
  if (sectionVisibility.spline === undefined) {
    sectionVisibility = { ...sectionVisibility, spline: true }
  }
  if (sectionVisibility.gallery === undefined) {
    sectionVisibility = { ...sectionVisibility, gallery: true }
  }
  if (sectionVisibility.typewriter === undefined) {
    sectionVisibility = { ...sectionVisibility, typewriter: true }
  }

  return (
    <HomepageTracker>
      <div className="bg-[#F5F1E8]">
        <HomepageSections
          homepageContent={homepageContent}
          siteSettings={siteSettings}
          services={services}
          sectionVisibility={sectionVisibility}
          sectionOrder={sectionOrder}
        />
      </div>
    </HomepageTracker>
  )
}
