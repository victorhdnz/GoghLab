'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FixedLogoProps {
  logo?: string | null
  siteName?: string
}

export function FixedLogo({ logo: initialLogo, siteName: initialSiteName }: FixedLogoProps) {
  const [siteLogo, setSiteLogo] = useState<string | null>(initialLogo || null)
  const [siteName, setSiteName] = useState<string>(initialSiteName || 'Gogh Lab')
  const [opacity, setOpacity] = useState<number>(1)

  useEffect(() => {
    // Se já temos o logo do servidor, não precisa buscar novamente
    if (initialLogo) {
      setSiteLogo(initialLogo)
      if (initialSiteName) {
        setSiteName(initialSiteName)
      }
      return
    }

    // Só buscar do cliente se não foi passado como prop
    const loadLogo = async () => {
      try {
        const supabase = createClient() as any
        const { data, error } = await supabase
          .from('site_settings')
          .select('site_logo, site_name, homepage_content')
          .eq('key', 'general')
          .maybeSingle()

        if (!error && data) {
          // Priorizar site_logo, mas usar hero_logo como fallback
          let logo = data.site_logo
          if (!logo && data.homepage_content && typeof data.homepage_content === 'object') {
            logo = (data.homepage_content as any)?.hero_logo || null
          }
          
          if (logo) {
            setSiteLogo(logo)
          }
          if (data.site_name) {
            setSiteName(data.site_name)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar logo:', error)
      }
    }

    loadLogo()
  }, [initialLogo, initialSiteName])

  // Efeito para ajustar transparência baseado no scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      // Começar a reduzir opacidade após 50px de scroll
      // Opacidade mínima de 0.3 quando scroll > 200px
      const threshold = 50
      const maxScroll = 200
      
      if (scrollY < threshold) {
        setOpacity(1)
      } else if (scrollY >= maxScroll) {
        setOpacity(0.3)
      } else {
        // Interpolação linear entre 1 e 0.3
        const progress = (scrollY - threshold) / (maxScroll - threshold)
        setOpacity(1 - (progress * 0.7))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Definir opacidade inicial
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Se não houver logo, não renderizar
  if (!siteLogo) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center items-center py-3 px-4 pointer-events-none">
      <Link 
        href="/" 
        className="pointer-events-auto transition-opacity duration-300 hover:opacity-80"
        prefetch={true}
        style={{ opacity }}
      >
        <div className="relative w-20 h-10 md:w-24 md:h-12 lg:w-28 lg:h-14">
          <Image
            src={siteLogo}
            alt={siteName}
            fill
            className="object-contain"
            priority
            unoptimized={siteLogo.startsWith('http')}
            sizes="(max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
            // Garantir que a imagem seja carregada imediatamente
            loading="eager"
          />
        </div>
      </Link>
    </header>
  )
}

