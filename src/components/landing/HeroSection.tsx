'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, Fragment as ReactFragment } from 'react'
import Image from 'next/image'
import { BannerCarousel } from './BannerCarousel'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  heroButtonText?: string
  heroButtonLink?: string
  images?: string[]
  backgroundColor?: string
  textColor?: string
  badgeText?: string
  viewerCountText?: string
  viewerCountEnabled?: boolean
  timerText?: string
  timerEndDate?: Date
  heroImages?: string[]
  heroBanner?: string
  heroBanners?: string[] // Array de banners para carrossel
  elementOrder?: string[] // Ordem dos elementos
  elementVisibility?: {
    banner?: boolean
    badge?: boolean
    title?: boolean
    subtitle?: boolean
    timer?: boolean
    cta?: boolean
    heroButton?: boolean
    viewerCount?: boolean
  }
}

export const HeroSection = ({
  title = '🚀 MV COMPANY — SERVIÇOS DIGITAIS',
  subtitle = '🚨 A BLACK FRIDAY CHEGOU!\nSmartwatch Série 11 com até 50% OFF + 4 BRINDES EXCLUSIVOS\n📦 Entrega em até 24h direto do Shopping Planalto – Uberlândia/MG',
  ctaText = '💬 QUERO MEU SÉRIE 11 AGORA!',
  ctaLink,
  heroButtonText,
  heroButtonLink,
  images = [],
  backgroundColor,
  textColor,
  badgeText = '🚨 A BLACK FRIDAY CHEGOU!',
  viewerCountText = 'pessoas vendo agora',
  viewerCountEnabled = true,
  timerText = 'Oferta termina em:',
  timerEndDate,
  heroImages = [],
  heroBanner,
  heroBanners = [],
  elementOrder = ['hero_banner_visible', 'hero_badge_visible', 'hero_title_visible', 'hero_subtitle_visible', 'hero_viewer_count', 'hero_timer_visible', 'hero_button_visible'],
  elementVisibility = {
    banner: true,
    badge: true,
    title: true,
    subtitle: true,
    timer: true,
    cta: true,
    heroButton: true,
    viewerCount: true,
  },
}: HeroSectionProps) => {
  // Usar cores configuradas ou usar padrão preto/branco
  const finalBackgroundColor = backgroundColor || '#000000'
  const finalTextColor = textColor || '#ffffff'
  const [viewerCount, setViewerCount] = useState(15)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Simular contador de pessoas visualizando (muda a cada 20 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(Math.floor(Math.random() * 11) + 15) // Entre 15 e 25
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  // Calcular tempo restante se houver timerEndDate
  useEffect(() => {
    if (!timerEndDate) return

    const calculateTimeLeft = () => {
      const difference = timerEndDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [timerEndDate])
  // Determinar se usar carrossel ou banner único - priorizar heroBanners (array)
  // Se heroBanners tiver itens, usar apenas ele (ignorar heroBanner antigo)
  const banners = heroBanners && heroBanners.length > 0 
    ? heroBanners.filter(Boolean) 
    : (heroBanner ? [heroBanner].filter(Boolean) : [])

  // Mapeamento de elementos para seus componentes JSX
  const elementComponents: Record<string, JSX.Element | null> = {
    hero_banner_visible: elementVisibility.banner && banners.length > 0 ? (
      <div key="banner" className="w-full relative z-20">
        <BannerCarousel banners={banners} autoPlayInterval={5000} />
      </div>
    ) : null,
    hero_badge_visible: elementVisibility.badge && badgeText ? (
      <motion.div
        key="badge"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-block bg-red-600 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-full text-sm md:text-lg font-bold shadow-2xl"
      >
        {badgeText}
      </motion.div>
    ) : null,
    hero_title_visible: elementVisibility.title ? (
      <motion.h1
        key="title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
      >
        {title}
      </motion.h1>
    ) : null,
    hero_subtitle_visible: elementVisibility.subtitle && subtitle ? (
      <motion.p
        key="subtitle"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="text-lg md:text-xl lg:text-2xl opacity-90 whitespace-pre-line"
      >
        {(() => {
          let cleanedSubtitle = subtitle
            .replace(/<button[^>]*>.*?<\/button>/gi, '')
            .replace(/<a[^>]*>.*?<\/a>/gi, '')
            .replace(/Garantir agora!?\s*#####/gi, '')
            .replace(/Garantir agora/gi, '')
            .replace(/#####/g, '')
            .replace(/!#####/g, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim()
          
          if (!cleanedSubtitle || cleanedSubtitle.length === 0) {
            return null
          }
          
          return cleanedSubtitle
        })()}
      </motion.p>
    ) : null,
    hero_viewer_count: elementVisibility.viewerCount && viewerCountEnabled ? (
      <motion.div
        key="viewerCount"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md border-2 transition-all duration-300 ${
          viewerCount < 15
            ? 'bg-orange-500/20 border-orange-400/50'
            : viewerCount >= 20
            ? 'bg-red-500/20 border-red-400/50'
            : 'bg-green-500/20 border-green-400/50'
        }`}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-2xl"
          >
            🔥
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.span
              key={viewerCount}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`text-xl md:text-2xl font-black ${
                viewerCount < 15 ? 'text-orange-300' : viewerCount >= 20 ? 'text-red-300' : 'text-green-300'
              }`}
            >
              {viewerCount}
            </motion.span>
            <span className="text-sm md:text-base font-bold text-white">
              {viewerCountText}
            </span>
          </div>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              viewerCount < 15
                ? 'bg-orange-500/30 text-orange-200 border-orange-400/50'
                : viewerCount >= 20
                ? 'bg-red-500/30 text-red-200 border-red-400/50'
                : 'bg-green-500/30 text-green-200 border-green-400/50'
            }`}
          >
            {viewerCount < 15 ? 'POPULAR' : viewerCount >= 20 ? 'ALTA DEMANDA' : 'MUITA GENTE'}
          </motion.span>
        </div>
        <motion.div
          className={`absolute inset-0 rounded-2xl blur-xl -z-10 ${
            viewerCount < 15 ? 'bg-orange-500/30' : viewerCount >= 20 ? 'bg-red-500/30' : 'bg-green-500/30'
          }`}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    ) : null,
    hero_timer_visible: elementVisibility.timer && timerEndDate ? (
      <motion.div
        key="timer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 relative z-20"
      >
        <span className="text-xl">⏰</span>
        <span className="font-semibold">
          {timerText} <span className="font-mono text-white">{String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s</span>
        </span>
      </motion.div>
    ) : null,
    hero_cta_visible: elementVisibility.cta && ctaText && !ctaText.toLowerCase().includes('garantir agora') && (!heroButtonText || !heroButtonLink) ? (
      <motion.div
        key="cta"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className=""
      >
        {ctaLink ? (
          <Link href={ctaLink}>
            <Button size="lg" className="text-lg px-8 py-4">
              {ctaText.replace(/Garantir agora!?\s*#####/gi, '').replace(/#####/g, '').trim()}
            </Button>
          </Link>
        ) : (
          <Button size="lg" className="text-lg px-8 py-4">
            {ctaText.replace(/Garantir agora!?\s*#####/gi, '').replace(/#####/g, '').trim()}
          </Button>
        )}
      </motion.div>
    ) : null,
    hero_button_visible: elementVisibility.heroButton && heroButtonText && heroButtonLink ? (
      <motion.div
        key="heroButton"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="relative z-10"
      >
        <Link href={heroButtonLink} target={heroButtonLink.startsWith('http') ? '_blank' : '_self'} rel={heroButtonLink.startsWith('http') ? 'noopener noreferrer' : undefined}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative inline-block group"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px rgba(255,255,255,0)',
                  '0 0 20px rgba(255,255,255,0.5)',
                  '0 0 0px rgba(255,255,255,0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="rounded-lg"
            >
              <Button 
                size="lg" 
                variant="outline" 
                className="text-sm md:text-lg px-4 py-2 md:px-8 md:py-4 border-2 border-white text-white bg-transparent hover:bg-white/10 hover:border-white/80 active:bg-white/20 transition-all duration-300 relative z-10 backdrop-blur-sm group-hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                <motion.span
                  animate={{
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  {heroButtonText}
                </motion.span>
                <motion.div
                  animate={{
                    x: [0, 4, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="inline-block ml-2"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </motion.div>
              </Button>
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-lg blur-xl pointer-events-none -z-10"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        </Link>
      </motion.div>
    ) : null,
  }

  // Separar elementos que ficam fora do container principal (banner)
  const bannerElement = elementComponents.hero_banner_visible
  
  // Renderizar elementos na ordem especificada (exceto banner que fica fora)
  const renderContentElements = () => {
    const viewerCountIndex = elementOrder.indexOf('hero_viewer_count')
    const timerIndex = elementOrder.indexOf('hero_timer_visible')
    const shouldWrapViewerAndTimer = viewerCountIndex !== -1 && timerIndex !== -1 && Math.abs(viewerCountIndex - timerIndex) === 1
    
    // Função para determinar espaçamento adicional baseado no tipo de elemento
    const getElementSpacing = (key: string, isFirst: boolean) => {
      // O gap-6 do container já fornece espaçamento base
      // Adicionar espaçamento extra apenas para elementos que precisam de mais espaço
      let spacing = ''
      
      // Elementos que precisam de mais espaço acima quando não são os primeiros
      if (!isFirst) {
        // Título e subtítulo precisam de mais espaço quando aparecem depois de outros elementos
        if (['hero_title_visible', 'hero_subtitle_visible'].includes(key)) {
          spacing += 'mt-4 ' // Espaçamento extra além do gap-6
        }
      }
      
      return spacing.trim()
    }
    
    const visibleElements = elementOrder.filter(key => key !== 'hero_banner_visible' && elementComponents[key])
    
    return elementOrder
      .filter(key => key !== 'hero_banner_visible')
      .map((key, index) => {
        const element = elementComponents[key]
        if (!element) return null
        
        // Encontrar o índice real do elemento na lista de elementos visíveis
        const visibleIndex = visibleElements.indexOf(key)
        const isFirst = visibleIndex === 0
        const spacing = getElementSpacing(key, isFirst)
        
        // Se viewerCount e timer estão juntos, renderizar em um wrapper
        if (key === 'hero_viewer_count' && shouldWrapViewerAndTimer) {
          return (
            <motion.div
              key="viewerCount-timer-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className={`flex flex-col items-center justify-center gap-4 text-base md:text-lg w-full ${spacing}`}
            >
              {element}
              {elementComponents.hero_timer_visible}
            </motion.div>
          )
        }
        
        // Se for timer e está junto com viewerCount, não renderizar aqui (já renderizado acima)
        if (key === 'hero_timer_visible' && shouldWrapViewerAndTimer) {
          return null
        }
        
        // Para botões, adicionar wrapper com espaçamento
        if (key === 'hero_button_visible' || key === 'hero_cta_visible') {
          return (
            <div key={key} className={`w-full flex justify-center ${spacing}`}>
              {element}
            </div>
          )
        }
        
        // Para badge, título e subtítulo - adicionar wrapper com espaçamento
        if (key === 'hero_badge_visible' || key === 'hero_title_visible' || key === 'hero_subtitle_visible') {
          return (
            <div key={key} className={`w-full ${spacing}`}>
              {element}
            </div>
          )
        }
        
        // Para outros elementos (viewerCount, timer quando separados), usar wrapper flex com espaçamento
        return (
          <div key={key} className={`w-full flex justify-center ${spacing}`}>
            {element}
          </div>
        )
      })
      .filter(Boolean)
  }

  return (
    <section
      style={{ backgroundColor: finalBackgroundColor, color: finalTextColor }}
      className="relative flex flex-col items-center justify-center"
    >
      {/* Banner carrossel acima do texto (1920x650) - renderizado primeiro se estiver na ordem */}
      {bannerElement}

      {/* Hero Images (se houver) */}
      {heroImages.length > 0 && (
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-2 gap-4 p-8">
            {heroImages.slice(0, 4).map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={img}
                  alt={`Hero ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-center min-h-[70vh]">
          {/* Content - renderizado na ordem especificada */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl w-full flex flex-col items-center gap-6 md:gap-8"
          >
            {renderContentElements()}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

