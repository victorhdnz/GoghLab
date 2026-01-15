'use client'

import { ServiceCard } from '@/components/portfolio/ServiceCard'
import { CustomServiceCard } from '@/components/portfolio/CustomServiceCard'
import { ServiceCard as CustomServiceCardType } from '@/components/ui/ServiceCardsManager'
import { Service } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { GitCompare } from 'lucide-react'
import { SocialButton } from '@/components/ui/SocialButton'
import { FadeInElement } from '@/components/ui/FadeInElement'
import { NotificationsSection } from './NotificationsSection'
import { TestimonialsSection } from './TestimonialsSection'
import { SplineSection } from './SplineSection'
import { PricingSection } from './PricingSection'
import { HomepageVideo } from './HomepageVideo'
import { TrustedBySection } from './TrustedBySection'
import { AwardSection } from './AwardSection'
import { Highlighter } from '@/components/ui/highlighter'
import { AuroraText } from '@/components/ui/aurora-text'
import { FeaturesSectionWithHoverEffects } from '@/components/ui/feature-section-with-hover-effects'

interface HomepageSectionsProps {
  homepageContent: any
  siteSettings: any
  services: Service[]
  sectionVisibility: Record<string, boolean>
  sectionOrder: string[]
}

export function HomepageSections({
  homepageContent,
  siteSettings,
  services,
  sectionVisibility,
  sectionOrder,
}: HomepageSectionsProps) {
  // Função para dividir texto para aplicar diferentes efeitos
  const splitTextForHighlights = (text: string) => {
    // Tenta dividir por vírgula primeiro
    if (text.includes(',')) {
      const parts = text.split(',')
      if (parts.length >= 2) {
        return {
          firstPart: parts[0].trim(),
          secondPart: parts.slice(1).join(',').trim()
        }
      }
    }
    // Se não tiver vírgula, divide pela metade
    const words = text.split(' ')
    const midPoint = Math.ceil(words.length / 2)
    return {
      firstPart: words.slice(0, midPoint).join(' '),
      secondPart: words.slice(midPoint).join(' ')
    }
  }

  // Função para renderizar seção de Vídeo
  const renderVideoSection = () => {
    if (homepageContent.video_enabled === false || sectionVisibility.video === false) return null
    
    // Verificar se o award deve ser mostrado ao lado do vídeo
    const showAwardWithVideo = homepageContent.award_with_video_enabled !== false && homepageContent.award_enabled !== false
    
    return (
      <section className="py-16 md:py-24 px-4 bg-gogh-beige">
        <div className="container mx-auto max-w-7xl">
          <div className={`flex flex-col ${showAwardWithVideo ? 'lg:flex-row' : ''} items-center justify-center gap-8`}>
            <div className={showAwardWithVideo ? 'lg:w-2/3' : 'w-full'}>
              <HomepageVideo
                enabled={homepageContent.video_enabled !== false}
                videoUrl={homepageContent.video_url}
                videoAutoplay={homepageContent.video_autoplay}
                title={homepageContent.video_title}
                subtitle={homepageContent.video_subtitle}
              />
            </div>
            {showAwardWithVideo && (
              <div className="lg:w-1/3">
                <AwardSection 
                  variant="alongside-video"
                  title={homepageContent.award_title || "PIONEIROS"}
                  subtitle={homepageContent.award_subtitle || "Plataforma Completa de IA para Criadores"}
                  recipient={homepageContent.award_recipient || "Gogh Lab"}
                  date={homepageContent.award_date || "Brasil 2025"}
                  level={homepageContent.award_level || "gold"}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Função para renderizar seção "Trusted By" (Logo Carousel)
  const renderTrustedBySection = () => {
    if (homepageContent.trusted_by_enabled === false || sectionVisibility.trusted_by === false) return null
    
    return (
      <TrustedBySection
        title={homepageContent.trusted_by_title || "Utilizamos as melhores ferramentas"}
        subtitle={homepageContent.trusted_by_subtitle || "Tecnologias de ponta para entregar resultados excepcionais"}
        platforms={homepageContent.trusted_by_platforms}
      />
    )
  }

  // Função para renderizar seção Award standalone
  const renderAwardSection = () => {
    if (homepageContent.award_enabled === false || sectionVisibility.award === false) return null
    
    return (
      <AwardSection 
        variant="standalone"
        title={homepageContent.award_title || "PIONEIROS"}
        subtitle={homepageContent.award_subtitle || "Plataforma Completa de IA para Criadores"}
        recipient={homepageContent.award_recipient || "Gogh Lab"}
        date={homepageContent.award_date || "Brasil 2025"}
        level={homepageContent.award_level || "gold"}
        standaloneTitle={homepageContent.award_standalone_title || "Primeira plataforma do Brasil"}
        standaloneDescription={homepageContent.award_standalone_description || "A Gogh Lab é pioneira em oferecer uma solução completa com agentes de IA, cursos profissionais e acesso às melhores ferramentas de criação — tudo em uma única assinatura."}
      />
    )
  }

  // Função para renderizar seção Hero
  const renderHeroSection = () => {
    if (homepageContent.hero_enabled === false || sectionVisibility.hero === false) return null
    
    return (
      <section className="relative bg-[#F5F1E8] text-[#0A0A0A] py-16 md:py-24 px-4 overflow-hidden">
        {homepageContent.hero_background_image && (
          <div className="absolute inset-0 z-0 opacity-20">
            <Image
              src={homepageContent.hero_background_image}
              alt="Background"
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="container mx-auto max-w-6xl text-center relative z-10 pt-24 md:pt-32">
          {homepageContent.hero_subtitle && (() => {
            const { firstPart, secondPart } = splitTextForHighlights(homepageContent.hero_subtitle)
            return (
              <FadeInElement delay={0}>
                <p className="text-2xl md:text-3xl lg:text-4xl text-[#0A0A0A] max-w-4xl mx-auto font-bold mb-6 leading-tight">
                  <span className="inline-block relative z-0 mb-2 md:mb-0">
                    <Highlighter action="underline" color="#F7C948" isView={true}>
                      {firstPart}
                    </Highlighter>
                  </span>
                  {secondPart && (
                    <>
                      {homepageContent.hero_subtitle.includes(',') ? ',' : ' '}
                      {' '}
                      <span className="inline-block relative z-0 mt-2 md:mt-0">
                        <Highlighter action="highlight" color="#F7C948" isView={true}>
                          {secondPart}
                        </Highlighter>
                      </span>
                    </>
                  )}
                </p>
              </FadeInElement>
            )
          })()}
          {homepageContent.hero_description && (
            <FadeInElement delay={0.2}>
              <p className="text-xl md:text-2xl lg:text-3xl text-[#0A0A0A] max-w-3xl mx-auto font-bold">
                <AuroraText colors={["#F7C948", "#E5A800", "#0A0A0A", "#F7C948", "#E5A800"]} speed={1}>
                  {homepageContent.hero_description}
                </AuroraText>
              </p>
            </FadeInElement>
          )}
        </div>
      </section>
    )
  }

  // Função para renderizar seção de Serviços
  const renderServicesSection = () => {
    if (homepageContent.services_enabled === false || sectionVisibility.services === false) return null
    
    return (
      <section id="servicos" className="py-16 md:py-24 px-4 bg-[#F5F1E8]">
        <div className="container mx-auto max-w-7xl">
          {(homepageContent.services_title || homepageContent.services_description) && (
            <div className="text-center mb-12">
              {homepageContent.services_title && (
                <FadeInElement>
                  <h2 className="text-3xl md:text-5xl font-semibold text-[#0A0A0A] mb-4 tracking-tight">
                    {homepageContent.services_title}
                  </h2>
                </FadeInElement>
              )}
              {homepageContent.services_description && (
                <FadeInElement delay={0.1}>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    {homepageContent.services_description}
                  </p>
                </FadeInElement>
              )}
            </div>
          )}

          {/* SEMPRE usar cards customizados se existirem (independentes dos serviços do banco) */}
          {homepageContent.services_cards && Array.isArray(homepageContent.services_cards) && homepageContent.services_cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {homepageContent.services_cards.map((card: CustomServiceCardType, index: number) => (
                <FadeInElement key={card.id} delay={0.1 * index}>
                  <CustomServiceCard card={card} />
                </FadeInElement>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-block bg-[#F7C948]/20 rounded-full p-6 mb-4">
                <span className="text-5xl">🚀</span>
              </div>
              <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-2">Nenhum card de serviço configurado</h2>
              <p className="text-gray-600">
                Adicione cards de serviços no editor da homepage.
              </p>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Função para renderizar seção de Comparação
  const renderComparisonSection = () => {
    if (homepageContent.comparison_cta_enabled === false || sectionVisibility.comparison === false) return null
    
    return (
      <section id="comparison-section" className="py-16 md:py-24 px-4 scroll-mt-24 bg-[#F5F1E8]">
        <div className="container mx-auto max-w-4xl">
          <FadeInElement>
            <Link href={homepageContent.comparison_cta_link || "/comparar"} prefetch={true}>
              <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden bg-white border border-[#F7C948]/30 hover:border-[#F7C948] hover:shadow-xl transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-[#FBF8F3] to-[#F5F1E8]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(247,201,72,0.1),transparent_50%)]" />
                <div className="relative h-full flex flex-col justify-center items-center p-8 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-[#F7C948] backdrop-blur-md border border-[#E5A800] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <GitCompare size={40} className="text-[#0A0A0A]" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold text-[#0A0A0A] mb-4 tracking-tight">
                    {homepageContent.comparison_cta_title || 'Compare a Gogh Lab'}
                  </h2>
                  {homepageContent.comparison_cta_description && (
                    <p className="text-gray-600 text-lg md:text-xl font-light max-w-2xl">
                      {homepageContent.comparison_cta_description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </FadeInElement>
        </div>
      </section>
    )
  }

  // Função para renderizar seção de Notificações
  const renderNotificationsSection = () => {
    // Se estiver explicitamente desabilitado ou oculto, não renderizar
    if (homepageContent.notifications_enabled === false || sectionVisibility.notifications === false) return null
    
    // Garantir que notifications_items seja um array válido
    const notificationsItems = Array.isArray(homepageContent.notifications_items) 
      ? homepageContent.notifications_items 
      : []
    
    // Se não houver notificações configuradas, não renderizar
    if (!notificationsItems || notificationsItems.length === 0) return null
    
    return (
      <NotificationsSection
        enabled={homepageContent.notifications_enabled !== false}
        title={homepageContent.notifications_title}
        description={homepageContent.notifications_description}
        notifications={notificationsItems}
        delay={homepageContent.notifications_delay}
      />
    )
  }

  // Função para renderizar seção de Depoimentos
  const renderTestimonialsSection = () => {
    // Se estiver explicitamente desabilitado ou oculto, não renderizar
    if (homepageContent.testimonials_enabled === false || sectionVisibility.testimonials === false) return null
    
    // Garantir que testimonials_items seja um array válido
    const testimonialsItems = Array.isArray(homepageContent.testimonials_items) 
      ? homepageContent.testimonials_items 
      : []
    
    // Se não houver depoimentos configurados, não renderizar
    if (!testimonialsItems || testimonialsItems.length === 0) return null
    
    return (
      <TestimonialsSection
        enabled={homepageContent.testimonials_enabled !== false}
        title={homepageContent.testimonials_title}
        description={homepageContent.testimonials_description}
        testimonials={testimonialsItems}
        duration={homepageContent.testimonials_duration ? Number(homepageContent.testimonials_duration) : 200}
      />
    )
  }

  // Função para renderizar seção Spline (3D)
  const renderSplineSection = () => {
    if (homepageContent.spline_enabled === false || sectionVisibility.spline === false) return null
    
    return (
      <SplineSection
        enabled={homepageContent.spline_enabled !== false}
        title={homepageContent.spline_title || 'O Futuro da Sua Empresa'}
        description={homepageContent.spline_description || 'Estamos aqui para ajudar sua empresa a evoluir e crescer no mundo digital. Com tecnologia de ponta e soluções inovadoras, transformamos sua presença online e impulsionamos seus resultados.'}
        sceneUrl={homepageContent.spline_scene_url || 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode'}
      />
    )
  }

  // Função para renderizar seção de Pricing
  // A seção depende tanto de pricing_enabled da página de pricing quanto de sectionVisibility.pricing
  const renderPricingSection = () => {
    const pricing = homepageContent.pricing || {}
    
    // A seção só aparece se estiver habilitada na página de pricing E se sectionVisibility.pricing for true
    if (pricing.pricing_enabled !== true || sectionVisibility.pricing === false) return null

    return (
      <PricingSection
        enabled={true}
        title={pricing.pricing_title}
        description={pricing.pricing_description}
        annualDiscount={pricing.pricing_annual_discount}
        plans={pricing.pricing_plans}
        whatsappNumber={pricing.pricing_whatsapp_number || siteSettings?.contact_whatsapp}
        featureCategories={pricing.feature_categories || []}
      />
    )
  }

  // Função para renderizar seção de Contato
  const renderContactSection = () => {
    if (homepageContent.contact_enabled === false || sectionVisibility.contact === false) return null
    
    return (
      <section id="contact-section" className="py-16 md:py-24 px-4 bg-[#F5F1E8]">
        <div className="container mx-auto max-w-4xl text-center">
          <FadeInElement>
            <h2 className="text-3xl md:text-5xl font-semibold text-[#0A0A0A] mb-4 tracking-tight">
              {homepageContent.contact_title || 'Fale Conosco'}
            </h2>
          </FadeInElement>
          {homepageContent.contact_description && (
            <FadeInElement delay={0.1}>
              <p className="text-gray-600 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
                {homepageContent.contact_description}
              </p>
            </FadeInElement>
          )}
          <FadeInElement delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {homepageContent.contact_whatsapp_enabled !== false && (homepageContent.contact_whatsapp_number || siteSettings?.contact_whatsapp) && (
                <SocialButton
                  type="whatsapp"
                  href={`https://wa.me/${(homepageContent.contact_whatsapp_number || siteSettings?.contact_whatsapp || '').replace(/\D/g, '')}`}
                  text={homepageContent.contact_whatsapp_text || 'WhatsApp'}
                />
              )}
              {homepageContent.contact_email_enabled !== false && (homepageContent.contact_email_address || siteSettings?.contact_email) && (
                <SocialButton
                  type="email"
                  href={`mailto:${homepageContent.contact_email_address || siteSettings?.contact_email}`}
                  text={homepageContent.contact_email_text || 'E-mail'}
                />
              )}
              {homepageContent.contact_instagram_enabled !== false && (homepageContent.contact_instagram_url || siteSettings?.instagram_url) && (
                <SocialButton
                  type="instagram"
                  href={homepageContent.contact_instagram_url || siteSettings?.instagram_url || '#'}
                  text={homepageContent.contact_instagram_text || 'Instagram'}
                />
              )}
            </div>
          </FadeInElement>
        </div>
      </section>
    )
  }

  // Função para renderizar seção de Features (Benefícios com hover effects)
  const renderFeaturesSection = () => {
    if (homepageContent.features_enabled === false || sectionVisibility.features === false) return null
    
    return (
      <FeaturesSectionWithHoverEffects
        title={homepageContent.features_title || "O que oferecemos"}
        subtitle={homepageContent.features_description || "Ferramentas profissionais, agentes de IA e cursos completos para transformar sua presença digital"}
        features={homepageContent.features_items}
      />
    )
  }

  // Mapear seções para funções de renderização
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: renderHeroSection,
    video: renderVideoSection,
    trusted_by: renderTrustedBySection,
    award: renderAwardSection,
    services: renderServicesSection,
    features: renderFeaturesSection,
    comparison: renderComparisonSection,
    notifications: renderNotificationsSection,
    testimonials: renderTestimonialsSection,
    spline: renderSplineSection,
    pricing: renderPricingSection,
    contact: renderContactSection,
  }

  // Garantir que sectionOrder seja um array válido
  const validSectionOrder = Array.isArray(sectionOrder) && sectionOrder.length > 0 
    ? sectionOrder 
    : ['hero', 'video', 'trusted_by', 'features', 'services', 'comparison', 'notifications', 'testimonials', 'spline', 'pricing', 'contact']
  
  return (
    <>
      {validSectionOrder.map((sectionId: string, index: number) => {
        if (!sectionId || typeof sectionId !== 'string') return null
        const renderer = sectionRenderers[sectionId]
        if (!renderer) {
          console.warn(`No renderer found for section: ${sectionId}`)
          return null
        }
        
        // Verificar sectionVisibility para todas as seções, incluindo pricing
        if (sectionVisibility[sectionId] === false) {
          return null
        }
        
        try {
          return <div key={`${sectionId}-${index}`}>{renderer()}</div>
        } catch (error) {
          console.error(`Error rendering section ${sectionId}:`, error)
          return null
        }
      })}
    </>
  )
}

