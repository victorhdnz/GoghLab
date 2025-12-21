import { createServerClient } from '@/lib/supabase/server'
import { Service, ServiceTestimonial } from '@/types'
import { ServiceDetailContent } from '@/types/service-detail'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ServicePageTracker } from '@/components/analytics/ServicePageTracker'
import { ServiceHeroVideo } from '@/components/service-detail/ServiceHeroVideo'
import { ServiceBenefits } from '@/components/service-detail/ServiceBenefits'
import { ServiceGifts } from '@/components/service-detail/ServiceGifts'
import { ServiceAlternateContent } from '@/components/service-detail/ServiceAlternateContent'
import { ServiceAbout } from '@/components/service-detail/ServiceAbout'
import { ServiceTestimonials } from '@/components/service-detail/ServiceTestimonials'
import { ServiceCTA } from '@/components/service-detail/ServiceCTA'
import { FixedLogo } from '@/components/layout/FixedLogo'

async function getService(slug: string): Promise<Service | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar serviço:', error)
    return null
  }
}

async function getTestimonials(serviceId: string): Promise<ServiceTestimonial[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('service_testimonials')
      .select('*')
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Erro ao buscar depoimentos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar depoimentos:', error)
    return []
  }
}

async function getRelatedServices(currentServiceId: string, category?: string): Promise<Service[]> {
  try {
    const supabase = createServerClient()
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .neq('id', currentServiceId)
      .limit(3)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar serviços relacionados:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar serviços relacionados:', error)
    return []
  }
}

async function getServiceDetailLayout(serviceId: string): Promise<ServiceDetailContent | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('services')
      .select('detail_layout')
      .eq('id', serviceId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar layout de detalhes:', error)
      return null
    }

    return data?.detail_layout || null
  } catch (error) {
    console.error('Erro ao buscar layout de detalhes:', error)
    return null
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
    
    return {
      ...data,
      homepage_content: homepageContent
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return null
  }
}

export default async function ServicePage({ params }: { params: { slug: string } }) {
  const service = await getService(params.slug)

  if (!service) {
    notFound()
  }

  const [testimonials, layoutContent, siteSettings] = await Promise.all([
    getTestimonials(service.id),
    getServiceDetailLayout(service.id),
    getSiteSettings(),
  ])

  console.log('📄 Layout carregado para serviço:', {
    serviceId: service.id,
    serviceSlug: service.slug,
    hasLayout: !!layoutContent,
    layoutContent,
  })

  // Usar layout padrão se não houver configuração ou se for um objeto vazio
  const hasValidLayout = layoutContent && Object.keys(layoutContent).length > 0
  const content: ServiceDetailContent = hasValidLayout ? layoutContent : {
    hero_enabled: true,
    hero_title: service.name, // Usar o nome do serviço como título padrão
    benefits_enabled: true,
    benefits_items: [],
    gifts_enabled: false, // Desabilitado por padrão
    gifts_items: [],
    alternate_content_enabled: true,
    alternate_content_items: [],
    about_enabled: true,
    testimonials_enabled: false, // Desabilitado por padrão
    cta_enabled: true,
    section_order: ['hero', 'benefits', 'alternate', 'about', 'cta'], // Removido 'gifts' e 'testimonials'
    section_visibility: {
      hero: true,
      benefits: true,
      gifts: false, // Desabilitado por padrão
      alternate: true,
      about: true,
      testimonials: false, // Desabilitado por padrão
      cta: true,
    },
  }

  // Ordem padrão das seções (sem 'gifts' e 'testimonials')
  const sectionOrder = content.section_order || ['hero', 'benefits', 'alternate', 'about', 'cta']
  const sectionVisibility = content.section_visibility || {
    hero: true,
    benefits: true,
    gifts: false, // Desabilitado por padrão
    alternate: true,
    about: true,
    testimonials: false, // Desabilitado por padrão
    cta: true,
  }
  
  // Filtrar seções desabilitadas da ordem
  const filteredSectionOrder = sectionOrder.filter(sectionId => {
    // Sempre permitir seções principais, mas remover gifts e testimonials se desabilitados
    if (sectionId === 'gifts' && (content.gifts_enabled === false || sectionVisibility.gifts === false)) {
      return false
    }
    if (sectionId === 'testimonials' && (content.testimonials_enabled === false || sectionVisibility.testimonials === false)) {
      return false
    }
    return true
  })

  // Mapear seções para componentes
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => <ServiceHeroVideo content={content} serviceName={service.name} />,
    benefits: () => <ServiceBenefits content={content} />,
    gifts: () => <ServiceGifts content={content} />,
    alternate: () => <ServiceAlternateContent content={content} />,
    about: () => <ServiceAbout content={content} />,
    testimonials: () => <ServiceTestimonials content={content} testimonials={testimonials} />,
    cta: () => <ServiceCTA content={content} siteSettings={siteSettings} />,
  }

  return (
    <ServicePageTracker serviceId={service.id} serviceSlug={service.slug}>
      <FixedLogo />
      <div className="min-h-screen bg-black">
        {/* Renderizar seções na ordem configurada (filtradas) */}
        {filteredSectionOrder.map((sectionId: string) => {
          const renderer = sectionRenderers[sectionId]
          if (!renderer || sectionVisibility[sectionId] === false) return null
          return <div key={sectionId}>{renderer()}</div>
        })}
      </div>
    </ServicePageTracker>
  )
}

