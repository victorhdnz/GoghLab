'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, CreditCard, MessageCircle, Sparkles, Wrench, BookOpen, User } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { LucideIcon } from 'lucide-react'

interface NavLinkItem {
  label: string
  href: string
  icon: LucideIcon
  isHash?: boolean
  highlight?: boolean
}

const linkConfig: NavLinkItem[] = [
  { label: 'Início', href: '/', icon: Home },
  { label: 'Planos', href: '/precos', icon: CreditCard },
  { label: 'Contato', href: '/#contact-section', icon: MessageCircle, isHash: true },
  { label: 'Criar', href: '/criar', icon: Sparkles, highlight: true },
  { label: 'Ferramentas', href: '/ferramentas', icon: Wrench },
  { label: 'Cursos', href: '/cursos', icon: BookOpen },
]

export function FloatingHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [siteName, setSiteName] = React.useState('Gogh Lab')
  const [siteLogo, setSiteLogo] = React.useState<string | null>(null)
  const [logoLoaded, setLogoLoaded] = React.useState(false)

  // Rolagem para seção ao vir de outra página (ex.: clicou em Planos ou Contato)
  React.useEffect(() => {
    if (pathname !== '/') return
    const id = sessionStorage.getItem('scrollToSection')
    if (!id) return
    sessionStorage.removeItem('scrollToSection')
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 400)
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
    if (pathname !== '/') {
      sessionStorage.setItem('scrollToSection', hash.replace('#', ''))
      router.push('/')
    } else {
      const el = document.getElementById(hash.replace('#', ''))
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
        {/* Mobile/tablet: ícones para cada item (sem hamburger) */}
        <div className="flex lg:hidden items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none flex-1 justify-end min-w-0">
          {linkConfig.map((link) => {
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
        </div>
        <div className="flex items-center flex-shrink-0 pl-1">
          <Link href={isAuthenticated ? '/conta' : '/login'}>
            <Button size="sm" variant={isAuthenticated ? 'outline' : 'default'} className="gap-1.5">
              <User className="size-4 hidden xs:inline" />
              {isAuthenticated ? 'Conta' : 'Entrar'}
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  )
}
