'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart3, Eye, Users, MousePointer, 
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
  averageScrollDepth: number
  bounceRate: number
  clickRate: number
}

interface DailyStats {
  date: string
  views: number
  clicks: number
  visitors: number
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
  const { isAuthenticated, isEditor, loading: authLoading, emailIsAdmin, user } = useAuth()
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
  const [clickDetails, setClickDetails] = useState<Array<{
    element: string
    text: string
    pageName: string
    count: number
  }>>([])

  // Verificar se tem acesso - emailIsAdmin funciona mesmo sem profile carregado
  const hasAccess = emailIsAdmin || isEditor
  
  useEffect(() => {
    if (!authLoading && hasAccess) {
      loadPages()
    }
  }, [hasAccess, authLoading])

  useEffect(() => {
    if (pages.length > 0 || pageType === 'homepage' || pageType === 'all') {
      loadAnalytics()
    }
  }, [pageType, selectedPageId, dateRange, customStartDate, customEndDate, pages.length])

  // Carregar páginas (serviços)
  const loadPages = async () => {
    try {
      const { data: services } = await (supabase as any)
        .from('services')
        .select('id, slug, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const allPages = (services || []).map((s: { id: string; slug: string; name: string }) => ({ 
        id: s.id,
        slug: s.slug,
        name: s.name,
        type: 'service' as const,
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
        .select('*', { count: 'exact' })
      
      // Aplicar filtros de data apenas se não for "all"
      if (dateRange !== 'all') {
        query = query
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      }

      // Filtrar por tipo de página
      if (pageType !== 'all') {
        query = query.eq('page_type', pageType)
      }

      // Filtrar por página específica
      if (selectedPageId && pageType === 'service') {
        query = query.eq('page_id', selectedPageId)
      }
      // Para homepage, o page_type já filtra corretamente, não precisa de filtro adicional

      const { data, error, count } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Erro na query:', error)
        throw error
      }

      // Limpar dados antigos antes de definir novos
      setAnalytics([])
      
      // Aguardar um pouco para garantir que o estado foi limpo
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setAnalytics(data || [])
      
      // Recalcular todas as métricas com os novos dados
      if (data && data.length > 0) {
        calculateSummary(data)
        calculateDailyStats(data)
        calculatePagePerformance(data)
        calculateSessions(data)
        calculateClickDetails(data)
      } else {
        // Se não há dados, limpar todas as métricas
        setSummary(null)
        setDailyStats([])
        setPagePerformance([])
        setSessions([])
        setClickDetails([])
      }
    } catch (error: any) {
      console.error('Erro ao carregar analytics:', error)
      toast.error(error.message || 'Erro ao carregar dados')
      // Limpar dados em caso de erro
      setAnalytics([])
      setSummary(null)
      setDailyStats([])
      setPagePerformance([])
      setSessions([])
      setClickDetails([])
    } finally {
      setLoading(false)
    }
  }

  // Calcular resumo
  const calculateSummary = (data: any[]) => {
    const views = data.filter(a => a.event_type === 'page_view')
    
    // Filtrar apenas cliques em elementos funcionais
    const functionalElements = [
      'service-link',
      'related-service-link',
      'comparison-cta',
      'contact-button',
      'whatsapp-button',
      'email-button',
      'instagram-button',
      'cta-contact',
    ]
    const clicks = data.filter(a => {
      if (a.event_type !== 'click') return false
      const element = a.event_data?.element || 'unknown'
      return functionalElements.includes(element)
    })
    
    const scrolls = data.filter(a => a.event_type === 'scroll')

    const totalViews = views.length
    const totalClicks = clicks.length
    
    // Visitantes únicos baseado em session_id
    const uniqueSessions = new Set(views.map(v => v.session_id))
    const uniqueVisitors = uniqueSessions.size

    const avgScrollDepth = scrolls.length > 0
      ? scrolls.reduce((sum, s) => sum + ((s.event_data?.scroll_depth || 0)), 0) / scrolls.length
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
    }>()

