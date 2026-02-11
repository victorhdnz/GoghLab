'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  CreditCard,
  Sparkles,
  Wrench,
  BookOpen,
  User,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

// ——— Spotlight nav item (mobile bottom bar)
function SpotlightNavItem({
  icon: Icon,
  isActive,
  onClick,
  indicatorPosition,
  position,
  href,
  label,
}: {
  icon: React.ElementType
  isActive: boolean
  onClick?: () => void
  indicatorPosition: number
  position: number
  href?: string
  label: string
}) {
  const distance = Math.abs(indicatorPosition - position)
  const spotlightOpacity = isActive ? 1 : Math.max(0, 1 - distance * 0.6)
  const content = (
    <>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-b from-white/40 to-transparent blur-lg rounded-full transition-opacity duration-400"
        style={{
          opacity: spotlightOpacity,
          transitionDelay: isActive ? '0.1s' : '0s',
        }}
      />
      <Icon
        className={cn(
          'w-6 h-6 transition-colors duration-200',
          isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
    </>
  )
  if (href) {
    return (
      <Link
        href={href}
        className="relative flex items-center justify-center w-12 h-12 mx-2 transition-all duration-400"
        title={label}
        aria-label={label}
      >
        {content}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className="relative flex items-center justify-center w-12 h-12 mx-2 transition-all duration-400"
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
    ],
  },
]

export function FloatingHeader() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [siteName, setSiteName] = useState('Gogh Lab')
  const [siteLogo, setSiteLogo] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0)

  // Sincronizar ícone ativo no mobile com a rota atual
  React.useEffect(() => {
    if (pathname === '/') setMobileActiveIndex(0)
    else if (pathname === '/criar' || pathname?.startsWith('/criar/')) setMobileActiveIndex(2)
    else if (pathname === '/precos') setMobileActiveIndex(3)
    else if (pathname === '/conta' || pathname?.startsWith('/conta/') || pathname === '/login') setMobileActiveIndex(4)
    else if (pathname === '/ferramentas' || pathname === '/cursos') setMobileActiveIndex(1)
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
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 py-3 md:py-4 pointer-events-none">
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
                    <NavigationMenuItem key={item.title} className="text-white/90">
                      <NavigationMenuTrigger className="bg-transparent text-white/90 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="w-72 p-3">
                          {item.items.map((sub) => {
                          const SubIcon = sub.icon
                          return (
                            <li key={sub.url}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={sub.url}
                                  className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground text-foreground"
                                >
                                  {SubIcon && <SubIcon className="size-5 shrink-0 text-muted-foreground" />}
                                  <div>
                                    <div className="text-sm font-semibold">{sub.title}</div>
                                    {sub.description && (
                                      <p className="text-sm leading-snug text-muted-foreground">{sub.description}</p>
                                    )}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          )
                          })}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
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

  // ——— Mobile: barra inferior estilo spotlight (centralizada, não full-width) + Sheet com accordion de categorias
  const mobileNavItems = [
    { index: 0, icon: Home, label: 'Início', href: '/' },
    { index: 1, icon: Layers, label: 'Categorias', openSheet: true },
    { index: 2, icon: Sparkles, label: 'Criar', href: '/criar' },
    { index: 3, icon: CreditCard, label: 'Planos', href: '/precos' },
    { index: 4, icon: User, label: isAuthenticated ? 'Conta' : 'Entrar', href: isAuthenticated ? '/conta' : '/login' },
  ]

  const mobileBar = (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 lg:hidden pointer-events-none">
      <nav
        className="pointer-events-auto relative flex items-center px-2 py-3 bg-black/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10"
        style={{ width: 'min(100% - 2rem, 22rem)' }}
      >
        <div
          className="absolute top-0 h-[2px] bg-white transition-all duration-400 ease-in-out"
          style={{
            left: `${mobileActiveIndex * 56 + 16}px`,
            width: '40px',
            transform: 'translateY(-1px)',
          }}
        />
        {mobileNavItems.map((item) => (
          <SpotlightNavItem
            key={item.label}
            icon={item.icon}
            isActive={mobileActiveIndex === item.index}
            indicatorPosition={mobileActiveIndex}
            position={item.index}
            href={item.openSheet ? undefined : item.href}
            label={item.label}
            onClick={
              item.openSheet
                ? () => {
                    setMobileActiveIndex(1)
                    setMenuOpen(true)
                  }
                : undefined
            }
          />
        ))}
      </nav>
    </div>
  )

  const categoriesSheet = (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent side="right" className="w-[min(85vw,320px)] max-w-[320px] overflow-y-auto overflow-x-hidden pl-6 pr-6 pb-8">
        <SheetHeader className="pb-4 pr-8">
          <SheetTitle className="flex items-center gap-2 min-w-0 text-left">
            {siteLogo && (
              <Image src={siteLogo} alt="" width={24} height={24} className="object-contain flex-shrink-0" unoptimized={siteLogo.startsWith('http')} />
            )}
            <span className="truncate">{siteName}</span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground mb-2 px-1">Menu mobile — atalhos principais estão na barra inferior.</p>
          <Accordion type="single" collapsible className="w-full">
            {menuWithDropdowns.filter((m) => m.items?.length).map((item) => (
              <AccordionItem key={item.title} value={item.title} className="border-b-0">
                <AccordionTrigger className="py-2 font-semibold hover:no-underline text-left">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="mt-1 pb-2">
                  {item.items?.map((sub) => {
                    const SubIcon = sub.icon
                    return (
                      <Link
                        key={sub.url}
                        href={sub.url}
                        onClick={() => setMenuOpen(false)}
                        className="flex gap-3 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted text-foreground min-w-0"
                      >
                        {SubIcon && <SubIcon className="size-5 shrink-0 text-muted-foreground" />}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold break-words">{sub.title}</div>
                          {sub.description && (
                            <p className="text-xs leading-snug text-muted-foreground break-words">{sub.description}</p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="border-t pt-4 mt-2 flex flex-col gap-1">
            <Link href="/" onClick={() => setMenuOpen(false)} className="font-medium py-2.5 hover:underline break-words">
              Início
            </Link>
            <Link href="/criar" onClick={() => setMenuOpen(false)} className="font-medium py-2.5 hover:underline break-words">
              Criar
            </Link>
            <Link href="/precos" onClick={() => setMenuOpen(false)} className="font-medium py-2.5 hover:underline break-words">
              Ver planos
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {desktopNav}
      {mobileBar}
      {categoriesSheet}
    </>
  )
}
