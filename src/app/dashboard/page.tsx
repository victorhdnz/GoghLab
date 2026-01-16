'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
  GitCompare,
  Layers,
  Palette,
  LogOut,
  Lock,
  ArrowRight,
  BarChart3,
  Sparkles,
  Link as LinkIcon,
  Users,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { isAdminEmail } from '@/lib/utils/admin'

interface DashboardStats {
  totalServices: number
}

// Componente de Login - Apenas Google
function LoginForm() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acesso Administrativo</h1>
          <p className="text-gray-500 mt-2">Entre com sua conta Google autorizada</p>
        </div>

        <GoogleLoginButton />
        
        <p className="text-xs text-gray-400 text-center mt-6">
          Apenas contas autorizadas podem acessar esta área.
        </p>
      </motion.div>
    </div>
  )
}

// Componente de Acesso Negado
function AccessDenied() {
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Forçar redirecionamento completo para limpar estado
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, redirecionar
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="text-red-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
        <p className="text-gray-500 mb-6">Você não tem permissão para acessar esta área.</p>
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Sair e tentar outra conta
        </button>
      </div>
    </div>
  )
}

// Dashboard Principal
function DashboardContent() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
  })
  const [loadingData, setLoadingData] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
    const dataInterval = setInterval(loadDashboardData, 60000)
    return () => clearInterval(dataInterval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoadingData(true)

      const { count } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('is_active', true)

      setStats({
        totalServices: count || 0,
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      // Forçar redirecionamento completo para limpar estado
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, redirecionar
      window.location.href = '/'
    }
  }

  const statsCards = [
    {
      title: 'Serviços',
      value: stats.totalServices.toString(),
      icon: Package,
      color: 'bg-blue-500',
      description: 'Serviços ativos',
    },
  ]

  const mainSections = [
    {
      title: 'Páginas',
      description: 'Edite a homepage e configure os planos',
      icon: Layers,
      items: [
        {
          title: 'Editar Homepage',
          description: 'Personalize textos, imagens e seções da página inicial',
          href: '/dashboard/homepage',
          icon: Palette,
          color: 'bg-indigo-500',
        },
        {
          title: 'Planos de Assinatura',
          description: 'Configure planos, preços e integração com Stripe',
          href: '/dashboard/pricing',
          icon: Sparkles,
          color: 'bg-yellow-500',
        },
      ],
    },
    {
      title: 'Membros',
      description: 'Gerencie usuários cadastrados e seus planos',
      icon: Users,
      items: [
        {
          title: 'Gerenciar Membros',
          description: 'Ver usuários, planos e alterar manualmente assinaturas',
          href: '/dashboard/membros',
          icon: Users,
          color: 'bg-emerald-500',
        },
      ],
    },
    {
      title: 'Comparador de Empresas',
      description: 'Configure empresas e tópicos para o comparador público',
      icon: GitCompare,
      items: [
        {
          title: 'Gerenciar Comparações',
          description: 'Adicionar, editar e organizar comparações de empresas',
          href: '/dashboard/comparador',
          icon: GitCompare,
          color: 'bg-orange-500',
        },
      ],
    },
    {
      title: 'Analytics',
      description: 'Acompanhe o desempenho das suas páginas',
      icon: BarChart3,
      items: [
        {
          title: 'Ver Analytics',
          description: 'Visualizações, cliques, scroll e métricas detalhadas',
          href: '/dashboard/analytics',
          icon: BarChart3,
          color: 'bg-green-500',
        },
      ],
    },
    {
      title: 'Agregadores de Links',
      description: 'Crie e gerencie agregadores de links (link-in-bio)',
      icon: LinkIcon,
      items: [
        {
          title: 'Gerenciar Agregadores',
          description: 'Criar e editar agregadores de links com efeitos 3D',
          href: '/dashboard/links',
          icon: LinkIcon,
          color: 'bg-pink-500',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-600">
              Olá, <span className="font-medium">Gogh Lab</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 max-w-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{loadingData ? '...' : stat.value}</p>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Sections */}
        <div className="space-y-8">
          {mainSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                  <section.icon size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.items.map((item) => (
                  <Link 
                    key={item.title} 
                    href={item.href}
                    target={(item as any).external ? '_blank' : undefined}
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group h-full">
                      <div className="flex items-start justify-between">
                        <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon size={24} />
                        </div>
                        <ArrowRight className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" size={20} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente Principal com Lógica de Autenticação Simplificada
export default function DashboardPage() {
  const { isAuthenticated, isEditor, loading, profile, user } = useAuth()
  
  // Verificar se o email do usuário está na lista de admins
  const userEmailIsAdmin = isAdminEmail(user?.email)
  
  // Verificar se tem acesso (por role ou por email)
  const hasAccess = isEditor || userEmailIsAdmin

  // Loading inicial - aguardar apenas o carregamento inicial
  // Não bloquear durante navegação
  if (loading && !isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  // Não autenticado - mostrar login
  // Confiar no middleware para proteger rotas, mas mostrar login se não autenticado
  if (!isAuthenticated && !user) {
    return <LoginForm />
  }

  // Autenticado mas não tem acesso - mostrar acesso negado
  // Só verificar se temos profile OU se o email é admin
  if (isAuthenticated && profile !== null && !hasAccess) {
    return <AccessDenied />
  }

  // Se está autenticado mas ainda não temos profile, verificar pelo email
  // Se o email é admin, permitir acesso mesmo sem profile
  if (isAuthenticated && profile === null) {
    if (userEmailIsAdmin) {
      return <DashboardContent />
    }
    // Se não é admin por email e não tem profile, aguardar um pouco
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  // Autenticado e autorizado (por role ou por email) - mostrar dashboard
  // Confiar no middleware para proteção, apenas verificar permissões para UI
  return <DashboardContent />
}