    data.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0]
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          views: 0,
          clicks: 0,
          visitors: new Set(),
          scrolls: []
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
      }
    })

    const stats: DailyStats[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        clicks: data.clicks,
        visitors: data.visitors.size,
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
      sessionScrolls: Map<string, number[]> // Para calcular bounce rate corretamente
    }>()

    data.forEach(event => {
      // Criar chave única para identificar a página
      // Para homepage: usar '/' ou 'homepage'
      // Para serviços: usar page_id (prioritário) ou page_slug
      let key: string
      if (event.page_type === 'homepage') {
        key = 'homepage'
      } else if (event.page_id) {
        key = event.page_id
      } else if (event.page_slug) {
        key = event.page_slug
      } else {
        key = 'unknown'
      }
      
      if (!pageMap.has(key)) {
        pageMap.set(key, {
          pageId: event.page_id,
          pageSlug: event.page_slug,
          pageName: event.page_type === 'homepage' ? 'Homepage' : (event.page_slug || 'Página desconhecida'),
          pageType: event.page_type,
          views: 0,
          clicks: 0,
          visitors: new Set(),
          scrolls: [],
          sessionScrolls: new Map()
        })
      }

      const page = pageMap.get(key)!
      
      if (event.event_type === 'page_view') {
        page.views++
        page.visitors.add(event.session_id)
      } else if (event.event_type === 'click') {
        // Contar apenas cliques em elementos funcionais
        const element = event.event_data?.element || 'unknown'
        const functionalElements = [
          'service-link',
          'related-service-link',
          'comparison-cta',
          'contact-button',
          'whatsapp-button',
          'email-button',
          'instagram-button',
          'cta-contact',
        ]
        if (functionalElements.includes(element)) {
          page.clicks++
        }
      } else if (event.event_type === 'scroll') {
        const scrollDepth = event.event_data?.scroll_depth || 0
        page.scrolls.push(scrollDepth)
        // Armazenar scroll por sessão para calcular bounce rate
        if (!page.sessionScrolls.has(event.session_id)) {
          page.sessionScrolls.set(event.session_id, [])
        }
        page.sessionScrolls.get(event.session_id)!.push(scrollDepth)
      }
    })

    // Buscar nomes dos serviços e calcular métricas
    const performance: PagePerformance[] = Array.from(pageMap.entries())
      .map(([key, data]) => {
        let pageName = data.pageName
        
        // Buscar nome do serviço se for uma página de serviço
        if (data.pageType === 'service') {
          const service = pages.find(p => 
            (data.pageId && p.id === data.pageId) || 
            (data.pageSlug && p.slug === data.pageSlug)
          )
          if (service) {
            pageName = service.name
          } else if (data.pageSlug) {
            // Tentar formatar o slug como nome
            pageName = data.pageSlug
              .split('-')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          }
        }

        // Calcular bounce rate corretamente
        // Uma sessão é considerada "bounce" se não teve scroll > 25%
        const sessions = Array.from(data.visitors)
        let bouncedSessions = 0
        
        sessions.forEach(sessionId => {
          const sessionScrolls = data.sessionScrolls.get(sessionId) || []
          const maxScroll = sessionScrolls.length > 0 ? Math.max(...sessionScrolls) : 0
          if (maxScroll <= 25) {
            bouncedSessions++
          }
        })

        return {
          pageId: data.pageId,
          pageSlug: data.pageSlug,
          pageName,
          pageType: data.pageType,
          views: data.views,
          clicks: data.clicks,
          visitors: data.visitors.size,
          avgScroll: data.scrolls.length > 0
            ? Math.round(data.scrolls.reduce((a, b) => a + b, 0) / data.scrolls.length)
            : 0,
          bounceRate: sessions.length > 0
            ? Math.round((bouncedSessions / sessions.length) * 100 * 10) / 10
            : 0,
        }
      })
      .sort((a, b) => b.views - a.views)

    setPagePerformance(performance)
  }

  // Apagar dados de analytics
  const handleDeleteData = async () => {
    const confirmMessage = selectedPageId 
      ? `Tem certeza que deseja apagar os dados da página selecionada? Esta ação não pode ser desfeita.`
      : pageType !== 'all'
      ? `Tem certeza que deseja apagar todos os dados de ${pageType === 'homepage' ? 'Homepage' : 'Serviços'}? Esta ação não pode ser desfeita.`
      : `Tem certeza que deseja apagar todos os dados de analytics? Esta ação não pode ser desfeita.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setDeleting(true)
      
      const { startDate, endDate } = getDateFilter(dateRange)
      
      // Tentar usar função RPC primeiro (mais eficiente e seguro)
      try {
        const rpcParams: any = {}
        
        if (dateRange !== 'all') {
          rpcParams.p_start_date = startDate
          rpcParams.p_end_date = endDate
        }
        
        if (pageType !== 'all') {
          rpcParams.p_page_type = pageType
        }
        
        if (selectedPageId) {
          rpcParams.p_page_id = selectedPageId
        }

        const { data: deletedCount, error: rpcError } = await (supabase as any)
          .rpc('delete_page_analytics', rpcParams)

        if (!rpcError && deletedCount !== null) {
          if (deletedCount === 0) {
            toast('Nenhum dado encontrado para apagar.', { icon: 'ℹ️' })
          } else {
            toast.success(`${deletedCount} registro(s) apagado(s) com sucesso!`)
          }
          await loadAnalytics()
          return
        } else if (rpcError) {
          // Se a função RPC não existir ou der erro, tentar método alternativo
          console.warn('Função RPC não disponível, usando método alternativo:', rpcError)
        }
      } catch (rpcErr) {
        console.warn('Erro ao usar RPC, tentando método alternativo:', rpcErr)
      }

      // Método alternativo: deletar em lotes usando IDs
      let selectQuery = (supabase as any)
        .from('page_analytics')
        .select('id')
      
      if (dateRange !== 'all') {
        selectQuery = selectQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      }
      
      if (pageType !== 'all') {
        selectQuery = selectQuery.eq('page_type', pageType)
      }
      
      if (selectedPageId) {
        selectQuery = selectQuery.eq('page_id', selectedPageId)
      }

      const { data: idsToDelete, error: selectError } = await selectQuery.limit(10000)

      if (selectError) {
        console.error('Erro ao buscar IDs para deletar:', selectError)
        throw selectError
      }

      if (!idsToDelete || idsToDelete.length === 0) {
        toast('Nenhum dado encontrado para apagar.', { icon: 'ℹ️' })
        return
      }

      // Deletar em lotes menores (100 por vez para evitar timeout)
      const batchSize = 100
      const ids = idsToDelete.map((item: { id: string }) => item.id)
      
      let totalDeleted = 0
      let errors: any[] = []
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)
        try {
          const { error: deleteError, count } = await (supabase as any)
            .from('page_analytics')
            .delete({ count: 'exact' })
            .in('id', batch)
          
          if (deleteError) {
            console.error('Erro ao deletar lote:', deleteError)
            errors.push(deleteError)
          } else {
            totalDeleted += batch.length
          }
        } catch (err: any) {
          console.error('Erro ao deletar lote:', err)
          errors.push(err)
        }
      }

      if (errors.length > 0 && totalDeleted === 0) {
        throw new Error(`Erro ao apagar dados: ${errors[0]?.message || 'Erro desconhecido'}`)
      } else if (errors.length > 0) {
        toast.success(`${totalDeleted} registro(s) apagado(s). Alguns erros ocorreram.`)
      } else {
        toast.success(`${totalDeleted} registro(s) apagado(s) com sucesso!`)
      }
      
      // Recarregar dados após deletar
      await loadAnalytics()
    } catch (error: any) {
      console.error('Erro ao apagar dados:', error)
      const errorMessage = error?.message || error?.error?.message || 'Erro ao apagar dados'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  // Calcular sessões
  const calculateSessions = (data: any[]) => {
    const sessionMap = new Map<string, {
      pageType: string
      pageId: string | null
      pageSlug: string | null
      startTime: string
      events: any[]
    }>()

    data.forEach(event => {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, {
          pageType: event.page_type,
          pageId: event.page_id,
          pageSlug: event.page_slug,
          startTime: event.created_at,
          events: []
        })
      }
      sessionMap.get(event.session_id)!.events.push(event)
    })

    const sessionsData: SessionData[] = Array.from(sessionMap.entries())
      .map(([sessionId, sessionData]) => {
        const views = sessionData.events.filter(e => e.event_type === 'page_view')
        
        // Filtrar apenas cliques em elementos funcionais
        const functionalElements = [
          'service-link',
          'related-service-link',
          'comparison-cta',
          'contact-button',
          'whatsapp-button',
          'email-button',
          'instagram-button',
          'cta-contact',
        ]
        const clicks = sessionData.events.filter(e => {
          if (e.event_type !== 'click') return false
          const element = e.event_data?.element || 'unknown'
          return functionalElements.includes(element)
        })
        
        const scrolls = sessionData.events.filter(e => e.event_type === 'scroll')

        const maxScroll = scrolls.length > 0
          ? Math.max(...scrolls.map((s: any) => s.event_data?.scroll_depth || 0))
          : 0

        // Determinar nome da página corretamente
        let pageName = 'Homepage'
        if (sessionData.pageType === 'service') {
          const service = pages.find(p => 
            (sessionData.pageId && p.id === sessionData.pageId) || 
            (sessionData.pageSlug && p.slug === sessionData.pageSlug)
          )
          if (service) {
            pageName = service.name
          } else if (sessionData.pageSlug) {
            // Formatar slug como nome
            pageName = sessionData.pageSlug
              .split('-')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          } else {
            pageName = 'Serviço desconhecido'
          }
        } else if (sessionData.pageType === 'homepage') {
          pageName = 'Homepage'
        }

        return {
          sessionId,
          pageName,
          startTime: sessionData.startTime,
          duration: 0, // Removido - não está funcionando bem
          scrollDepth: maxScroll,
          clicks: clicks.length,
          pageViews: views.length,
        }
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 100) // Limitar a 100 sessões mais recentes

    setSessions(sessionsData)
  }

  // Calcular detalhes de cliques por elemento
  // Mostrar apenas elementos realmente clicáveis e funcionais
  const calculateClickDetails = (data: any[]) => {
    const clickMap = new Map<string, {
      element: string
      text: string
      pageName: string
      count: number
    }>()

    // Elementos funcionais que devem ser rastreados
    const functionalElements = [
      'service-link',           // Links para páginas de serviços
      'related-service-link',   // Links para serviços relacionados
      'comparison-cta',         // CTA de comparação
      'contact-button',         // Botões de contato (WhatsApp, Email, Instagram)
      'whatsapp-button',        // Botão WhatsApp
      'email-button',           // Botão Email
      'instagram-button',       // Botão Instagram
      'cta-contact',           // CTA de contato
    ]

    const clickEvents = data.filter(e => {
      if (e.event_type !== 'click') return false
      const element = e.event_data?.element || 'unknown'
      // Filtrar apenas elementos funcionais
      return functionalElements.includes(element)
    })
    
    clickEvents.forEach(event => {
      const element = event.event_data?.element || 'unknown'
      const text = event.event_data?.text || ''
      
      // Determinar nome da página
      let pageName = 'Homepage'
      if (event.page_type === 'service') {
        const service = pages.find(p => 
          (event.page_id && p.id === event.page_id) || 
          (event.page_slug && p.slug === event.page_slug)
        )
        if (service) {
          pageName = service.name
        } else if (event.page_slug) {
          pageName = event.page_slug
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
      }

      // Criar chave única baseada no elemento e URL/texto para evitar duplicações
      const url = event.event_data?.url || ''
      const uniqueKey = `${event.page_type}_${event.page_id || event.page_slug || 'homepage'}_${element}_${url || text}`
      
      if (!clickMap.has(uniqueKey)) {
        // Limpar texto para exibição (remover duplicações e formatação)
        let displayText = text
        if (element === 'service-link' && displayText) {
          // Remover "Ver detalhes" e duplicações do texto
          displayText = displayText
            .replace(/\.Ver detalhes/gi, '')
            .replace(/Ver detalhes/gi, '')
            .trim()
        }
        
        clickMap.set(uniqueKey, {
          element,
          text: displayText || element,
          pageName,
          count: 0
        })
      }
      
      clickMap.get(uniqueKey)!.count++
    })

    const details = Array.from(clickMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 50) // Top 50 elementos mais clicados

    setClickDetails(details)
  }

  // Loading - aguardar carregamento do auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  // Se não está autenticado E auth já carregou, redirecionar para login
  if (!authLoading && !isAuthenticated) {
    // Usar window.location para evitar problemas de navegação do Next.js
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
    return null
  }

  // Sem permissão - mostrar mensagem (só verificar após auth carregar e user estar disponível)
  // Se emailIsAdmin é true, sempre permitir acesso mesmo sem profile
  if (!emailIsAdmin && !hasAccess && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Você não tem permissão.</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">Voltar</a>
        </div>
      </div>
    )
  }

  // Carregando dados
  if (loading) {
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
            {(pageType === 'service' || pageType === 'homepage') && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">Página Específica</label>
                <select
                  value={selectedPageId || ''}
                  onChange={(e) => setSelectedPageId(e.target.value || null)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Todas</option>
                  {pageType === 'homepage' ? (
                    <option value="homepage">Homepage</option>
                  ) : (
                    pages
                      .filter(p => p.type === 'service')
                      .map(page => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                        </option>
                      ))
                  )}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <BarChart3 className="w-7 h-7 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.averageScrollDepth}%</p>
              <p className="text-sm text-gray-500">Scroll médio</p>
            </div>

          </div>
        )}

        {/* Detalhes de Cliques por Elemento */}
        {clickDetails.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-1">🖱️ Cliques por Elemento</h2>
              <p className="text-sm text-gray-500">Elementos mais clicados nas páginas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Página</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elemento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Texto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliques</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clickDetails.map((detail, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{detail.pageName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {detail.element}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{detail.text || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{detail.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance por Página */}
        {pagePerformance.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-1">📊 Performance por Página</h2>
              <p className="text-sm text-gray-500">Métricas detalhadas de cada página</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Página</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visualizações</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitantes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliques</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scroll Médio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagePerformance.map((page, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{page.pageName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {page.pageType === 'homepage' ? 'Homepage' : 'Serviço'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.visitors}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.clicks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.avgScroll}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.bounceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
