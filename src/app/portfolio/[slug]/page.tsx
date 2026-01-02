import { createServerClient } from '@/lib/supabase/server'
import { Service } from '@/types'
import { ServiceDetailContent } from '@/types/service-detail'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ServicePageTracker } from '@/components/analytics/ServicePageTracker'
import { ServiceHeroVideo } from '@/components/service-detail/ServiceHeroVideo'
import { ServiceBenefits } from '@/components/service-detail/ServiceBenefits'
import { ServicePricing } from '@/components/service-detail/ServicePricing'
import { ServiceCTA } from '@/components/service-detail/ServiceCTA'
import { ServiceScrollAnimation } from '@/components/service-detail/ServiceScrollAnimation'
import { ServiceStats } from '@/components/service-detail/ServiceStats'
import { ServiceCardSwap } from '@/components/service-detail/ServiceCardSwap'
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
    scroll_animation_enabled: true,
    benefits_enabled: true,
    benefits_items: [],
    cta_enabled: true,
    section_order: ['hero', 'scroll_animation', 'benefits', 'stats', 'cta'],
    section_visibility: {
      hero: true,
      scroll_animation: true,
      benefits: true,
      stats: false,
      cta: true,
    },
  }

  // Ordem padrão das seções (sem 'gifts', 'testimonials', 'about', 'alternate' e 'pricing')
  const sectionOrder = (content.section_order || ['hero', 'scroll_animation', 'benefits', 'stats', 'card_swap', 'cta']).filter(
    (sectionId) => sectionId !== 'gifts' && sectionId !== 'testimonials' && sectionId !== 'about' && sectionId !== 'alternate' && sectionId !== 'pricing'
  )
  // Garantir que 'card_swap' esteja presente
  if (!sectionOrder.includes('card_swap') && sectionOrder.includes('stats')) {
    const statsIndex = sectionOrder.indexOf('stats')
    sectionOrder.splice(statsIndex + 1, 0, 'card_swap')
  } else if (!sectionOrder.includes('card_swap')) {
    sectionOrder.push('card_swap')
  }
  // Adicionar 'pricing' antes de 'cta' se services_pricing_enabled estiver habilitado
  const servicesPricingEnabled = siteSettings?.homepage_content?.services_pricing_enabled === true
  if (servicesPricingEnabled && !sectionOrder.includes('pricing')) {
    const ctaIndex = sectionOrder.indexOf('cta')
    if (ctaIndex >= 0) {
      sectionOrder.splice(ctaIndex, 0, 'pricing')
    } else {
      sectionOrder.push('pricing')
    }
  }
  
  const sectionVisibility = content.section_visibility || {
    hero: true,
    scroll_animation: true,
    benefits: true,
    stats: false,
    card_swap: false,
    cta: true,
  }
  
  // Garantir que gifts, testimonials, about e alternate não estejam na visibilidade
  if (sectionVisibility.gifts !== undefined) delete sectionVisibility.gifts
  if (sectionVisibility.testimonials !== undefined) delete sectionVisibility.testimonials
  if (sectionVisibility.about !== undefined) delete sectionVisibility.about
  if (sectionVisibility.alternate !== undefined) delete sectionVisibility.alternate
  if (sectionVisibility.pricing !== undefined) delete sectionVisibility.pricing // Remover pricing da visibilidade individual
  if (sectionVisibility.stats === undefined) sectionVisibility.stats = false
  if (sectionVisibility.card_swap === undefined) sectionVisibility.card_swap = false
  if (sectionVisibility.scroll_animation === undefined) sectionVisibility.scroll_animation = true

  // Obter dados de pricing do site_settings
  const pricing = siteSettings?.homepage_content?.pricing || {}

  // Mapear seções para componentes
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => <ServiceHeroVideo content={content} serviceName={service.name} />,
    scroll_animation: () => {
      if (sectionVisibility.scroll_animation === false) return null
      return (
        <ServiceScrollAnimation
          serviceName={service.name}
          imageUrl={content.scroll_animation_image || service.cover_image || service.images?.[0]}
          title={content.scroll_animation_title}
          subtitle={content.scroll_animation_subtitle}
        />
      )
    },
    benefits: () => <ServiceBenefits content={content} />,
    stats: () => {
      if (sectionVisibility.stats === false) return null
      return <ServiceStats content={content} />
    },
    card_swap: () => {
      if (sectionVisibility.card_swap === false) return null
      return (
        <ServiceCardSwap
          enabled={content.card_swap_enabled}
          title={content.card_swap_title}
          subtitle={content.card_swap_subtitle}
          cards={content.card_swap_cards}
          delay={content.card_swap_delay}
          pauseOnHover={content.card_swap_pause_on_hover}
        />
      )
    },
    pricing: () => {
      // A seção aparece se estiver habilitada na página de pricing E se services_pricing_enabled estiver habilitado
      if (pricing.pricing_enabled !== true || !servicesPricingEnabled) return null
      
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
        {/* Botão para voltar à homepage */}
        <div className="bg-black text-white py-8 md:py-12 px-4 relative">
          <div className="container mx-auto max-w-7xl">
            <Link 
              href="/"
              prefetch={true}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Voltar para Homepage</span>
              <span className="text-sm font-medium sm:hidden">Voltar</span>
            </Link>
          </div>
        </div>
        
        {/* Renderizar seções na ordem configurada */}
        {sectionOrder.map((sectionId: string) => {
          const renderer = sectionRenderers[sectionId]
          if (!renderer) return null
          
          // Para pricing, verificar apenas se services_pricing_enabled estiver habilitado
          // A verificação de pricing_enabled já é feita dentro do renderer
          if (sectionId === 'pricing') {
            return <div key={sectionId}>{renderer()}</div>
          }
          
          // Para scroll_animation, verificar se está habilitado no layout
          if (sectionId === 'scroll_animation') {
            if (content.scroll_animation_enabled === false) return null
            return <div key={sectionId}>{renderer()}</div>
          }
          
          // Para card_swap, verificar se está habilitado no layout
          if (sectionId === 'card_swap') {
            if (content.card_swap_enabled === false) return null
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

