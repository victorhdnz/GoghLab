'use client'

import { LandingLayout, LandingVersion } from '@/types'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DefaultLayout } from './layouts/DefaultLayout'
import { AppleWatchLayout, defaultAppleWatchContent, AppleWatchContent } from './layouts/AppleWatchLayout'

interface LandingPageRendererProps {
  layout: LandingLayout
  version: LandingVersion | null
}

// Tipos de layout disponíveis (criados via código)
export type LayoutType = 'default' | 'apple-watch'

export function LandingPageRenderer({ layout, version }: LandingPageRendererProps) {
  const [mounted, setMounted] = useState(false)
  const [landingSettings, setLandingSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    loadSettings()
    
    // Registrar analytics
    const sessionId = typeof window !== 'undefined' 
      ? sessionStorage.getItem('session_id') || `session_${Date.now()}_${Math.random()}`
      : null

    if (sessionId && typeof window !== 'undefined') {
      sessionStorage.setItem('session_id', sessionId)
      
      // Registrar page_view
      Promise.resolve(
        supabase
      .from('landing_analytics')
      .insert({
        layout_id: layout.id,
        version_id: version?.id || null,
        session_id: sessionId,
        event_type: 'page_view',
        event_data: {
          url: window.location.href,
          referrer: document.referrer,
        },
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      })
      ).then(() => {}).catch((error) => console.error('Erro ao registrar analytics:', error))
    }

    // Tracking de scroll
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const scrollDepth = Math.round(
          ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
        )
        
        if (sessionId) {
          Promise.resolve(
            supabase
            .from('landing_analytics')
            .insert({
              layout_id: layout.id,
              version_id: version?.id || null,
              session_id: sessionId,
              event_type: 'scroll',
                event_data: { scroll_depth: scrollDepth },
            })
          ).then(() => {}).catch((error) => console.error('Erro ao registrar scroll:', error))
        }
      }, 500)
    }

    // Tracking de tempo na página
    const startTime = Date.now()
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000)
      if (sessionId && timeOnPage > 5) {
        Promise.resolve(
          supabase
          .from('landing_analytics')
          .insert({
            layout_id: layout.id,
            version_id: version?.id || null,
            session_id: sessionId,
            event_type: 'time_on_page',
              event_data: { time_seconds: timeOnPage },
          })
        ).then(() => {}).catch((error) => console.error('Erro ao registrar tempo:', error))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearTimeout(scrollTimeout)
    }
  }, [layout.id, version?.id, supabase])

  const loadSettings = async () => {
    try {
      // Se a versão tiver conteúdo próprio (sections_config), usar ele
      if (version?.sections_config && Object.keys(version.sections_config as any).length > 0) {
        setLandingSettings({ value: version.sections_config })
        setLoading(false)
        return
      }

      // Caso contrário, buscar settings do site (landing page settings)
      const { data: siteSettings } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'general')
        .maybeSingle()

      if (siteSettings) {
        setLandingSettings(siteSettings)
      }
    } catch (error) {
      console.error('Erro ao carregar settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  // Aplicar estilos customizados da versão ou layout
  const versionStyles = (version?.custom_styles as any) || {}
  const themeColors = (layout.theme_colors as any) || {}
  const layoutFonts = (layout.default_fonts as any) || {}
  const fonts = versionStyles.fonts || layoutFonts

  // Aplicar fontes via CSS variables
  const fontStyles: Record<string, string> = {}
  if (fonts.heading) fontStyles['--font-heading'] = fonts.heading
  if (fonts.body) fontStyles['--font-body'] = fonts.body
  if (fonts.button) fontStyles['--font-button'] = fonts.button

  // Aplicar cores via CSS variables
  const colorStyles: React.CSSProperties & Record<string, string> = {
    ...fontStyles,
    '--color-primary': versionStyles.colors?.primary || themeColors.primary || '#000000',
    '--color-secondary': versionStyles.colors?.secondary || themeColors.secondary || '#ffffff',
    '--color-accent': versionStyles.colors?.accent || themeColors.accent || '#FFD700',
    '--color-background': versionStyles.colors?.background || themeColors.background || '#ffffff',
    '--color-text': versionStyles.colors?.text || themeColors.text || '#000000',
    '--color-button': versionStyles.colors?.button || themeColors.button || '#000000',
    '--color-button-text': versionStyles.colors?.buttonText || themeColors.buttonText || '#ffffff',
  } as React.CSSProperties & Record<string, string>

  // Configuração das seções da versão
  const sectionsConfig = (version?.sections_config as any) || {}

  // Determinar o tipo de layout baseado no slug
  const layoutType = getLayoutType(layout.slug)

  // Debug: verificar valor do showWhatsAppButton
  const showWhatsApp = sectionsConfig?.showWhatsAppButton === true
  console.log('🔍 WhatsApp Button Config:', {
    hasConfig: !!sectionsConfig,
    rawValue: sectionsConfig?.showWhatsAppButton,
    finalValue: showWhatsApp,
    versionId: version?.id,
  })

  return (
    <div style={colorStyles}>
      {/* Aplicar fontes via classes Tailwind ou inline */}
      <style jsx global>{`
        :root {
          ${fonts.heading ? `--font-heading: ${fonts.heading};` : ''}
          ${fonts.body ? `--font-body: ${fonts.body};` : ''}
          ${fonts.button ? `--font-button: ${fonts.button};` : ''}
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading, inherit);
        }
        body {
          font-family: var(--font-body, inherit);
        }
        button, .btn {
          font-family: var(--font-button, inherit);
        }
      `}</style>

      {/* Renderizar layout baseado no tipo */}
      {layoutType === 'apple-watch' ? (
        <AppleWatchLayout 
          content={getAppleWatchContent(version, landingSettings)}
          sectionOrder={sectionsConfig?.sectionOrder}
          sectionVisibility={sectionsConfig?.sectionVisibility}
          sectionColors={sectionsConfig?.sectionColors}
          showWhatsAppButton={showWhatsApp}
          layoutId={layout.id}
          versionId={version?.id}
        />
      ) : (
        <DefaultLayout 
          layout={layout} 
          version={version} 
          sectionsConfig={sectionsConfig} 
          landingSettings={landingSettings}
        />
      )}
    </div>
  )
}

// Determinar tipo de layout baseado no slug
function getLayoutType(slug: string): LayoutType {
  const appleWatchSlugs = ['apple-watch', 'apple', 'premium']
  if (appleWatchSlugs.includes(slug.toLowerCase())) {
    return 'apple-watch'
  }
  return 'default'
}

// Extrair conteúdo para o layout Apple Watch
function getAppleWatchContent(
  version: LandingVersion | null,
  landingSettings: any
): AppleWatchContent {
  // Se a versão tiver conteúdo customizado, usar
  const versionContent = (version?.sections_config as any)?.appleWatchContent
  
  if (versionContent) {
    return {
      ...defaultAppleWatchContent,
      ...versionContent,
    }
  }

  // Usar conteúdo padrão
  return defaultAppleWatchContent
}
