'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  CreditCard,
  Sparkles,
  Wrench,
  BookOpen,
  Briefcase,
  User,
  Package,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ——— Spotlight nav item (mobile bottom bar)
function SpotlightNavItem({
  icon: Icon,
  isActive,
  onClick,
  indicatorPosition,
  position,
  href,
  label,
  innerRef,
}: {
  icon: React.ElementType
  isActive: boolean
  onClick?: () => void
  indicatorPosition: number
  position: number
  href?: string
  label: string
  innerRef?: (el: HTMLElement | null) => void
}) {
  const distance = Math.abs(indicatorPosition - position)
  const spotlightOpacity = isActive ? 1 : Math.max(0, 1 - distance * 0.6)
  const content = (
    <>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-b from-white/40 to-transparent blur-lg rounded-full transition-opacity duration-400 pointer-events-none"
        style={{
          opacity: spotlightOpacity,
          transitionDelay: isActive ? '0.1s' : '0s',
        }}
      />
      <Icon
        className={cn(
          'w-6 h-6 transition-colors duration-200 shrink-0',
          isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
    </>
  )
  const className = 'relative flex items-center justify-center w-12 h-12 min-w-[3rem] mx-1 sm:mx-2 transition-all duration-400'
  if (href) {
    return (
      <Link
        ref={innerRef as any}
        href={href}
        className={className}
        title={label}
        aria-label={label}
      >
        {content}
      </Link>
    )
  }
  return (
    <button
      ref={innerRef as any}
      type="button"
      className={className}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {content}
    </button>
  )
}

// ——— Menu structure: desktop (Início, Criar, Produto dropdown) e mobile (accordion Produto)
type SubItem = { title: string; description?: string; url: string; icon: React.ElementType }
const menuWithDropdowns: Array<
  { title: string; url: string; highlight?: boolean; items?: SubItem[] }> = [
  { title: 'Início', url: '/' },
  { title: 'Criar', url: '/criar', highlight: true },
  {
    title: 'Produto',
    url: '/ferramentas',
    items: [
      { title: 'Ferramentas', description: 'Ferramentas profissionais para criação', url: '/ferramentas', icon: Wrench },
      { title: 'Cursos', description: 'Cursos e formação', url: '/cursos', icon: BookOpen },
      { title: 'Serviços personalizados', description: 'Serviços sob demanda da Agency', url: '/servicos', icon: Briefcase },
    ],
  },
]

export function FloatingHeader() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [siteName, setSiteName] = useState('Gogh Lab')
  const [siteLogo, setSiteLogo] = useState<string | null>(null)
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0)
  const [produtoDropdownOpen, setProdutoDropdownOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null)

  // Sincronizar ícone ativo no mobile com a rota atual
  React.useEffect(() => {
    if (pathname === '/') setMobileActiveIndex(0)
    else if (pathname === '/criar' || pathname?.startsWith('/criar/')) setMobileActiveIndex(2)
    else if (pathname === '/precos') setMobileActiveIndex(3)
    else if (pathname === '/conta' || pathname?.startsWith('/conta/') || pathname === '/login') setMobileActiveIndex(4)
    else if (pathname === '/ferramentas' || pathname === '/cursos' || pathname === '/servicos' || pathname?.startsWith('/servicos/')) setMobileActiveIndex(1)
  }, [pathname])

  // Posicionar indicador branco do nav mobile pelo elemento ativo (responsivo)
  const updateIndicatorPosition = () => {
    const nav = navRef.current
    const el = itemRefs.current[mobileActiveIndex]
    if (nav && el) {
      const navRect = nav.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      setIndicatorStyle({
        left: elRect.left - navRect.left,
        width: elRect.width,
      })
    } else {
      setIndicatorStyle(null)
    }
  }
  useEffect(() => {
    const run = () => requestAnimationFrame(() => updateIndicatorPosition())
    run()
    const t = setTimeout(run, 150)
    const ro = new ResizeObserver(run)
    if (navRef.current) ro.observe(navRef.current)
    window.addEventListener('resize', run)
    return () => {
      clearTimeout(t)
      ro.disconnect()
      window.removeEventListener('resize', run)
    }
  }, [mobileActiveIndex])
  useEffect(() => {
    const t = setTimeout(() => requestAnimationFrame(() => updateIndicatorPosition()), 100)
    return () => clearTimeout(t)
  }, [pathname])

  React.useEffect(() => {
    if (pathname !== '/') return
    const id = sessionStorage.getItem('scrollToSection')
    if (!id) return
    sessionStorage.removeItem('scrollToSection')
    const scrollToEl = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return true
      }
      return false
    }
    if (scrollToEl()) return
    const t0 = Date.now()
    const interval = setInterval(() => {
      if (scrollToEl() || Date.now() - t0 > 3000) clearInterval(interval)
    }, 150)
    return () => clearInterval(interval)
  }, [pathname])

  React.useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient() as any
        const { data } = await supabase
          .from('site_settings')
          .select('site_logo, site_name')
          .eq('key', 'general')
          .maybeSingle()
        if (data) {
          setSiteName(data.site_name || 'Gogh Lab')
          if (data.site_logo) setSiteLogo(data.site_logo)
        }
      } catch (e) {
        console.error('FloatingHeader site_settings:', e)
      }
    }
    load()
  }, [])

  // ——— Desktop: navbar centralizada, não full-width; dropdowns + um botão Ver planos
  const desktopNav = (
    <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 justify-center px-3 py-3 md:py-4 pointer-events-none">
      <nav className="pointer-events-auto relative flex items-center justify-between gap-4 w-full max-w-5xl px-4 py-2.5 bg-black/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 min-w-0" prefetch>
          {siteLogo ? (
            <Image
              src={siteLogo}
              alt={siteName}
              width={32}
              height={32}
              className="h-8 w-8 object-contain flex-shrink-0"
              unoptimized={siteLogo.startsWith('http')}
              priority
            />
          ) : (
            <span className="text-lg font-semibold text-white truncate">{siteName}</span>
          )}
        </Link>

        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-1 bg-transparent">
              {menuWithDropdowns.map((item) => {
                if (item.items?.length) {
                  return (
                    <div key={item.title} className="flex items-center">
                      <DropdownMenu open={produtoDropdownOpen} onOpenChange={setProdutoDropdownOpen}>
                        <DropdownMenuTrigger
                          className={cn(
                            'group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
                            'bg-transparent text-white/90 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 outline-none'
                          )}
                        >
                          {item.title}
                          <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-72 p-0" sideOffset={8}>
                          <ul className="p-3">
                            {item.items.map((sub) => {
                              const SubIcon = sub.icon
                              return (
                                <li key={sub.url}>
                                  <Link
                                    href={sub.url}
                                    className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground text-foreground"
                                    onClick={() => setProdutoDropdownOpen(false)}
                                  >
                                    {SubIcon && <SubIcon className="size-5 shrink-0 text-muted-foreground" />}
                                    <div>
                                      <div className="text-sm font-semibold">{sub.title}</div>
                                      {sub.description && (
                                        <p className="text-sm leading-snug text-muted-foreground">{sub.description}</p>
                                      )}
                                    </div>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                }
                return (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          'inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10',
                          item.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-white/90 hover:text-white'
                        )}
                      >
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden lg:flex flex-shrink-0 items-center gap-2">
          <Button asChild size="sm" className="rounded-lg">
            <Link href="/precos">Ver planos</Link>
          </Button>
          <Link
            href={isAuthenticated ? '/conta' : '/login'}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-colors"
            title={isAuthenticated ? 'Conta' : 'Entrar'}
            aria-label={isAuthenticated ? 'Conta' : 'Entrar'}
          >
            <User className="w-5 h-5" strokeWidth={2} />
          </Link>
        </div>
      </nav>
    </header>
  )

  // ——— Mobile: barra inferior com ícone Produto que abre pop-up (Ferramentas + Cursos)
  const produtoItem = menuWithDropdowns.find((m) => m.title === 'Produto' && m.items?.length)
  const mobileNavItems = [
    { index: 0, icon: Home, label: 'Início', href: '/' },
    { index: 1, icon: Package, label: 'Produto', openDropdown: true },
    { index: 2, icon: Sparkles, label: 'Criar', href: '/criar' },
    { index: 3, icon: CreditCard, label: 'Planos', href: '/precos' },
    { index: 4, icon: User, label: isAuthenticated ? 'Conta' : 'Entrar', href: isAuthenticated ? '/conta' : '/login' },
  ]

  const mobileBar = (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 lg:hidden pointer-events-none safe-area-pb">
      <nav
        ref={navRef}
        className="pointer-events-auto relative flex items-center justify-between px-2 py-3 bg-black/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10"
        style={{ width: 'min(100% - 1.5rem, 22rem)', maxWidth: 'calc(100vw - 1.5rem)' }}
      >
        {indicatorStyle && (
          <div
            className="absolute top-0 h-[2px] bg-white transition-all duration-300 ease-out pointer-events-none"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              transform: 'translateY(-1px)',
            }}
          />
        )}
        {mobileNavItems.map((item) => {
          if (item.openDropdown && produtoItem?.items) {
            const isActive = mobileActiveIndex === item.index
            const distance = Math.abs(mobileActiveIndex - item.index)
            const spotlightOpacity = isActive ? 1 : Math.max(0, 1 - distance * 0.6)
            return (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    ref={(el) => { itemRefs.current[item.index] = el }}
                    type="button"
                    className="relative flex items-center justify-center w-12 h-12 min-w-[3rem] mx-1 sm:mx-2 transition-all duration-400 outline-none"
                    title={item.label}
                    aria-label={item.label}
                  >
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-b from-white/40 to-transparent blur-lg rounded-full transition-opacity duration-400 pointer-events-none"
                      style={{
                        opacity: spotlightOpacity,
                        transitionDelay: isActive ? '0.1s' : '0s',
                      }}
                    />
                    <Package
                      className={cn(
                        'w-6 h-6 transition-colors duration-200 shrink-0',
                        isActive ? 'text-white' : 'text-gray-500'
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="center"
                  sideOffset={12}
                  className="w-56 rounded-xl border border-white/10 bg-black/95 backdrop-blur-sm py-1"
                >
                  {produtoItem.items.map((sub) => {
                    const SubIcon = sub.icon
                    return (
                      <DropdownMenuItem key={sub.url} asChild>
                        <Link
                          href={sub.url}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 no-underline outline-none transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                        >
                          {SubIcon && <SubIcon className="size-5 shrink-0 text-white/70" />}
                          <span>{sub.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
          return (
            <SpotlightNavItem
              key={item.label}
              icon={item.icon}
              isActive={mobileActiveIndex === item.index}
              indicatorPosition={mobileActiveIndex}
              position={item.index}
              href={item.href}
              label={item.label}
              innerRef={(el) => { itemRefs.current[item.index] = el }}
            />
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {desktopNav}
      {mobileBar}
    </>
  )
}
