'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, CreditCard, MessageCircle, Sparkles, Wrench, BookOpen, User, Menu } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { LucideIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface NavLinkItem {
  label: string
  href: string
  icon: LucideIcon
  isHash?: boolean
  highlight?: boolean
  /** No mobile: se true, fica na barra; se false, vai para o menu hamburger */
  showOnMobileBar?: boolean
}

const linkConfig: NavLinkItem[] = [
  { label: 'Início', href: '/', icon: Home, showOnMobileBar: true },
  { label: 'Planos', href: '/precos', icon: CreditCard, showOnMobileBar: false },
  { label: 'Contato', href: '/#contact-section', icon: MessageCircle, isHash: true, showOnMobileBar: false },
  { label: 'Criar', href: '/criar', icon: Sparkles, highlight: true, showOnMobileBar: true },
  { label: 'Ferramentas', href: '/ferramentas', icon: Wrench, showOnMobileBar: false },
  { label: 'Cursos', href: '/cursos', icon: BookOpen, showOnMobileBar: false },
]

export function FloatingHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [siteName, setSiteName] = React.useState('Gogh Lab')
  const [siteLogo, setSiteLogo] = React.useState<string | null>(null)
  const [logoLoaded, setLogoLoaded] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  // Rolagem para seção ao vir de outra página (ex.: clicou em Contato)
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
      } finally {
        setLogoLoaded(true)
      }
    }
    load()
  }, [])

  const handleHashLink = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault()
    const sectionId = hash.replace('#', '')
    if (pathname !== '/') {
      sessionStorage.setItem('scrollToSection', sectionId)
      router.push('/')
      return
    }
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'w-full border-b shadow-sm',
        'bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg'
      )}
    >
      <nav className="mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 py-2 min-h-12 max-w-7xl">
        <Link
          href="/"
          className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 flex-shrink-0 min-w-0"
        >
          {!logoLoaded ? (
            <span className="size-6 sm:size-7 rounded bg-muted/40 flex-shrink-0 inline-block" aria-hidden />
          ) : siteLogo ? (
            <Image
              src={siteLogo}
              alt={siteName}
              width={28}
              height={28}
              className="size-6 sm:size-7 object-contain flex-shrink-0"
              unoptimized={siteLogo.startsWith('http')}
              priority
            />
          ) : (
            <span className="font-mono text-sm sm:text-base font-bold truncate">{siteName}</span>
          )}
        </Link>
        {/* Desktop: links com texto */}
        <div className="hidden lg:flex items-center gap-1">
          {linkConfig.map((link) => (
            <Link
              key={link.href}
              className={
                link.highlight
                  ? buttonVariants({ variant: 'default', size: 'sm' })
                  : buttonVariants({ variant: 'ghost', size: 'sm' })
              }
              href={link.href}
              onClick={link.isHash ? (e) => handleHashLink(e, link.href) : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {/* Mobile/tablet: itens centralizados na barra (ícone + texto abaixo), resto no menu hamburger */}
        <div className="flex lg:hidden items-center justify-center gap-0.5 sm:gap-1 flex-1 min-w-0">
          {linkConfig.filter((l) => l.showOnMobileBar).map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href === '/' && pathname === '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={link.isHash ? (e) => handleHashLink(e, link.href) : undefined}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg p-1.5 sm:p-2 min-w-[44px] min-h-[44px]',
                  link.highlight
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
                title={link.label}
              >
                <Icon className="size-5 sm:size-5" />
                <span className="text-[10px] sm:text-xs truncate w-full text-center">{link.label}</span>
              </Link>
            )
          })}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-center justify-center rounded-lg p-1.5 sm:p-2 min-w-[44px] min-h-[44px] hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Menu"
                aria-label="Abrir menu"
              >
                <Menu className="size-5 sm:size-5" />
                <span className="text-[10px] sm:text-xs">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-8">
              <nav className="flex flex-col gap-1">
                {linkConfig.filter((l) => !l.showOnMobileBar).map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        setMenuOpen(false)
                        if (link.isHash) {
                          e.preventDefault()
                          handleHashLink(e, link.href)
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        link.highlight
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'hover:bg-accent text-foreground'
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <Link
            href={isAuthenticated ? '/conta' : '/login'}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg p-1.5 sm:p-2 min-w-[44px] min-h-[44px]',
              pathname === '/conta' || pathname?.startsWith('/conta/')
                ? 'bg-accent text-accent-foreground'
                : isAuthenticated
                  ? 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            title={isAuthenticated ? 'Conta' : 'Entrar'}
          >
            <User className="size-5 sm:size-5" />
            <span className="text-[10px] sm:text-xs truncate w-full text-center">{isAuthenticated ? 'Conta' : 'Entrar'}</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
