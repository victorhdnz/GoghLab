'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Lock,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Megaphone,
  Plus,
  Trash2,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Calendar as CalendarIcon,
  ImageIcon,
  Target,
} from 'lucide-react'
import { Calendar as DayPickerCalendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { LumaSpin } from '@/components/ui/luma-spin'
import { ShinyButton } from '@/components/ui/shiny-button'
import toast from 'react-hot-toast'

type AnalyticsAccordionId = 'inicio' | 'estrategia' | 'campanhas' | 'status'

interface AnalyticsCampaign {
  id: string
  name: string
  start_date: string
  is_active: boolean
  valor_venda: number | null
  custo_venda: number | null
  custo_por_aquisicao: number | null
  roi_enabled: boolean
  alcance?: number | null
  impressoes?: number | null
  cliques_link?: number | null
  valor_investido?: number | null
  compras?: number | null
  valor_total_faturado?: number | null
  meta_lucro_por_venda?: number | null
  created_at: string
  updated_at: string
}

interface AnalyticsCreative {
  id: string
  campaign_id: string
  name: string
  alcance: number | null
  impressoes: number | null
  cliques_link: number | null
  valor_investido: number | null
  compras: number | null
  valor_total_faturado: number | null
  created_at: string
  updated_at: string
}

// Fases de orçamento planejado por campanha (não alteram dados reais; só para planejamento)
interface BudgetPhase {
  id: string
  valor: number
  dias: number
}

const BUDGET_PHASES_STORAGE_KEY = 'gogh_analytics_budget_phases'
const BUDGET_TYPE_STORAGE_KEY = 'gogh_analytics_budget_type' // CBO = campanha (por dia na campanha); ABO = conjunto (por conjunto)
const AUTO_DIAS_RECOMMENDATION_KEY = 'gogh_analytics_auto_dias'
const FILLED_DATES_STORAGE_KEY = 'gogh_analytics_dias_preenchidos' // por campanha: { [campaignId]: string[] } (YYYY-MM-DD)
const HAS_EXISTING_ADS_KEY = 'gogh_analytics_has_existing_ads' // true = já tem anúncio/campanha, false = criar do zero, null = não respondeu
const ANALYTICS_PROFILE_KEY = 'gogh_analytics_profile' // perfil de análise: forma de venda do cliente (define métricas e status)
type BudgetTypeMeta = 'cbo' | 'abo'

export type AnalyticsProfileKey = 'venda-site' | 'contato-mensagens' | 'leads'
const ANALYTICS_PROFILES: Record<AnalyticsProfileKey, { label: string; description: string }> = {
  'venda-site': { label: 'Venda por site próprio', description: 'E-commerce, loja virtual. Métricas: alcance, impressões, frequência, CTR, cliques no link, CPC, compras, custo por compra, valor usado, valor de conversão das compras diretas no site, ROAS de resultados.' },
  'contato-mensagens': { label: 'Contato (WhatsApp, mensagens)', description: 'Foco em conversas iniciadas, contatos por mensagem. Use os campos abaixo para conversas por mensagem iniciadas, custo por conversa e valor de conversão.' },
  'leads': { label: 'Leads', description: 'Captação de leads, formulários. Use os campos abaixo para quantidade de leads, CPL e valor por lead.' },
}

// Labels das métricas de resultado por perfil (mesmo schema; só mudam rótulos e textos do Status)
function getProfileMetricLabels(profile: AnalyticsProfileKey): {
  resultados: string
  valorConversao: string
  custoPorResultado: string
  custoPorResultadoShort: string
  roasLabel: string
  hintPreencher: string
} {
  switch (profile) {
    case 'leads':
      return {
        resultados: 'Leads',
        valorConversao: 'Valor por lead (R$)',
        custoPorResultado: 'Custo por lead (CPL)',
        custoPorResultadoShort: 'CPL',
        roasLabel: 'ROAS de resultados',
        hintPreencher: 'leads',
      }
    case 'contato-mensagens':
      return {
        resultados: 'Conversas iniciadas',
        valorConversao: 'Valor de conversão (R$)',
        custoPorResultado: 'Custo por conversa',
        custoPorResultadoShort: 'Custo por conversa',
        roasLabel: 'ROAS de resultados',
        hintPreencher: 'conversas',
      }
    default:
      return {
        resultados: 'Compras',
        valorConversao: 'Valor de conversão das compras diretas no site (R$)',
        custoPorResultado: 'Custo por compra',
        custoPorResultadoShort: 'CPA',
        roasLabel: 'ROAS de resultados',
        hintPreencher: 'compras',
      }
  }
}

function dateToKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isActionDay(dayNum: number): boolean {
  return dayNum === 7 || (dayNum >= 10 && dayNum <= 14) || dayNum >= 18
}

// Parâmetros de análise (benchmarks para decisão)
// Referências 2025: WordStream, Rocket Launch, AdBacklog, Triple Whale — CTR 1,5–2,2%, CPC ~US$0,50–0,70, ROAS ~1,86–1,93x, CVR 1,6–10% por setor
const FREQ_SAUDAVEL = { min: 1.5, max: 2.5 }
const FREQ_ATENCAO = { min: 2.5, max: 3 }
const FREQ_SATURACAO = 3
const FREQ_CRITICO = 4
const CTR_BOM = 1.5
const CTR_MEDIO = 1
const CONV_FORTE = 3
const CONV_MEDIO = 1.5
// Só sugerir valor de aumento de investimento a partir do dia 18 (fase de avaliação), evitando recomendação precoce
const DIAS_MINIMOS_PARA_SUGERIR_AUMENTO = 18

// Ecossistema de estratégia por faixa de investimento: análise e recomendações se adaptam ao capital investido
// suggestedDailyForPlanning: R$/dia de referência para sugerir "duração em dias" no planejamento (valor total ÷ dias)
const STRATEGY_TIERS = {
  baixo: {
    label: 'Baixo',
    dailyInvestMax: 49.99,
    minCreatives: 2,
    maxCreatives: 3,
    description: 'Até ~R$ 50/dia',
    suggestedDailyForPlanning: 35,
  },
  medio: {
    label: 'Médio',
    dailyInvestMax: 299.99,
    minCreatives: 3,
    maxCreatives: 5,
    description: 'R$ 50 a ~R$ 300/dia',
    suggestedDailyForPlanning: 120,
  },
  alto: {
    label: 'Alto',
    dailyInvestMax: Infinity,
    minCreatives: 4,
    maxCreatives: 6,
    description: 'Acima de ~R$ 300/dia',
    suggestedDailyForPlanning: 350,
  },
} as const

export type StrategyTierKey = keyof typeof STRATEGY_TIERS

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading, hasActiveSubscription, isPro } = useAuth()
  const hasAccess = isAuthenticated && isPro

  const [mounted, setMounted] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState<AnalyticsAccordionId | null>(null)
  const [savingDados, setSavingDados] = useState(false)
  const [campaigns, setCampaigns] = useState<AnalyticsCampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignIdState] = useState<string | null>(null)
  const setSelectedCampaignId = (id: string | null) => {
    setSelectedCampaignIdState(id)
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem('analytics_selected_campaign_id', id)
      else window.localStorage.removeItem('analytics_selected_campaign_id')
    }
  }
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignStartDate, setNewCampaignStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [roiEnabled, setRoiEnabled] = useState(false)
  const [valorVenda, setValorVenda] = useState<string>('')
  const [custoVenda, setCustoVenda] = useState<string>('')
  const [metaLucroPorVenda, setMetaLucroPorVenda] = useState<string>('')
  const [alcance, setAlcance] = useState<string>('')
  const [impressoes, setImpressoes] = useState<string>('')
  const [cliquesLink, setCliquesLink] = useState<string>('')
  const [valorInvestido, setValorInvestido] = useState<string>('')
  const [compras, setCompras] = useState<string>('')
  const [valorTotalFaturado, setValorTotalFaturado] = useState<string>('')
  const [savedCampaignSignature, setSavedCampaignSignature] = useState<string>('')
  const [savedCreativesSignature, setSavedCreativesSignature] = useState<string>('')
  const [expandedRecommendationIndex, setExpandedRecommendationIndex] = useState<number | null>(null)
  const [creatives, setCreatives] = useState<AnalyticsCreative[]>([])
  const [creativesLoading, setCreativesLoading] = useState(false)
  const [addingCreative, setAddingCreative] = useState(false)
  const [creativosSubOpen, setCreativosSubOpen] = useState(false)
  const [budgetPhases, setBudgetPhases] = useState<BudgetPhase[]>([])
  const [newPhaseValor, setNewPhaseValor] = useState('')
  const [newPhaseDias, setNewPhaseDias] = useState('')
  const [budgetTypeMeta, setBudgetTypeMeta] = useState<BudgetTypeMeta>(() => {
    if (typeof window === 'undefined') return 'cbo'
    return (localStorage.getItem(BUDGET_TYPE_STORAGE_KEY) === 'abo' ? 'abo' : 'cbo') as BudgetTypeMeta
  })
  const [useAutoDiasRecommendation, setUseAutoDiasRecommendation] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(AUTO_DIAS_RECOMMENDATION_KEY) === '1'
  })
  const [campaignCalendarMonth, setCampaignCalendarMonth] = useState<Date>(() => new Date())
  const [campaignCalendarSelectedDate, setCampaignCalendarSelectedDate] = useState<Date | undefined>(undefined)
  const [filledDatesSet, setFilledDatesSet] = useState<Set<string>>(new Set())
  const [hasExistingAds, setHasExistingAds] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    const v = localStorage.getItem(HAS_EXISTING_ADS_KEY)
    if (v === '1') return true
    if (v === '0') return false
    return null
  })
  const [savedHasExistingAds, setSavedHasExistingAds] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    const v = localStorage.getItem(HAS_EXISTING_ADS_KEY)
    if (v === '1') return true
    if (v === '0') return false
    return null
  })
  const [analyticsProfile, setAnalyticsProfile] = useState<AnalyticsProfileKey>(() => {
    if (typeof window === 'undefined') return 'venda-site'
    const v = localStorage.getItem(ANALYTICS_PROFILE_KEY) as AnalyticsProfileKey | null
    return v && (v === 'venda-site' || v === 'contato-mensagens' || v === 'leads') ? v : 'venda-site'
  })
  const [savedAnalyticsProfile, setSavedAnalyticsProfile] = useState<AnalyticsProfileKey>(() => {
    if (typeof window === 'undefined') return 'venda-site'
    const v = localStorage.getItem(ANALYTICS_PROFILE_KEY) as AnalyticsProfileKey | null
    return v && (v === 'venda-site' || v === 'contato-mensagens' || v === 'leads') ? v : 'venda-site'
  })

  const buildCampaignSignature = () =>
    JSON.stringify({
      roi_enabled: roiEnabled,
      valor_venda: valorVenda.trim(),
      custo_venda: custoVenda.trim(),
      meta_lucro_por_venda: metaLucroPorVenda.trim(),
      alcance: alcance.trim(),
      impressoes: impressoes.trim(),
      cliques_link: cliquesLink.trim(),
      valor_investido: valorInvestido.trim(),
      compras: compras.trim(),
      valor_total_faturado: valorTotalFaturado.trim(),
    })

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

  const buildCreativesSignature = (list: AnalyticsCreative[]) =>
    JSON.stringify(
      list.map((c) => ({
        id: c.id,
        name: (c.name ?? '').trim(),
        alcance: c.alcance ?? '',
        impressoes: c.impressoes ?? '',
        cliques_link: c.cliques_link ?? '',
        valor_investido: c.valor_investido ?? '',
        compras: c.compras ?? '',
        valor_total_faturado: c.valor_total_faturado ?? '',
      }))
    )

  const loadCreatives = async (campaignId: string) => {
    if (!hasAccess) return
    try {
      setCreativesLoading(true)
      const res = await fetch(`/api/analytics/campaigns/${campaignId}/creatives`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar criativos')
      const list = data.creatives || []
      setCreatives(list)
      setSavedCreativesSignature(buildCreativesSignature(list))
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar criativos')
      setCreatives([])
      setSavedCreativesSignature('')
    } finally {
      setCreativesLoading(false)
    }
  }

  const selectedCampaign = selectedCampaignId ? campaigns.find((c) => c.id === selectedCampaignId) : null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && hasAccess) loadCampaigns()
  }, [mounted, hasAccess])

  useEffect(() => {
    if (!mounted || !campaigns.length || selectedCampaignId !== null) return
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('analytics_selected_campaign_id') : null
    if (!stored || !campaigns.some((c) => c.id === stored)) return
    setSelectedCampaignId(stored)
  }, [mounted, campaigns, selectedCampaignId])

  useEffect(() => {
    if (!mounted || !selectedCampaignId || !campaigns.length) return
    const c = campaigns.find((x) => x.id === selectedCampaignId)
    if (c) {
      setRoiEnabled(c.roi_enabled)
      setValorVenda(c.valor_venda != null ? String(c.valor_venda) : '')
      setCustoVenda(c.custo_venda != null ? String(c.custo_venda) : '')
      setMetaLucroPorVenda(c.meta_lucro_por_venda != null ? String(c.meta_lucro_por_venda) : '')
      setAlcance(c.alcance != null ? String(c.alcance) : '')
      setImpressoes(c.impressoes != null ? String(c.impressoes) : '')
      setCliquesLink(c.cliques_link != null ? String(c.cliques_link) : '')
      setValorInvestido(c.valor_investido != null ? String(c.valor_investido) : '')
      setCompras(c.compras != null ? String(c.compras) : '')
      setValorTotalFaturado(c.valor_total_faturado != null ? String(c.valor_total_faturado) : '')
      setSavedCampaignSignature(
        JSON.stringify({
          roi_enabled: c.roi_enabled,
          valor_venda: c.valor_venda != null ? String(c.valor_venda) : '',
          custo_venda: c.custo_venda != null ? String(c.custo_venda) : '',
          meta_lucro_por_venda: c.meta_lucro_por_venda != null ? String(c.meta_lucro_por_venda) : '',
          alcance: c.alcance != null ? String(c.alcance) : '',
          impressoes: c.impressoes != null ? String(c.impressoes) : '',
          cliques_link: c.cliques_link != null ? String(c.cliques_link) : '',
          valor_investido: c.valor_investido != null ? String(c.valor_investido) : '',
          compras: c.compras != null ? String(c.compras) : '',
          valor_total_faturado: c.valor_total_faturado != null ? String(c.valor_total_faturado) : '',
        })
      )
    }
  }, [mounted, selectedCampaignId, campaigns])

  useEffect(() => {
    if (!selectedCampaignId || !hasAccess) {
      setCreatives([])
      setSavedCreativesSignature('')
      return
    }
    setCreativosSubOpen(true)
    loadCreatives(selectedCampaignId)
  }, [selectedCampaignId, hasAccess])

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedCampaignId) {
      setBudgetPhases([])
      return
    }
    try {
      const raw = localStorage.getItem(BUDGET_PHASES_STORAGE_KEY)
      const map = raw ? (JSON.parse(raw) as Record<string, BudgetPhase[]>) : {}
      const phases = Array.isArray(map[selectedCampaignId]) ? map[selectedCampaignId] : []
      setBudgetPhases(phases)
    } catch {
      setBudgetPhases([])
    }
  }, [selectedCampaignId])

  useEffect(() => {
    const camp = selectedCampaignId ? campaigns.find((c) => c.id === selectedCampaignId) : null
    if (camp?.start_date) {
      const start = new Date(camp.start_date + 'T12:00:00')
      setCampaignCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1))
      setCampaignCalendarSelectedDate(undefined)
    }
  }, [selectedCampaignId, campaigns])

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedCampaignId) {
      setFilledDatesSet(new Set())
      return
    }
    try {
      const raw = localStorage.getItem(FILLED_DATES_STORAGE_KEY)
      const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
      const list = Array.isArray(map[selectedCampaignId]) ? map[selectedCampaignId] : []
      setFilledDatesSet(new Set(list))
    } catch {
      setFilledDatesSet(new Set())
    }
  }, [selectedCampaignId])

  const toggleFilledDate = (date: Date) => {
    if (!selectedCampaignId) return
    const key = dateToKey(date)
    const next = new Set(filledDatesSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setFilledDatesSet(next)
    try {
      const raw = localStorage.getItem(FILLED_DATES_STORAGE_KEY)
      const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
      map[selectedCampaignId] = Array.from(next)
      localStorage.setItem(FILLED_DATES_STORAGE_KEY, JSON.stringify(map))
    } catch {}
    toast.success(next.has(key) ? 'Dia marcado como preenchido' : 'Desmarcado')
  }

  const persistBudgetPhases = (campaignId: string, phases: BudgetPhase[]) => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(BUDGET_PHASES_STORAGE_KEY) : null
      const map = raw ? (JSON.parse(raw) as Record<string, BudgetPhase[]>) : {}
      map[campaignId] = phases
      localStorage.setItem(BUDGET_PHASES_STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }

  const addBudgetPhase = () => {
    const valor = parseFloat(String(newPhaseValor).replace(',', '.')) || 0
    const dias = Math.max(1, Math.floor(parseFloat(String(newPhaseDias).replace(',', '.')) || 0))
    if (valor <= 0 || !selectedCampaignId) return
    const phase: BudgetPhase = { id: crypto.randomUUID(), valor, dias }
    const next = [...budgetPhases, phase]
    setBudgetPhases(next)
    persistBudgetPhases(selectedCampaignId, next)
    setNewPhaseValor('')
    setNewPhaseDias('')
    toast.success('Fase de orçamento adicionada')
  }

  const removeLastBudgetPhase = () => {
    if (budgetPhases.length === 0 || !selectedCampaignId) return
    const next = budgetPhases.slice(0, -1)
    setBudgetPhases(next)
    persistBudgetPhases(selectedCampaignId, next)
    toast.success('Última fase removida')
  }

  const removeBudgetPhaseAt = (index: number) => {
    if (index < 0 || index >= budgetPhases.length || !selectedCampaignId) return
    const next = budgetPhases.filter((_, i) => i !== index)
    setBudgetPhases(next)
    persistBudgetPhases(selectedCampaignId, next)
    toast.success('Fase removida')
  }

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(BUDGET_TYPE_STORAGE_KEY, budgetTypeMeta)
  }, [budgetTypeMeta])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (hasExistingAds === null) {
      localStorage.removeItem(HAS_EXISTING_ADS_KEY)
    } else {
      localStorage.setItem(HAS_EXISTING_ADS_KEY, hasExistingAds ? '1' : '0')
    }
  }, [hasExistingAds])

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(ANALYTICS_PROFILE_KEY, analyticsProfile)
  }, [analyticsProfile])

  const profileLabels = getProfileMetricLabels(analyticsProfile)

  const parseNum = (s: string) => parseFloat(String(s).replace(',', '.')) || 0
  const toNum = (s: string) => (s.trim() ? parseNum(s) : 0)
  const valorNum = toNum(valorVenda)
  const custoNum = toNum(custoVenda)
  const lucroBruto = valorNum - custoNum
  const metaLucroNum = toNum(metaLucroPorVenda)

  const aggregatedFromCreatives = useMemo(() => {
    if (!creatives.length) return null
    return {
      alcance: creatives.reduce((a, c) => a + (c.alcance ?? 0), 0),
      impressoes: creatives.reduce((a, c) => a + (c.impressoes ?? 0), 0),
      cliques_link: creatives.reduce((a, c) => a + (c.cliques_link ?? 0), 0),
      valor_investido: creatives.reduce((a, c) => a + (c.valor_investido ?? 0), 0),
      compras: creatives.reduce((a, c) => a + (c.compras ?? 0), 0),
      valor_total_faturado: creatives.reduce((a, c) => a + (c.valor_total_faturado ?? 0), 0),
    }
  }, [creatives])

  const alcanceNum = aggregatedFromCreatives
    ? aggregatedFromCreatives.alcance
    : toNum(alcance)
  const impressoesNum = aggregatedFromCreatives
    ? aggregatedFromCreatives.impressoes
    : toNum(impressoes)
  const cliquesNum = aggregatedFromCreatives
    ? aggregatedFromCreatives.cliques_link
    : toNum(cliquesLink)
  const valorInvestidoNum = aggregatedFromCreatives
    ? aggregatedFromCreatives.valor_investido
    : toNum(valorInvestido)
  const comprasNum = aggregatedFromCreatives
    ? aggregatedFromCreatives.compras
    : toNum(compras)
  const valorFaturadoNum = aggregatedFromCreatives
    ? aggregatedFromCreatives.valor_total_faturado
    : toNum(valorTotalFaturado)
  const custoMaxAceitavel = useMemo(() => {
    if (lucroBruto <= 0) return 0
    if (metaLucroNum > 0) return Math.max(0, lucroBruto - metaLucroNum)
    return lucroBruto
  }, [lucroBruto, metaLucroNum])
  const metricasCampanha = useMemo(() => {
    const freq = alcanceNum > 0 ? impressoesNum / alcanceNum : 0
    const ctrPct = impressoesNum > 0 ? (cliquesNum / impressoesNum) * 100 : 0
    const taxaConvPct = cliquesNum > 0 ? (comprasNum / cliquesNum) * 100 : 0
    const cpc = cliquesNum > 0 ? valorInvestidoNum / cliquesNum : 0
    const cpaCalculado = comprasNum > 0 ? valorInvestidoNum / comprasNum : 0
    const roas = valorInvestidoNum > 0 ? valorFaturadoNum / valorInvestidoNum : 0
    const cpm = impressoesNum > 0 && valorInvestidoNum > 0 ? (valorInvestidoNum / impressoesNum) * 1000 : 0
    return { freq, ctrPct, taxaConvPct, cpc, cpaCalculado, roas, cpm }
  }, [alcanceNum, impressoesNum, cliquesNum, valorInvestidoNum, comprasNum, valorFaturadoNum])

  // Estratégia adaptada ao investimento: tier definido pelo investimento médio/dia (após 3+ dias) ou padrão "médio"
  const strategyTier = useMemo(() => {
    const config = STRATEGY_TIERS
    let investimentoMedioPorDia = 0
    let daysSinceStart = 0
    if (selectedCampaign?.start_date && valorInvestidoNum > 0) {
      const start = new Date(selectedCampaign.start_date + 'T12:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      start.setHours(0, 0, 0, 0)
      daysSinceStart = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
      investimentoMedioPorDia = valorInvestidoNum / Math.max(1, daysSinceStart)
    }
    let tier: StrategyTierKey = 'medio'
    if (investimentoMedioPorDia > 0 && daysSinceStart >= 3) {
      if (investimentoMedioPorDia <= config.baixo.dailyInvestMax) tier = 'baixo'
      else if (investimentoMedioPorDia <= config.medio.dailyInvestMax) tier = 'medio'
      else tier = 'alto'
    }
    const t = config[tier]
    return {
      tier,
      investimentoMedioPorDia: investimentoMedioPorDia > 0 ? investimentoMedioPorDia : null,
      minCreatives: t.minCreatives,
      maxCreatives: t.maxCreatives,
      label: t.label,
      description: t.description,
    }
  }, [selectedCampaign?.start_date, selectedCampaign, valorInvestidoNum])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTO_DIAS_RECOMMENDATION_KEY, useAutoDiasRecommendation ? '1' : '0')
    }
  }, [useAutoDiasRecommendation])

  // Quando "usar recomendação automática" está ligado, preenche duração (dias) conforme o nível da estratégia
  const suggestedDailyForPlanning = STRATEGY_TIERS[strategyTier.tier].suggestedDailyForPlanning
  useEffect(() => {
    if (!useAutoDiasRecommendation || !selectedCampaignId) return
    const v = parseFloat(String(newPhaseValor).replace(',', '.')) || 0
    if (v <= 0) return
    const dias = Math.max(1, Math.round(v / suggestedDailyForPlanning))
    setNewPhaseDias(String(dias))
  }, [useAutoDiasRecommendation, newPhaseValor, selectedCampaignId, suggestedDailyForPlanning])

  useEffect(() => {
    if (!selectedCampaign?.start_date) {
      setCampaignCalendarSelectedDate(undefined)
      return
    }
    const start = new Date(selectedCampaign.start_date + 'T12:00:00')
    start.setHours(0, 0, 0, 0)
    setCampaignCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1))
    setCampaignCalendarSelectedDate((prev) => (prev ? prev : start))
  }, [selectedCampaign?.start_date])

  const { score, statusGeral, statusAlerts, hasDataForDiagnosis } = useMemo(() => {
    // Campanha pausada: mostrar estado dedicado em vez de diagnóstico ativo
    if (selectedCampaign && !selectedCampaign.is_active) {
      return {
        score: 0,
        statusGeral: 'pausada' as const,
        statusAlerts: [{
          type: 'warning' as const,
          action: 'Campanha pausada',
          details: ['Esta campanha está pausada. Ative-a na seção Campanhas para voltar a rodar os anúncios e ver o diagnóstico completo.'],
        }] as { type: 'success' | 'warning' | 'danger'; action: string; details: string[] }[],
        hasDataForDiagnosis: true,
      }
    }
    // Só considera que há dados quando existir pelo menos uma métrica dos criativos/campanha
    const hasData =
      impressoesNum > 0 ||
      valorInvestidoNum > 0 ||
      comprasNum > 0
    if (!hasData) {
      return {
        score: 0,
        statusGeral: 'sem_dados' as const,
        statusAlerts: [] as { type: 'success' | 'warning' | 'danger'; action: string; details: string[] }[],
        hasDataForDiagnosis: false,
      }
    }
    type AlertItem = { type: 'success' | 'warning' | 'danger'; action: string; detail: string }
    const labels = profileLabels
    const alerts: AlertItem[] = []
    let scoreFreq = 20
    let scoreCtr = 20
    let scoreConv = 20
    let scoreCpa = 20
    let scoreLucro = 20
    const { freq, ctrPct, taxaConvPct, cpaCalculado } = metricasCampanha
    const cpaUsado = comprasNum > 0 ? cpaCalculado : 0
    if (alcanceNum > 0 && impressoesNum > 0) {
      const freqStr = freq.toFixed(2).replace('.', ',')
      if (freq >= FREQ_CRITICO) {
        scoreFreq = 0
        alerts.push({ type: 'danger', action: 'Trocar criativo.', detail: `Frequência ${freqStr} → ideal <4` })
      } else if (freq > FREQ_SATURACAO) {
        scoreFreq = 5
        alerts.push({ type: 'warning', action: 'Avaliar novo criativo.', detail: `Frequência ${freqStr} → ideal ≤3` })
      } else if (freq > FREQ_ATENCAO.max) {
        scoreFreq = 10
        alerts.push({ type: 'warning', action: 'Acompanhar.', detail: `Frequência ${freqStr} (entre 2,5 e 3)` })
      } else if (freq >= FREQ_SAUDAVEL.min && freq <= FREQ_SAUDAVEL.max) {
        scoreFreq = 20
      }
    } else {
      scoreFreq = 20
    }
    if (impressoesNum > 0 && cliquesNum >= 0) {
      const ctrStr = ctrPct.toFixed(2).replace('.', ',')
      if (ctrPct >= CTR_BOM) scoreCtr = 20
      else if (ctrPct >= CTR_MEDIO) {
        scoreCtr = 12
        alerts.push({ type: 'warning', action: 'Testar novo criativo.', detail: `CTR ${ctrStr}% → ideal ≥1,5%` })
      } else if (ctrPct > 0) {
        scoreCtr = 5
        alerts.push({ type: 'warning', action: 'Testar novo criativo.', detail: `CTR ${ctrStr}% → ideal ≥1%` })
      }
    }
    if (cliquesNum > 0 && comprasNum >= 0) {
      const convStr = taxaConvPct.toFixed(2).replace('.', ',')
      if (taxaConvPct >= CONV_FORTE) scoreConv = 20
      else if (taxaConvPct >= CONV_MEDIO) scoreConv = 12
      else if (taxaConvPct > 0) {
        scoreConv = 5
        alerts.push({ type: 'warning', action: 'Revisar oferta ou página.', detail: `Conversão ${convStr}% → ideal ≥1,5%` })
      }
    }
    if (roiEnabled && valorNum > 0) {
      const lucroStr = `R$ ${lucroBruto.toFixed(2).replace('.', ',')}`
      const cpaAcimaDoLimite = custoMaxAceitavel > 0 && cpaUsado > 0 && cpaUsado > custoMaxAceitavel
      const lucroRealPorVenda = cpaUsado > 0 ? lucroBruto - cpaUsado : lucroBruto
      if (lucroBruto <= 0) {
        scoreLucro = 0
        alerts.push({ type: 'danger', action: 'Ajustar preço ou custo.', detail: `Lucro ${lucroStr} (prejuízo)` })
      } else if (metaLucroNum > 0 && lucroBruto >= metaLucroNum && !cpaAcimaDoLimite) {
        scoreLucro = 20
        alerts.push({ type: 'success', action: 'Dentro da meta.', detail: `Lucro ${lucroStr}` })
      } else if (lucroBruto > 0) {
        scoreLucro = 15
      }
      if (custoMaxAceitavel > 0 && cpaUsado > 0) {
        const cpaStr = `R$ ${cpaUsado.toFixed(2).replace('.', ',')}`
        const limiteStr = `R$ ${custoMaxAceitavel.toFixed(2).replace('.', ',')}`
        if (cpaUsado > lucroBruto) {
          scoreCpa = 0
          alerts.push({ type: 'danger', action: 'Não escalar.', detail: `${labels.custoPorResultadoShort} ${cpaStr} > lucro ${lucroStr} (prejuízo por aquisição)` })
        } else if (cpaUsado > custoMaxAceitavel) {
          scoreCpa = 0
          const lucroRealStr = `R$ ${lucroRealPorVenda.toFixed(2).replace('.', ',')}`
          const metaStr = metaLucroNum > 0 ? ` (meta R$ ${metaLucroNum.toFixed(2).replace('.', ',')})` : ''
          alerts.push({
            type: 'danger',
            action: 'Não escalar.',
            detail: `${labels.custoPorResultadoShort} ${cpaStr} > limite ${limiteStr}. Lucro real por venda: ${lucroRealStr}${metaStr}.`,
          })
        } else if (cpaUsado >= custoMaxAceitavel * 0.98) {
          scoreCpa = 8
          alerts.push({ type: 'warning', action: 'Não escalar.', detail: `${labels.custoPorResultadoShort} ${cpaStr} no limite ${limiteStr}` })
        } else if (cpaUsado < custoMaxAceitavel * 0.8) {
          scoreCpa = 20
          let action: string
          let detail: string
          if (selectedCampaign?.start_date && valorInvestidoNum > 0) {
            const start = new Date(selectedCampaign.start_date + 'T12:00:00')
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            start.setHours(0, 0, 0, 0)
            const daysSinceStart = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
            const investimentoPorDia = valorInvestidoNum / daysSinceStart
            if (daysSinceStart >= DIAS_MINIMOS_PARA_SUGERIR_AUMENTO && investimentoPorDia > 0) {
              action = 'Pode escalar.'
              const scaleMin = investimentoPorDia * 0.15
              const scaleMax = investimentoPorDia * 0.2
              detail = `${labels.custoPorResultadoShort} ${cpaStr} < limite ${limiteStr}. Invest. médio/dia: R$ ${investimentoPorDia.toFixed(2).replace('.', ',')}. Pode aumentar R$ ${scaleMin.toFixed(2).replace('.', ',')} a R$ ${scaleMax.toFixed(2).replace('.', ',')}/dia (15–20%).`
            } else if (daysSinceStart < 7) {
              action = `${labels.custoPorResultadoShort} dentro do limite.`
              detail = `${labels.custoPorResultadoShort} ${cpaStr} < limite ${limiteStr}. Fase de aprendizado (dia 1–5): não altere o orçamento. A partir do dia 18 o sistema poderá sugerir aumento de investimento.`
            } else {
              action = `${labels.custoPorResultadoShort} dentro do limite.`
              detail = `${labels.custoPorResultadoShort} ${cpaStr} < limite ${limiteStr}. A partir do dia ${DIAS_MINIMOS_PARA_SUGERIR_AUMENTO} o sistema sugerirá valor de aumento (15–20% ao dia).`
            }
          } else {
            action = `${labels.custoPorResultadoShort} dentro do limite.`
            detail = `${labels.custoPorResultadoShort} ${cpaStr} < limite ${limiteStr}`
          }
          alerts.push({ type: 'success', action, detail })
        } else {
          scoreCpa = 15
        }
      }
    }
    const total = scoreFreq + scoreCtr + scoreConv + scoreCpa + scoreLucro
    const scoreFinal = Math.min(100, total)
    let statusGeral: 'saudável' | 'estável' | 'alerta' | 'crítica' = 'saudável'
    if (scoreFinal >= 80) statusGeral = 'saudável'
    else if (scoreFinal >= 60) statusGeral = 'estável'
    else if (scoreFinal >= 40) statusGeral = 'alerta'
    else statusGeral = 'crítica'
    if (statusGeral === 'saudável' && alerts.length === 0 && roiEnabled && valorNum > 0 && cpaUsado > 0 && cpaUsado < lucroBruto) {
      let action: string
      let scaleDetail: string
      if (selectedCampaign?.start_date && valorInvestidoNum > 0) {
        const start = new Date(selectedCampaign.start_date + 'T12:00:00')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        start.setHours(0, 0, 0, 0)
        const daysSinceStart = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
        const investimentoPorDia = valorInvestidoNum / daysSinceStart
        if (daysSinceStart >= DIAS_MINIMOS_PARA_SUGERIR_AUMENTO && investimentoPorDia > 0) {
          action = 'Pode escalar.'
          const scaleMin = investimentoPorDia * 0.15
          const scaleMax = investimentoPorDia * 0.2
          scaleDetail = `Investimento médio por dia: R$ ${investimentoPorDia.toFixed(2).replace('.', ',')}. Pode aumentar em R$ ${scaleMin.toFixed(2).replace('.', ',')} a R$ ${scaleMax.toFixed(2).replace('.', ',')} por dia (15–20%).`
        } else if (daysSinceStart < 7) {
          action = 'Métricas dentro da meta.'
          scaleDetail = 'Fase de aprendizado (dia 1–5): não altere o orçamento. A partir do dia 18 o sistema poderá sugerir aumento de investimento.'
        } else {
          action = 'Métricas dentro da meta.'
          scaleDetail = `A partir do dia ${DIAS_MINIMOS_PARA_SUGERIR_AUMENTO} o sistema sugerirá valor de aumento (15–20% ao dia).`
        }
      } else {
        action = 'Campanha saudável.'
        scaleDetail = 'Métricas dentro da meta.'
      }
      alerts.push({
        type: 'success',
        action,
        detail: scaleDetail,
      })
    }
    if (statusGeral === 'estável') {
      alerts.push({ type: 'warning', action: 'Otimizar criativo ou público.', detail: `Score ${scoreFinal}. Otimizar antes de escalar.` })
    }
    if (statusGeral === 'alerta') {
      alerts.push({ type: 'warning', action: 'Ajustar criativo ou público.', detail: `Score ${scoreFinal} em alerta.` })
    }
    if (statusGeral === 'crítica') {
      alerts.push({ type: 'danger', action: 'Revisar estratégia.', detail: `Score ${scoreFinal} crítico.` })
    }
    // Estratégia por investimento: quantidade de criativos ideal (min/max) conforme tier
    const { minCreatives, maxCreatives, label: tierLabel } = strategyTier
    const activeCreativesCount = creatives.length
    if (activeCreativesCount > 0) {
      if (activeCreativesCount === 1) {
        alerts.push({
          type: 'warning',
          action: 'Risco de saturação com 1 criativo.',
          detail: `Recomendado ter entre ${minCreatives} e ${maxCreatives} criativos ativos (estratégia ${tierLabel}). Adicione criativos para o algoritmo performar melhor.`,
        })
      } else if (activeCreativesCount < minCreatives) {
        alerts.push({
          type: 'warning',
          action: `Adicione criativos (estratégia ${tierLabel}).`,
          detail: `Para seu nível de investimento o ideal é manter entre ${minCreatives} e ${maxCreatives} criativos ativos. Você tem ${activeCreativesCount}.`,
        })
      } else if (activeCreativesCount > maxCreatives) {
        alerts.push({
          type: 'warning',
          action: `Muitos criativos para o orçamento (estratégia ${tierLabel}).`,
          detail: `Ideal entre ${minCreatives} e ${maxCreatives} ativos. Você tem ${activeCreativesCount}. Considere pausar os piores e manter os melhores.`,
        })
      }
    }
    if (creatives.length > 0) {
      for (const cr of creatives) {
        const cAlc = cr.alcance ?? 0
        const cImp = cr.impressoes ?? 0
        const cCliques = cr.cliques_link ?? 0
        if (cAlc <= 0 && cImp <= 0) continue
        const cFreq = cAlc > 0 ? (cImp / cAlc) : 0
        const cCtrPct = cImp > 0 ? (cCliques / cImp) * 100 : 0
        const name = (cr.name || 'Criativo').trim() || 'Criativo'
        const underperforming = (cAlc > 0 && cImp > 0 && cFreq >= FREQ_CRITICO) ||
          (cAlc > 0 && cImp > 0 && cFreq > FREQ_SATURACAO) ||
          (cImp > 0 && cCtrPct > 0 && cCtrPct < CTR_MEDIO)
        if (cAlc > 0 && cImp > 0 && cFreq >= FREQ_CRITICO) {
          alerts.push({ type: 'danger', action: `Trocar o criativo "${name}".`, detail: `Frequência ${cFreq.toFixed(2).replace('.', ',')} → ideal <4` })
        } else if (cAlc > 0 && cImp > 0 && cFreq > FREQ_SATURACAO) {
          alerts.push({ type: 'warning', action: `Avaliar novo criativo: "${name}".`, detail: `Frequência ${cFreq.toFixed(2).replace('.', ',')} → ideal ≤3` })
        }
        if (cImp > 0 && cCtrPct > 0 && cCtrPct < CTR_MEDIO) {
          alerts.push({ type: 'warning', action: `Testar novo criativo: "${name}".`, detail: `CTR ${cCtrPct.toFixed(2).replace('.', ',')}% → ideal ≥1%` })
        }
        if (underperforming) {
          alerts.push({
            type: 'warning',
            action: `Pausar ou excluir o criativo "${name}".`,
            detail: 'Performando mal. Pause no Meta e exclua aqui para alinhar o painel; depois adicione um novo criativo se quiser.',
          })
        }
      }
    }
    const severity = (t: AlertItem['type']) => (t === 'danger' ? 3 : t === 'warning' ? 2 : 1)
    const grouped = new Map<string, { type: AlertItem['type']; action: string; details: string[] }>()
    for (const a of alerts) {
      const key = a.action
      const existing = grouped.get(key)
      if (existing) {
        existing.details.push(a.detail)
        if (severity(a.type) > severity(existing.type)) existing.type = a.type
      } else {
        grouped.set(key, { type: a.type, action: a.action, details: [a.detail] })
      }
    }
    const statusAlerts = Array.from(grouped.values())
    return { score: scoreFinal, statusGeral, statusAlerts, hasDataForDiagnosis: true }
  }, [
    metricasCampanha,
    roiEnabled,
    valorNum,
    lucroBruto,
    custoMaxAceitavel,
    metaLucroNum,
    comprasNum,
    alcanceNum,
    impressoesNum,
    cliquesNum,
    selectedCampaign,
    valorInvestidoNum,
    creatives,
    strategyTier,
    profileLabels,
    selectedCampaign,
  ])
  const lucroPorVenda = lucroBruto

  const planoOtimizacao = useMemo(() => {
    if (!selectedCampaign?.start_date) {
      return { daysSinceStart: null as number | null, phase: null as string | null, phaseLabel: '', phaseSteps: [] as string[], isPaused: false, strategyTier }
    }
    const start = new Date(selectedCampaign.start_date + 'T12:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
    const isPaused = !selectedCampaign.is_active
    const { minCreatives, maxCreatives } = strategyTier
    const creativesRange = `${minCreatives}–${maxCreatives}`
    let phase: string
    let phaseLabel: string
    let phaseSteps: string[]
    if (daysSinceStart <= 5) {
      phase = 'aprendizado'
      phaseLabel = 'Dia 1 a 5 — Fase de aprendizado'
      phaseSteps = [
        'Não mexer no orçamento nem nos criativos (fase de aprendizado do algoritmo).',
        'Deixe o Meta otimizar; alterações agora atrapalham a entrega.',
        'Atualize os dados da campanha nos próximos dias para acompanhar métricas no painel.',
      ]
    } else if (daysSinceStart <= 9) {
      phase = 'analise-7'
      phaseLabel = 'Dia 7 — Primeira análise'
      phaseSteps = [
        'Analisar métricas principais: CTR (taxa de cliques no link), CPC (custo por clique) e CPA (custo por aquisição).',
        `Pausar 1 ou 2 piores criativos no Meta. Manter pelo menos ${minCreatives} ativos (meta ${creativesRange} para seu nível de investimento).`,
        'Desativar os ruins e manter os bons evita desperdício e melhora o resultado.',
        'Atualize os dados da campanha aqui para o sistema recomendar os próximos passos.',
      ]
    } else if (daysSinceStart <= 17) {
      phase = 'novos-criativos'
      phaseLabel = 'Dia 10 a 14 — Novos criativos'
      phaseSteps = [
        `Criar 1 ou 2 novos criativos para voltar ao total de ${creativesRange} ativos.`,
        'Repor criativos mantém o algoritmo saudável e evita saturação do público.',
        'Sempre substituir os fracos por novos; nunca deixar cair para 1 criativo só.',
      ]
    } else {
      phase = 'avaliacao'
      phaseLabel = 'Dia 18+ — Avaliação e modelo contínuo'
      phaseSteps = [
        'Avaliação geral. Se estiver lucrativo: manter rodando, escalar 15–20% ao dia se desejar, ou manter orçamento fixo.',
        `Manter entre ${minCreatives} e ${maxCreatives} criativos ativos. Nunca deixar cair para 1 só; ideal ${creativesRange}.`,
        'Criar novos criativos para repor e manter ciclo contínuo; substituir os fracos pelos bons.',
        'Modelo contínuo: sempre manter mínimo de criativos ativos e repor os que saturarem.',
      ]
    }
    return { daysSinceStart, phase, phaseLabel, phaseSteps, isPaused, strategyTier }
  }, [selectedCampaign, strategyTier])

  const currentCampaignSignature = useMemo(() => buildCampaignSignature(), [
    roiEnabled,
    valorVenda,
    custoVenda,
    metaLucroPorVenda,
    alcance,
    impressoes,
    cliquesLink,
    valorInvestido,
    compras,
    valorTotalFaturado,
  ])
  const currentCreativesSignature = useMemo(() => buildCreativesSignature(creatives), [creatives])
  const isCampaignSigDirty = !!selectedCampaignId && savedCampaignSignature.length > 0 && currentCampaignSignature !== savedCampaignSignature
  const isCreativesDirty =
    !!selectedCampaignId &&
    creatives.length > 0 &&
    savedCreativesSignature.length > 0 &&
    currentCreativesSignature !== savedCreativesSignature
  const isProfileDirty = isCampaignSigDirty || isCreativesDirty
  const isEstrategiaDirty = isProfileDirty || analyticsProfile !== savedAnalyticsProfile
  const isDadosCampanhaComplete =
    !!selectedCampaignId &&
    creatives.length > 0 &&
    creatives.every(
      (c) =>
        (c.name ?? '').trim().length > 0 &&
        [c.alcance, c.impressoes, c.cliques_link, c.valor_investido, c.compras, c.valor_total_faturado].every(
          (v) => v != null
        )
    )
  const isRoiComplete = !roiEnabled || (roiEnabled && (valorVenda ?? '').trim().length > 0)

  const isInicioDirty = hasExistingAds !== savedHasExistingAds

  const getAccordionCardClass = (sectionId: AnalyticsAccordionId): string => {
    if (sectionId === 'inicio') {
      if (isInicioDirty) return 'bg-emerald-50/80 border-emerald-300'
      return 'bg-white border-gogh-grayLight'
    }
    if (sectionId === 'status') return 'bg-white border-gogh-grayLight'
    if (sectionId === 'estrategia') {
      if (!isEstrategiaDirty) return 'bg-white border-gogh-grayLight'
      return isRoiComplete ? 'bg-emerald-50/80 border-emerald-300' : 'bg-red-50/80 border-red-300'
    }
    if (sectionId === 'campanhas') {
      if (campaignsLoading || creativesLoading || (selectedCampaignId && campaigns.length === 0))
        return 'bg-white border-gogh-grayLight'
      const campanhasDirty = isProfileDirty
      const campanhasIncomplete = selectedCampaignId && !isDadosCampanhaComplete
      if (campanhasDirty || campanhasIncomplete)
        return isDadosCampanhaComplete ? 'bg-emerald-50/80 border-emerald-300' : 'bg-red-50/80 border-red-300'
      return 'bg-white border-gogh-grayLight'
    }
    return 'bg-white border-gogh-grayLight'
  }

  const getFieldBorderClass = (sectionId: AnalyticsAccordionId): string => {
    if (sectionId === 'estrategia' && !isEstrategiaDirty) return 'border-gogh-grayLight'
    if (sectionId === 'estrategia') return isRoiComplete ? 'border-emerald-400 focus:ring-emerald-200' : 'border-red-300 focus:ring-red-200'
    if (!isProfileDirty) return 'border-gogh-grayLight'
    return 'border-gogh-grayLight'
  }

  const toggleAccordion = (id: AnalyticsAccordionId) => {
    setAccordionOpen((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    if (accordionOpen) {
      const el = document.getElementById(`analytics-accordion-${accordionOpen}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [accordionOpen])

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
      const crRes = await fetch(`/api/analytics/campaigns/${data.campaign.id}/creatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: 'Criativo 1' }),
      })
      if (crRes.ok) await loadCreatives(data.campaign.id)
      toast.success('Campanha criada. Preencha os dados do criativo.')
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
    if (!confirm('Excluir esta campanha? Todos os dados salvos nela serão apagados permanentemente.')) return
    try {
      const res = await fetch(`/api/analytics/campaigns/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir')
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      if (selectedCampaignId === id) setSelectedCampaignId(null)
      setCreatives([])
      toast.success('Campanha excluída')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir')
    }
  }

  const handleAddCreative = async () => {
    if (!selectedCampaignId) return
    setAddingCreative(true)
    try {
      const res = await fetch(`/api/analytics/campaigns/${selectedCampaignId}/creatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: `Criativo ${creatives.length + 1}` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar criativo')
      setCreatives((prev) => [...prev, data.creative])
      toast.success('Criativo adicionado. Preencha os dados abaixo.')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao adicionar criativo')
    } finally {
      setAddingCreative(false)
    }
  }

  const handleDeleteCreative = async (creativeId: string) => {
    if (!selectedCampaignId || !confirm('Excluir este criativo? Os dados dele serão apagados.')) return
    try {
      const res = await fetch(`/api/analytics/campaigns/${selectedCampaignId}/creatives/${creativeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir')
      }
      setCreatives((prev) => prev.filter((c) => c.id !== creativeId))
      toast.success('Criativo excluído')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir criativo')
    }
  }

  const canSaveProfile = selectedCampaignId && isRoiComplete && (isProfileDirty || isInicioDirty || analyticsProfile !== savedAnalyticsProfile)

  const handleSaveProfile = async () => {
    if (!selectedCampaignId) return
    if (creatives.length > 0) {
      const incomplete = creatives.find(
        (c) =>
          !(c.name ?? '').trim() ||
          [c.alcance, c.impressoes, c.cliques_link, c.valor_investido, c.compras, c.valor_total_faturado].some((v) => v == null)
      )
      if (incomplete) {
        toast.error('Preencha nome e todas as métricas de cada criativo antes de salvar.')
        return
      }
    }
    setSavingDados(true)
    try {
      const body: Record<string, unknown> = {
        roi_enabled: roiEnabled,
        valor_venda: valorVenda ? parseNum(valorVenda) : null,
        custo_venda: custoVenda ? parseNum(custoVenda) : null,
        meta_lucro_por_venda: metaLucroPorVenda ? parseNum(metaLucroPorVenda) : null,
        custo_por_aquisicao: comprasNum > 0 ? metricasCampanha.cpaCalculado : null,
      }
      const res = await fetch(`/api/analytics/campaigns/${selectedCampaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      setCampaigns((prev) => prev.map((c) => (c.id === selectedCampaignId ? { ...c, ...data.campaign } : c)))
      setSavedCampaignSignature(currentCampaignSignature)

      if (creatives.length > 0) {
        for (const cr of creatives) {
          const crRes = await fetch(`/api/analytics/campaigns/${selectedCampaignId}/creatives/${cr.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: (cr.name ?? '').trim() || null,
              alcance: cr.alcance != null ? Number(cr.alcance) : null,
              impressoes: cr.impressoes != null ? Number(cr.impressoes) : null,
              cliques_link: cr.cliques_link != null ? Number(cr.cliques_link) : null,
              valor_investido: cr.valor_investido != null ? Number(cr.valor_investido) : null,
              compras: cr.compras != null ? Number(cr.compras) : null,
              valor_total_faturado: cr.valor_total_faturado != null ? Number(cr.valor_total_faturado) : null,
            }),
          })
          const crData = await crRes.json()
          if (!crRes.ok) throw new Error(crData.error || 'Erro ao salvar criativo')
        }
        setSavedCreativesSignature(currentCreativesSignature)
      }

      toast.success('Configurações salvas.')
      localStorage.setItem('gogh_analytics_ja_salvou', '1')
      setSavedHasExistingAds(hasExistingAds)
      setSavedAnalyticsProfile(analyticsProfile)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar')
    } finally {
      setSavingDados(false)
    }
  }

  const accordionCard = (
    id: AnalyticsAccordionId,
    title: string,
    subtitle: string | null,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => (
    <div id={`analytics-accordion-${id}`} className={`rounded-lg border transition-colors overflow-hidden ${getAccordionCardClass(id)}`}>
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
    <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige pb-12 px-4 pt-2 sm:pt-4 md:pt-12">
      {authLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <LumaSpin size="lg" className="text-gogh-grayDark" />
        </div>
      ) : (
      <div className="container mx-auto max-w-5xl space-y-5 sm:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gogh-black flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-gogh-yellow" />
              Gogh Analytics Ads
            </h1>
            <p className="text-sm text-gogh-grayDark mt-0.5">Análise de anúncios e desempenho</p>
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
                  {!hasActiveSubscription ? 'Assine o Gogh Pro para acessar' : 'Gogh Analytics Ads é exclusivo do Plano Pro'}
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
            {hasAccess && !mounted && (
              <div className="flex justify-center py-12">
                <LumaSpin size="default" className="text-gogh-grayDark" />
              </div>
            )}
            {hasAccess && mounted && (
              <section className="bg-white rounded-2xl border border-gogh-grayLight p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gogh-black">Painel de campanhas</h2>
                  <p className="text-xs text-gogh-grayDark mt-0.5">Preencha os dados das campanhas e acompanhe métricas, custos e recomendações.</p>
                </div>
                <div className="space-y-2">
                {accordionCard(
                  'inicio',
                  'Como você está?',
                  hasExistingAds === true ? 'Já tenho anúncio ou campanha' : hasExistingAds === false ? 'Vou criar do zero' : 'Defina para personalizar o fluxo',
                  <Target className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <p className="text-sm text-gogh-grayDark">
                      Assim o painel se adapta: quem já tem anúncio/campanha rodando continua com gestão e análise; quem ainda não tem nada criado segue do planejamento até a criação.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setHasExistingAds(true)
                          if (typeof window !== 'undefined') localStorage.setItem(HAS_EXISTING_ADS_KEY, '1')
                        }}
                        className={`rounded-xl border-2 p-4 text-left transition-colors ${hasExistingAds === true ? 'border-gogh-yellow bg-gogh-yellow/10' : 'border-gogh-grayLight hover:border-gogh-grayLight/80 bg-white'}`}
                      >
                        <span className="block font-medium text-gogh-black">Já tenho anúncio ou campanha rodando</span>
                        <span className="block text-xs text-gogh-grayDark mt-0.5">Quero continuar com gestão e análise dos dados.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasExistingAds(false)
                          if (typeof window !== 'undefined') localStorage.setItem(HAS_EXISTING_ADS_KEY, '0')
                        }}
                        className={`rounded-xl border-2 p-4 text-left transition-colors ${hasExistingAds === false ? 'border-gogh-yellow bg-gogh-yellow/10' : 'border-gogh-grayLight hover:border-gogh-grayLight/80 bg-white'}`}
                      >
                        <span className="block font-medium text-gogh-black">Ainda não tenho nada criado</span>
                        <span className="block text-xs text-gogh-grayDark mt-0.5">Preciso criar estratégia, campanhas e anúncios do zero.</span>
                      </button>
                    </div>
                  </div>
                )}

                {accordionCard(
                  'estrategia',
                  'Análise, estratégia e planejamento',
                  selectedCampaignId && planoOtimizacao.daysSinceStart != null
                    ? `Nível ${strategyTier.label} · Dia ${planoOtimizacao.daysSinceStart} — Perfil, valores, agenda de ações e status`
                    : 'Perfil de venda, planejamento de valores, orçamento por fases, agenda de ações e status. Tudo para analisar, planejar e decidir.',
                  <TrendingUp className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <p className="text-sm text-gogh-grayDark -mt-1">
                      Nesta seção: perfil de análise (forma de venda), valores do negócio, nível de investimento, planejamento de orçamento por fases, calendário com ações por dia e resumo de status. Use para tomar decisões com base nos dados.
                    </p>
                    <div className="rounded-lg border-2 border-gogh-yellow/50 bg-gogh-yellow/5 p-3 space-y-2">
                      <p className="text-xs font-semibold text-gogh-black flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-gogh-yellow" />
                        Perfil de análise (forma de venda)
                      </p>
                      <p className="text-[11px] text-gogh-grayDark">
                        Defina como seu negócio vende ou gera resultados. Os campos de preenchimento, métricas e recomendações do Status se adaptam a este perfil.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(ANALYTICS_PROFILES) as AnalyticsProfileKey[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setAnalyticsProfile(key)
                              if (typeof window !== 'undefined') localStorage.setItem(ANALYTICS_PROFILE_KEY, key)
                            }}
                            className={`rounded-xl border-2 px-3 py-2 text-left text-xs transition-colors ${analyticsProfile === key ? 'border-gogh-yellow bg-gogh-yellow/20' : 'border-gogh-grayLight bg-white hover:border-gogh-grayDark/30'}`}
                          >
                            <span className="font-medium text-gogh-black block">{ANALYTICS_PROFILES[key].label}</span>
                            <span className="text-[10px] text-gogh-grayDark line-clamp-2">{ANALYTICS_PROFILES[key].description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gogh-grayDark">
                      Configure valores do negócio (para o Status usar lucro e CPA) e a estratégia por investimento da campanha.
                    </p>
                    <div className="rounded-lg border border-gogh-grayLight bg-gogh-beige/20 p-3 space-y-3">
                      <p className="text-xs font-semibold text-gogh-black flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-gogh-yellow" />
                        Planejamento de valores
                      </p>
                      <p className="text-xs text-gogh-grayDark">
                        Não são dados do Meta. Valor da venda e custo por venda para o sistema refletir lucro e recomendações no Status.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roiEnabled}
                          onChange={(e) => setRoiEnabled(e.target.checked)}
                          className="rounded border-gogh-grayLight"
                        />
                        <span className="text-xs font-medium text-gogh-grayDark">Usar planejamento de valores no status (valor da venda, custo, lucro)</span>
                      </label>
                      {roiEnabled && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[11px] font-medium text-gogh-grayDark mb-0.5">Preço (R$)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={valorVenda}
                                onChange={(e) => setValorVenda(e.target.value)}
                                placeholder="Ex: 97"
                                className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:ring-2 ${getFieldBorderClass('estrategia')}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gogh-grayDark mb-0.5">Custo por venda (R$)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={custoVenda}
                                onChange={(e) => setCustoVenda(e.target.value)}
                                placeholder="0"
                                className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:ring-2 ${getFieldBorderClass('estrategia')}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gogh-grayDark mb-0.5">Meta lucro/venda (R$) — opc.</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={metaLucroPorVenda}
                                onChange={(e) => setMetaLucroPorVenda(e.target.value)}
                                placeholder="Ex: 20"
                                className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:ring-2 ${getFieldBorderClass('estrategia')}`}
                              />
                            </div>
                          </div>
                          {valorNum > 0 ? (
                            <div className={`rounded-md border p-1.5 text-[11px] max-w-full ${
                              lucroPorVenda > 0 ? 'bg-green-50 border-green-200' : lucroPorVenda < 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                            }`}>
                              <span className="font-medium text-gogh-black">Lucro/venda: </span>
                              {lucroPorVenda > 0 ? (
                                <span className="text-green-700">R$ {lucroPorVenda.toFixed(2).replace('.', ',')}</span>
                              ) : lucroPorVenda < 0 ? (
                                <span className="text-red-700">R$ {lucroPorVenda.toFixed(2).replace('.', ',')}</span>
                              ) : (
                                <span className="text-amber-700">R$ 0,00</span>
                              )}
                              {custoMaxAceitavel > 0 && (
                                <span className="text-gogh-grayDark ml-1.5">· CPA máx: R$ {custoMaxAceitavel.toFixed(2).replace('.', ',')}</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gogh-grayDark">Preencha o preço para ver lucro e CPA máximo.</p>
                          )}
                        </>
                      )}
                    </div>
                    {!selectedCampaignId ? (
                      <p className="text-sm text-gogh-grayDark rounded-lg border border-gogh-grayLight bg-gogh-beige/30 p-4">
                        Selecione uma campanha na seção <strong>Campanhas</strong> para ver a estratégia e o plano de otimização.
                      </p>
                    ) : !selectedCampaign?.start_date || planoOtimizacao.daysSinceStart == null ? (
                      <p className="text-sm text-gogh-grayDark rounded-lg border border-gogh-grayLight bg-gogh-beige/30 p-4">
                        Defina a data de início da campanha para calcular o plano de otimização por dia.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-lg bg-gogh-grayLight/40 border border-gogh-grayLight p-3 space-y-2">
                          <p className="text-xs font-semibold text-gogh-black flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-gogh-yellow" />
                            Estratégia: nível {strategyTier.label}
                          </p>
                          <p className="text-xs text-gogh-grayDark">
                            Faixa do nível {strategyTier.label}: <strong>{strategyTier.description}</strong> — referência para meta de criativos e plano de otimização.
                          </p>
                          {strategyTier.investimentoMedioPorDia != null ? (
                            <p className="text-xs text-gogh-black">
                              Investimento real (dados da campanha): <strong>R$ {strategyTier.investimentoMedioPorDia.toFixed(2).replace('.', ',')}/dia</strong>
                            </p>
                          ) : (
                            <p className="text-xs text-gogh-grayDark">
                              Investimento real: preencha os dados da campanha (seção Campanhas) por 3+ dias para o nível ser ajustado ao que você está gastando.
                            </p>
                          )}
                          {budgetPhases.length > 0 && budgetPhases[0].dias > 0 && (
                            <p className="text-xs text-gogh-black border-t border-gogh-grayLight/80 pt-1">
                              Investimento planejado (1ª fase): <strong>R$ {(budgetPhases[0].valor / budgetPhases[0].dias).toFixed(2).replace('.', ',')}/dia</strong> por {budgetPhases[0].dias} dias
                            </p>
                          )}
                          <p className="text-xs text-gogh-black pt-1 border-t border-gogh-grayLight/80">
                            Meta de criativos: <strong>{strategyTier.minCreatives} a {strategyTier.maxCreatives} ativos</strong>
                          </p>
                        </div>

                        <div className="border-t border-gogh-grayLight pt-4 mt-4">
                          <p className="text-xs font-semibold text-gogh-black mb-1 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-gogh-yellow" />
                            Planejamento de orçamento
                          </p>
                          <p className="text-xs text-gogh-grayDark mb-2">
                            Valor que você pretende investir e por quantos dias. <strong>Não altera os dados reais</strong> da campanha — use para planejamento; preencha o valor investido na seção Campanhas com o real.
                          </p>
                          <div className="mb-3 rounded-lg border border-gogh-grayLight bg-gogh-beige/20 p-2">
                            <p className="text-[11px] font-medium text-gogh-black mb-1.5">No Meta, como você define o orçamento?</p>
                            <div className="flex flex-wrap gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="budgetTypeMeta"
                                  checked={budgetTypeMeta === 'cbo'}
                                  onChange={() => setBudgetTypeMeta('cbo')}
                                  className="border-gogh-grayLight"
                                />
                                <span className="text-xs text-gogh-grayDark"><strong>CBO</strong> — Campanha (orçamento por dia na campanha; o Meta distribui entre conjuntos)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="budgetTypeMeta"
                                  checked={budgetTypeMeta === 'abo'}
                                  onChange={() => setBudgetTypeMeta('abo')}
                                  className="border-gogh-grayLight"
                                />
                                <span className="text-xs text-gogh-grayDark"><strong>ABO</strong> — Conjunto de anúncios (orçamento por conjunto; some os valores para o total planejado)</span>
                              </label>
                            </div>
                          </div>
                          <p className="text-[11px] font-medium text-gogh-black mb-1.5 mt-3">Fases</p>
                          {budgetPhases.length > 0 && (
                            <div className="space-y-1.5 mb-3">
                              {(() => {
                                const startDate = selectedCampaign?.start_date ? new Date(selectedCampaign.start_date + 'T12:00:00') : null
                                let dayOffset = 0
                                return budgetPhases.map((phase, index) => {
                                  const diaInicio = dayOffset + 1
                                  const diaFim = dayOffset + phase.dias
                                  dayOffset = diaFim
                                  const porDia = phase.dias > 0 ? phase.valor / phase.dias : 0
                                  return (
                                    <div key={phase.id} className="flex items-center justify-between gap-2 rounded-lg border border-gogh-grayLight bg-gogh-beige/30 px-2.5 py-1.5 text-[11px]">
                                      <span><span className="font-medium text-gogh-black">Fase {index + 1}:</span>{' '}
                                      <span className="text-gogh-grayDark">R$ {phase.valor.toFixed(2).replace('.', ',')} · {phase.dias} dias</span>
                                      <span className="text-gogh-grayDark"> (R$ {porDia.toFixed(2).replace('.', ',')}/dia)</span>
                                      {startDate && <span className="block text-gogh-grayDark mt-0.5">Dias {diaInicio}–{diaFim}</span>}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeBudgetPhaseAt(index)}
                                        title="Excluir esta fase"
                                        className="shrink-0 p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                                        aria-label="Excluir fase"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )
                                })
                              })()}
                            </div>
                          )}
                          <div className="rounded-lg border border-gogh-grayLight bg-white p-3 space-y-2 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useAutoDiasRecommendation}
                                onChange={(e) => setUseAutoDiasRecommendation(e.target.checked)}
                                className="rounded border-gogh-grayLight"
                              />
                              <span className="text-[11px] text-gogh-grayDark">Preencher duração (dias) automaticamente pelo nível {strategyTier.label}</span>
                            </label>
                            <div className="flex flex-wrap gap-2 items-end">
                              <div>
                                <label className="block text-[11px] text-gogh-grayDark mb-0.5">Valor (R$)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={newPhaseValor}
                                  onChange={(e) => setNewPhaseValor(e.target.value)}
                                  placeholder="Ex: 1200"
                                  className="w-24 border border-gogh-grayLight rounded-lg px-2 py-1 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-gogh-grayDark mb-0.5">Duração (dias)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={newPhaseDias}
                                  onChange={(e) => setNewPhaseDias(e.target.value)}
                                  placeholder="Ex: 18"
                                  disabled={useAutoDiasRecommendation}
                                  readOnly={useAutoDiasRecommendation}
                                  title={useAutoDiasRecommendation ? 'Preenchido automaticamente pelo nível; desmarque a opção acima para editar.' : undefined}
                                  className={`w-20 border border-gogh-grayLight rounded-lg px-2 py-1 text-xs ${useAutoDiasRecommendation ? 'bg-gogh-grayLight/50 cursor-not-allowed' : ''}`}
                                />
                              </div>
                              {(() => {
                                const v = parseFloat(String(newPhaseValor).replace(',', '.')) || 0
                                const d = Math.max(1, Math.floor(parseFloat(String(newPhaseDias).replace(',', '.')) || 0))
                                const porDia = d > 0 ? v / d : 0
                                const suggestedDias = v > 0 ? Math.max(1, Math.round(v / suggestedDailyForPlanning)) : 0
                                return (
                                  <>
                                    {v > 0 && d > 0 && <span className="text-[11px] text-gogh-grayDark">≈ R$ {porDia.toFixed(2).replace('.', ',')}/dia</span>}
                                    {v > 0 && !useAutoDiasRecommendation && suggestedDias > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setNewPhaseDias(String(suggestedDias))}
                                        className="text-[11px] text-gogh-grayDark hover:text-gogh-black underline"
                                      >
                                        Sugestão: {suggestedDias} dias
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={addBudgetPhase}
                                      disabled={!newPhaseValor.trim() || parseFloat(String(newPhaseValor).replace(',', '.')) <= 0}
                                      className="px-2.5 py-1 bg-gogh-yellow text-gogh-black rounded-lg text-[11px] font-medium hover:bg-gogh-yellow/90 disabled:opacity-50"
                                    >
                                      {budgetPhases.length === 0 ? 'Adicionar fase' : 'Adicionar'}
                                    </button>
                                  </>
                                )
                              })()}
                            </div>
                            <p className="text-[10px] text-gogh-grayDark">
                              Menos dias com mais R$/dia costuma entregar melhor no Meta.
                            </p>
                          </div>
                          {selectedCampaign?.start_date && (() => {
                            const start = new Date(selectedCampaign.start_date + 'T12:00:00')
                            start.setHours(0, 0, 0, 0)
                            const totalDias = budgetPhases.length > 0
                              ? Math.min(budgetPhases.reduce((s, p) => s + p.dias, 0), 60)
                              : 30
                            const endDate = new Date(start)
                            endDate.setDate(endDate.getDate() + totalDias)
                            const getDayNum = (date: Date): number | null => {
                              const d = new Date(date)
                              d.setHours(0, 0, 0, 0)
                              const s = new Date(start)
                              s.setHours(0, 0, 0, 0)
                              const e = new Date(endDate)
                              e.setHours(0, 0, 0, 0)
                              if (d < s || d >= e) return null
                              return Math.floor((d.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1
                            }
                            const getMilestoneShort = (dayNum: number): string => {
                              if (dayNum >= 1 && dayNum <= 5) return 'Aprendizado — Não mexer no orçamento nem nos criativos.'
                              if (dayNum === 7) return `1ª análise — Analisar CTR, CPC e CPA; pausar 1 ou 2 piores criativos (manter ≥${strategyTier.minCreatives} ativos).`
                              if (dayNum >= 10 && dayNum <= 14) return `Novos criativos — +1 ou 2 criativos para voltar a ${strategyTier.minCreatives}–${strategyTier.maxCreatives} ativos; evita saturação.`
                              if (dayNum >= 18) return `Avaliação — Se lucrativo: manter ou escalar 15–20%/dia; manter ${strategyTier.minCreatives}–${strategyTier.maxCreatives} criativos; repor os fracos.`
                              return ''
                            }
                            const getPhaseForDay = (dayNum: number): number => {
                              if (budgetPhases.length === 0) return 0
                              let acc = 0
                              for (let p = 0; p < budgetPhases.length; p++) {
                                acc += budgetPhases[p].dias
                                if (dayNum <= acc) return p
                              }
                              return budgetPhases.length - 1
                            }
                            return (
                              <div className="mb-4 grid grid-cols-1 lg:grid-cols-[1fr,minmax(240px,280px)] gap-4 items-start">
                                <div className="flex flex-col items-center min-w-0">
                                <Card className="w-full max-w-[380px] py-3 border border-gogh-grayLight shadow-sm">
                                  <CardContent className="px-3">
                                    <DayPickerCalendar
                                      mode="single"
                                      month={campaignCalendarMonth}
                                      selected={campaignCalendarSelectedDate}
                                      onMonthChange={(month) => setCampaignCalendarMonth(new Date(month.getFullYear(), month.getMonth(), 1))}
                                      onSelect={(date) => { if (date) setCampaignCalendarSelectedDate(date) }}
                                      disabled={(date) => {
                                        const d = new Date(date)
                                        d.setHours(0, 0, 0, 0)
                                        const e = new Date(endDate)
                                        e.setHours(0, 0, 0, 0)
                                        return d >= e
                                      }}
                                      modifiers={{
                                        dayPassed: (date) => {
                                          const n = getDayNum(date)
                                          if (n == null) return false
                                          const d = new Date(date)
                                          d.setHours(0, 0, 0, 0)
                                          const today = new Date()
                                          today.setHours(0, 0, 0, 0)
                                          return d < today
                                        },
                                        ...(budgetPhases.length > 0 ? {
                                          inCampaign: (date: Date) => {
                                            const n = getDayNum(date)
                                            return n != null && !isActionDay(n)
                                          },
                                          actionDay: (date: Date) => {
                                            const n = getDayNum(date)
                                            return n != null && isActionDay(n) && !filledDatesSet.has(dateToKey(date))
                                          },
                                          actionDayFilled: (date: Date) => {
                                            const n = getDayNum(date)
                                            return n != null && isActionDay(n) && filledDatesSet.has(dateToKey(date))
                                          },
                                        } : {}),
                                      }}
                                      modifiersClassNames={{
                                        dayPassed: '[&>button]:line-through [&>button]:opacity-65',
                                        ...(budgetPhases.length > 0 ? {
                                          inCampaign: '[&>button]:bg-gogh-yellow/35 [&>button]:text-gogh-black [&>button]:shadow-[inset_0_0_0_1px_rgba(247,201,72,0.5)]',
                                          actionDay: '[&>button]:bg-emerald-500/50 [&>button]:text-gogh-black [&>button]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.6)]',
                                          actionDayFilled: '[&>button]:bg-emerald-400/70 [&>button]:text-white [&>button]:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.9)]',
                                        } : {}),
                                      }}
                                      classNames={{
                                        day_button: '!size-7',
                                        day: '!size-7 !px-0',
                                        weekday: '!size-7 !p-0 !text-[10px]',
                                        month_caption: '!mb-0.5',
                                        caption_label: '!text-xs',
                                      }}
                                      className="bg-transparent p-0"
                                    />
                                  </CardContent>
                                  <CardFooter className="flex flex-col items-stretch gap-1.5 border-t border-gogh-grayLight px-3 !pt-3 pb-3">
                                    <div className="text-xs font-medium text-gogh-black">
                                      {campaignCalendarSelectedDate
                                        ? campaignCalendarSelectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : 'Selecione um dia'}
                                    </div>
                                    {budgetPhases.length > 0 && campaignCalendarSelectedDate && getDayNum(campaignCalendarSelectedDate) != null && (
                                      <>
                                        <div className="rounded-md bg-gogh-beige/30 border border-gogh-grayLight/80 p-1.5 text-[11px] text-gogh-grayDark w-full">
                                          <p className="font-medium text-gogh-black text-[11px]">Dia {getDayNum(campaignCalendarSelectedDate)} da campanha · Fase {getPhaseForDay(getDayNum(campaignCalendarSelectedDate)!) + 1}</p>
                                          {getMilestoneShort(getDayNum(campaignCalendarSelectedDate)!) && (
                                            <p className="mt-0.5 leading-snug text-[11px]">{getMilestoneShort(getDayNum(campaignCalendarSelectedDate)!)}</p>
                                          )}
                                        </div>
                                        {isActionDay(getDayNum(campaignCalendarSelectedDate)!) && (
                                            <button
                                            type="button"
                                            onClick={() => campaignCalendarSelectedDate && toggleFilledDate(campaignCalendarSelectedDate)}
                                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${filledDatesSet.has(dateToKey(campaignCalendarSelectedDate)) ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                                          >
                                            {filledDatesSet.has(dateToKey(campaignCalendarSelectedDate)) ? '✓ Preenchido' : 'Marcar como preenchido'}
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </CardFooter>
                                </Card>
                                </div>
                                <Card className="w-full py-3 border border-gogh-grayLight shadow-sm shrink-0">
                                  <CardContent className="px-3 space-y-2">
                                    <p className="text-xs font-semibold text-gogh-black flex items-center gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5 text-gogh-grayDark" />
                                      Status e próximas ações
                                    </p>
                                    {selectedCampaign && !selectedCampaign.is_active ? (
                                      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-amber-800 text-[11px]">
                                        <p className="font-medium">Campanha pausada</p>
                                        <p className="mt-0.5 opacity-90">Ative na seção Campanhas para rodar e ver o diagnóstico.</p>
                                      </div>
                                    ) : !hasDataForDiagnosis ? (
                                      <p className="text-[11px] text-gogh-grayDark">Preencha os dados na seção <strong>Campanhas</strong> para ver o status e as recomendações.</p>
                                    ) : (
                                      <>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold ${
                                            statusGeral === 'saudável' ? 'bg-green-100 text-green-800' :
                                            statusGeral === 'estável' ? 'bg-blue-100 text-blue-800' :
                                            statusGeral === 'alerta' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {score}/100
                                          </span>
                                          <span className="text-[11px] font-medium text-gogh-black">
                                            {statusGeral === 'saudável' && 'Saudável'}
                                            {statusGeral === 'estável' && 'Estável'}
                                            {statusGeral === 'alerta' && 'Alerta'}
                                            {statusGeral === 'crítica' && 'Crítica'}
                                          </span>
                                        </div>
                                        {statusAlerts.length > 0 ? (
                                          <ul className="space-y-1.5 text-[11px]">
                                            {statusAlerts.slice(0, 3).map((a, i) => (
                                              <li key={i} className={`rounded border-l-2 pl-1.5 ${
                                                a.type === 'success' ? 'border-green-500 text-green-800' :
                                                a.type === 'warning' ? 'border-amber-500 text-amber-800' : 'border-red-500 text-red-800'
                                              }`}>
                                                {a.action}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : null}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAccordionOpen('status')
                                            setTimeout(() => document.getElementById('analytics-accordion-status')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                                          }}
                                          className="text-[11px] font-medium text-gogh-grayDark hover:text-gogh-black underline"
                                        >
                                          Ver todas as recomendações
                                        </button>
                                      </>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {accordionCard(
                  'campanhas',
                  'Campanhas',
                  selectedCampaign ? `${selectedCampaign.name} · Início ${selectedCampaign.start_date}` : 'Crie, ative ou pause campanhas',
                  <Megaphone className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4 overflow-hidden">
                    <div className="flex flex-wrap gap-3 items-end min-w-0">
                      <div className="flex-1 min-w-0 sm:min-w-[160px]">
                        <label className="block text-sm font-medium text-gogh-grayDark mb-1">Nova campanha</label>
                        <input
                          type="text"
                          value={newCampaignName}
                          onChange={(e) => setNewCampaignName(e.target.value)}
                          placeholder="Nome da campanha"
                          className="w-full min-w-0 border border-gogh-grayLight rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="min-w-0 max-w-full overflow-hidden basis-32 shrink sm:basis-auto sm:min-w-[140px]">
                        <label className="block text-sm font-medium text-gogh-grayDark mb-1">Início</label>
                        <input
                          type="date"
                          value={newCampaignStartDate}
                          onChange={(e) => setNewCampaignStartDate(e.target.value)}
                          className="w-full min-w-0 max-w-full border border-gogh-grayLight rounded-lg px-3 py-2 text-sm box-border"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateCampaign}
                        disabled={campaignsLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow text-gogh-black rounded-xl hover:bg-gogh-yellow/90 font-medium text-sm transition-colors shrink-0"
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
                    {selectedCampaignId && (
                      <div className="border-t border-gogh-grayLight pt-4 mt-4">
                        <button
                          type="button"
                          onClick={() => setCreativosSubOpen((o) => !o)}
                          className="w-full flex items-center justify-between gap-2 py-2 px-0 text-left"
                        >
                          <span className="text-sm font-semibold text-gogh-black flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-gogh-grayDark" />
                            Criativos desta campanha
                            {creatives.length > 0 && (
                              <span className="text-xs font-normal text-gogh-grayDark">({creatives.length})</span>
                            )}
                          </span>
                          {creativosSubOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                        </button>
                        {creativosSubOpen && (
                          <div className="pt-3 space-y-3">
                            {creativesLoading ? (
                              <div className="flex justify-center py-4"><LumaSpin size="sm" /></div>
                            ) : creatives.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-gogh-grayLight bg-gogh-beige/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="text-xs text-gogh-grayDark">Adicione cada vídeo ou anúncio e preencha as métricas. Os totais alimentam Dados da campanha e o Status.</p>
                                <button
                                  type="button"
                                  onClick={handleAddCreative}
                                  disabled={addingCreative}
                                  className="shrink-0 inline-flex items-center gap-2 px-3 py-2 bg-gogh-yellow text-gogh-black rounded-lg text-sm font-medium hover:bg-gogh-yellow/90"
                                >
                                  <Plus className="w-4 h-4" />
                                  {addingCreative ? '...' : 'Adicionar criativo'}
                                </button>
                              </div>
                            ) : (
                              <>
                                {creatives.map((cr) => (
                                  <div key={cr.id} className="rounded-lg border border-gogh-grayLight bg-white p-3 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <input
                                        type="text"
                                        value={cr.name}
                                        onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, name: e.target.value } : c)))}
                                        placeholder="Nome do criativo"
                                        className="flex-1 min-w-[120px] border border-gogh-grayLight rounded-lg px-2 py-1.5 text-sm"
                                      />
                                      <button type="button" onClick={() => handleDeleteCreative(cr.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" aria-label="Excluir"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      <div><label className="block text-xs text-gogh-grayDark">Alcance</label><input type="number" min="0" value={cr.alcance ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, alcance: e.target.value ? Number(e.target.value) : null } : c)))} className="w-full border rounded px-2 py-1 text-sm" /></div>
                                      <div><label className="block text-xs text-gogh-grayDark">Impressões</label><input type="number" min="0" value={cr.impressoes ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, impressoes: e.target.value ? Number(e.target.value) : null } : c)))} className="w-full border rounded px-2 py-1 text-sm" /></div>
                                      <div><label className="block text-xs text-gogh-grayDark">Cliques no link</label><input type="number" min="0" value={cr.cliques_link ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, cliques_link: e.target.value ? Number(e.target.value) : null } : c)))} className="w-full border rounded px-2 py-1 text-sm" /></div>
                                      <div><label className="block text-xs text-gogh-grayDark">Valor usado (R$)</label><input type="number" min="0" step="0.01" value={cr.valor_investido ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, valor_investido: e.target.value ? Number(e.target.value) : null } : c)))} className="w-full border rounded px-2 py-1 text-sm" /></div>
                                      <div><label className="block text-xs text-gogh-grayDark">{profileLabels.resultados}</label><input type="number" min="0" value={cr.compras ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, compras: e.target.value ? Number(e.target.value) : null } : c)))} className="w-full border rounded px-2 py-1 text-sm" /></div>
                                      <div><label className="block text-xs text-gogh-grayDark">{profileLabels.valorConversao}</label><input type="number" min="0" step="0.01" value={cr.valor_total_faturado ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, valor_total_faturado: e.target.value ? Number(e.target.value) : null } : c)))} className="w-full border rounded px-2 py-1 text-sm" /></div>
                                    </div>
                                  </div>
                                ))}
                                <button type="button" onClick={handleAddCreative} disabled={addingCreative} className="inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-gogh-grayLight rounded-lg text-xs font-medium text-gogh-grayDark hover:bg-gogh-grayLight/30">
                                  <Plus className="w-3.5 h-3.5" />{addingCreative ? '...' : 'Adicionar criativo'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedCampaignId && (
                      <div className="border-t border-gogh-grayLight pt-4 mt-4">
                        <p className="text-xs font-semibold text-gogh-black mb-0.5 flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Dados e métricas
                        </p>
                        <p className="text-xs text-gogh-grayDark mb-2">Calculados de forma automática a partir dos dados preenchidos nos criativos.</p>
                        {creatives.length > 0 ? (
                          (impressoesNum > 0 || cliquesNum > 0 || comprasNum > 0 || valorInvestidoNum > 0) ? (
                            <div className="rounded-lg border border-gogh-grayLight bg-gogh-beige/40 p-3">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                                {alcanceNum > 0 && impressoesNum > 0 && <div><span className="text-gogh-grayDark">Frequência</span> <span className="font-medium">{metricasCampanha.freq.toFixed(2)}</span></div>}
                                {impressoesNum > 0 && <div><span className="text-gogh-grayDark">CTR (taxa de cliques no link)</span> <span className="font-medium">{metricasCampanha.ctrPct.toFixed(2)}%</span></div>}
                                {cliquesNum > 0 && <div><span className="text-gogh-grayDark">Conversão</span> <span className="font-medium">{metricasCampanha.taxaConvPct.toFixed(2)}%</span></div>}
                                {impressoesNum > 0 && valorInvestidoNum > 0 && <div><span className="text-gogh-grayDark">CPM (Custo Por Mil impressões)</span> <span className="font-medium">R$ {metricasCampanha.cpm.toFixed(2)}</span></div>}
                                {cliquesNum > 0 && valorInvestidoNum > 0 && <div><span className="text-gogh-grayDark">CPC (custo por clique no link)</span> <span className="font-medium">R$ {metricasCampanha.cpc.toFixed(2)}</span></div>}
                                {comprasNum > 0 && <div><span className="text-gogh-grayDark">{profileLabels.custoPorResultado}</span> <span className="font-medium">R$ {metricasCampanha.cpaCalculado.toFixed(2)}</span></div>}
                                {valorInvestidoNum > 0 && valorFaturadoNum > 0 && <div><span className="text-gogh-grayDark">{profileLabels.roasLabel}</span> <span className="font-medium">{metricasCampanha.roas.toFixed(2)}x</span></div>}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gogh-grayDark">Preencha os criativos acima para ver os totais.</p>
                          )
                        ) : (
                          <p className="text-xs text-gogh-grayDark rounded-lg border border-gogh-grayLight bg-gogh-beige/20 p-3">Adicione pelo menos um criativo e preencha os dados para ver os totais e o diagnóstico.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {accordionCard(
                  'status',
                  'Status e decisões',
                  statusGeral === 'pausada' ? 'Campanha pausada' : hasDataForDiagnosis && statusAlerts.length > 0 ? `Score ${score} · ${statusGeral} · Todas as recomendações` : 'Diagnóstico automático e recomendações',
                  <AlertCircle className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <p className="text-sm text-gogh-grayDark">
                      Resumo ao lado da <strong>agenda</strong> (Estratégia). Abaixo, a lista completa de recomendações para seguir as ações sugeridas.
                    </p>
                    {!hasDataForDiagnosis ? (
                      <p className="text-sm text-gogh-grayDark bg-gogh-grayLight/50 rounded-lg p-3">
                        Preencha os dados da campanha na seção <strong>Campanhas</strong> (alcance, impressões, cliques, valor investido, {profileLabels.hintPreencher} em pelo menos um criativo) para ver o diagnóstico. Opcionalmente, preencha o <strong>Planejamento de valores</strong> na seção <strong>Estratégia</strong> para incluir análise de lucro e {profileLabels.custoPorResultadoShort} limite.
                      </p>
                    ) : statusGeral === 'pausada' ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-amber-800">
                        <p className="text-sm font-medium mb-1">Campanha pausada</p>
                        <p className="text-xs opacity-90">Esta campanha está pausada. Ative-a na seção <strong>Campanhas</strong> (botão &quot;Ativar&quot;) para voltar a rodar os anúncios e ver o diagnóstico completo. Ao selecionar outra campanha ativa, o Status mostrará o score e as recomendações normalmente.</p>
                      </div>
                    ) : (
                      <>
                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-lg ${
                          statusGeral === 'saudável'
                            ? 'bg-green-100 text-green-800'
                            : statusGeral === 'estável'
                              ? 'bg-blue-100 text-blue-800'
                              : statusGeral === 'alerta'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <span className="text-2xl tabular-nums">{score}</span>
                        <span>/ 100</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gogh-grayDark">Status: </span>
                        <span
                          className={`font-semibold ${
                            statusGeral === 'saudável'
                              ? 'text-green-700'
                              : statusGeral === 'estável'
                                ? 'text-blue-700'
                                : statusGeral === 'alerta'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                          }`}
                        >
                          {statusGeral === 'saudável' && 'Campanha saudável — Escalar'}
                          {statusGeral === 'estável' && 'Estável — Otimizar'}
                          {statusGeral === 'alerta' && 'Em alerta — Ajustar criativo ou público'}
                          {statusGeral === 'crítica' && 'Crítica — Revisar estratégia'}
                        </span>
                      </div>
                    </div>
                    {statusAlerts.length === 0 ? (
                      <p className="text-sm text-gogh-grayDark bg-gogh-grayLight/50 rounded-lg p-3">
                        Preencha os dados da campanha na seção <strong>Campanhas</strong> para ver o diagnóstico. Opcionalmente, preencha o <strong>Planejamento de valores</strong> na seção <strong>Estratégia</strong> para incluir análise de lucro e {profileLabels.custoPorResultadoShort} limite.
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs text-gogh-grayDark mb-2">
                          {roiEnabled && valorNum > 0
                            ? `Análise considerando Planejamento de valores (lucro e ${profileLabels.custoPorResultadoShort} limite).`
                            : 'Análise com base nas métricas dos criativos (frequência, CTR, conversão).'}
                        </p>
                        <p className="text-sm font-medium text-gogh-black mb-2">Recomendações:</p>
                        <p className="text-xs text-gogh-grayDark mb-2">Clique na ação para ver o detalhe dos índices (atual → ideal).</p>
                        <ul className="space-y-2">
                          {statusAlerts.map((a, i) => {
                            const isExpanded = expandedRecommendationIndex === i
                            return (
                              <li
                                key={i}
                                className={`rounded-lg border text-sm overflow-hidden ${
                                  a.type === 'success'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : a.type === 'warning'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : 'bg-red-50 border-red-200 text-red-800'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedRecommendationIndex((prev) => (prev === i ? null : i))}
                                  className="w-full flex items-center gap-2 p-3 text-left hover:opacity-90 transition-opacity"
                                >
                                  {a.type === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                  )}
                                  <span className="flex-1 font-medium">{a.action}</span>
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 shrink-0" />
                                  )}
                                </button>
                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-0 border-t border-current/20 space-y-1">
                                    {a.details.map((d, j) => {
                                      const lines = (d || '').split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean)
                                      return (
                                        <div key={j} className="space-y-1 pt-2 first:pt-2">
                                          {lines.map((line, k) => (
                                            <p key={k} className="text-xs opacity-90">
                                              {line}
                                            </p>
                                          ))}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                      </>
                    ))}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-gogh-grayLight">
                  <p className="text-xs text-gogh-grayDark">
                    {selectedCampaignId
                      ? ((isProfileDirty || isInicioDirty || analyticsProfile !== savedAnalyticsProfile) ? 'Alterações não salvas. Clique em Salvar configurações para gravar.' : 'Configurações salvas.')
                      : 'Selecione uma campanha e preencha os dados para poder salvar.'}
                  </p>
                  <ShinyButton
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingDados || !canSaveProfile}
                    className="h-9 px-4 min-w-[140px] shrink-0"
                  >
                    {savingDados ? (
                      <>
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden">
                          <LumaSpin size="sm" />
                        </span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        Salvar configurações
                      </>
                    )}
                  </ShinyButton>
                </div>
                {selectedCampaignId && !isDadosCampanhaComplete && isProfileDirty && (
                  <p className="text-xs text-red-600 mt-2">
                    Preencha todos os dados da campanha (na seção Campanhas) para salvar.
                  </p>
                )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
