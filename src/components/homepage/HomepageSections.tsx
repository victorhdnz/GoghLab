'use client'

import { useState } from 'react'
import { ServiceCard } from '@/components/portfolio/ServiceCard'
import { CustomServiceCard } from '@/components/portfolio/CustomServiceCard'
import { ServiceCard as CustomServiceCardType } from '@/components/ui/ServiceCardsManager'
import { Service } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { GitCompare, Smartphone, X } from 'lucide-react'
import { SocialButton } from '@/components/ui/SocialButton'
import { FadeInElement } from '@/components/ui/FadeInElement'
import { NotificationsSection } from './NotificationsSection'
import { TestimonialsSection } from './TestimonialsSection'
import { SplineSection } from './SplineSection'
import { HomepageVideo } from './HomepageVideo'
import { TrustedBySection } from './TrustedBySection'
import { AwardSection } from './AwardSection'
import { AnimatedBeamSection } from './AnimatedBeamSection'
import { TeamSection } from './TeamSection'
import { Highlighter } from '@/components/ui/highlighter'
import { AuroraText } from '@/components/ui/aurora-text'
import { FeaturesSectionWithHoverEffects } from '@/components/ui/feature-section-with-hover-effects'
import GalleryHoverCarousel from '@/components/ui/gallery-hover-carousel'
import type { GalleryHoverCarouselItem } from '@/components/ui/gallery-hover-carousel'
import { getYouTubeId } from '@/lib/utils/youtube'
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect'
import { Hero } from '@/components/ui/hero-1'
import { ButtonOne } from '@/components/ui/button-1'

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
  const [installTutorialModal, setInstallTutorialModal] = useState<null | { platform: 'ios' | 'android'; url: string }>(null)
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
            <div className={showAwardWithVideo ? 'lg:w-2/3 w-full flex justify-center' : 'w-full flex justify-center'}>
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
        standaloneDescription={homepageContent.award_standalone_description || "O Gogh Lab é pioneira em oferecer uma solução completa com agentes de IA, cursos profissionais e acesso às melhores ferramentas de criação — tudo em uma única assinatura."}
      />
    )
  }

  // Função para renderizar seção Typewriter (texto animado + botão planos)
  const renderTypewriterSection = () => {
    if (homepageContent.typewriter_enabled === false || sectionVisibility.typewriter === false) return null
    const wordsRaw = Array.isArray(homepageContent.typewriter_words) ? homepageContent.typewriter_words : []
    const words = wordsRaw.length > 0
      ? wordsRaw.map((w: { text: string; highlight?: boolean }, i: number) => ({
          text: typeof w.text === 'string' ? w.text : '',
          className: w.highlight === true || i === wordsRaw.length - 1 ? 'text-yellow-500 dark:text-yellow-500' : undefined,
        }))
      : [
          { text: 'Crie', className: undefined },
          { text: 'com', className: undefined },
          { text: 'IA.', className: 'text-yellow-500 dark:text-yellow-500' },
        ]
    const subtitle = homepageContent.typewriter_subtitle || 'O caminho para a liberdade começa aqui.'
    const buttonLabel = homepageContent.typewriter_button_label || 'Ver planos'

    return (
      <section className="py-8 md:py-12 px-4 bg-[#F5F1E8]">
        <div className="flex flex-col items-center justify-center min-h-0">
          <p className="text-neutral-600 dark:text-neutral-200 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 text-center max-w-xl mx-auto px-2">
            {subtitle}
          </p>
          <TypewriterEffectSmooth words={words} className="justify-center" />
          <div className="mt-4 sm:mt-6">
            <ButtonOne
              onClick={() => {
                window.location.href = '/precos'
              }}
              containerClassName="w-40"
              className="h-11 sm:h-10"
            >
              {buttonLabel}
            </ButtonOne>
          </div>
        </div>
      </section>
    )
  }

  // Função para renderizar seção Hero (hero-1 com paleta Gogh, eyebrow → chats IA, CTA Shimmer → planos)
  const renderHeroSection = () => {
    if (homepageContent?.hero_enabled === false || sectionVisibility?.hero === false) return null

    const heroTitle = typeof homepageContent?.hero_title === 'string' ? homepageContent.hero_title : 'Gogh Lab'
    const heroSubtitle = typeof homepageContent?.hero_subtitle === 'string'
      ? homepageContent.hero_subtitle
      : typeof homepageContent?.hero_description === 'string'
        ? homepageContent.hero_description
        : 'Criatividade guiada por tecnologia. Agentes de IA para criação de conteúdo, redes sociais e anúncios.'
    const ctaLabel = typeof homepageContent?.typewriter_button_label === 'string' ? homepageContent.typewriter_button_label : 'Ver planos'

    return (
      <Hero
        eyebrow="Criar"
        eyebrowHref="/planejamento"
        title={heroTitle}
        subtitle={heroSubtitle}
        ctaLabel={ctaLabel}
        ctaHref="/precos"
      />
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
                    {homepageContent.comparison_cta_title || 'Compare o Gogh Lab'}
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

  // Função para renderizar seção de instalação do app web (iOS/Android)
  const renderInstallAppSection = () => {
    if (homepageContent.install_app_enabled === false || sectionVisibility.install_app === false) return null

    const iosIcon = homepageContent.install_app_ios_icon || null
    const androidIcon = homepageContent.install_app_android_icon || null
    const iosTutorial = homepageContent.install_app_ios_tutorial_url || ''
    const androidTutorial = homepageContent.install_app_android_tutorial_url || ''

    return (
      <section id="install-app-section" className="py-12 md:py-16 px-4 bg-[#F5F1E8]">
        <div className="container mx-auto max-w-4xl text-center">
          <FadeInElement>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0A0A0A] mb-3 tracking-tight">
              {homepageContent.install_app_title || 'Instale o Gogh Lab no seu celular'}
            </h2>
          </FadeInElement>
          <FadeInElement delay={0.1}>
            <p className="text-gray-600 text-sm md:text-base mb-8 max-w-2xl mx-auto">
              {homepageContent.install_app_description || 'Escolha seu sistema e veja o tutorial para adicionar o ícone do app web na tela inicial do seu telefone.'}
            </p>
          </FadeInElement>

          <FadeInElement delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => iosTutorial && setInstallTutorialModal({ platform: 'ios', url: iosTutorial })}
                disabled={!iosTutorial}
                className="group relative h-24 w-24 md:h-28 md:w-28 rounded-3xl border border-[#F7C948]/40 bg-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Abrir tutorial iOS"
                title={iosTutorial ? 'Tutorial iOS' : 'Configure a URL do tutorial iOS no dashboard'}
              >
                {iosIcon ? (
                  <Image src={iosIcon} alt="Tutorial iOS" fill className="object-contain p-3" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-[#0A0A0A]" />
                  </div>
                )}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-[#0A0A0A] whitespace-nowrap">
                  iOS
                </span>
                <span className="absolute inset-0 rounded-3xl ring-2 ring-transparent group-hover:ring-[#F7C948]/60 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => androidTutorial && setInstallTutorialModal({ platform: 'android', url: androidTutorial })}
                disabled={!androidTutorial}
                className="group relative h-24 w-24 md:h-28 md:w-28 rounded-3xl border border-[#F7C948]/40 bg-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Abrir tutorial Android"
                title={androidTutorial ? 'Tutorial Android' : 'Configure a URL do tutorial Android no dashboard'}
              >
                {androidIcon ? (
                  <Image src={androidIcon} alt="Tutorial Android" fill className="object-contain p-3" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-[#0A0A0A]" />
                  </div>
                )}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-[#0A0A0A] whitespace-nowrap">
                  Android
                </span>
                <span className="absolute inset-0 rounded-3xl ring-2 ring-transparent group-hover:ring-[#F7C948]/60 transition-all" />
              </button>
            </div>
          </FadeInElement>
        </div>
      </section>
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

  // Função para renderizar seção de Contato
  const renderContactSection = () => {
    if (homepageContent.contact_enabled === false || sectionVisibility.contact === false) return null
    
    return (
      <section id="contact-section" className="py-10 md:py-14 px-4 bg-[#F5F1E8]">
        <div className="container mx-auto max-w-3xl text-center">
          <FadeInElement>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0A0A0A] mb-3 tracking-tight">
              {homepageContent.contact_title || 'Fale Conosco'}
            </h2>
          </FadeInElement>
          {homepageContent.contact_description && (
            <FadeInElement delay={0.1}>
              <p className="text-gray-600 text-sm md:text-base mb-8 font-light max-w-xl mx-auto">
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

  // Função para renderizar seção Nossa Equipe (testimonial style com Instagram)
  const renderTeamSection = () => {
    if (homepageContent.team_enabled === false || sectionVisibility.team === false) return null
    const members = Array.isArray(homepageContent.team_members) ? homepageContent.team_members : []
    if (members.length === 0) return null
    return (
      <TeamSection
        enabled={homepageContent.team_enabled !== false}
        title={homepageContent.team_title}
        subtitle={homepageContent.team_subtitle}
        members={members}
        autoplay={true}
      />
    )
  }

  // Função para renderizar seção Gallery (carrossel: prompts de criação ou cards manuais)
  const renderGallerySection = () => {
    if (homepageContent.gallery_enabled === false || sectionVisibility.gallery === false) return null
    const data = homepageContent.gallery_carousel
    const useCreationPrompts = homepageContent.gallery_use_creation_prompts === true && Array.isArray(homepageContent.creation_prompts) && homepageContent.creation_prompts.length > 0
    const items: GalleryHoverCarouselItem[] = useCreationPrompts
      ? (homepageContent.creation_prompts as any[]).map((p: any) => {
          const isYouTube = p.coverVideo && getYouTubeId(p.coverVideo)
          const isVideo = !!p.coverVideo
          return {
            id: p.id,
            type: isVideo ? 'video' : 'image',
            title: p.title,
            summary: p.subtitle ?? '',
            image: p.coverImage ?? '',
            prompt: p.prompt,
            promptId: p.id,
            tabId: p.tabId,
            ...(isYouTube ? { youtubeUrl: p.coverVideo } : isVideo ? { videoUrl: p.coverVideo } : {}),
          }
        })
      : (Array.isArray(data?.items) ? (data.items as GalleryHoverCarouselItem[]) : [])
    if (items.length === 0) return null
    return (
      <GalleryHoverCarousel
        heading={data?.heading ?? 'Projetos em destaque'}
        subtitle={data?.subtitle ?? 'Explore nossa coleção de imagens e vídeos criados com IA.'}
        items={items}
        autoSlideInterval={typeof data?.auto_slide_interval === 'number' ? data.auto_slide_interval : 5000}
      />
    )
  }

  // Função para renderizar seção Animated Beam (integrações / fluxo de plataformas)
  const renderAnimatedBeamSection = () => {
    if (homepageContent.animated_beam_enabled === false || sectionVisibility.animated_beam === false) return null
    const items = Array.isArray(homepageContent.animated_beam_items) ? homepageContent.animated_beam_items : []
    if (items.length === 0) return null
    return (
      <AnimatedBeamSection
        enabled={homepageContent.animated_beam_enabled !== false}
        title={homepageContent.animated_beam_title}
        subtitle={homepageContent.animated_beam_subtitle}
        items={items}
        center_icon_url={homepageContent.animated_beam_center_icon_url}
        site_logo={siteSettings?.site_logo}
      />
    )
  }

  // Mapear seções para funções de renderização
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: renderHeroSection,
    typewriter: renderTypewriterSection,
    video: renderVideoSection,
    trusted_by: renderTrustedBySection,
    animated_beam: renderAnimatedBeamSection,
    award: renderAwardSection,
    gallery: renderGallerySection,
    services: renderServicesSection,
    features: renderFeaturesSection,
    comparison: renderComparisonSection,
    install_app: renderInstallAppSection,
    notifications: renderNotificationsSection,
    testimonials: renderTestimonialsSection,
    team: renderTeamSection,
    spline: renderSplineSection,
    contact: renderContactSection,
  }

  // Garantir que sectionOrder seja um array válido
  const validSectionOrder = Array.isArray(sectionOrder) && sectionOrder.length > 0 
    ? sectionOrder 
    : ['hero', 'video', 'trusted_by', 'features', 'gallery', 'services', 'comparison', 'install_app', 'notifications', 'testimonials', 'team', 'spline', 'contact']
  
  return (
    <>
      {validSectionOrder.map((sectionId: string, index: number) => {
        if (!sectionId || typeof sectionId !== 'string') return null
        const renderer = sectionRenderers[sectionId]
        if (!renderer) {
          console.warn(`No renderer found for section: ${sectionId}`)
          return null
        }
        
        // Verificar sectionVisibility para todas as seções
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

      {installTutorialModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 p-4 flex items-center justify-center"
          onClick={() => setInstallTutorialModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Tutorial ${installTutorialModal.platform}`}
        >
          <div
            className="relative w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInstallTutorialModal(null)}
              className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
              aria-label="Fechar tutorial"
            >
              <X className="w-5 h-5" />
            </button>
            {getYouTubeId(installTutorialModal.url) ? (
              <iframe
                src={installTutorialModal.url.includes('embed') ? installTutorialModal.url : `https://www.youtube.com/embed/${getYouTubeId(installTutorialModal.url)}?autoplay=1`}
                className="absolute inset-0 w-full h-full"
                title={`Tutorial ${installTutorialModal.platform}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={installTutorialModal.url} controls autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}
    </>
  )
}

