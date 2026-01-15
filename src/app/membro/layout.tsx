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
  Menu,
  X,
  Crown,
  Sparkles,
  ChevronRight,
  Home,
  CreditCard,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MemberLayoutProps {
  children: ReactNode
}

const menuItems = [
  { 
    href: '/membro', 
    label: 'Dashboard', 
    icon: Home,
    description: 'Visão geral da sua conta'
  },
  { 
    href: '/membro/agentes', 
    label: 'Agentes de IA', 
    icon: MessageSquare,
    description: 'Converse com nossos agentes'
  },
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
    description: 'Acesso ao Canva e CapCut'
  },
  { 
    href: '/membro/perfil', 
    label: 'Meu Perfil', 
    icon: User,
    description: 'Configure seu perfil de nicho'
  },
]

export default function MemberLayout({ children }: MemberLayoutProps) {
  const { user, profile, subscription, loading, isAuthenticated, hasActiveSubscription, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)

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

  // Verificar autenticação e assinatura
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/membro')
      } else if (!hasActiveSubscription) {
        // Redirecionar para homepage onde tem os planos bonitos
        router.push('/#pricing')
      }
    }
  }, [loading, isAuthenticated, hasActiveSubscription, router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gogh-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gogh-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado ou sem assinatura - aguardar redirecionamento
  if (!isAuthenticated || !hasActiveSubscription) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
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
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gogh-yellow rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gogh-black" />
              </div>
              <div>
                <h1 className="font-bold text-gogh-black">Gogh Lab</h1>
                <p className="text-xs text-gogh-grayDark">Área de Membros</p>
              </div>
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
                  {profile?.full_name || profile?.email?.split('@')[0] || 'Usuário'}
                </p>
                <div className="flex items-center gap-1">
                  {subscription?.plan_id === 'gogh_pro' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  ) : subscription?.plan_id === 'gogh_essencial' ? (
                    <span className="text-xs text-gogh-grayDark">Essencial</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
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
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gogh-grayLight space-y-2">
            {/* Gerenciar Assinatura */}
            {hasActiveSubscription && (
              <button
                onClick={handleManageSubscription}
                disabled={openingPortal}
                className="w-full flex items-center gap-3 px-4 py-2 text-gogh-grayDark hover:text-gogh-black hover:bg-gogh-grayLight rounded-lg transition-colors disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                <span className="flex-1 text-left">Gerenciar Assinatura</span>
                {openingPortal ? (
                  <div className="w-4 h-4 border-2 border-gogh-grayDark border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
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
            >
              <Menu className="w-6 h-6 text-gogh-black" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gogh-yellow" />
              <span className="font-bold text-gogh-black">Gogh Lab</span>
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

