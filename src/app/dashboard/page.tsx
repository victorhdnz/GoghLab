'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
  GitCompare,
  Layers,
  Eye,
  MousePointer,
  Palette,
  Package,
  LogOut,
  Lock,
  Plus,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalViews: number
  totalClicks: number
  totalServices: number
  totalComparisons: number
}

// Componente de Login
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Email ou senha incorretos')
          toast.error('Email ou senha incorretos')
        } else if (error.message.includes('fetch')) {
          setError('Erro de conexão. Verifique sua internet e tente novamente.')
          toast.error('Erro de conexão com o servidor')
        } else {
          setError(error.message)
          toast.error(error.message)
        }
        return
      }

      toast.success('Login realizado com sucesso!')
      // O useAuth vai detectar a mudança e atualizar o estado
    } catch (err: any) {
      const errorMessage = err?.message?.includes('fetch') 
        ? 'Erro de conexão. Verifique sua internet e tente novamente.'
        : 'Erro ao fazer login. Tente novamente.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

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
          <p className="text-gray-500 mt-2">Entre com suas credenciais</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// Componente de Acesso Negado
function AccessDenied() {
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logout realizado')
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
    totalViews: 0,
    totalClicks: 0,
    totalServices: 0,
    totalComparisons: 0,
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

      const [analyticsResult, servicesResult, comparisonsResult] = await Promise.all([
        supabase.from('portfolio_analytics').select('event_type').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('services').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('company_comparisons').select('id', { count: 'exact' }).eq('is_active', true),
      ])

      const views = analyticsResult.data?.filter(a => a.event_type === 'page_view').length || 0
      const clicks = analyticsResult.data?.filter(a => a.event_type === 'click').length || 0

      setStats({
        totalViews: views,
        totalClicks: clicks,
        totalServices: servicesResult.count || 0,
        totalComparisons: comparisonsResult.count || 0,
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logout realizado')
  }

  const statsCards = [
    {
      title: 'Serviços',
      value: stats.totalServices.toString(),
      icon: Package,
      color: 'bg-blue-500',
      description: 'Serviços ativos',
    },
    {
      title: 'Comparações',
      value: stats.totalComparisons.toString(),
      icon: GitCompare,
      color: 'bg-orange-500',
      description: 'Comparações ativas',
    },
    {
      title: 'Views (30d)',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'bg-teal-500',
      description: 'Visualizações',
    },
    {
      title: 'Cliques (30d)',
      value: stats.totalClicks.toLocaleString(),
      icon: MousePointer,
      color: 'bg-green-500',
      description: 'Interações',
    },
  ]

  const mainSections = [
    {
      title: 'Página Inicial',
      description: 'Edite o conteúdo da página inicial do site',
      icon: Layers,
      items: [
        {
          title: 'Editar Homepage',
          description: 'Personalize textos, imagens e seções da página inicial',
          href: '/dashboard/homepage',
          icon: Palette,
          color: 'bg-indigo-500',
        },
      ],
    },
    {
      title: 'Portfolio de Serviços',
      description: 'Gerencie os serviços digitais da MV Company',
      icon: Package,
      items: [
        {
          title: 'Gerenciar Serviços',
          description: 'Criar, editar e organizar serviços do portfolio',
          href: '/dashboard/portfolio',
          icon: Package,
          color: 'bg-blue-500',
        },
        {
          title: 'Layout de Página Detalhada',
          description: 'Edite o layout e template das páginas de detalhes dos serviços',
          href: '/dashboard/portfolio/layout',
          icon: Layers,
          color: 'bg-purple-500',
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
        {
          title: 'Ver Comparador',
          description: 'Abrir o comparador público',
          href: '/comparar',
          icon: Eye,
          color: 'bg-gray-500',
          external: true,
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
              Olá, <span className="font-medium">MV Company</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
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

// Componente Principal com Lógica de Autenticação
export default function DashboardPage() {
  const { isAuthenticated, isEditor, loading } = useAuth()

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  // Não autenticado - mostrar login
  if (!isAuthenticated) {
    return <LoginForm />
  }

  // Autenticado mas não é admin/editor - mostrar acesso negado
  if (!isEditor) {
    return <AccessDenied />
  }

  // Autenticado e autorizado - mostrar dashboard
  return <DashboardContent />
}
