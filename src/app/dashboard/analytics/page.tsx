'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart3, Clock, Eye, Users, MousePointer, 
  RefreshCw, ChevronDown, ChevronUp, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface AnalyticsSummary {
  totalViews: number
  totalClicks: number
  uniqueVisitors: number
  averageTimeOnPage: number
  averageScrollDepth: number
  bounceRate: number
  clickRate: number
}

interface DailyStats {
  date: string
  views: number
  clicks: number
  visitors: number
  avgTime: number
  avgScroll: number
}

interface PagePerformance {
  pageId: string | null
  pageSlug: string | null
  pageName: string
  pageType: string
  views: number
  clicks: number
  visitors: number
  avgTime: number
  avgScroll: number
  bounceRate: number
}

interface SessionData {
  sessionId: string
  pageName: string
  startTime: string
  duration: number
  scrollDepth: number
  clicks: number
  pageViews: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Estados
  const [pageType, setPageType] = useState<'all' | 'homepage' | 'service' | 'product'>('all')
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [pages, setPages] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [pagePerformance, setPagePerformance] = useState<PagePerformance[]>([])
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showSessions, setShowSessions] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }
    loadPages()
  }, [isAuthenticated, isEditor, authLoading, router])

  useEffect(() => {
    if (pages.length > 0 || pageType === 'homepage' || pageType === 'all') {
      loadAnalytics()
    }
  }, [pageType, selectedPageId, dateRange, customStartDate, customEndDate, pages.length])

  // Carregar páginas (serviços)
  const loadPages = async () => {
    try {
      const { data: services } = await supabase
        .from('services')
        .select('id, slug, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const allPages = (services || []).map(s => ({ 
        ...s, 
        type: 'service',
        title: s.name 
      }))
      
      setPages(allPages)
    } catch (error) {
      console.error('Erro ao carregar páginas:', error)
    }
  }

  // Função para obter filtro de data
  const getDateFilter = (range: string) => {
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(0)
        break
      default:
        startDate = new Date(0)
    }
    
    const endDate = range === 'custom' && customEndDate 
      ? new Date(customEndDate) 
      : now

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  // Carregar analytics
  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateFilter(dateRange)
      
      let query = supabase
        .from('page_analytics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Filtrar por tipo de página
      if (pageType !== 'all') {
        query = query.eq('page_type', pageType)
      }

      // Filtrar por página específica
      if (selectedPageId) {
        query = query.eq('page_id', selectedPageId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      setAnalytics(data || [])
      calculateSummary(data || [])
      calculateDailyStats(data || [])
      calculatePagePerformance(data || [])
      calculateSessions(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar analytics:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Calcular resumo
  const calculateSummary = (data: any[]) => {
    const views = data.filter(a => a.event_type === 'page_view')
    const clicks = data.filter(a => a.event_type === 'click')
    const scrolls = data.filter(a => a.event_type === 'scroll')
    const timeOnPage = data.filter(a => a.event_type === 'time_on_page')

    const totalViews = views.length
    const totalClicks = clicks.length
    
    // Visitantes únicos baseado em session_id
    const uniqueSessions = new Set(views.map(v => v.session_id))
    const uniqueVisitors = uniqueSessions.size

    const avgScrollDepth = scrolls.length > 0
      ? scrolls.reduce((sum, s) => sum + ((s.event_data?.scroll_depth || 0)), 0) / scrolls.length
      : 0

    const avgTimeOnPage = timeOnPage.length > 0
      ? timeOnPage.reduce((sum, t) => sum + ((t.event_data?.time_seconds || 0)), 0) / timeOnPage.length
      : 0

    // Calcular bounce rate
    const sessions = new Set(data.map(a => a.session_id))
    const bouncedSessions = Array.from(sessions).filter(sessionId => {
      const sessionEvents = data.filter(a => a.session_id === sessionId)
      const hasScroll = sessionEvents.some(e => {
        if (e.event_type === 'scroll') {
          const depth = e.event_data?.scroll_depth || 0
          return depth > 25
        }
        return false
      })
      return !hasScroll
    }).length
    const bounceRate = sessions.size > 0 ? (bouncedSessions / sessions.size) * 100 : 0

    // Taxa de cliques
    const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

    setSummary({
      totalViews,
      totalClicks,
      uniqueVisitors,
      averageTimeOnPage: Math.round(avgTimeOnPage),
      averageScrollDepth: Math.round(avgScrollDepth),
      bounceRate: Math.round(bounceRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
    })
  }

  // Calcular estatísticas diárias
  const calculateDailyStats = (data: any[]) => {
    const dailyMap = new Map<string, {
      views: number
      clicks: number
      visitors: Set<string>
      scrolls: number[]
      times: number[]
    }>()

    data.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0]
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          views: 0,
          clicks: 0,
          visitors: new Set(),
          scrolls: [],
          times: []
        })
      }

      const day = dailyMap.get(date)!
      
      if (event.event_type === 'page_view') {
        day.views++
        day.visitors.add(event.session_id)
      } else if (event.event_type === 'click') {
        day.clicks++
      } else if (event.event_type === 'scroll') {
        day.scrolls.push(event.event_data?.scroll_depth || 0)
      } else if (event.event_type === 'time_on_page') {
        day.times.push(event.event_data?.time_seconds || 0)
      }
    })

    const stats: DailyStats[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        clicks: data.clicks,
        visitors: data.visitors.size,
        avgTime: data.times.length > 0 
          ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
          : 0,
        avgScroll: data.scrolls.length > 0
          ? Math.round(data.scrolls.reduce((a, b) => a + b, 0) / data.scrolls.length)
          : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setDailyStats(stats)
  }

  // Calcular performance por página
  const calculatePagePerformance = (data: any[]) => {
    const pageMap = new Map<string, {
      pageId: string | null
      pageSlug: string | null
      pageName: string
      pageType: string
      views: number
      clicks: number
      visitors: Set<string>
      scrolls: number[]
      times: number[]
    }>()

    data.forEach(event => {
      const key = event.page_id || event.page_slug || 'homepage'
      
      if (!pageMap.has(key)) {
        pageMap.set(key, {
          pageId: event.page_id,
          pageSlug: event.page_slug,
          pageName: event.page_slug || 'Homepage',
          pageType: event.page_type,
          views: 0,
          clicks: 0,
          visitors: new Set(),
          scrolls: [],
          times: []
        })
      }

      const page = pageMap.get(key)!
      
      if (event.event_type === 'page_view') {
        page.views++
        page.visitors.add(event.session_id)
      } else if (event.event_type === 'click') {
        page.clicks++
      } else if (event.event_type === 'scroll') {
        page.scrolls.push(event.event_data?.scroll_depth || 0)
      } else if (event.event_type === 'time_on_page') {
        page.times.push(event.event_data?.time_seconds || 0)
      }
    })

    // Buscar nomes dos serviços
    const performance: PagePerformance[] = Array.from(pageMap.entries())
      .map(([key, data]) => {
        const service = pages.find(p => p.id === data.pageId || p.slug === data.pageSlug)
        const pageName = service ? service.name : (data.pageSlug || 'Homepage')

        const sessions = new Set(
          data.views > 0 
            ? Array.from(data.visitors).map(v => v)
            : []
        )
        
        const bouncedSessions = Array.from(sessions).filter(sessionId => {
          const sessionEvents = data.scrolls.filter((_, i) => {
            // Verificar se a sessão teve scroll > 25%
            return data.scrolls[i] > 25
          })
          return sessionEvents.length === 0
        }).length

        return {
          pageId: data.pageId,
          pageSlug: data.pageSlug,
          pageName,
          pageType: data.pageType,
          views: data.views,
          clicks: data.clicks,
          visitors: data.visitors.size,
          avgTime: data.times.length > 0
            ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
            : 0,
          avgScroll: data.scrolls.length > 0
            ? Math.round(data.scrolls.reduce((a, b) => a + b, 0) / data.scrolls.length)
            : 0,
          bounceRate: sessions.size > 0
            ? Math.round((bouncedSessions / sessions.size) * 100 * 10) / 10
            : 0,
        }
      })
      .sort((a, b) => b.views - a.views)

    setPagePerformance(performance)
  }

  // Apagar dados de analytics
  const handleDeleteData = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os dados de analytics? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(true)
      
      // Se há filtros aplicados, apagar apenas os dados filtrados
      const { startDate, endDate } = getDateFilter(dateRange)
      
      let query = supabase
        .from('page_analytics')
        .delete()
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Filtrar por tipo de página
      if (pageType !== 'all') {
        query = query.eq('page_type', pageType)
      }

      // Filtrar por página específica
      if (selectedPageId) {
        query = query.eq('page_id', selectedPageId)
      }

      const { error } = await query

      if (error) throw error

      toast.success('Dados apagados com sucesso!')
      loadAnalytics()
    } catch (error: any) {
      console.error('Erro ao apagar dados:', error)
      toast.error('Erro ao apagar dados')
    } finally {
      setDeleting(false)
    }
  }

  // Calcular sessões
  const calculateSessions = (data: any[]) => {
    const sessionMap = new Map<string, {
      pageName: string
      startTime: string
      events: any[]
    }>()

    data.forEach(event => {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, {
          pageName: event.page_slug || 'Homepage',
          startTime: event.created_at,
          events: []
        })
      }
      sessionMap.get(event.session_id)!.events.push(event)
    })

    const sessionsData: SessionData[] = Array.from(sessionMap.entries())
      .map(([sessionId, data]) => {
        const views = data.events.filter(e => e.event_type === 'page_view')
        const clicks = data.events.filter(e => e.event_type === 'click')
        const scrolls = data.events.filter(e => e.event_type === 'scroll')
        const times = data.events.filter(e => e.event_type === 'time_on_page')

        const maxScroll = scrolls.length > 0
          ? Math.max(...scrolls.map(s => s.event_data?.scroll_depth || 0))
          : 0

        const totalTime = times.length > 0
          ? Math.max(...times.map(t => t.event_data?.time_seconds || 0))
          : 0

        const service = pages.find(p => p.slug === data.pageName)
        const pageName = service ? service.name : (data.pageName || 'Homepage')

        return {
          sessionId,
          pageName,
          startTime: data.startTime,
          duration: totalTime,
          scrollDepth: maxScroll,
          clicks: clicks.length,
          pageViews: views.length,
        }
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 100) // Limitar a 100 sessões mais recentes

    setSessions(sessionsData)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardNavigation
          title="Analytics"
          subtitle="Acompanhe o desempenho das suas páginas"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
          actions={
            <div className="flex gap-3">
              <button
                onClick={handleDeleteData}
                disabled={deleting || loading}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={18} className={deleting ? 'animate-spin' : ''} />
                Apagar Dados
              </button>
              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>
          }
        />

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Tipo de Página */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Tipo de Página</label>
              <select
                value={pageType}
                onChange={(e) => {
                  setPageType(e.target.value as any)
                  setSelectedPageId(null)
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Todas as páginas</option>
                <option value="homepage">Homepage</option>
                <option value="service">Serviços</option>
              </select>
            </div>

            {/* Página Específica */}
            {(pageType === 'service') && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">Página Específica</label>
                <select
                  value={selectedPageId || ''}
                  onChange={(e) => setSelectedPageId(e.target.value || null)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Todas</option>
                  {pages
                    .filter(p => p.type === 'service')
                    .map(page => (
                      <option key={page.id} value={page.id}>
                        {page.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Período */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium mb-2">Período</label>
              <select
                value={dateRange}
                onChange={(e) => {
                  const value = e.target.value as any
                  setDateRange(value)
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="all">Todo o período</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Datas personalizadas */}
            {dateRange === 'custom' && (
              <>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium mb-2">Data Inicial</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium mb-2">Data Final</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resumo Principal - Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <Eye className="w-7 h-7 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalViews.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Visualizações</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <MousePointer className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalClicks.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Cliques</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-7 h-7 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.uniqueVisitors.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Visitantes</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-7 h-7 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.averageTimeOnPage}s</p>
              <p className="text-sm text-gray-500">Tempo médio</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="w-7 h-7 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.averageScrollDepth}%</p>
              <p className="text-sm text-gray-500">Scroll médio</p>
            </div>

          </div>
        )}

        {/* Sessões Individuais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">👥 Acessos Individuais</h2>
            <p className="text-sm text-gray-500">{sessions.length} sessões</p>
          </div>
          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>Nenhuma sessão encontrada no período selecionado.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Página</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scroll</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliques</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visualizações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.pageName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.startTime).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.duration}s</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.scrollDepth}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.clicks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.pageViews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
