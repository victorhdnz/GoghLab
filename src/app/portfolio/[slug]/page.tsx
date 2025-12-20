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

export default async function ServicePage({ params }: { params: { slug: string } }) {
  const service = await getService(params.slug)

  if (!service) {
    notFound()
  }

  const [testimonials, layoutContent] = await Promise.all([
    getTestimonials(service.id),
    getServiceDetailLayout(service.id),
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
    gifts_enabled: true,
    gifts_items: [],
    alternate_content_enabled: true,
    alternate_content_items: [],
    about_enabled: true,
    testimonials_enabled: true,
    cta_enabled: true,
    section_order: ['hero', 'benefits', 'gifts', 'alternate', 'about', 'testimonials', 'cta'],
    section_visibility: {
      hero: true,
      benefits: true,
      gifts: true,
      alternate: true,
      about: true,
      testimonials: true,
      cta: true,
    },
  }

  // Ordem padrão das seções
  const sectionOrder = content.section_order || ['hero', 'benefits', 'gifts', 'alternate', 'about', 'testimonials', 'cta']
  const sectionVisibility = content.section_visibility || {
    hero: true,
    benefits: true,
    gifts: true,
    alternate: true,
    about: true,
    testimonials: true,
    cta: true,
  }

  // Mapear seções para componentes
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => <ServiceHeroVideo content={content} serviceName={service.name} />,
    benefits: () => <ServiceBenefits content={content} />,
    gifts: () => <ServiceGifts content={content} />,
    alternate: () => <ServiceAlternateContent content={content} />,
    about: () => <ServiceAbout content={content} />,
    testimonials: () => <ServiceTestimonials content={content} testimonials={testimonials} />,
    cta: () => <ServiceCTA content={content} />,
  }

  return (
    <ServicePageTracker serviceId={service.id} serviceSlug={service.slug}>
      <div className="min-h-screen bg-black">
        {/* Renderizar seções na ordem configurada */}
        {sectionOrder.map((sectionId: string) => {
          const renderer = sectionRenderers[sectionId]
          if (!renderer || sectionVisibility[sectionId] === false) return null
          return <div key={sectionId}>{renderer()}</div>
        })}
      </div>
    </ServicePageTracker>
  )
}

