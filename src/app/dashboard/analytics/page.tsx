'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { LandingLayout, LandingVersion, LandingAnalytics } from '@/types'
import { BarChart3, Clock, Eye, X, ArrowLeft, RefreshCw, Users, Activity, ChevronDown, ChevronUp, MousePointer, Trash2, AlertTriangle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

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

interface LayoutPerformance {
  layoutId: string
  layoutName: string
  versionId?: string
  versionName?: string
  views: number
  clicks: number
  visitors: number
  avgTime: number
  avgScroll: number
  bounceRate: number
  insights: string[]
}

interface SessionData {
  sessionId: string
  layoutName: string
  startTime: string
  duration: number
  scrollDepth: number
  clicks: number
  pageViews: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [layouts, setLayouts] = useState<LandingLayout[]>([])
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [versions, setVersions] = useState<LandingVersion[]>([])
  const [analytics, setAnalytics] = useState<LandingAnalytics[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [layoutPerformance, setLayoutPerformance] = useState<LayoutPerformance[]>([])
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    loadLayouts()
  }, [isAuthenticated, isEditor, authLoading, router])

  // Carregar analytics quando layouts estiverem carregados
  useEffect(() => {
    if (layouts.length === 0 && loading) return // Aguardar layouts carregarem
    
    if (selectedLayout) {
      loadVersions(selectedLayout)
    }
    loadAnalytics()
  }, [selectedLayout, selectedVersion, dateRange, customStartDate, customEndDate, layouts.length])

  const loadLayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_layouts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLayouts(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar layouts:', error)
      toast.error('Erro ao carregar layouts')
    } finally {
      setLoading(false)
    }
  }

  const loadVersions = async (layoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('landing_versions')
        .select('*')
        .eq('layout_id', layoutId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVersions(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar versões:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      setRefreshing(true)
      const { startDate, endDate } = getDateFilter(dateRange)
      
      let query = supabase
        .from('landing_analytics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (selectedLayout) {
        query = query.eq('layout_id', selectedLayout)
      }

      if (selectedVersion) {
        query = query.eq('version_id', selectedVersion)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(2000)

      if (error) throw error

      setAnalytics(data || [])
      calculateSummary(data || [])
      calculateDailyStats(data || [])
      calculateLayoutPerformance(data || [])
      calculateSessions(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar analytics:', error)
      toast.error('Erro ao carregar analytics')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteAllData = async () => {
    try {
      setDeleting(true)
      
      // Primeiro, buscar todos os IDs que serão deletados
      let selectQuery = supabase.from('landing_analytics').select('id')
      
      if (selectedLayout) {
        selectQuery = selectQuery.eq('layout_id', selectedLayout)
      }
      
      const { data: idsToDelete, error: selectError } = await selectQuery
      
      if (selectError) {
        console.error('Erro ao buscar IDs:', selectError)
        throw selectError
      }
      
      if (!idsToDelete || idsToDelete.length === 0) {
        toast.success('Não há dados para apagar!')
        setShowDeleteModal(false)
        setDeleting(false)
        return
      }
      
      console.log(`Deletando ${idsToDelete.length} registros...`)
      
      // Deletar em batches de 100 para evitar timeout
      const batchSize = 100
      const ids = idsToDelete.map(item => item.id)
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)
        const { error: deleteError } = await supabase
          .from('landing_analytics')
          .delete()
          .in('id', batch)
        
        if (deleteError) {
          console.error('Erro ao deletar batch:', deleteError)
          throw deleteError
        }
      }

      toast.success(`${idsToDelete.length} registros apagados com sucesso!`)
      setShowDeleteModal(false)
      
      // Limpar estados locais imediatamente
      setAnalytics([])
      setSummary(null)
      setDailyStats([])
      setLayoutPerformance([])
      setSessions([])
      
      // Recarregar analytics após um pequeno delay
      setTimeout(() => loadAnalytics(), 300)
    } catch (error: any) {
      console.error('Erro ao apagar dados:', error)
      toast.error(`Erro ao apagar dados: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setDeleting(false)
    }
  }

  const getDateFilter = (range: string): { startDate: string; endDate: string } => {
    const now = new Date()
    const endDate = now.toISOString()
    
    switch (range) {
      case '7d':
        return {
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate
        }
      case '30d':
        return {
          startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate
        }
      case '90d':
        return {
          startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate
        }
      case 'custom':
        // Usar datas personalizadas
        const customStart = customStartDate 
          ? new Date(customStartDate + 'T00:00:00').toISOString() 
          : '1970-01-01T00:00:00Z'
        const customEnd = customEndDate 
          ? new Date(customEndDate + 'T23:59:59').toISOString() 
          : now.toISOString()
        return { startDate: customStart, endDate: customEnd }
      default:
        return { startDate: '1970-01-01T00:00:00Z', endDate }
    }
  }

  const calculateSummary = (data: LandingAnalytics[]) => {
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
      ? scrolls.reduce((sum, s) => sum + ((s.event_data as any)?.scroll_depth || 0), 0) / scrolls.length
      : 0

    const avgTimeOnPage = timeOnPage.length > 0
      ? timeOnPage.reduce((sum, t) => sum + ((t.event_data as any)?.time_seconds || 0), 0) / timeOnPage.length
      : 0

    // Calcular bounce rate (sessões com apenas page_view, sem scroll significativo)
    const sessions = new Set(data.map(a => a.session_id))
    const bouncedSessions = Array.from(sessions).filter(sessionId => {
      const sessionEvents = data.filter(a => a.session_id === sessionId)
      const hasScroll = sessionEvents.some(e => {
        if (e.event_type === 'scroll') {
          const depth = (e.event_data as any)?.scroll_depth || 0
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
      bounceRate: Math.round(bounceRate),
      clickRate: Math.round(clickRate * 10) / 10,
    })
  }

  const calculateDailyStats = (data: LandingAnalytics[]) => {
    const dailyMap = new Map<string, { views: number; clicks: number; sessions: Set<string>; times: number[]; scrolls: number[] }>()

    data.forEach(event => {
      const date = new Date(event.created_at).toLocaleDateString('pt-BR')
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { views: 0, clicks: 0, sessions: new Set(), times: [], scrolls: [] })
      }
      
      const dayStats = dailyMap.get(date)!
      
      if (event.event_type === 'page_view') {
        dayStats.views++
        dayStats.sessions.add(event.session_id)
      } else if (event.event_type === 'click') {
        dayStats.clicks++
      } else if (event.event_type === 'time_on_page') {
        dayStats.times.push((event.event_data as any)?.time_seconds || 0)
      } else if (event.event_type === 'scroll') {
        dayStats.scrolls.push((event.event_data as any)?.scroll_depth || 0)
      }
    })

    const stats: DailyStats[] = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        views: stats.views,
        clicks: stats.clicks,
        visitors: stats.sessions.size,
        avgTime: stats.times.length > 0 ? Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length) : 0,
        avgScroll: stats.scrolls.length > 0 ? Math.round(stats.scrolls.reduce((a, b) => a + b, 0) / stats.scrolls.length) : 0,
      }))
      .slice(0, 7)

    setDailyStats(stats)
  }

  const calculateLayoutPerformance = (data: LandingAnalytics[]) => {
    // Agrupar por layout + versão para ter dados mais granulares
    const performanceMap = new Map<string, { 
      layoutId: string
      versionId: string | null
      views: number
      clicks: number
      sessions: Set<string>
      times: number[]
      scrolls: number[]
      allEvents: LandingAnalytics[] 
    }>()

    data.forEach(event => {
      const layoutId = event.layout_id
      if (!layoutId) return
      
      // Chave única: layout + versão (ou só layout se não tiver versão)
      const key = event.version_id ? `${layoutId}-${event.version_id}` : layoutId
      
      if (!performanceMap.has(key)) {
        performanceMap.set(key, { 
          layoutId, 
          versionId: event.version_id || null,
          views: 0, 
          clicks: 0, 
          sessions: new Set(), 
          times: [], 
          scrolls: [], 
          allEvents: [] 
        })
      }
      
      const stats = performanceMap.get(key)!
      stats.allEvents.push(event)
      
      if (event.event_type === 'page_view') {
        stats.views++
        stats.sessions.add(event.session_id)
      } else if (event.event_type === 'click') {
        stats.clicks++
      } else if (event.event_type === 'time_on_page') {
        stats.times.push((event.event_data as any)?.time_seconds || 0)
      } else if (event.event_type === 'scroll') {
        stats.scrolls.push((event.event_data as any)?.scroll_depth || 0)
      }
    })

    const performance: LayoutPerformance[] = Array.from(performanceMap.entries())
      .map(([key, stats]) => {
        const layout = layouts.find(l => l.id === stats.layoutId)
        const version = versions.find(v => v.id === stats.versionId)
        const avgTime = stats.times.length > 0 ? Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length) : 0
        const avgScroll = stats.scrolls.length > 0 ? Math.round(stats.scrolls.reduce((a, b) => a + b, 0) / stats.scrolls.length) : 0
        
        // Calcular bounce rate do layout
        const sessions = new Set(stats.allEvents.map(e => e.session_id))
        const bouncedSessions = Array.from(sessions).filter(sessionId => {
          const sessionEvents = stats.allEvents.filter(a => a.session_id === sessionId)
          const hasScroll = sessionEvents.some(e => {
            if (e.event_type === 'scroll') {
              const depth = (e.event_data as any)?.scroll_depth || 0
              return depth > 25
            }
            return false
          })
          return !hasScroll
        }).length
        const bounceRate = sessions.size > 0 ? Math.round((bouncedSessions / sessions.size) * 100) : 0

        // Gerar insights específicos para o layout
        const insights: string[] = []
        
        if (bounceRate > 70) {
          insights.push('⚠️ Taxa de rejeição alta. Revise o conteúdo inicial.')
        }
        if (avgScroll < 40) {
          insights.push('📜 Scroll baixo. Considere reorganizar o conteúdo.')
        }
        if (avgTime < 10) {
          insights.push('⏱️ Tempo baixo. O conteúdo pode não estar engajando.')
        }
        if (stats.clicks === 0 && stats.views > 5) {
          insights.push('👆 Nenhum clique registrado. Verifique os CTAs.')
        }
        if (stats.clicks > 0 && stats.views > 0) {
          const clickRate = (stats.clicks / stats.views) * 100
          if (clickRate > 10) {
            insights.push('✅ Boa taxa de cliques!')
          }
        }
        if (bounceRate <= 50 && avgScroll >= 50 && avgTime >= 15) {
          insights.push('🎯 Ótima performance geral!')
        }
        if (insights.length === 0) {
          insights.push('📊 Performance moderada. Continue monitorando.')
        }

        return {
          layoutId: stats.layoutId,
          layoutName: layout?.name || 'Layout desconhecido',
          versionId: stats.versionId || undefined,
          versionName: version?.name,
          views: stats.views,
          clicks: stats.clicks,
          visitors: stats.sessions.size,
          avgTime,
          avgScroll,
          bounceRate,
          insights,
        }
      })
      .sort((a, b) => b.views - a.views)

    setLayoutPerformance(performance)
  }

  const calculateSessions = (data: LandingAnalytics[]) => {
    const sessionMap = new Map<string, { events: LandingAnalytics[]; layoutId: string | null }>()

    data.forEach(event => {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, { events: [], layoutId: event.layout_id })
      }
      sessionMap.get(event.session_id)!.events.push(event)
    })

    const sessionData: SessionData[] = Array.from(sessionMap.entries())
      .map(([sessionId, { events, layoutId }]) => {
        const layout = layouts.find(l => l.id === layoutId)
        const pageViews = events.filter(e => e.event_type === 'page_view').length
        const clicks = events.filter(e => e.event_type === 'click').length
        
        const scrollEvents = events.filter(e => e.event_type === 'scroll')
        const maxScroll = scrollEvents.length > 0
          ? Math.max(...scrollEvents.map(e => (e.event_data as any)?.scroll_depth || 0))
          : 0
        
        const timeEvent = events.find(e => e.event_type === 'time_on_page')
        const duration = timeEvent ? (timeEvent.event_data as any)?.time_seconds || 0 : 0
        
        const startTime = events.length > 0 
          ? new Date(Math.min(...events.map(e => new Date(e.created_at).getTime()))).toISOString()
          : ''

        return {
          sessionId,
          layoutName: layout?.name || 'Desconhecido',
          startTime,
          duration,
          scrollDepth: maxScroll,
          clicks,
          pageViews,
        }
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 50)

    setSessions(sessionData)
  }

  const getEngagementLevel = (scrollDepth: number, timeOnPage: number): { label: string; color: string } => {
    const score = (scrollDepth / 100) * 0.5 + Math.min(timeOnPage / 60, 1) * 0.5
    
    if (score >= 0.7) return { label: 'Excelente', color: 'text-green-600 bg-green-50' }
    if (score >= 0.5) return { label: 'Bom', color: 'text-blue-600 bg-blue-50' }
    if (score >= 0.3) return { label: 'Moderado', color: 'text-yellow-600 bg-yellow-50' }
    return { label: 'Baixo', color: 'text-red-600 bg-red-50' }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600">Acompanhe o desempenho das suas landing pages</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} />
              Limpar Dados
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Layout</label>
              <select
                value={selectedLayout || ''}
                onChange={(e) => {
                  setSelectedLayout(e.target.value || null)
                  setSelectedVersion(null)
                }}
                className="w-full border rounded-lg px-4 py-2.5"
              >
                <option value="">Todos os layouts</option>
                {layouts.map(layout => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLayout && versions.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">Versão</label>
                <select
                  value={selectedVersion || ''}
                  onChange={(e) => setSelectedVersion(e.target.value || null)}
                  className="w-full border rounded-lg px-4 py-2.5"
                >
                  <option value="">Todas as versões</option>
                  {versions.map(version => (
                    <option key={version.id} value={version.id}>
                      {version.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium mb-2">Período</label>
              <select
                value={dateRange}
                onChange={(e) => {
                  const value = e.target.value as any
                  setDateRange(value)
                  if (value === 'custom') {
                    setShowDatePicker(true)
                  }
                }}
                className="w-full border rounded-lg px-4 py-2.5"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="all">Todo o período</option>
                <option value="custom">Período personalizado</option>
              </select>
            </div>

            {/* Seletor de datas personalizadas */}
            {dateRange === 'custom' && (
              <>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2.5"
                    max={customEndDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2.5"
                    min={customStartDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}

            <button
              onClick={loadAnalytics}
              disabled={refreshing}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Indicador de período selecionado */}
          {dateRange === 'custom' && customStartDate && customEndDate && (
            <div className="mt-3 text-sm text-gray-600">
              📅 Exibindo dados de <strong>{new Date(customStartDate).toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(customEndDate).toLocaleDateString('pt-BR')}</strong>
            </div>
          )}
        </div>

        {/* Resumo Principal */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <X className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.bounceRate}%</p>
              <p className="text-sm text-gray-500">Taxa de rejeição</p>
            </div>
          </div>
        )}

        {/* Performance por Layout com Insights */}
        {layoutPerformance.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Performance por Layout / Versão</h2>
            
            <div className="space-y-4">
              {layoutPerformance.map((lp, index) => (
                <div key={`${lp.layoutId}-${lp.versionId || 'base'}`} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {lp.layoutName}
                          {lp.versionName && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-normal">
                              {lp.versionName}
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye size={14} /> {lp.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer size={14} /> {lp.clicks} cliques
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} /> {lp.visitors} visitantes
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {lp.avgTime}s
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 size={14} /> {lp.avgScroll}%
                          </span>
                          <span className="flex items-center gap-1">
                            <X size={14} /> {lp.bounceRate}% rejeição
                          </span>
                        </div>
                        {/* Insights do layout */}
                        <div className="mt-3 space-y-1">
                          {lp.insights.map((insight, i) => (
                            <p key={i} className="text-sm text-gray-600">{insight}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      getEngagementLevel(lp.avgScroll, lp.avgTime).color
                    }`}>
                      {getEngagementLevel(lp.avgScroll, lp.avgTime).label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico Diário */}
        {dailyStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Últimos Dias</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Data</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Views</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Cliques</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Visitantes</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Tempo</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Scroll</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStats.map((day) => (
                    <tr key={day.date} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{day.date}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{day.views}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{day.clicks}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{day.visitors}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{day.avgTime}s</td>
                      <td className="py-3 px-4 text-right text-gray-600">{day.avgScroll}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sessões/Acessos Agrupados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-left">👥 Acessos Individuais</h2>
              <p className="text-sm text-gray-500 text-left">{sessions.length} sessões registradas (clique para {showSessions ? 'ocultar' : 'ver'})</p>
            </div>
            {showSessions ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
          
          {showSessions && sessions.length > 0 && (
            <div className="border-t max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Layout</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tempo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Scroll</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cliques</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Engajamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map((session) => {
                    const engagement = getEngagementLevel(session.scrollDepth, session.duration)
                    return (
                      <tr key={session.sessionId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(session.startTime).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {session.layoutName}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {session.duration}s
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {session.scrollDepth}%
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {session.clicks > 0 ? (
                            <span className="text-green-600 font-medium">{session.clicks}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${engagement.color}`}>
                            {engagement.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Eventos Detalhados (colapsável) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-left">📋 Eventos Detalhados</h2>
              <p className="text-sm text-gray-500 text-left">{analytics.length} eventos (clique para {showDetails ? 'ocultar' : 'ver'})</p>
            </div>
            {showDetails ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
          
          {showDetails && (
            <>
              {analytics.length === 0 ? (
                <div className="p-12 text-center border-t">
                  <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado ainda</h3>
                  <p className="text-gray-500">Os eventos aparecerão aqui conforme os visitantes interagem</p>
                </div>
              ) : (
                <div className="border-t max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Layout</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {analytics.slice(0, 50).map((event) => {
                        const layout = layouts.find(l => l.id === event.layout_id)
                        const eventData = event.event_data as any
                        
                        const eventLabels: Record<string, { label: string; icon: string }> = {
                          page_view: { label: 'Visita', icon: '👁️' },
                          scroll: { label: 'Scroll', icon: '📜' },
                          time_on_page: { label: 'Tempo', icon: '⏱️' },
                          click: { label: 'Clique', icon: '👆' },
                        }
                        
                        const eventInfo = eventLabels[event.event_type] || { label: event.event_type, icon: '📌' }
                        
                        return (
                          <tr key={event.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(event.created_at).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-sm">
                                {eventInfo.icon} {eventInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {layout?.name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {event.event_type === 'scroll' && `${eventData?.scroll_depth || 0}% da página`}
                              {event.event_type === 'time_on_page' && `${eventData?.time_seconds || 0} segundos`}
                              {event.event_type === 'page_view' && 'Nova visita'}
                              {event.event_type === 'click' && (eventData?.element || eventData?.text || 'Botão clicado')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Confirmação para Apagar Dados */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Apagar Dados</h2>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              {selectedLayout 
                ? `Você está prestes a apagar todos os dados de analytics do layout "${layouts.find(l => l.id === selectedLayout)?.name}".`
                : 'Você está prestes a apagar TODOS os dados de analytics de todas as landing pages.'
              }
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Apagar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
