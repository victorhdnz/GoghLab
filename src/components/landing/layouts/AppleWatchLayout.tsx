'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Play } from 'lucide-react'
import Image from 'next/image'
import { trackClick } from '@/lib/utils/analytics'

// Cores por seção
interface SectionColors {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
}

interface AllSectionColors {
  hero: SectionColors
  products: SectionColors
  reasons: SectionColors
  features: SectionColors
  video: SectionColors
  accessories: SectionColors
  faq: SectionColors
  cta: SectionColors
}

interface AppleWatchLayoutProps {
  content?: AppleWatchContent
  isEditing?: boolean
  sectionOrder?: string[]
  sectionVisibility?: Record<string, boolean>
  sectionColors?: AllSectionColors
  showWhatsAppButton?: boolean
  layoutId?: string
  versionId?: string | null
}

const defaultSectionColors: AllSectionColors = {
  hero: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  products: { backgroundColor: '#f9fafb', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  reasons: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  features: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  video: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  accessories: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  faq: { backgroundColor: '#f9fafb', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  cta: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
}

export interface AppleWatchContent {
  // Hero
  hero: {
    title: string
    subtitle: string
    badge?: string
  }
  // Produtos em destaque
  products: Array<{
    id: string
    name: string
    description: string
    price: string
    monthlyPrice?: string
    image: string
    colors: string[]
    badge?: string
    learnMoreLink?: string
    buyLink?: string
    learnMoreText?: string
    buyText?: string
  }>
  // Seção "Motivos para comprar"
  reasons: {
    title: string
    link: { text: string; url: string }
    items: Array<{
      title: string
      subtitle: string
      description: string
      image: string
    }>
  }
  // Seção "Conheça melhor"
  features: {
    title: string
    items: Array<{
      category: string
      title: string
      image: string
      textColor?: string
    }>
  }
  // Seção de vídeo
  video?: {
    url: string
    title?: string
    description?: string
    orientation?: 'horizontal' | 'vertical' // Orientação do vídeo
  }
  // Seção de acessórios
  accessories: {
    title: string
    link: { text: string; url: string }
    banner: {
      title: string
      description: string
      link: { text: string; url: string }
      image: string
    }
  }
  // Seção FAQ/Accordion
  faq: {
    title: string
    items: Array<{
      question: string
      answer: string
    }>
  }
  // CTA final
  cta: {
    title: string
    buttonText: string
    buttonLink: string
  }
  // Configurações gerais
  settings: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    whatsappNumber?: string
  }
}

// Conteúdo padrão para o layout Apple Watch
export const defaultAppleWatchContent: AppleWatchContent = {
  hero: {
    title: 'Smart Watch',
    subtitle: 'O mais poderoso de todos os tempos.',
    badge: 'Novo',
  },
  products: [
    {
      id: '1',
      name: 'Smart Watch Series 11',
      description: 'O parceiro ideal para cuidar da sua saúde.',
      price: 'R$ 5.499',
      monthlyPrice: 'R$ 458,25/mês',
      image: '',
      colors: ['#f5e6d8', '#e8e8e8', '#1a1a1a', '#3b82f6', '#22c55e'],
      badge: 'Novo',
      learnMoreLink: '#',
      buyLink: '#',
      learnMoreText: 'Saiba mais',
      buyText: 'Comprar',
    },
    {
      id: '2',
      name: 'Smart Watch SE 3',
      description: 'Recursos essenciais para a saúde ao seu alcance.',
      price: 'R$ 3.299',
      monthlyPrice: 'R$ 274,92/mês',
      image: '',
      colors: ['#1a1a1a', '#e8e8e8'],
      badge: 'Novo',
      learnMoreLink: '#',
      buyLink: '#',
      learnMoreText: 'Saiba mais',
      buyText: 'Comprar',
    },
  ],
  reasons: {
    title: 'Motivos para comprar seu Smart Watch aqui.',
    link: { text: 'Comprar Smart Watch', url: '#' },
    items: [
      {
        title: 'Opções de pagamento',
        subtitle: 'Compre em até 12 meses.',
        description: 'Aproveite e parcele com facilidade e conveniência.',
        image: '',
      },
      {
        title: 'Frete',
        subtitle: 'Envio por nossa conta.',
        description: 'Em todo o Brasil. Em algumas regiões, os pedidos qualificados têm envio no dia seguinte.',
        image: '',
      },
    ],
  },
  features: {
    title: 'Conheça melhor o Smart Watch.',
    items: [
      {
        category: 'Saúde',
        title: 'Sabe muito de você.\nE usa isso a seu favor.',
        image: '',
        textColor: '#ffffff',
      },
      {
        category: 'Fitness',
        title: 'Motivação inclusa.',
        image: '',
        textColor: '#ffffff',
      },
      {
        category: 'Conectividade',
        title: 'Ligado em tudo.',
        image: '',
        textColor: '#ffffff',
      },
      {
        category: 'Segurança',
        title: 'Ajuda quando você mais precisa.',
        image: '',
        textColor: '#ffffff',
      },
    ],
  },
  accessories: {
    title: 'Essenciais para o Smart Watch.',
    link: { text: 'Todos os acessórios para Smart Watch', url: '#' },
    banner: {
      title: 'Hora de mudar de ares.',
      description: 'Explore as novas pulseiras em novos materiais, estilos e cores.',
      link: { text: 'Comprar pulseiras para Smart Watch', url: '#' },
      image: '',
    },
  },
  faq: {
    title: 'Feitos um para o outro.',
    items: [
      {
        question: 'Smart Watch e iPhone',
        answer: 'Usar o Smart Watch com o iPhone abre um mundo de recursos que deixa os dois aparelhos ainda melhores. Crie uma rota personalizada com o Mapas no iPhone e baixe no relógio para usar a qualquer momento. Ou inicie um exercício de bicicleta no Smart Watch e ele aparecerá automaticamente como Atividade ao Vivo no iPhone.',
      },
      {
        question: 'Qual Smart Watch é ideal para mim?',
        answer: 'O Smart Watch Series 11 é perfeito para quem busca recursos avançados de saúde e performance. O Smart Watch SE 3 oferece os recursos essenciais com um ótimo custo-benefício.',
      },
    ],
  },
  cta: {
    title: 'Pronto para ter o seu?',
    buttonText: 'Comprar agora',
    buttonLink: '#',
  },
  settings: {
    primaryColor: '#0071e3',
    accentColor: '#f56300',
    backgroundColor: '#ffffff',
    whatsappNumber: '',
  },
}

export function AppleWatchLayout({ 
  content = defaultAppleWatchContent, 
  isEditing = false,
  sectionOrder = ['hero', 'products', 'reasons', 'features', 'video', 'accessories', 'faq', 'cta'],
  sectionVisibility = { hero: true, products: true, reasons: true, features: true, accessories: true, faq: true, cta: true },
  sectionColors = defaultSectionColors,
  showWhatsAppButton = false, // Padrão desativado - só aparece se explicitamente ativado
  layoutId,
  versionId,
}: AppleWatchLayoutProps) {
  
  // Debug WhatsApp Button
  console.log('🔍 AppleWatchLayout - WhatsApp:', {
    showWhatsAppButton,
    hasNumber: !!content.settings.whatsappNumber,
    number: content.settings.whatsappNumber,
    willShow: showWhatsAppButton === true && !!content.settings.whatsappNumber,
  })

  // Função para rastrear cliques
  const handleClick = (element: string, text?: string, url?: string) => {
    if (layoutId) {
      trackClick({
        layoutId,
        versionId,
        element,
        text,
        url,
      })
    }
  }
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({})
  const featuresRef = useRef<HTMLDivElement>(null)
  
  // Merge das cores com defaults
  const colors: AllSectionColors = {
    hero: { ...defaultSectionColors.hero, ...sectionColors?.hero },
    products: { ...defaultSectionColors.products, ...sectionColors?.products },
    reasons: { ...defaultSectionColors.reasons, ...sectionColors?.reasons },
    features: { ...defaultSectionColors.features, ...sectionColors?.features },
    video: { ...defaultSectionColors.video, ...sectionColors?.video },
    accessories: { ...defaultSectionColors.accessories, ...sectionColors?.accessories },
    faq: { ...defaultSectionColors.faq, ...sectionColors?.faq },
    cta: { ...defaultSectionColors.cta, ...sectionColors?.cta },
  }

  const scrollFeatures = (direction: 'left' | 'right') => {
    if (featuresRef.current) {
      const scrollAmount = 300
      featuresRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Ordem padrão das seções
  const defaultSectionOrder = ['hero', 'products', 'reasons', 'features', 'accessories', 'faq', 'cta']
  const orderedSections = sectionOrder && sectionOrder.length > 0 ? sectionOrder : defaultSectionOrder

  // Função para renderizar cada seção
  const renderSection = (sectionKey: string) => {
    if (!sectionVisibility[sectionKey]) return null

    switch (sectionKey) {
      case 'hero':
        return (
          <section 
            key="hero"
            className="pt-16 pb-20 px-4 text-center"
            style={{ backgroundColor: colors.hero.backgroundColor }}
          >
            {content.hero.badge && (
              <div className="mb-4">
                <span 
                  className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: colors.hero.buttonColor,
                    color: colors.hero.buttonTextColor 
                  }}
                >
                  {content.hero.badge}
                </span>
              </div>
            )}
            <h1 
              className="text-[56px] md:text-[80px] font-semibold tracking-tight leading-none mb-2"
              style={{ color: colors.hero.textColor }}
            >
              {content.hero.title}
            </h1>
            {content.hero.subtitle && (
              <p 
                className="text-xl md:text-2xl max-w-2xl mx-auto"
                style={{ color: colors.hero.textColor, opacity: 0.7 }}
              >
                {content.hero.subtitle}
              </p>
            )}
          </section>
        )

      case 'products':
        return (
          <section key="products" className="py-8 px-4" style={{ backgroundColor: colors.products.backgroundColor }}>
            <div className="max-w-[1200px] mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {content.products.map((product) => (
                  <div
                    key={product.id}
                    id={`product-${product.id}`}
                    className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all"
                  >
                    {product.badge && (
                      <div className="mb-3">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ 
                            backgroundColor: colors.products.buttonColor,
                            color: colors.products.buttonTextColor 
                          }}
                        >
                          {product.badge}
                        </span>
                      </div>
                    )}
                    <div className="mb-6">
                      {product.image ? (
                        <Image 
                          src={product.image} 
                          alt={product.name} 
                          width={400} 
                          height={400} 
                          className="w-full h-auto object-contain"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {product.colors.map((color, i) => (
                        <button key={i} className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h3 
                      className="text-3xl font-semibold mb-2"
                      style={{ color: colors.products.textColor }}
                    >
                      {product.name}
                    </h3>
                    <p 
                      className="text-lg mb-4"
                      style={{ color: colors.products.textColor, opacity: 0.7 }}
                    >
                      {product.description}
                    </p>
                    <div className="mb-6">
                      <span 
                        className="text-2xl font-semibold"
                        style={{ color: colors.products.textColor }}
                      >
                        {product.price}
                      </span>
                      {product.monthlyPrice && (
                        <p 
                          className="text-sm mt-1"
                          style={{ color: colors.products.textColor, opacity: 0.6 }}
                        >
                          ou {product.monthlyPrice}/mês
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {product.buyLink && (
                        <a 
                          href={product.buyLink}
                          onClick={() => handleClick('product_buy_button', product.buyText || 'Comprar', product.buyLink)}
                          className="flex-1 py-3 rounded-full text-center text-sm font-semibold transition-all hover:opacity-90"
                          style={{
                            backgroundColor: colors.products.buttonColor,
                            color: colors.products.buttonTextColor,
                          }}
                        >
                          {product.buyText || 'Comprar'}
                        </a>
                      )}
                      {product.learnMoreLink && (
                        <a 
                          href={product.learnMoreLink}
                          onClick={() => handleClick('product_learn_more_button', product.learnMoreText || 'Saiba mais', product.learnMoreLink)}
                          className="flex-1 py-3 rounded-full text-center text-sm font-semibold border-2 transition-all hover:bg-gray-50"
                          style={{ 
                            borderColor: colors.products.buttonColor,
                            color: colors.products.buttonColor 
                          }}
                        >
                          {product.learnMoreText || 'Saiba mais'}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'reasons':
        return (
          <section key="reasons" className="py-20 px-4" style={{ backgroundColor: colors.reasons.backgroundColor }}>
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-12">
                <h2 
                  className="text-4xl md:text-5xl font-semibold mb-4"
                  style={{ color: colors.reasons.textColor }}
                >
                  {content.reasons.title}
                </h2>
                <a 
                  href={content.reasons.link.url}
                  onClick={() => handleClick('reasons_link', content.reasons.link.text, content.reasons.link.url)}
                  className="inline-flex items-center gap-2 font-medium hover:underline"
                  style={{ color: colors.reasons.buttonColor }}
                >
                  {content.reasons.link.text} 
                  <ChevronRight size={18} />
                </a>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {content.reasons.items.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-6 rounded-2xl overflow-hidden">
                      {item.image ? (
                        <Image 
                          src={item.image} 
                          alt={item.title} 
                          width={400} 
                          height={225}
                          className="w-full h-auto object-cover" 
                        />
                      ) : (
                        <div className="w-full h-56 bg-gray-200 flex items-center justify-center text-gray-400">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <h3 
                      className="text-sm font-semibold mb-1"
                      style={{ color: colors.reasons.buttonColor }}
                    >
                      {item.subtitle}
                    </h3>
                    <h4 
                      className="text-2xl font-semibold mb-2"
                      style={{ color: colors.reasons.textColor }}
                    >
                      {item.title}
                    </h4>
                    <p 
                      className="text-base"
                      style={{ color: colors.reasons.textColor, opacity: 0.7 }}
                    >
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'features':
        return (
          <section key="features" className="py-20 px-4" style={{ backgroundColor: colors.features.backgroundColor }}>
            <div className="max-w-[1200px] mx-auto">
              <h2 
                className="text-4xl md:text-5xl font-semibold text-center mb-12"
                style={{ color: colors.features.textColor }}
              >
                {content.features.title}
              </h2>
              <div className="relative">
                <button
                  onClick={() => scrollFeatures('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <div 
                  ref={featuresRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {content.features.items.map((feature, index) => (
                    <div
                      key={index}
                      className="flex-none w-[300px] rounded-2xl overflow-hidden relative group cursor-pointer"
                      onClick={() => setActiveFeatureIndex(index)}
                    >
                      {feature.image ? (
                        <Image 
                          src={feature.image} 
                          alt={feature.title} 
                          width={300} 
                          height={533}
                          className="w-full h-auto object-cover" 
                        />
                      ) : (
                        <div className="w-full h-[533px] bg-gray-200 flex items-center justify-center text-gray-400">
                          Sem imagem
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-8 left-6 right-6">
                        <p className="text-xs font-semibold mb-2" style={{ color: feature.textColor || colors.features.buttonColor }}>
                          {feature.category}
                        </p>
                        <h3 className="text-xl font-semibold" style={{ color: colors.features.buttonTextColor }}>
                          {feature.title}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollFeatures('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </section>
        )

      case 'video':
        if (!content.video?.url) return null
        
        // Função para extrair ID do YouTube
        const getYouTubeId = (url: string) => {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
          const match = url.match(regExp)
          return (match && match[2].length === 11) ? match[2] : null
        }

        const isYouTube = content.video.url.includes('youtube.com') || content.video.url.includes('youtu.be')
        const youtubeId = isYouTube ? getYouTubeId(content.video.url) : null
        const videoOrientation = content.video.orientation || 'horizontal'

        return (
          <section 
            key="video" 
            className={`py-20 px-4 ${videoOrientation === 'vertical' ? 'bg-gradient-to-b from-gray-50 to-white' : ''}`}
            style={{ backgroundColor: colors.video.backgroundColor }}
          >
            <div className={`max-w-[1200px] mx-auto ${videoOrientation === 'vertical' ? 'max-w-md' : ''}`}>
              {(content.video.title || content.video.description) && (
                <div className="text-center mb-12">
                  {content.video.title && (
                    <h2 
                      className="text-4xl md:text-5xl font-semibold mb-4"
                      style={{ color: colors.video.textColor }}
                    >
                      {content.video.title}
                    </h2>
                  )}
                  {content.video.description && (
                    <p 
                      className="text-lg max-w-2xl mx-auto"
                      style={{ color: colors.video.textColor, opacity: 0.7 }}
                    >
                      {content.video.description}
                    </p>
                  )}
                </div>
              )}
              
              <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${
                videoOrientation === 'vertical' 
                  ? 'max-w-sm mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-1' 
                  : 'bg-black'
              }`}>
                {isYouTube && youtubeId ? (
                  <div className={`relative ${videoOrientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'} bg-black`}>
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={content.video.title || 'Vídeo'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-xl"
                    />
                    {videoOrientation === 'vertical' && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <span>▶</span> Reels
                      </div>
                    )}
                  </div>
                ) : (
                  (() => {
                    const videoKey = `apple-video-${content.video.url}`
                    const isPlaying = playingVideos[videoKey]
                    
                    return isPlaying ? (
                      <div className={`relative ${videoOrientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'} bg-black`}>
                        <video
                          src={content.video.url}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="w-full h-full object-cover rounded-xl"
                          style={{ backgroundColor: '#000000' }}
                        >
                          Seu navegador não suporta vídeo.
                        </video>
                        {videoOrientation === 'vertical' && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                            <span>▶</span> Reels
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`relative ${videoOrientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'} bg-black rounded-xl overflow-hidden`}>
                        <video
                          src={content.video.url}
                          className="w-full h-full object-cover"
                          style={{ backgroundColor: '#000000' }}
                          muted
                          playsInline
                        />
                        <button
                          onClick={() => setPlayingVideos(prev => ({ ...prev, [videoKey]: true }))}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                        >
                          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
                            <Play size={32} className="text-black ml-1" fill="currentColor" />
                          </div>
                        </button>
                        {videoOrientation === 'vertical' && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                            <span>▶</span> Reels
                          </div>
                        )}
                      </div>
                    )
                  })()
                )}
              </div>
            </div>
          </section>
        )

      case 'accessories':
        return (
          <section key="accessories" className="py-20 px-4" style={{ backgroundColor: colors.accessories.backgroundColor }}>
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-12">
                <h2 
                  className="text-4xl md:text-5xl font-semibold mb-4"
                  style={{ color: colors.accessories.textColor }}
                >
                  {content.accessories.title}
                </h2>
                <a 
                  href={content.accessories.link.url}
                  onClick={() => handleClick('accessories_link', content.accessories.link.text, content.accessories.link.url)}
                  className="inline-flex items-center gap-2 font-medium hover:underline"
                  style={{ color: colors.accessories.buttonColor }}
                >
                  {content.accessories.link.text}
                  <ChevronRight size={18} />
                </a>
              </div>
              <div className="relative rounded-3xl overflow-hidden group">
                {content.accessories.banner.image ? (
                  <Image 
                    src={content.accessories.banner.image} 
                    alt={content.accessories.banner.title} 
                    width={1200} 
                    height={400}
                    className="w-full h-auto object-cover" 
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-400">
                    Sem imagem
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="px-12 max-w-lg">
                    <h3 className="text-4xl font-semibold mb-3" style={{ color: colors.accessories.buttonTextColor }}>
                      {content.accessories.banner.title}
                    </h3>
                    <p className="text-lg mb-6" style={{ color: colors.accessories.buttonTextColor, opacity: 0.9 }}>
                      {content.accessories.banner.description}
                    </p>
                    <a 
                      href={content.accessories.banner.link.url}
                      onClick={() => handleClick('accessories_banner_link', content.accessories.banner.link.text, content.accessories.banner.link.url)}
                      className="inline-flex items-center gap-2 py-3 px-6 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                      style={{
                        backgroundColor: colors.accessories.buttonColor,
                        color: colors.accessories.buttonTextColor,
                      }}
                    >
                      {content.accessories.banner.link.text}
                      <ChevronRight size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )

      case 'faq':
        return (
          <section key="faq" className="py-20 px-4" style={{ backgroundColor: colors.faq.backgroundColor }}>
            <div className="max-w-[800px] mx-auto">
              <h2 
                className="text-4xl md:text-5xl font-semibold text-center mb-12"
                style={{ color: colors.faq.textColor }}
              >
                {content.faq.title}
              </h2>
              <div className="space-y-4">
                {content.faq.items.map((item, index) => (
                  <div 
                    key={index} 
                    className="border-b pb-4"
                    style={{ borderColor: `${colors.faq.textColor}20` }}
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full text-left flex items-center justify-between py-4 group"
                    >
                      <span 
                        className="text-lg font-semibold pr-4"
                        style={{ color: colors.faq.textColor }}
                      >
                        {item.question}
                      </span>
                      <Plus 
                        size={24}
                        className={`flex-shrink-0 transition-transform ${expandedFaq === index ? 'rotate-45' : ''}`}
                        style={{ color: colors.faq.textColor }}
                      />
                    </button>
                    {expandedFaq === index && (
                      <p 
                        className="text-base pb-4"
                        style={{ color: colors.faq.textColor, opacity: 0.7 }}
                      >
                        {item.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'cta':
        return (
          <section key="cta" className="py-20 px-4 text-center" style={{ backgroundColor: colors.cta.backgroundColor }}>
            <div className="max-w-[600px] mx-auto">
              <h2 
                className="text-4xl md:text-5xl font-semibold mb-8"
                style={{ color: colors.cta.textColor }}
              >
                {content.cta.title}
              </h2>
              <a 
                href={content.cta.buttonLink}
                onClick={() => handleClick('cta_button', content.cta.buttonText, content.cta.buttonLink)}
                className="inline-block py-4 px-8 rounded-full text-lg font-semibold transition-all hover:opacity-90"
                style={{
                  backgroundColor: colors.cta.buttonColor,
                  color: colors.cta.buttonTextColor,
                }}
              >
                {content.cta.buttonText}
              </a>
            </div>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: content.settings.backgroundColor || '#ffffff' }}>
      {/* Renderização dinâmica das seções baseada em sectionOrder */}
      {orderedSections.map(renderSection)}

      {/* WhatsApp Float Button - só aparece se showWhatsAppButton for explicitamente true */}
      {showWhatsAppButton === true && content.settings.whatsappNumber && (
        <a
          href={`https://wa.me/${content.settings.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClick('whatsapp_button', 'WhatsApp', `https://wa.me/${content.settings.whatsappNumber}`)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* Styles */}
      <style jsx>{`
        :root {
          --primary-color: ${content.settings.primaryColor};
          --accent-color: ${content.settings.accentColor};
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
