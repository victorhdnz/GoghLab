import { createServerClient } from '@/lib/supabase/server'
import { Service } from '@/types'
import { HomepageTracker } from '@/components/analytics/HomepageTracker'
import { HomepageSections } from '@/components/homepage/HomepageSections'

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
    
    // Garantir que services_cards seja sempre um array
    if (homepageContent && !Array.isArray(homepageContent.services_cards)) {
      homepageContent.services_cards = []
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
  
  // Ordem padrão das seções
  const sectionOrder = homepageContent.section_order || ['hero', 'services', 'comparison', 'notifications', 'contact']
  const sectionVisibility = homepageContent.section_visibility || {
    hero: true,
    services: true,
    comparison: true,
    notifications: true,
    contact: true,
  }

  return (
    <HomepageTracker>
      <div className="min-h-screen bg-black">
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
