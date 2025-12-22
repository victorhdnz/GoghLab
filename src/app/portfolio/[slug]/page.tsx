import { createServerClient } from '@/lib/supabase/server'
import { Service } from '@/types'
import { ServiceDetailContent } from '@/types/service-detail'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ServicePageTracker } from '@/components/analytics/ServicePageTracker'
import { ServiceHeroVideo } from '@/components/service-detail/ServiceHeroVideo'
import { ServiceBenefits } from '@/components/service-detail/ServiceBenefits'
import { ServiceAlternateContent } from '@/components/service-detail/ServiceAlternateContent'
import { ServicePricing } from '@/components/service-detail/ServicePricing'
import { ServiceCTA } from '@/components/service-detail/ServiceCTA'
import { FixedLogo } from '@/components/layout/FixedLogo'
import { NavigationTabs } from '@/components/ui/NavigationTabs'

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

  const [layoutContent, siteSettings] = await Promise.all([
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
    alternate_content_enabled: true,
    alternate_content_items: [],
    cta_enabled: true,
    section_order: ['hero', 'benefits', 'alternate', 'cta'],
    section_visibility: {
      hero: true,
      benefits: true,
      alternate: true,
      cta: true,
    },
  }

  // Ordem padrão das seções (sem 'gifts', 'testimonials' e 'about')
  const sectionOrder = (content.section_order || ['hero', 'benefits', 'alternate', 'pricing', 'cta']).filter(
    (sectionId) => sectionId !== 'gifts' && sectionId !== 'testimonials' && sectionId !== 'about'
  )
  // Garantir que 'pricing' esteja antes de 'cta' se não estiver
  if (!sectionOrder.includes('pricing')) {
    const ctaIndex = sectionOrder.indexOf('cta')
    if (ctaIndex >= 0) {
      sectionOrder.splice(ctaIndex, 0, 'pricing')
    } else {
      sectionOrder.push('pricing')
    }
  }
  
  const sectionVisibility = content.section_visibility || {
    hero: true,
    benefits: true,
    alternate: true,
    pricing: false,
    cta: true,
  }
  
  // Garantir que gifts, testimonials e about não estejam na visibilidade
  if (sectionVisibility.gifts !== undefined) delete sectionVisibility.gifts
  if (sectionVisibility.testimonials !== undefined) delete sectionVisibility.testimonials
  if (sectionVisibility.about !== undefined) delete sectionVisibility.about
  if (sectionVisibility.pricing === undefined) sectionVisibility.pricing = false

  // Obter dados de pricing do site_settings
  const pricing = siteSettings?.homepage_content?.pricing || {}

  // Mapear seções para componentes
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => <ServiceHeroVideo content={content} serviceName={service.name} />,
    benefits: () => <ServiceBenefits content={content} />,
    alternate: () => <ServiceAlternateContent content={content} />,
    pricing: () => {
      // A seção apenas espelha o que está configurado em /dashboard/pricing
      // Só aparece se estiver habilitada na página de pricing
      if (pricing.pricing_enabled !== true) return null
      
      return (
        <ServicePricing
          enabled={true}
          title={pricing.pricing_title}
          description={pricing.pricing_description}
          annualDiscount={pricing.pricing_annual_discount}
          plans={pricing.pricing_plans}
          whatsappNumber={pricing.pricing_whatsapp_number || siteSettings?.contact_whatsapp}
          serviceName={service.name}
          featureCategories={pricing.feature_categories || []}
        />
      )
    },
    cta: () => <ServiceCTA content={content} siteSettings={siteSettings} />,
  }

  return (
    <ServicePageTracker serviceId={service.id} serviceSlug={service.slug}>
      <FixedLogo />
      <div className="min-h-screen bg-black">
        {/* Renderizar seções na ordem configurada */}
        {sectionOrder.map((sectionId: string) => {
          const renderer = sectionRenderers[sectionId]
          if (!renderer) return null
          
          // Para pricing, não verificar sectionVisibility pois é gerenciado exclusivamente em /dashboard/pricing
          if (sectionId === 'pricing') {
            return <div key={sectionId}>{renderer()}</div>
          }
          
          // Para outras seções, verificar sectionVisibility normalmente
          if (sectionVisibility[sectionId] === false) return null
          return <div key={sectionId}>{renderer()}</div>
        })}
        <NavigationTabs variant="service" />
      </div>
    </ServicePageTracker>
  )
}

