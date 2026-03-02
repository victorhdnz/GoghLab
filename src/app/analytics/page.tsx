'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Lock,
  RefreshCw,
  Eye,
  Users,
  MousePointer,
  ChevronDown,
  ChevronRight,
  Filter,
  LayoutDashboard,
  MousePointerClick,
  Table2,
  UserCheck,
  DollarSign,
  TrendingUp,
  Megaphone,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import toast from 'react-hot-toast'

interface AnalyticsSummary {
  totalViews: number
  totalClicks: number
  totalConversions: number
  uniqueVisitors: number
  averageScrollDepth: number
  bounceRate: number
  clickRate: number
  conversionRate: number
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

type AnalyticsAccordionId = 'campanhas' | 'filtros' | 'status' | 'resumo' | 'roi' | 'cliques' | 'performance' | 'sessoes'

interface AnalyticsCampaign {
  id: string
  name: string
  start_date: string
  is_active: boolean
  valor_venda: number | null
  custo_venda: number | null
  custo_por_aquisicao: number | null
  roi_enabled: boolean
  created_at: string
  updated_at: string
}

const FUNCTIONAL_ELEMENTS = [
  'service-link',
  'related-service-link',
  'comparison-cta',
  'contact-button',
  'whatsapp-button',
  'email-button',
  'instagram-button',
  'cta-contact',
]

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading, hasActiveSubscription, isPro } = useAuth()
  const hasAccess = isAuthenticated && isPro
  const supabase = createClient()

  const [accordionOpen, setAccordionOpen] = useState<AnalyticsAccordionId | null>('campanhas')
  const [campaigns, setCampaigns] = useState<AnalyticsCampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignStartDate, setNewCampaignStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [pageType, setPageType] = useState<'all' | 'homepage' | 'service' | 'product'>('all')
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [pages, setPages] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [pagePerformance, setPagePerformance] = useState<PagePerformance[]>([])
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [clickDetails, setClickDetails] = useState<Array<{ element: string; text: string; pageName: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  // ROI opcional: ativar para ver lucro e CPA break-even
  const [roiEnabled, setRoiEnabled] = useState(false)
  const [valorVenda, setValorVenda] = useState<string>('')
  const [custoVenda, setCustoVenda] = useState<string>('')
  const [custoPorAquisição, setCustoPorAquisição] = useState<string>('')

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
    const endDate = range === 'custom' && customEndDate ? new Date(customEndDate) : now
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  }

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
        title: s.name,
      }))
      setPages(allPages)
    } catch (e) {
      console.error('Erro ao carregar páginas:', e)
    }
  }

  const loadAnalytics = async () => {
    if (!hasAccess) return
    try {
      setLoading(true)
      const { startDate, endDate } = getDateFilter(dateRange)
      let query = (supabase as any).from('page_analytics').select('*', { count: 'exact' })
      if (dateRange !== 'all') {
        query = query.gte('created_at', startDate).lte('created_at', endDate)
      }
      if (pageType !== 'all') query = query.eq('page_type', pageType)
      if (selectedPageId && pageType === 'service') query = query.eq('page_id', selectedPageId)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setAnalytics(data || [])
      if (data?.length) {
        calculateSummary(data)
        calculateDailyStats(data)
        calculatePagePerformance(data)
        calculateSessions(data)
        calculateClickDetails(data)
      } else {
        setSummary(null)
        setDailyStats([])
        setPagePerformance([])
        setSessions([])
        setClickDetails([])
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao carregar dados')
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

  const calculateSummary = (data: any[]) => {
    const views = data.filter((a) => a.event_type === 'page_view')
    const clicks = data.filter((a) => a.event_type === 'click' && FUNCTIONAL_ELEMENTS.includes(a.event_data?.element || ''))
    const conversions = data.filter((a) => a.event_type === 'conversion')
    const scrolls = data.filter((a) => a.event_type === 'scroll')
    const totalViews = views.length
    const totalClicks = clicks.length
    const totalConversions = conversions.length
    const uniqueVisitors = new Set(views.map((v) => v.session_id)).size
    const avgScrollDepth = scrolls.length
      ? scrolls.reduce((sum, s) => sum + (s.event_data?.scroll_depth || 0), 0) / scrolls.length
      : 0
    const sessionsSet = new Set(data.map((a) => a.session_id))
    const bouncedSessions = Array.from(sessionsSet).filter((sessionId) => {
      const sessionEvents = data.filter((a) => a.session_id === sessionId)
      const hasScroll = sessionEvents.some((e) => e.event_type === 'scroll' && (e.event_data?.scroll_depth || 0) > 25)
      return !hasScroll
    }).length
    const bounceRate = sessionsSet.size > 0 ? (bouncedSessions / sessionsSet.size) * 100 : 0
    const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0
    const conversionRate = uniqueVisitors > 0 ? (totalConversions / uniqueVisitors) * 100 : 0
    setSummary({
      totalViews,
      totalClicks,
      totalConversions,
      uniqueVisitors,
      averageScrollDepth: Math.round(avgScrollDepth),
      bounceRate: Math.round(bounceRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
    })
  }

  const calculateDailyStats = (data: any[]) => {
    const dailyMap = new Map<string, { views: number; clicks: number; visitors: Set<string>; scrolls: number[] }>()
    data.forEach((event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0]
      if (!dailyMap.has(date)) dailyMap.set(date, { views: 0, clicks: 0, visitors: new Set(), scrolls: [] })
      const day = dailyMap.get(date)!
      if (event.event_type === 'page_view') {
        day.views++
        day.visitors.add(event.session_id)
      } else if (event.event_type === 'click') day.clicks++
      else if (event.event_type === 'scroll') day.scrolls.push(event.event_data?.scroll_depth || 0)
    })
    const stats: DailyStats[] = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        views: d.views,
        clicks: d.clicks,
        visitors: d.visitors.size,
        avgScroll: d.scrolls.length ? Math.round(d.scrolls.reduce((a, b) => a + b, 0) / d.scrolls.length) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    setDailyStats(stats)
  }

  const calculatePagePerformance = (data: any[]) => {
    const pageMap = new Map<
      string,
      {
        pageId: string | null
        pageSlug: string | null
        pageName: string
        pageType: string
        views: number
        clicks: number
        visitors: Set<string>
        scrolls: number[]
        sessionScrolls: Map<string, number[]>
      }
    >()
    data.forEach((event) => {
      const key =
        event.page_type === 'homepage'
          ? 'homepage'
          : event.page_id || event.page_slug || 'unknown'
      if (!pageMap.has(key)) {
        pageMap.set(key, {
          pageId: event.page_id,
          pageSlug: event.page_slug,
          pageName: event.page_type === 'homepage' ? 'Homepage' : event.page_slug || 'Página',
          pageType: event.page_type,
          views: 0,
          clicks: 0,
          visitors: new Set(),
          scrolls: [],
          sessionScrolls: new Map(),
        })
      }
      const page = pageMap.get(key)!
      if (event.event_type === 'page_view') {
        page.views++
        page.visitors.add(event.session_id)
      } else if (event.event_type === 'click' && FUNCTIONAL_ELEMENTS.includes(event.event_data?.element || '')) {
        page.clicks++
      } else if (event.event_type === 'scroll') {
        const depth = event.event_data?.scroll_depth || 0
        page.scrolls.push(depth)
        if (!page.sessionScrolls.has(event.session_id)) page.sessionScrolls.set(event.session_id, [])
        page.sessionScrolls.get(event.session_id)!.push(depth)
      }
    })
    const performance: PagePerformance[] = Array.from(pageMap.entries())
      .map(([, d]) => {
        let pageName = d.pageName
        if (d.pageType === 'service') {
          const service = pages.find((p) => (d.pageId && p.id === d.pageId) || (d.pageSlug && p.slug === d.pageSlug))
          if (service) pageName = service.name
        }
        const sessionsList = Array.from(d.visitors)
        let bounced = 0
        sessionsList.forEach((sid) => {
          const scrolls = d.sessionScrolls.get(sid) || []
          const maxScroll = scrolls.length ? Math.max(...scrolls) : 0
          if (maxScroll <= 25) bounced++
        })
        return {
          pageId: d.pageId,
          pageSlug: d.pageSlug,
          pageName,
          pageType: d.pageType,
          views: d.views,
          clicks: d.clicks,
          visitors: d.visitors.size,
          avgScroll: d.scrolls.length ? Math.round(d.scrolls.reduce((a, b) => a + b, 0) / d.scrolls.length) : 0,
          bounceRate: sessionsList.length ? Math.round((bounced / sessionsList.length) * 100 * 10) / 10 : 0,
        }
      })
      .sort((a, b) => b.views - a.views)
    setPagePerformance(performance)
  }

  const calculateSessions = (data: any[]) => {
    const sessionMap = new Map<
      string,
      { pageType: string; pageId: string | null; pageSlug: string | null; startTime: string; events: any[] }
    >()
    data.forEach((event) => {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, {
          pageType: event.page_type,
          pageId: event.page_id,
          pageSlug: event.page_slug,
          startTime: event.created_at,
          events: [],
        })
      }
      sessionMap.get(event.session_id)!.events.push(event)
    })
    const sessionsData: SessionData[] = Array.from(sessionMap.entries())
      .map(([sessionId, sd]) => {
        const views = sd.events.filter((e) => e.event_type === 'page_view')
        const clicks = sd.events.filter((e) => e.event_type === 'click' && FUNCTIONAL_ELEMENTS.includes(e.event_data?.element || ''))
        const scrolls = sd.events.filter((e) => e.event_type === 'scroll')
        const maxScroll = scrolls.length ? Math.max(...scrolls.map((s: any) => s.event_data?.scroll_depth || 0)) : 0
        let pageName = 'Homepage'
        if (sd.pageType === 'service') {
          const service = pages.find((p) => (sd.pageId && p.id === sd.pageId) || (sd.pageSlug && p.slug === sd.pageSlug))
          pageName = service?.name || sd.pageSlug || 'Serviço'
        }
        return {
          sessionId,
          pageName,
          startTime: sd.startTime,
          duration: 0,
          scrollDepth: maxScroll,
          clicks: clicks.length,
          pageViews: views.length,
        }
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 100)
    setSessions(sessionsData)
  }

  const calculateClickDetails = (data: any[]) => {
    const clickMap = new Map<string, { element: string; text: string; pageName: string; count: number }>()
    const clickEvents = data.filter((e) => e.event_type === 'click' && FUNCTIONAL_ELEMENTS.includes(e.event_data?.element || ''))
    clickEvents.forEach((event) => {
      const element = event.event_data?.element || 'unknown'
      const text = (event.event_data?.text || '').replace(/\.?Ver detalhes/gi, '').trim() || element
      let pageName = 'Homepage'
      if (event.page_type === 'service') {
        const service = pages.find((p) => (event.page_id && p.id === event.page_id) || (event.page_slug && p.slug === event.page_slug))
        pageName = service?.name || event.page_slug || 'Serviço'
      }
      const key = `${event.page_type}_${event.page_id || event.page_slug || 'hp'}_${element}_${event.event_data?.url || text}`
      if (!clickMap.has(key)) clickMap.set(key, { element, text, pageName, count: 0 })
      clickMap.get(key)!.count++
    })
    setClickDetails(
      Array.from(clickMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)
    )
  }

  const loadCampaigns = async () => {
    if (!hasAccess) return
    try {
      setCampaignsLoading(true)
      const res = await fetch('/api/analytics/campaigns', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar campanhas')
      setCampaigns(data.campaigns || [])
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar campanhas')
      setCampaigns([])
    } finally {
      setCampaignsLoading(false)
    }
  }

  const selectedCampaign = selectedCampaignId ? campaigns.find((c) => c.id === selectedCampaignId) : null

  useEffect(() => {
    loadPages()
  }, [])

  useEffect(() => {
    if (hasAccess) loadCampaigns()
  }, [hasAccess])

  useEffect(() => {
    if (!selectedCampaignId || !campaigns.length) return
    const c = campaigns.find((x) => x.id === selectedCampaignId)
    if (c) {
      setRoiEnabled(c.roi_enabled)
      setValorVenda(c.valor_venda != null ? String(c.valor_venda) : '')
      setCustoVenda(c.custo_venda != null ? String(c.custo_venda) : '')
      setCustoPorAquisição(c.custo_por_aquisicao != null ? String(c.custo_por_aquisicao) : '')
    }
  }, [selectedCampaignId, campaigns])

  useEffect(() => {
    if (hasAccess && (pages.length > 0 || pageType === 'homepage' || pageType === 'all')) {
      loadAnalytics()
    }
  }, [hasAccess, pageType, selectedPageId, dateRange, customStartDate, customEndDate, pages.length])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige flex items-center justify-center p-4">
        <LumaSpin size="lg" className="text-gogh-grayDark" />
      </div>
    )
  }

  const toggleAccordion = (id: AnalyticsAccordionId) => {
    setAccordionOpen((prev) => (prev === id ? null : id))
  }

  const handleCreateCampaign = async () => {
    const name = newCampaignName.trim()
    if (!name) {
      toast.error('Digite o nome da campanha')
      return
    }
    try {
      const res = await fetch('/api/analytics/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, start_date: newCampaignStartDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar')
      setCampaigns((prev) => [data.campaign, ...prev])
      setSelectedCampaignId(data.campaign.id)
      setNewCampaignName('')
      setNewCampaignStartDate(new Date().toISOString().split('T')[0])
      toast.success('Campanha criada')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar campanha')
    }
  }

  const handleToggleCampaignActive = async (campaign: AnalyticsCampaign) => {
    try {
      const res = await fetch(`/api/analytics/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !campaign.is_active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar')
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, is_active: !c.is_active } : c)))
      toast.success(campaign.is_active ? 'Campanha pausada' : 'Campanha ativada')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar')
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Excluir esta campanha? Os dados de ROI salvos nela serão perdidos.')) return
    try {
      const res = await fetch(`/api/analytics/campaigns/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir')
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      if (selectedCampaignId === id) setSelectedCampaignId(null)
      toast.success('Campanha excluída')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir')
    }
  }

  const handleSaveRoiToCampaign = async () => {
    if (!selectedCampaignId) return
    try {
      const res = await fetch(`/api/analytics/campaigns/${selectedCampaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roi_enabled: roiEnabled,
          valor_venda: valorVenda ? parseFloat(valorVenda.replace(',', '.')) : null,
          custo_venda: custoVenda ? parseFloat(custoVenda.replace(',', '.')) : null,
          custo_por_aquisicao: custoPorAquisição ? parseFloat(custoPorAquisição.replace(',', '.')) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      setCampaigns((prev) => prev.map((c) => (c.id === selectedCampaignId ? { ...c, ...data.campaign } : c)))
      toast.success('Dados salvos na campanha')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar')
    }
  }

  // Recomendações automáticas com base em índices (benchmarks de referência)
  const statusRecommendations = useMemo(() => {
    const recs: { type: 'success' | 'warning' | 'info'; text: string }[] = []
    if (!summary) return recs
    if (summary.bounceRate > 55) {
      recs.push({ type: 'warning', text: 'Bounce rate alto (>55%). Considere trocar criativo, headline ou público para melhorar retenção.' })
    } else if (summary.bounceRate < 40) {
      recs.push({ type: 'success', text: 'Bounce rate saudável (<40%). Mantenha o criativo e monitore.' })
    }
    if (summary.clickRate > 0 && summary.clickRate < 1) {
      recs.push({ type: 'warning', text: 'Taxa de cliques baixa. Teste novos CTAs ou posicionamento dos botões.' })
    } else if (summary.clickRate >= 3) {
      recs.push({ type: 'success', text: 'Taxa de cliques boa (≥3%). Pode considerar aumentar investimento nessa página.' })
    }
    if (summary.uniqueVisitors >= 10 && summary.totalConversions === 0) {
      recs.push({ type: 'info', text: 'Há visitantes mas nenhuma conversão. Revise a oferta ou o formulário de contato.' })
    }
    if (summary.averageScrollDepth < 30) {
      recs.push({ type: 'warning', text: 'Scroll médio baixo. Conteúdo pode não estar engajando; teste abertura mais forte.' })
    }
    if (recs.length === 0 && summary.totalViews > 0) {
      recs.push({ type: 'info', text: 'Métricas dentro da média. Continue coletando dados e compare com os próximos períodos.' })
    }
    return recs
  }, [summary])

  const accordionCard = (
    id: AnalyticsAccordionId,
    title: string,
    subtitle: string | null,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => (
    <div className="rounded-lg border border-gogh-grayLight bg-white transition-colors">
      <button
        type="button"
        onClick={() => toggleAccordion(id)}
        className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
      >
        <span className="flex items-center gap-2 text-base font-semibold text-gogh-black">
          {icon}
          {title}
        </span>
        {accordionOpen === id ? (
          <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />
        )}
      </button>
      {subtitle && accordionOpen !== id && (
        <p className="px-3 pb-2 text-xs text-gogh-grayDark">{subtitle}</p>
      )}
      {accordionOpen === id && (
        <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50">{children}</div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-gogh-yellow" />
          <div>
            <h1 className="text-2xl font-bold text-gogh-black">Gogh Analytics</h1>
            <p className="text-sm text-gogh-grayDark">Análise de anúncios e desempenho</p>
          </div>
        </div>

        {!hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
          >
            <p className="text-amber-800">
              {!hasActiveSubscription ? (
                <>
                  Você precisa assinar o plano Gogh Pro para acessar esta área.{' '}
                  <Link href="/precos" className="font-medium underline">Assinar Gogh Pro</Link>
                </>
              ) : (
                <>
                  O painel de análise está disponível apenas para o plano Pro.{' '}
                  <Link href="/precos" className="font-medium underline">Faça upgrade agora</Link>
                </>
              )}
            </p>
          </motion.div>
        )}

        <div className={!hasAccess ? 'relative' : ''}>
          {!hasAccess && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center min-h-[280px]">
              <div className="text-center p-4 sm:p-6 md:p-8">
                <Lock className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gogh-black mb-2">
                  {!hasActiveSubscription ? 'Assine o Gogh Pro para acessar' : 'Gogh Analytics é exclusivo do Plano Pro'}
                </h3>
                <p className="text-gogh-grayDark mb-6 max-w-md mx-auto">
                  {!hasActiveSubscription
                    ? 'Para acessar o painel de análise de anúncios e desempenho é necessário assinar o plano Gogh Pro.'
                    : 'Faça upgrade para o plano Pro e tenha acesso ao painel de métricas e desempenho.'}
                </p>
                <Link
                  href="/precos"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
                >
                  {!hasActiveSubscription ? 'Assinar Gogh Pro' : 'Fazer Upgrade'}
                </Link>
              </div>
            </div>
          )}

          <div className={!hasAccess ? 'pointer-events-none select-none blur-sm opacity-60' : ''}>
            {!hasAccess && (
              <div className="bg-white rounded-2xl border border-gogh-grayLight p-6 sm:p-8 shadow-sm">
                <p className="text-gogh-grayDark">
                  Painel de análise de anúncios e métricas de desempenho (conteúdo disponível para assinantes Gogh Pro).
                </p>
              </div>
            )}
            {hasAccess && (
              <div className="space-y-2">
                {accordionCard(
                  'campanhas',
                  'Campanhas',
                  selectedCampaign ? `${selectedCampaign.name} · Início ${selectedCampaign.start_date}` : 'Crie, ative ou pause campanhas',
                  <Megaphone className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-sm font-medium text-gogh-grayDark mb-1">Nova campanha</label>
                        <input
                          type="text"
                          value={newCampaignName}
                          onChange={(e) => setNewCampaignName(e.target.value)}
                          placeholder="Nome da campanha"
                          className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="min-w-[140px]">
                        <label className="block text-sm font-medium text-gogh-grayDark mb-1">Início</label>
                        <input
                          type="date"
                          value={newCampaignStartDate}
                          onChange={(e) => setNewCampaignStartDate(e.target.value)}
                          className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateCampaign}
                        disabled={campaignsLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/90 font-medium text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Criar
                      </button>
                    </div>
                    {campaignsLoading ? (
                      <div className="flex justify-center py-4"><LumaSpin size="sm" /></div>
                    ) : campaigns.length === 0 ? (
                      <p className="text-sm text-gogh-grayDark py-2">Nenhuma campanha. Crie uma para organizar métricas e decisões por campanha.</p>
                    ) : (
                      <ul className="space-y-2">
                        {campaigns.map((c) => (
                          <li
                            key={c.id}
                            className={`flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors ${
                              selectedCampaignId === c.id ? 'border-gogh-yellow bg-gogh-yellow/10' : 'border-gogh-grayLight bg-white'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedCampaignId(c.id)}
                              className="flex-1 text-left min-w-0"
                            >
                              <span className="font-medium text-gogh-black block truncate">{c.name}</span>
                              <span className="text-xs text-gogh-grayDark">
                                Início: {c.start_date} · {c.is_active ? 'Ativa' : 'Pausada'}
                              </span>
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleCampaignActive(c)}
                                title={c.is_active ? 'Pausar' : 'Ativar'}
                                className="p-2 rounded-lg text-gogh-grayDark hover:bg-gogh-grayLight"
                              >
                                {c.is_active ? <span className="text-xs font-medium text-amber-600">Pausar</span> : <span className="text-xs font-medium text-green-600">Ativar</span>}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCampaign(c.id)}
                                title="Excluir"
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {accordionCard(
                  'filtros',
                  'Filtros',
                  'Tipo de página, período e atualizar',
                  <Filter className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm font-medium text-gogh-grayDark mb-1">Tipo de página</label>
                        <select
                          value={pageType}
                          onChange={(e) => {
                            setPageType(e.target.value as any)
                            setSelectedPageId(null)
                          }}
                          className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="all">Todas</option>
                          <option value="homepage">Homepage</option>
                          <option value="service">Serviços</option>
                        </select>
                      </div>
                      {(pageType === 'service' || pageType === 'homepage') && (
                        <div className="flex-1 min-w-[180px]">
                          <label className="block text-sm font-medium text-gogh-grayDark mb-1">Página</label>
                          <select
                            value={selectedPageId || ''}
                            onChange={(e) => setSelectedPageId(e.target.value || null)}
                            className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Todas</option>
                            {pageType === 'service' &&
                              pages.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-sm font-medium text-gogh-grayDark mb-1">Período</label>
                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value as any)}
                          className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="7d">Últimos 7 dias</option>
                          <option value="30d">Últimos 30 dias</option>
                          <option value="90d">Últimos 90 dias</option>
                          <option value="all">Todo o período</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>
                      {dateRange === 'custom' && (
                        <>
                          <div className="min-w-[140px]">
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Início</label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="min-w-[140px]">
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Fim</label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => loadAnalytics()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-black text-white rounded-lg hover:bg-gogh-black/90 disabled:opacity-50 text-sm font-medium"
                      >
                        {loading ? <LumaSpin size="sm" /> : <RefreshCw className="w-4 h-4" />}
                        Atualizar
                      </button>
                    </div>
                  </div>
                )}

                {accordionCard(
                  'status',
                  'Status e decisões',
                  statusRecommendations.length ? `${statusRecommendations.length} recomendação(ões)` : 'Tomadas de decisão com base nos índices',
                  <AlertCircle className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-3">
                    {loading ? (
                      <div className="flex justify-center py-4"><LumaSpin size="sm" /></div>
                    ) : statusRecommendations.length === 0 ? (
                      <p className="text-sm text-gogh-grayDark py-2">Atualize os dados nos Filtros para ver recomendações automáticas com base em bounce rate, taxa de cliques e conversão.</p>
                    ) : (
                      <ul className="space-y-2">
                        {statusRecommendations.map((r, i) => (
                          <li
                            key={i}
                            className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                              r.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                              r.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                              'bg-blue-50 border border-blue-200 text-blue-800'
                            }`}
                          >
                            {r.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                            <span>{r.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-gogh-grayDark">Baseado em índices de referência: bounce &lt;40% saudável, &gt;55% alto; taxa de cliques ≥3% boa; scroll médio e conversões.</p>
                  </div>
                )}

                {accordionCard(
                  'resumo',
                  'Resumo',
                  summary ? `${summary.totalViews} visualizações · ${summary.uniqueVisitors} visitantes` : null,
                  <LayoutDashboard className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3">
                    {loading ? (
                      <div className="flex justify-center py-6">
                        <LumaSpin size="sm" />
                      </div>
                    ) : summary ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className="bg-gogh-grayLight/50 rounded-lg p-4">
                            <Eye className="w-6 h-6 text-blue-500 mb-2" />
                            <p className="text-xl font-bold text-gogh-black">{summary.totalViews.toLocaleString()}</p>
                            <p className="text-xs text-gogh-grayDark">Visualizações</p>
                          </div>
                          <div className="bg-gogh-grayLight/50 rounded-lg p-4">
                            <MousePointer className="w-6 h-6 text-green-500 mb-2" />
                            <p className="text-xl font-bold text-gogh-black">{summary.totalClicks.toLocaleString()}</p>
                            <p className="text-xs text-gogh-grayDark">Cliques</p>
                          </div>
                          <div className="bg-gogh-grayLight/50 rounded-lg p-4">
                            <TrendingUp className="w-6 h-6 text-amber-500 mb-2" />
                            <p className="text-xl font-bold text-gogh-black">{summary.totalConversions.toLocaleString()}</p>
                            <p className="text-xs text-gogh-grayDark">Conversões</p>
                          </div>
                          <div className="bg-gogh-grayLight/50 rounded-lg p-4">
                            <Users className="w-6 h-6 text-purple-500 mb-2" />
                            <p className="text-xl font-bold text-gogh-black">{summary.uniqueVisitors.toLocaleString()}</p>
                            <p className="text-xs text-gogh-grayDark">Visitantes</p>
                          </div>
                          <div className="bg-gogh-grayLight/50 rounded-lg p-4">
                            <BarChart3 className="w-6 h-6 text-indigo-500 mb-2" />
                            <p className="text-xl font-bold text-gogh-black">{summary.averageScrollDepth}%</p>
                            <p className="text-xs text-gogh-grayDark">Scroll médio</p>
                          </div>
                          <div className="bg-gogh-grayLight/50 rounded-lg p-4">
                            <p className="text-xl font-bold text-gogh-black">{summary.bounceRate}%</p>
                            <p className="text-xs text-gogh-grayDark">Bounce rate</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gogh-grayDark">
                          Taxa de cliques: {summary.clickRate}% · Taxa de conversão: {summary.conversionRate}%
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gogh-grayDark py-2">Nenhum dado no período. Ajuste os filtros ou aguarde novos acessos.</p>
                    )}
                  </div>
                )}

                {accordionCard(
                  'roi',
                  'Custos e receita (ROI)',
                  roiEnabled ? 'Valor, custo e CPA para decisão de tráfego pago' : 'Opcional — ative para ver lucro e CPA break-even',
                  <DollarSign className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roiEnabled}
                        onChange={(e) => setRoiEnabled(e.target.checked)}
                        className="rounded border-gogh-grayLight"
                      />
                      <span className="text-sm font-medium text-gogh-grayDark">Usar métricas de custo e receita</span>
                    </label>
                    {roiEnabled && (
                      <>
                        <p className="text-xs text-gogh-grayDark">
                          Informe o valor da sua venda e o custo (se houver) para ver o lucro por venda e quanto você pode gastar por aquisição (CPA) sem prejuízo.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Valor da venda (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={valorVenda}
                              onChange={(e) => setValorVenda(e.target.value)}
                              placeholder="Ex: 97"
                              className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Custo por venda (R$) — opcional</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={custoVenda}
                              onChange={(e) => setCustoVenda(e.target.value)}
                              placeholder="0 se não tiver"
                              className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-gogh-grayDark mt-0.5">Deixe 0 ou vazio se não tiver custo por venda.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Seu CPA médio (R$) — opcional</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={custoPorAquisição}
                              onChange={(e) => setCustoPorAquisição(e.target.value)}
                              placeholder="Ex: 45"
                              className="w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-gogh-grayDark mt-0.5">Quanto você gasta por conversão no anúncio.</p>
                          </div>
                        </div>
                        {(() => {
                          const valor = parseFloat(valorVenda.replace(',', '.')) || 0
                          const custo = parseFloat(custoVenda.replace(',', '.')) || 0
                          const cpa = parseFloat(custoPorAquisição.replace(',', '.')) || 0
                          const lucroVenda = valor - custo
                          if (valor <= 0) {
                            return (
                              <p className="text-sm text-gogh-grayDark bg-gogh-grayLight/50 rounded-lg p-3">
                                Preencha o valor da venda para ver o lucro por venda e o CPA break-even (máximo que pode gastar por aquisição sem prejuízo).
                              </p>
                            )
                          }
                          return (
                            <div className="space-y-2 bg-gogh-grayLight/30 rounded-lg p-4 border border-gogh-grayLight/50">
                              <p className="text-sm font-medium text-gogh-black">
                                Lucro por venda: <span className="text-green-600">R$ {lucroVenda.toFixed(2).replace('.', ',')}</span>
                                {custo > 0 && <span className="text-gogh-grayDark font-normal"> (valor − custo)</span>}
                              </p>
                              <p className="text-sm text-gogh-grayDark">
                                CPA break-even: você pode gastar até <strong className="text-gogh-black">R$ {lucroVenda.toFixed(2).replace('.', ',')}</strong> por aquisição para não ter prejuízo.
                              </p>
                              {cpa > 0 && (
                                <p className={`text-sm font-medium ${cpa <= lucroVenda ? 'text-green-600' : 'text-red-600'}`}>
                                  {cpa <= lucroVenda
                                    ? `Seu CPA (R$ ${cpa.toFixed(2).replace('.', ',')}) está abaixo do break-even. Você está no lucro por venda.`
                                    : `Seu CPA (R$ ${cpa.toFixed(2).replace('.', ',')}) está acima do break-even. Ajuste anúncios ou valor/custo para ficar no lucro.`}
                                </p>
                              )}
                            </div>
                          )
                        })()}
                        {selectedCampaignId && (
                          <button
                            type="button"
                            onClick={handleSaveRoiToCampaign}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gogh-black text-white rounded-lg hover:bg-gogh-black/90 text-sm font-medium"
                          >
                            Salvar na campanha
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {accordionCard(
                  'cliques',
                  'Cliques por elemento',
                  clickDetails.length ? `${clickDetails.length} elementos` : null,
                  <MousePointerClick className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 overflow-x-auto">
                    {clickDetails.length === 0 ? (
                      <p className="text-sm text-gogh-grayDark py-2">Nenhum clique registrado no período.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gogh-grayLight">
                            <th className="text-left py-2 font-medium text-gogh-grayDark">Página</th>
                            <th className="text-left py-2 font-medium text-gogh-grayDark">Elemento</th>
                            <th className="text-left py-2 font-medium text-gogh-grayDark">Texto</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Cliques</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clickDetails.map((d, i) => (
                            <tr key={i} className="border-b border-gogh-grayLight/50">
                              <td className="py-2 text-gogh-black">{d.pageName}</td>
                              <td className="py-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{d.element}</span>
                              </td>
                              <td className="py-2 text-gogh-grayDark">{d.text || '-'}</td>
                              <td className="py-2 text-right font-medium">{d.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {accordionCard(
                  'performance',
                  'Performance por página',
                  pagePerformance.length ? `${pagePerformance.length} páginas` : null,
                  <Table2 className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 overflow-x-auto">
                    {pagePerformance.length === 0 ? (
                      <p className="text-sm text-gogh-grayDark py-2">Nenhum dado por página no período.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gogh-grayLight">
                            <th className="text-left py-2 font-medium text-gogh-grayDark">Página</th>
                            <th className="text-left py-2 font-medium text-gogh-grayDark">Tipo</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Views</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Visit.</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Cliques</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Scroll</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Bounce</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagePerformance.map((p, i) => (
                            <tr key={i} className="border-b border-gogh-grayLight/50">
                              <td className="py-2 font-medium text-gogh-black">{p.pageName}</td>
                              <td className="py-2 text-gogh-grayDark">{p.pageType === 'homepage' ? 'Homepage' : 'Serviço'}</td>
                              <td className="py-2 text-right">{p.views}</td>
                              <td className="py-2 text-right">{p.visitors}</td>
                              <td className="py-2 text-right">{p.clicks}</td>
                              <td className="py-2 text-right">{p.avgScroll}%</td>
                              <td className="py-2 text-right">{p.bounceRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {accordionCard(
                  'sessoes',
                  'Acessos individuais (sessões)',
                  sessions.length ? `${sessions.length} sessões` : null,
                  <UserCheck className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 overflow-x-auto">
                    {sessions.length === 0 ? (
                      <p className="text-sm text-gogh-grayDark py-2">Nenhuma sessão no período.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gogh-grayLight">
                            <th className="text-left py-2 font-medium text-gogh-grayDark">Página</th>
                            <th className="text-left py-2 font-medium text-gogh-grayDark">Início</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Scroll</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Cliques</th>
                            <th className="text-right py-2 font-medium text-gogh-grayDark">Views</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.slice(0, 50).map((s) => (
                            <tr key={s.sessionId} className="border-b border-gogh-grayLight/50">
                              <td className="py-2 font-medium text-gogh-black">{s.pageName}</td>
                              <td className="py-2 text-gogh-grayDark">{new Date(s.startTime).toLocaleString('pt-BR')}</td>
                              <td className="py-2 text-right">{s.scrollDepth}%</td>
                              <td className="py-2 text-right">{s.clicks}</td>
                              <td className="py-2 text-right">{s.pageViews}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
