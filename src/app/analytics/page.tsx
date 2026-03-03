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
  Calendar,
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { ShinyButton } from '@/components/ui/shiny-button'
import toast from 'react-hot-toast'

type AnalyticsAccordionId = 'campanhas' | 'dados-campanha' | 'roi' | 'plano-otimizacao' | 'status'

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

// Parâmetros de análise (benchmarks para decisão)
const FREQ_SAUDAVEL = { min: 1.5, max: 2.5 }
const FREQ_ATENCAO = { min: 2.5, max: 3 }
const FREQ_SATURACAO = 3
const FREQ_CRITICO = 4
const CTR_BOM = 1.5
const CTR_MEDIO = 1
const CONV_FORTE = 3
const CONV_MEDIO = 1.5

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading, hasActiveSubscription, isPro } = useAuth()
  const hasAccess = isAuthenticated && isPro

  const [mounted, setMounted] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState<AnalyticsAccordionId | null>('campanhas')
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
  const [expandedRecommendationIndex, setExpandedRecommendationIndex] = useState<number | null>(null)
  const [creatives, setCreatives] = useState<AnalyticsCreative[]>([])
  const [creativesLoading, setCreativesLoading] = useState(false)
  const [savingCreativeId, setSavingCreativeId] = useState<string | null>(null)
  const [addingCreative, setAddingCreative] = useState(false)

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

  const loadCreatives = async (campaignId: string) => {
    if (!hasAccess) return
    try {
      setCreativesLoading(true)
      const res = await fetch(`/api/analytics/campaigns/${campaignId}/creatives`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar criativos')
      setCreatives(data.creatives || [])
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar criativos')
      setCreatives([])
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
      return
    }
    loadCreatives(selectedCampaignId)
  }, [selectedCampaignId, hasAccess])

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
    return { freq, ctrPct, taxaConvPct, cpc, cpaCalculado, roas }
  }, [alcanceNum, impressoesNum, cliquesNum, valorInvestidoNum, comprasNum, valorFaturadoNum])
  const { score, statusGeral, statusAlerts, hasDataForDiagnosis } = useMemo(() => {
    const hasData =
      impressoesNum > 0 ||
      valorInvestidoNum > 0 ||
      comprasNum > 0 ||
      (roiEnabled && valorNum > 0)
    if (!hasData) {
      return {
        score: 0,
        statusGeral: 'sem_dados' as const,
        statusAlerts: [] as { type: 'success' | 'warning' | 'danger'; action: string; details: string[] }[],
        hasDataForDiagnosis: false,
      }
    }
    type AlertItem = { type: 'success' | 'warning' | 'danger'; action: string; detail: string }
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
      if (lucroBruto <= 0) {
        scoreLucro = 0
        alerts.push({ type: 'danger', action: 'Ajustar preço ou custo.', detail: `Lucro ${lucroStr} (prejuízo)` })
      } else if (metaLucroNum > 0 && lucroBruto >= metaLucroNum) {
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
          alerts.push({ type: 'danger', action: 'Não escalar.', detail: `CPA ${cpaStr} > lucro ${lucroStr} (prejuízo por aquisição)` })
        } else if (cpaUsado > custoMaxAceitavel) {
          scoreCpa = 0
          alerts.push({ type: 'danger', action: 'Não escalar.', detail: `CPA ${cpaStr} → limite ${limiteStr}` })
        } else if (cpaUsado >= custoMaxAceitavel * 0.98) {
          scoreCpa = 8
          alerts.push({ type: 'warning', action: 'Não escalar.', detail: `CPA ${cpaStr} no limite ${limiteStr}` })
        } else if (cpaUsado < custoMaxAceitavel * 0.8) {
          scoreCpa = 20
          let detail = `CPA ${cpaStr} < limite ${limiteStr}`
          if (selectedCampaign?.start_date && valorInvestidoNum > 0) {
            const start = new Date(selectedCampaign.start_date + 'T12:00:00')
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            start.setHours(0, 0, 0, 0)
            const daysSinceStart = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
            const investimentoPorDia = valorInvestidoNum / daysSinceStart
            if (investimentoPorDia > 0) {
              const scaleMin = investimentoPorDia * 0.15
              const scaleMax = investimentoPorDia * 0.2
              detail += `. Invest. médio/dia: R$ ${investimentoPorDia.toFixed(2).replace('.', ',')}. Pode aumentar R$ ${scaleMin.toFixed(2).replace('.', ',')} a R$ ${scaleMax.toFixed(2).replace('.', ',')}/dia (15–20%).`
            }
          }
          alerts.push({ type: 'success', action: 'Pode escalar.', detail })
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
      let scaleDetail = 'Campanha saudável.'
      if (selectedCampaign?.start_date && valorInvestidoNum > 0) {
        const start = new Date(selectedCampaign.start_date + 'T12:00:00')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        start.setHours(0, 0, 0, 0)
        const daysSinceStart = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
        const investimentoPorDia = valorInvestidoNum / daysSinceStart
        if (investimentoPorDia > 0) {
          const scaleMin = investimentoPorDia * 0.15
          const scaleMax = investimentoPorDia * 0.2
          scaleDetail = `Investimento médio por dia: R$ ${investimentoPorDia.toFixed(2).replace('.', ',')}. Pode aumentar em R$ ${scaleMin.toFixed(2).replace('.', ',')} a R$ ${scaleMax.toFixed(2).replace('.', ',')} por dia (15–20%).`
        }
      }
      alerts.push({
        type: 'success',
        action: 'Pode escalar.',
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
    if (creatives.length > 0) {
      for (const cr of creatives) {
        const cAlc = cr.alcance ?? 0
        const cImp = cr.impressoes ?? 0
        const cCliques = cr.cliques_link ?? 0
        if (cAlc <= 0 && cImp <= 0) continue
        const cFreq = cAlc > 0 ? (cImp / cAlc) : 0
        const cCtrPct = cImp > 0 ? (cCliques / cImp) * 100 : 0
        const name = (cr.name || 'Criativo').trim() || 'Criativo'
        if (cAlc > 0 && cImp > 0 && cFreq >= FREQ_CRITICO) {
          alerts.push({ type: 'danger', action: `Trocar o criativo "${name}".`, detail: `Frequência ${cFreq.toFixed(2).replace('.', ',')} → ideal <4` })
        } else if (cAlc > 0 && cImp > 0 && cFreq > FREQ_SATURACAO) {
          alerts.push({ type: 'warning', action: `Avaliar novo criativo: "${name}".`, detail: `Frequência ${cFreq.toFixed(2).replace('.', ',')} → ideal ≤3` })
        }
        if (cImp > 0 && cCtrPct > 0 && cCtrPct < CTR_MEDIO) {
          alerts.push({ type: 'warning', action: `Testar novo criativo: "${name}".`, detail: `CTR ${cCtrPct.toFixed(2).replace('.', ',')}% → ideal ≥1%` })
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
  ])
  const lucroPorVenda = lucroBruto

  const planoOtimizacao = useMemo(() => {
    if (!selectedCampaign?.start_date) {
      return { daysSinceStart: null as number | null, phase: null as string | null, phaseLabel: '', phaseSteps: [] as string[], isPaused: false }
    }
    const start = new Date(selectedCampaign.start_date + 'T12:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
    const isPaused = !selectedCampaign.is_active
    let phase: string
    let phaseLabel: string
    let phaseSteps: string[]
    if (daysSinceStart <= 5) {
      phase = 'aprendizado'
      phaseLabel = 'Dia 1 a 5 — Fase de aprendizado'
      phaseSteps = [
        'Não mexer no orçamento nem nos criativos (fase de aprendizado do algoritmo).',
        'Atualize os dados da campanha nos próximos dias para acompanhar.',
      ]
    } else if (daysSinceStart <= 9) {
      phase = 'analise-7'
      phaseLabel = 'Dia 7 — Primeira análise'
      phaseSteps = [
        'Analisar métricas principais: CTR, CPC e CPA.',
        'Pausar 1 ou 2 piores criativos. Manter pelo menos 3 ativos.',
        'Atualize os dados da campanha para o sistema recomendar próximos passos.',
      ]
    } else if (daysSinceStart <= 17) {
      phase = 'novos-criativos'
      phaseLabel = 'Dia 10 a 14 — Novos criativos'
      phaseSteps = [
        'Criar 1 ou 2 novos criativos para voltar ao total de 4–5 ativos.',
        'Isso mantém o algoritmo saudável e evita saturação.',
      ]
    } else {
      phase = 'avaliacao'
      phaseLabel = 'Dia 18+ — Avaliação e modelo contínuo'
      phaseSteps = [
        'Avaliação geral. Se estiver lucrativo: manter rodando, escalar 15–20% ao dia se desejar, ou manter orçamento fixo.',
        'Sempre manter entre 3 e 5 criativos ativos.',
        'Criar novos criativos para repor e manter ciclo contínuo.',
        'Nunca deixar cair para 1 criativo só; ideal 4–5 ativos.',
      ]
    }
    return { daysSinceStart, phase, phaseLabel, phaseSteps, isPaused }
  }, [selectedCampaign])

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
  const isProfileDirty =
    !!selectedCampaignId &&
    savedCampaignSignature.length > 0 &&
    currentCampaignSignature !== savedCampaignSignature
  const isDadosCampanhaComplete =
    !!selectedCampaignId &&
    (creatives.length > 0 || [alcance, impressoes, cliquesLink, valorInvestido, compras, valorTotalFaturado].every((s) => (s ?? '').trim().length > 0))
  const isRoiComplete = !roiEnabled || (roiEnabled && (valorVenda ?? '').trim().length > 0)

  const getAccordionCardClass = (sectionId: AnalyticsAccordionId): string => {
    if (sectionId === 'campanhas' || sectionId === 'status' || sectionId === 'plano-otimizacao') return 'bg-white border-gogh-grayLight'
    if (!isProfileDirty) return 'bg-white border-gogh-grayLight'
    if (sectionId === 'dados-campanha') {
      return isDadosCampanhaComplete ? 'bg-emerald-50/80 border-emerald-300' : 'bg-red-50/80 border-red-300'
    }
    if (sectionId === 'roi') {
      return isRoiComplete ? 'bg-emerald-50/80 border-emerald-300' : 'bg-red-50/80 border-red-300'
    }
    return 'bg-white border-gogh-grayLight'
  }

  const getFieldBorderClass = (sectionId: AnalyticsAccordionId): string => {
    if (!isProfileDirty) return 'border-gogh-grayLight'
    if (sectionId === 'roi') return isRoiComplete ? 'border-emerald-400 focus:ring-emerald-200' : 'border-red-300 focus:ring-red-200'
    if (sectionId === 'dados-campanha') return isDadosCampanhaComplete ? 'border-emerald-400 focus:ring-emerald-200' : 'border-red-300 focus:ring-red-200'
    return 'border-gogh-grayLight'
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

  const handleUpdateCreative = async (creative: AnalyticsCreative) => {
    if (!selectedCampaignId) return
    setSavingCreativeId(creative.id)
    try {
      const res = await fetch(`/api/analytics/campaigns/${selectedCampaignId}/creatives/${creative.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: creative.name,
          alcance: creative.alcance != null ? creative.alcance : null,
          impressoes: creative.impressoes != null ? creative.impressoes : null,
          cliques_link: creative.cliques_link != null ? creative.cliques_link : null,
          valor_investido: creative.valor_investido != null ? creative.valor_investido : null,
          compras: creative.compras != null ? creative.compras : null,
          valor_total_faturado: creative.valor_total_faturado != null ? creative.valor_total_faturado : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      setCreatives((prev) => prev.map((c) => (c.id === creative.id ? data.creative : c)))
      toast.success('Criativo atualizado')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar criativo')
    } finally {
      setSavingCreativeId(null)
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

  const requiredDadosFields = [
    { key: 'alcance', label: 'Alcance', value: alcance },
    { key: 'impressoes', label: 'Impressões', value: impressoes },
    { key: 'cliques', label: 'Cliques no link', value: cliquesLink },
    { key: 'valor_investido', label: 'Valor investido', value: valorInvestido },
    { key: 'compras', label: 'Compras / conversões', value: compras },
    { key: 'valor_faturado', label: 'Valor total faturado', value: valorTotalFaturado },
  ]
  const missingDados = requiredDadosFields.filter((f) => !f.value?.trim())
  const canSaveProfile = selectedCampaignId && isRoiComplete && (creatives.length > 0 ? isProfileDirty : isProfileDirty && isDadosCampanhaComplete)

  const handleSaveProfile = async () => {
    if (!selectedCampaignId) return
    if (creatives.length === 0 && missingDados.length > 0) {
      toast.error(`Preencha todos os campos de Dados da campanha: ${requiredDadosFields.filter((f) => !f.value?.trim()).map((f) => f.label).join(', ')}`)
      return
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
      if (creatives.length === 0) {
        body.alcance = alcance ? parseInt(alcance, 10) : null
        body.impressoes = impressoes ? parseInt(impressoes, 10) : null
        body.cliques_link = cliquesLink ? parseInt(cliquesLink, 10) : null
        body.valor_investido = valorInvestido ? parseNum(valorInvestido) : null
        body.compras = compras ? parseInt(compras, 10) : null
        body.valor_total_faturado = valorTotalFaturado ? parseNum(valorTotalFaturado) : null
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
      toast.success('Alterações salvas na campanha')
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
    <div className={`rounded-lg border transition-colors ${getAccordionCardClass(id)}`}>
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
              Gogh Analytics
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow text-gogh-black rounded-xl hover:bg-gogh-yellow/90 font-medium text-sm transition-colors"
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
                  'roi',
                  'Planejamento de valores',
                  null,
                  <DollarSign className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <p className="text-sm text-gogh-grayDark">
                      Não são dados do Meta. Configure o <strong>valor da venda</strong> e o <strong>custo por venda</strong> do seu negócio para o sistema refletir lucro e recomendações no Status.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roiEnabled}
                        onChange={(e) => setRoiEnabled(e.target.checked)}
                        className="rounded border-gogh-grayLight"
                      />
                      <span className="text-sm font-medium text-gogh-grayDark">Usar planejamento de valores no status (valor da venda, custo, lucro)</span>
                    </label>
                    {roiEnabled && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Preço do produto/serviço (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={valorVenda}
                              onChange={(e) => setValorVenda(e.target.value)}
                              placeholder="Ex: 97"
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('roi')}`}
                            />
                            <p className="text-xs text-gogh-grayDark mt-0.5">Preço que você cobra pelo produto ou serviço.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Custo variável por venda (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={custoVenda}
                              onChange={(e) => setCustoVenda(e.target.value)}
                              placeholder="0 se não tiver (ex.: serviço sem custo variável)"
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('roi')}`}
                            />
                            <p className="text-xs text-gogh-grayDark mt-0.5">O que você gasta para entregar uma unidade (produto, frete, taxa, etc.). Deixe 0 se não tiver.</p>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Meta de lucro por venda (R$) — opcional</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={metaLucroPorVenda}
                              onChange={(e) => setMetaLucroPorVenda(e.target.value)}
                              placeholder="Ex: 20 — lucro mínimo desejado por venda"
                              className={`w-full border rounded-lg px-3 py-2 text-sm max-w-[240px] focus:ring-2 ${getFieldBorderClass('roi')}`}
                            />
                            <p className="text-xs text-gogh-grayDark mt-0.5">Quanto você quer lucrar por venda. O sistema usa isso para calcular o custo máximo aceitável (CPA limite).</p>
                          </div>
                        </div>
                        {valorNum > 0 ? (
                          <div className="space-y-3">
                            <div
                              className={`rounded-xl border-2 p-4 ${
                                lucroPorVenda > 0
                                  ? 'bg-green-50 border-green-200'
                                  : lucroPorVenda < 0
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-amber-50 border-amber-200'
                              }`}
                            >
                              <p className="text-sm font-medium text-gogh-black mb-1">Lucro bruto por venda</p>
                              <p className="text-lg font-bold">
                                {lucroPorVenda > 0 ? (
                                  <span className="text-green-700">R$ {lucroPorVenda.toFixed(2).replace('.', ',')}</span>
                                ) : lucroPorVenda < 0 ? (
                                  <span className="text-red-700">R$ {lucroPorVenda.toFixed(2).replace('.', ',')}</span>
                                ) : (
                                  <span className="text-amber-700">R$ 0,00</span>
                                )}
                              </p>
                              <p className="text-xs text-gogh-grayDark mt-1">
                                Preço (R$ {valorNum.toFixed(2).replace('.', ',')}) − Custo variável (R$ {custoNum.toFixed(2).replace('.', ',')})
                              </p>
                              {valorNum > 0 && lucroPorVenda > 0 && (
                                <p className="text-xs text-gogh-grayDark mt-2">
                                  Margem: {((lucroPorVenda / valorNum) * 100).toFixed(1).replace('.', ',')}%
                                </p>
                              )}
                              {custoMaxAceitavel > 0 && (
                                <div className="mt-3 pt-3 border-t border-gogh-grayLight/50">
                                  <p className="text-sm font-medium text-gogh-black">Custo máximo aceitável (CPA)</p>
                                  <p className="text-base font-bold text-gogh-grayDark">R$ {custoMaxAceitavel.toFixed(2).replace('.', ',')}</p>
                                  <p className="text-xs text-gogh-grayDark mt-0.5">
                                    {metaLucroNum > 0
                                      ? `Máximo que você pode gastar por aquisição e ainda manter a meta de lucro (R$ ${metaLucroNum.toFixed(2).replace('.', ',')}).`
                                      : 'Máximo que você pode gastar por aquisição sem prejuízo (ponto de equilíbrio).'}
                                  </p>
                                </div>
                              )}
                              {lucroPorVenda > 0 && (
                                <p className="text-xs font-medium text-green-700 mt-2 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Mantenha o CPA da campanha abaixo de R$ {custoMaxAceitavel.toFixed(2).replace('.', ',')} para operar com margem.
                                </p>
                              )}
                              {lucroPorVenda <= 0 && valorNum > 0 && (
                                <p className="text-xs font-medium text-amber-700 mt-2 flex items-center gap-1">
                                  <AlertTriangle className="w-4 h-4" /> Ajuste o preço ou o custo variável para ter lucro por venda.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gogh-grayDark bg-gogh-grayLight/50 rounded-lg p-3">
                            Preencha o valor da venda para ver o lucro por venda (e o máximo que pode gastar por aquisição sem prejuízo).
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {accordionCard(
                  'dados-campanha',
                  'Dados da campanha',
                  selectedCampaign ? `Métricas e índices da campanha "${selectedCampaign.name}"` : 'Selecione uma campanha para preencher',
                  <ClipboardList className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    {!selectedCampaignId ? (
                      <p className="text-sm text-gogh-grayDark py-2">Selecione uma campanha na seção Campanhas para preencher os dados de anúncio. O sistema calculará automaticamente frequência, CTR, conversão, CPC, CPA e ROAS.</p>
                    ) : creatives.length > 0 ? (
                      <>
                        <p className="text-sm text-gogh-grayDark">
                          Dados por criativo (como no Meta Ads). Os totais da campanha são a soma dos criativos. O Status indica qual criativo trocar ou escalar.
                        </p>
                        {creativesLoading ? (
                          <div className="flex justify-center py-4"><LumaSpin size="sm" /></div>
                        ) : (
                          <div className="space-y-4">
                            {creatives.map((cr) => (
                              <div key={cr.id} className="rounded-xl border border-gogh-grayLight bg-gogh-beige/30 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <input
                                    type="text"
                                    value={cr.name}
                                    onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, name: e.target.value } : c)))}
                                    placeholder="Nome do criativo"
                                    className="flex-1 min-w-[140px] border border-gogh-grayLight rounded-lg px-3 py-2 text-sm font-medium"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCreative(creatives.find((c) => c.id === cr.id) ?? cr)}
                                      disabled={savingCreativeId === cr.id}
                                      className="px-3 py-1.5 text-sm bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/90 font-medium disabled:opacity-70"
                                    >
                                      {savingCreativeId === cr.id ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCreative(cr.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                      aria-label="Excluir criativo"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gogh-grayDark mb-0.5">Alcance</label>
                                    <input type="number" min="0" value={cr.alcance ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, alcance: e.target.value ? Number(e.target.value) : null } : c)))} placeholder="0" className="w-full border border-gogh-grayLight rounded-lg px-2 py-1.5 text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gogh-grayDark mb-0.5">Impressões</label>
                                    <input type="number" min="0" value={cr.impressoes ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, impressoes: e.target.value ? Number(e.target.value) : null } : c)))} placeholder="0" className="w-full border border-gogh-grayLight rounded-lg px-2 py-1.5 text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gogh-grayDark mb-0.5">Cliques</label>
                                    <input type="number" min="0" value={cr.cliques_link ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, cliques_link: e.target.value ? Number(e.target.value) : null } : c)))} placeholder="0" className="w-full border border-gogh-grayLight rounded-lg px-2 py-1.5 text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gogh-grayDark mb-0.5">Investido (R$)</label>
                                    <input type="number" min="0" step="0.01" value={cr.valor_investido ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, valor_investido: e.target.value ? Number(e.target.value) : null } : c)))} placeholder="0" className="w-full border border-gogh-grayLight rounded-lg px-2 py-1.5 text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gogh-grayDark mb-0.5">Compras</label>
                                    <input type="number" min="0" value={cr.compras ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, compras: e.target.value ? Number(e.target.value) : null } : c)))} placeholder="0" className="w-full border border-gogh-grayLight rounded-lg px-2 py-1.5 text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gogh-grayDark mb-0.5">Faturado (R$)</label>
                                    <input type="number" min="0" step="0.01" value={cr.valor_total_faturado ?? ''} onChange={(e) => setCreatives((prev) => prev.map((c) => (c.id === cr.id ? { ...c, valor_total_faturado: e.target.value ? Number(e.target.value) : null } : c)))} placeholder="0" className="w-full border border-gogh-grayLight rounded-lg px-2 py-1.5 text-sm" />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddCreative}
                              disabled={addingCreative}
                              className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gogh-grayLight rounded-xl text-sm font-medium text-gogh-grayDark hover:bg-gogh-grayLight/30 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              {addingCreative ? 'Adicionando...' : 'Adicionar criativo'}
                            </button>
                          </div>
                        )}
                        {creatives.length > 0 && (impressoesNum > 0 || cliquesNum > 0 || comprasNum > 0 || valorInvestidoNum > 0) && (
                          <div className="rounded-xl border border-gogh-grayLight bg-gogh-beige/50 p-4 space-y-2 mt-4">
                            <p className="text-sm font-semibold text-gogh-black flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gogh-yellow" />
                              Totais da campanha (soma dos criativos)
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                              {alcanceNum > 0 && impressoesNum > 0 && (
                                <div><span className="text-gogh-grayDark">Frequência</span><br /><span className="font-medium">{metricasCampanha.freq.toFixed(2)}</span></div>
                              )}
                              {impressoesNum > 0 && <div><span className="text-gogh-grayDark">CTR</span><br /><span className="font-medium">{metricasCampanha.ctrPct.toFixed(2)}%</span></div>}
                              {cliquesNum > 0 && <div><span className="text-gogh-grayDark">Taxa de conversão</span><br /><span className="font-medium">{metricasCampanha.taxaConvPct.toFixed(2)}%</span></div>}
                              {cliquesNum > 0 && valorInvestidoNum > 0 && <div><span className="text-gogh-grayDark">CPC (R$)</span><br /><span className="font-medium">{metricasCampanha.cpc.toFixed(2)}</span></div>}
                              {comprasNum > 0 && <div><span className="text-gogh-grayDark">CPA (R$)</span><br /><span className="font-medium">{metricasCampanha.cpaCalculado.toFixed(2)}</span></div>}
                              {valorInvestidoNum > 0 && valorFaturadoNum > 0 && <div><span className="text-gogh-grayDark">ROAS</span><br /><span className="font-medium">{metricasCampanha.roas.toFixed(2)}x</span></div>}
                            </div>
                            {comprasNum > 0 && <p className="text-xs text-gogh-grayDark mt-2">CPA = valor investido ÷ compras.</p>}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gogh-grayDark">
                          Preencha os dados da campanha abaixo ou adicione criativos para acompanhar cada anúncio separadamente (como no Meta Ads).
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Alcance (pessoas)</label>
                            <input type="number" min="0" value={alcance} onChange={(e) => setAlcance(e.target.value)} placeholder="Ex: 50000" className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('dados-campanha')}`} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Impressões</label>
                            <input type="number" min="0" value={impressoes} onChange={(e) => setImpressoes(e.target.value)} placeholder="Ex: 120000" className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('dados-campanha')}`} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Cliques no link</label>
                            <input type="number" min="0" value={cliquesLink} onChange={(e) => setCliquesLink(e.target.value)} placeholder="Ex: 2400" className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('dados-campanha')}`} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Valor investido (R$)</label>
                            <input type="number" min="0" step="0.01" value={valorInvestido} onChange={(e) => setValorInvestido(e.target.value)} placeholder="Ex: 1500" className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('dados-campanha')}`} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Compras / conversões</label>
                            <input type="number" min="0" value={compras} onChange={(e) => setCompras(e.target.value)} placeholder="Ex: 45" className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('dados-campanha')}`} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gogh-grayDark mb-1">Valor total faturado (R$)</label>
                            <input type="number" min="0" step="0.01" value={valorTotalFaturado} onChange={(e) => setValorTotalFaturado(e.target.value)} placeholder="Ex: 4365" className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ${getFieldBorderClass('dados-campanha')}`} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCreative}
                          disabled={addingCreative}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gogh-grayLight rounded-xl text-sm font-medium text-gogh-grayDark hover:bg-gogh-grayLight/30 transition-colors mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          {addingCreative ? 'Adicionando...' : 'Adicionar criativos (por anúncio)'}
                        </button>
                        {(impressoesNum > 0 || cliquesNum > 0 || comprasNum > 0 || valorInvestidoNum > 0) && (
                          <div className="rounded-xl border border-gogh-grayLight bg-gogh-beige/50 p-4 space-y-2">
                            <p className="text-sm font-semibold text-gogh-black flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gogh-yellow" />
                              Métricas calculadas automaticamente
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                              {alcanceNum > 0 && impressoesNum > 0 && (
                                <div><span className="text-gogh-grayDark">Frequência</span><br /><span className="font-medium">{metricasCampanha.freq.toFixed(2)}</span></div>
                              )}
                              {impressoesNum > 0 && <div><span className="text-gogh-grayDark">CTR</span><br /><span className="font-medium">{metricasCampanha.ctrPct.toFixed(2)}%</span></div>}
                              {cliquesNum > 0 && <div><span className="text-gogh-grayDark">Taxa de conversão</span><br /><span className="font-medium">{metricasCampanha.taxaConvPct.toFixed(2)}%</span></div>}
                              {cliquesNum > 0 && valorInvestidoNum > 0 && <div><span className="text-gogh-grayDark">CPC (R$)</span><br /><span className="font-medium">{metricasCampanha.cpc.toFixed(2)}</span></div>}
                              {comprasNum > 0 && <div><span className="text-gogh-grayDark">CPA (R$)</span><br /><span className="font-medium">{metricasCampanha.cpaCalculado.toFixed(2)}</span></div>}
                              {valorInvestidoNum > 0 && valorFaturadoNum > 0 && <div><span className="text-gogh-grayDark">ROAS</span><br /><span className="font-medium">{metricasCampanha.roas.toFixed(2)}x</span></div>}
                            </div>
                            {comprasNum > 0 && (
                              <p className="text-xs text-gogh-grayDark mt-2">CPA = valor investido ÷ compras.</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {accordionCard(
                  'plano-otimizacao',
                  'Plano de otimização',
                  planoOtimizacao.daysSinceStart != null
                    ? `Dia ${planoOtimizacao.daysSinceStart} · ${planoOtimizacao.phaseLabel}`
                    : 'Guia por dias desde o início da campanha',
                  <Calendar className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <p className="text-sm text-gogh-grayDark">
                      Estrutura recomendada por fase. Atualize os dados da campanha nos dias indicados para o sistema sugerir as próximas decisões.
                    </p>
                    {planoOtimizacao.daysSinceStart == null ? (
                      <p className="text-sm text-gogh-grayDark bg-gogh-grayLight/50 rounded-lg p-3">
                        Selecione uma campanha com data de início para ver o guia por dias.
                      </p>
                    ) : (
                      <>
                        {planoOtimizacao.isPaused && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            Campanha pausada. Ao retomar, siga o plano a partir do dia atual desde o início (ou reinicie mentalmente o ciclo se preferir).
                          </div>
                        )}
                        <p className="text-sm font-medium text-gogh-black">
                          {planoOtimizacao.phaseLabel}
                          {planoOtimizacao.daysSinceStart != null && (
                            <span className="text-gogh-grayDark font-normal"> — Dia {planoOtimizacao.daysSinceStart} desde o início</span>
                          )}
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 text-sm text-gogh-grayDark">
                          {planoOtimizacao.phaseSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                        <div className="rounded-lg border border-gogh-grayLight bg-gogh-beige/30 p-3 text-xs text-gogh-grayDark">
                          <strong>Modelo contínuo:</strong> Nunca deixar menos de 3 criativos ativos; ideal 4–5. Sempre substituir os fracos por novos.
                        </div>
                      </>
                    )}
                  </div>
                )}

                {accordionCard(
                  'status',
                  'Status e decisões',
                  statusAlerts.length > 0 ? `Score ${score} · ${statusGeral}` : 'Diagnóstico automático e recomendações',
                  <AlertCircle className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-4">
                    <p className="text-sm text-gogh-grayDark">
                      O sistema analisa os dados da campanha e da estrutura financeira e retorna um <strong>score (0–100)</strong> e recomendações objetivas. Você não precisa interpretar números — siga as ações sugeridas.
                    </p>
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
                        Preencha <strong>Dados da campanha</strong> (alcance, impressões, cliques, investido, compras) e <strong>Planejamento de valores</strong> para ver o diagnóstico e as recomendações.
                      </p>
                    ) : (
                      <div>
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
                                    {a.details.map((d, j) => (
                                      <p key={j} className="text-xs opacity-90 pt-2 first:pt-2">
                                        {d}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-gogh-grayLight">
                  <p className="text-xs text-gogh-grayDark">
                    {selectedCampaignId
                      ? (isProfileDirty ? 'Alterações não salvas. Clique em Salvar na campanha para gravar.' : 'Dados da campanha salvos.')
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
                        Salvar na campanha
                      </>
                    )}
                  </ShinyButton>
                </div>
                {selectedCampaignId && !isDadosCampanhaComplete && isProfileDirty && (
                  <p className="text-xs text-red-600 mt-2">
                    Preencha todos os campos de Dados da campanha para salvar.
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
