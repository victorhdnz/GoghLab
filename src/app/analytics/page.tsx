'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import toast from 'react-hot-toast'

type AnalyticsAccordionId = 'campanhas' | 'status' | 'roi'

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

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading, hasActiveSubscription, isPro } = useAuth()
  const hasAccess = isAuthenticated && isPro

  const [accordionOpen, setAccordionOpen] = useState<AnalyticsAccordionId | null>('campanhas')
  const [campaigns, setCampaigns] = useState<AnalyticsCampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignStartDate, setNewCampaignStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [roiEnabled, setRoiEnabled] = useState(false)
  const [valorVenda, setValorVenda] = useState<string>('')
  const [custoVenda, setCustoVenda] = useState<string>('')
  const [custoPorAquisição, setCustoPorAquisição] = useState<string>('')

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
                  'status',
                  'Status e decisões',
                  'Tomadas de decisão da campanha de anúncios',
                  <AlertCircle className="w-4 h-4 text-gogh-grayDark" />,
                  <div className="pt-3 space-y-3">
                    <p className="text-sm text-gogh-grayDark">
                      Use esta área para acompanhar as decisões da sua campanha de tráfego pago. Preencha valor da venda e custos na seção <strong>Custos e receita (ROI)</strong> para calcular o CPA break-even e saber se está no lucro. Em breve: recomendações automáticas com base nos resultados dos anúncios (ex.: trocar criativo, aumentar investimento ou manter).
                    </p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
