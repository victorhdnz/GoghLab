'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MessageSquare, 
  BookOpen, 
  Wrench, 
  User, 
  Settings, 
  LogOut,
  PanelLeft,
  X,
  Crown,
  Sparkles,
  ChevronRight,
  Home,
  ExternalLink
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface MemberLayoutProps {
  children: ReactNode
}

// Itens do menu que requerem assinatura
const subscriberMenuItems = [
  { 
    href: '/membro/cursos', 
    label: 'Cursos', 
    icon: BookOpen,
    description: 'Aprenda novas habilidades'
  },
  { 
    href: '/membro/ferramentas', 
    label: 'Ferramentas', 
    icon: Wrench,
    description: 'Solicite acesso às ferramentas do seu plano'
  },
]

// Item de conta (sempre visível) — URL canônica é /conta
const accountMenuItem = {
  href: '/conta',
  label: 'Minha Conta',
  icon: Settings,
  description: 'Plano e informações pessoais'
}

export default function MemberLayout({ children }: MemberLayoutProps) {
  const { user, profile, subscription, loading, isAuthenticated, hasActiveSubscription } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [siteLogo, setSiteLogo] = useState<string | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState<string>('5534999999999')
  const [signingOut, setSigningOut] = useState(false)
  const supabase = createClient()

  // Carregar logo e WhatsApp do site
  useEffect(() => {
    const loadSiteData = async () => {
      try {
        const { data: logoData } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', 'hero_logo')
          .single()
        
        if (logoData?.value) {
          setSiteLogo(logoData.value)
        }

        const { data: whatsappData } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', 'contact_whatsapp')
          .single()
        
        if (whatsappData?.value) {
          // Remover caracteres não numéricos e garantir formato internacional
          const number = whatsappData.value.replace(/\D/g, '')
          setWhatsappNumber(number || '5534999999999')
        }
      } catch (error) {
        console.error('Erro ao carregar dados do site:', error)
      }
    }
    loadSiteData()
  }, [supabase])

  // Abrir portal de gerenciamento do Stripe
  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true)
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Erro ao abrir portal:', data.error)
      }
    } catch (error) {
      console.error('Erro ao abrir portal:', error)
    } finally {
      setOpeningPortal(false)
    }
  }

  // Páginas que podem ser acessadas sem assinatura ativa
  const publicMemberPages = ['/membro/conta']
  const isPublicPage = publicMemberPages.some(page => pathname === page || pathname.startsWith(page + '/'))
  
  // Verificar se pode acessar a página atual
  const canAccessPage = hasActiveSubscription || isPublicPage

  // Verificar autenticação e assinatura
  useEffect(() => {
    // Aguardar um pouco para garantir que a sessão foi carregada
    if (!loading) {
      // Pequeno delay para garantir que cookies foram atualizados
      const checkAuth = setTimeout(async () => {
        if (!isAuthenticated) {
          router.push('/login?redirect=' + encodeURIComponent(pathname))
          return
        }
        
        // Para outras páginas, verificar se tem assinatura ou está em página pública
        if (!hasActiveSubscription && !isPublicPage) {
          router.push('/precos')
        }
      }, 300) // Pequeno delay para garantir sincronização
      
      return () => clearTimeout(checkAuth)
    }
  }, [loading, isAuthenticated, hasActiveSubscription, router, pathname, isPublicPage])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gogh-beige flex items-center justify-center">
        <div className="text-center">
          <LumaSpin size="lg" className="mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado - aguardar redirecionamento
  if (!isAuthenticated) {
    return null
  }

  // Sem assinatura em página que requer assinatura - aguardar redirecionamento
  if (!canAccessPage) {
    return null
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      // Limpar senha do dashboard ao fazer logout
      localStorage.removeItem('dashboard_password_verified')
      
      // Timeout de segurança
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      const signOutPromise = supabase.auth.signOut()
      await Promise.race([signOutPromise, timeoutPromise])
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error)
      // Continuar mesmo com erro
    } finally {
      // Sempre redirecionar, mesmo se der erro ou timeout
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white border-r border-gogh-grayLight z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="p-6 border-b border-gogh-grayLight">
            <Link href="/" className="flex items-center justify-center">
              {siteLogo ? (
                <Image
                  src={siteLogo}
                  alt="Logo"
                  width={48}
                  height={48}
                  className="rounded-xl"
                />
              ) : (
                <div className="w-12 h-12 bg-gogh-yellow rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-gogh-black" />
                </div>
              )}
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 mx-4 mt-4 bg-gradient-to-r from-gogh-yellow/20 to-gogh-yellow/5 rounded-xl">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Avatar'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gogh-yellow rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gogh-black" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gogh-black truncate">
                  {profile?.full_name || profile?.email?.split('@')[0] || 'Membro'}
                </p>
                <div className="flex items-center gap-1">
                  {subscription?.plan_id === 'gogh_pro' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  ) : subscription?.plan_id === 'gogh_essencial' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-900/80 bg-gogh-yellow/40 px-2 py-0.5 rounded-full border border-amber-200/60">
                      <Sparkles className="w-3 h-3" />
                      Essencial
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Botão para voltar à HomePage */}
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gogh-grayDark hover:bg-gogh-grayLight hover:text-gogh-black mb-2"
            >
              <Home className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-medium">Voltar à HomePage</p>
                <p className="text-xs text-gogh-grayDark">Retornar ao site principal</p>
              </div>
            </Link>

            {/* Itens que requerem assinatura */}
            {hasActiveSubscription && subscriberMenuItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/membro' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gogh-yellow text-gogh-black shadow-sm' 
                      : 'text-gogh-grayDark hover:bg-gogh-grayLight hover:text-gogh-black'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-gogh-black' : ''}`} />
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className={`text-xs ${isActive ? 'text-gogh-black/70' : 'text-gogh-grayDark'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              )
            }            )}

            {/* Item de conta (sempre visível) */}
            {(() => {
              const isActive = pathname === accountMenuItem.href || pathname.startsWith(accountMenuItem.href + '/')
              return (
                <Link
                  href={accountMenuItem.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gogh-yellow text-gogh-black shadow-sm' 
                      : 'text-gogh-grayDark hover:bg-gogh-grayLight hover:text-gogh-black'
                    }
                  `}
                >
                  <accountMenuItem.icon className={`w-5 h-5 ${isActive ? 'text-gogh-black' : ''}`} />
                  <div className="flex-1">
                    <p className="font-medium">{accountMenuItem.label}</p>
                    <p className={`text-xs ${isActive ? 'text-gogh-black/70' : 'text-gogh-grayDark'}`}>
                      {accountMenuItem.description}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              )
            })()}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gogh-grayLight space-y-2">
            {/* Suporte WhatsApp */}
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-2 text-gogh-grayDark hover:text-gogh-black hover:bg-gogh-grayLight rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="flex-1 text-left">Suporte</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {signingOut ? (
                <LumaSpin size="sm" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              <span>{signingOut ? 'Saindo...' : 'Sair'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gogh-grayLight">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gogh-grayLight rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              <PanelLeft className="w-6 h-6 text-gogh-black" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              {siteLogo ? (
                <Image
                  src={siteLogo}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-8 h-8 bg-gogh-yellow rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gogh-black" />
                </div>
              )}
            </Link>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Close Button when Sidebar Open */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg lg:hidden"
          >
            <X className="w-6 h-6 text-gogh-black" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

