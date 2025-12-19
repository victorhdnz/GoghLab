'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, GitCompare } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useProductComparison } from '@/hooks/useProductComparison'
import { AuthDebug } from './AuthDebug'
import { createClient } from '@/lib/supabase/client'

export const Header = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [siteName, setSiteName] = useState<string>('Smart Time Prime')
  const [siteLogo, setSiteLogo] = useState<string | undefined>(undefined)
  const { products } = useProductComparison()
  const comparisonCount = products.length

  // Carregar logo e nome do site
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const supabase = createClient()
        // Buscar registro com key = 'general' (correto)
        const { data, error } = await supabase
          .from('site_settings')
          .select('site_logo, site_name')
          .eq('key', 'general')
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações:', error)
          return
        }

        if (data) {
          // Sempre atualizar o nome, mesmo se vazio (para permitir limpar)
          setSiteName(data.site_name || 'Smart Time Prime')
          // Atualizar logo apenas se existir
          if (data.site_logo) {
            setSiteLogo(data.site_logo)
          } else {
            setSiteLogo(undefined)
          }
        } else {
          // Se não houver dados, manter o padrão
          setSiteName('Smart Time Prime')
          setSiteLogo(undefined)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
    
    // Carregar imediatamente
    loadSiteSettings()

    // Recarregar configurações a cada 3 segundos (para atualizar após mudanças no dashboard)
    const interval = setInterval(loadSiteSettings, 3000)
    return () => clearInterval(interval)
  }, [])



  const navigation = [
    { name: 'Início', href: '/' },
    { name: 'Produtos', href: '/produtos' },
    { name: 'Sobre', href: '#about-us' },
    { name: 'Termos', href: '/termos' },
    { name: 'Contato', href: '#contato' },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const id = href.substring(1)
      
      // Se não estiver na home, vai pra home primeiro
      if (pathname !== '/') {
        // Salva o ID para rolar depois
        sessionStorage.setItem('scrollToSection', id)
        router.push('/')
      } else {
        // Se já está na home, só rola
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      setMobileMenuOpen(false)
    }
  }

  // Efeito para rolar após navegação
  useEffect(() => {
    const scrollToSection = sessionStorage.getItem('scrollToSection')
    if (scrollToSection && pathname === '/') {
      setTimeout(() => {
        const element = document.getElementById(scrollToSection)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        sessionStorage.removeItem('scrollToSection')
      }, 500)
    }
  }, [pathname])

  // Ocultar header em landing pages, página principal, dashboard, comparador, catálogos e suporte
  if (pathname?.startsWith('/lp/') || pathname === '/' || pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/comparar') || pathname?.startsWith('/catalogo') || pathname?.startsWith('/suporte')) {
    return null
  }

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <AuthDebug />
      <nav className="container mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4 w-full relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 h-full min-w-0 flex-shrink-0 max-w-[calc(100%-140px)] sm:max-w-none z-10">
            {siteLogo && (
              <Image
                src={siteLogo}
                alt={siteName}
                width={60}
                height={48}
                className="h-10 sm:h-12 w-auto object-contain flex-shrink-0"
                priority
                sizes="(max-width: 640px) 40px, 48px"
              />
            )}
            <span 
              className="text-sm sm:text-2xl font-bold leading-tight break-words whitespace-normal min-w-0 flex-1" 
              style={{ 
                wordBreak: 'break-word', 
                overflowWrap: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxHeight: '2.5em',
                lineHeight: '1.25em'
              }}
            >
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation - Centralizado */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-8 z-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-gray-700 hover:text-black font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0 ml-2">
            {/* Comparison Icon */}
            <Link
              href="/comparar"
              className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <GitCompare size={20} className="sm:w-6 sm:h-6" />
              {comparisonCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-black text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                  {comparisonCount}
                </span>
              )}
            </Link>

            {/* User Menu - Removido login público, apenas admin acessa via /admin */}
            {/* Login removido - sistema não usa mais login público */}

            {/* Mobile Menu Toggle - apenas visível em mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="block px-4 py-2 hover:bg-gray-100 rounded-lg"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

