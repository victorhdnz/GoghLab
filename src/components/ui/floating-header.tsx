'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { MenuIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export function FloatingHeader() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [siteName, setSiteName] = React.useState('Gogh Lab')
  const [siteLogo, setSiteLogo] = React.useState<string | null>(null)

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
      }
    }
    load()
  }, [])

  const handleHashLink = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault()
    setOpen(false)
    if (pathname !== '/') {
      sessionStorage.setItem('scrollToSection', hash.replace('#', ''))
      router.push('/')
    } else {
      const el = document.getElementById(hash.replace('#', ''))
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const links = [
    { label: 'Início', href: '/' },
    { label: 'Planos', href: '/precos' },
    { label: 'Contato', href: '/#contact-section', isHash: true },
    { label: 'Criar', href: '/criar', highlight: true },
    { label: 'Ferramentas', href: '/ferramentas' },
    { label: 'Cursos', href: '/cursos' },
  ]

  return (
    <header
      className={cn(
        'sticky top-5 z-50',
        'mx-auto w-full max-w-3xl rounded-lg border shadow',
        'bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg'
      )}
    >
      <nav className="mx-auto flex items-center justify-between p-1.5">
        <Link
          href="/"
          className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100"
        >
          {siteLogo ? (
            <Image
              src={siteLogo}
              alt={siteName}
              width={28}
              height={28}
              className="size-6 sm:size-7 object-contain flex-shrink-0"
              unoptimized={siteLogo.startsWith('http')}
            />
          ) : (
            <span className="font-mono text-base font-bold">{siteName}</span>
          )}
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              className={
                link.highlight
                  ? buttonVariants({ variant: 'default', size: 'sm' })
                  : buttonVariants({ variant: 'ghost', size: 'sm' })
              }
              href={link.href}
              onClick={link.isHash ? (e) => handleHashLink(e, link.href) : () => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href={isAuthenticated ? '/conta' : '/login'}>
            <Button size="sm">{isAuthenticated ? 'Minha conta' : 'Entrar'}</Button>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setOpen(!open)}
              className="lg:hidden"
              aria-label="Abrir menu"
            >
              <MenuIcon className="size-4" />
            </Button>
            <SheetContent
              className="bg-background/95 supports-[backdrop-filter]:bg-background/80 gap-0 backdrop-blur-lg"
              showClose={false}
              side="left"
            >
              <div className="grid gap-y-2 overflow-y-auto px-4 pt-12 pb-5">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    className={buttonVariants({
                      variant: link.highlight ? 'default' : 'ghost',
                      className: 'justify-start',
                    })}
                    href={link.href}
                    onClick={
                      link.isHash
                        ? (e) => handleHashLink(e, link.href)
                        : () => setOpen(false)
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <SheetFooter>
                <Link href={isAuthenticated ? '/conta' : '/login'} onClick={() => setOpen(false)}>
                  <Button variant="outline">
                    {isAuthenticated ? 'Minha conta' : 'Entrar'}
                  </Button>
                </Link>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
