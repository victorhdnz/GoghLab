'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Coins, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getCreditsConfigKey, getCreditPlansKey, type CreditsConfig, type CreditActionId, type CreditPlan } from '@/lib/credits'

const ACTION_LABELS: Record<CreditActionId, string> = {
  foto: 'Criação de Foto',
  video: 'Criação de Vídeo',
  roteiro: 'Vídeo com Roteiro completo',
  prompts: 'Prompts para IAs',
  vangogh: 'Van Gogh',
}

const PLAN_IDS = ['gogh_essencial', 'gogh_pro'] as const

export default function CreditosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [monthlyCredits, setMonthlyCredits] = useState<Record<string, number>>({
    gogh_essencial: 50,
    gogh_pro: 200,
  })
  const [costByAction, setCostByAction] = useState<Record<CreditActionId, number>>({
    foto: 5,
    video: 10,
    roteiro: 15,
    prompts: 2,
    vangogh: 5,
  })
  const [creditPlans, setCreditPlans] = useState<CreditPlan[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', getCreditsConfigKey())
          .maybeSingle()
        const config = (data?.value as CreditsConfig) ?? null
        if (config?.monthlyCreditsByPlan) {
          setMonthlyCredits((prev) => ({ ...prev, ...config.monthlyCreditsByPlan }))
        }
        if (config?.costByAction) {
          setCostByAction((prev) => ({ ...prev, ...config.costByAction }))
        }
        const { data: plansData } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', getCreditPlansKey())
          .maybeSingle()
        const plans = Array.isArray(plansData?.value) ? plansData.value : []
        setCreditPlans(plans)
      } catch (e) {
        toast.error('Erro ao carregar configurações de créditos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    try {
      const value: CreditsConfig = {
        monthlyCreditsByPlan: { ...monthlyCredits },
        costByAction: { ...costByAction },
      }
      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert(
          {
            key: getCreditsConfigKey(),
            value,
            description: 'Créditos IA: créditos mensais por plano e custo por tipo de criação',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
      if (error) throw error
      const { error: plansError } = await (supabase as any)
        .from('site_settings')
        .upsert(
          {
            key: getCreditPlansKey(),
            value: creditPlans,
            description: 'Planos de créditos avulsos (exibidos na área de conta em Uso)',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
      if (plansError) throw plansError
      toast.success('Configurações de créditos salvas!')
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          Voltar ao Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center text-white">
            <Coins size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Créditos IA</h1>
            <p className="text-sm text-gray-500">
              Créditos mensais por plano e custo por tipo de criação
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Créditos mensais por plano</h2>
            <p className="text-sm text-gray-500 mb-4">
              Quantidade de créditos atribuídos a cada assinante no início do mês.
            </p>
            <div className="space-y-3">
              {PLAN_IDS.map((planId) => (
                <div key={planId} className="flex items-center gap-4">
                  <label className="w-40 text-sm font-medium text-gray-700 capitalize">
                    {planId.replace('_', ' ')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyCredits[planId] ?? 0}
                    onChange={(e) =>
                      setMonthlyCredits((prev) => ({
                        ...prev,
                        [planId]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-gray-500">créditos/mês</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Custo em créditos por função</h2>
            <p className="text-sm text-gray-500 mb-4">
              Quantos créditos são descontados por tipo de criação com IA.
            </p>
            <div className="space-y-3">
              {(Object.keys(ACTION_LABELS) as CreditActionId[]).map((actionId) => (
                <div key={actionId} className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-medium text-gray-700">
                    {ACTION_LABELS[actionId]}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={costByAction[actionId] ?? 0}
                    onChange={(e) =>
                      setCostByAction((prev) => ({
                        ...prev,
                        [actionId]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-gray-500">créditos</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planos de créditos avulsos</h2>
            <p className="text-sm text-gray-500 mb-4">
              Estes planos aparecem apenas na área de conta do usuário (seção Uso), para compra de créditos extras. Crie quantos quiser e informe o link do checkout da Stripe para cada um.
            </p>
            <div className="space-y-4">
              {creditPlans.map((plan, index) => (
                <div key={plan.id} className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                  <input
                    type="text"
                    placeholder="Nome do plano (ex: 50 créditos)"
                    value={plan.name}
                    onChange={(e) => {
                      const next = [...creditPlans]
                      next[index] = { ...next[index], name: e.target.value }
                      setCreditPlans(next)
                    }}
                    className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Créditos"
                    value={plan.credits || ''}
                    onChange={(e) => {
                      const next = [...creditPlans]
                      next[index] = { ...next[index], credits: parseInt(e.target.value, 10) || 0 }
                      setCreditPlans(next)
                    }}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    placeholder="URL checkout Stripe"
                    value={plan.stripe_checkout_url || ''}
                    onChange={(e) => {
                      const next = [...creditPlans]
                      next[index] = { ...next[index], stripe_checkout_url: e.target.value }
                      setCreditPlans(next)
                    }}
                    className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setCreditPlans((prev) => prev.filter((_, i) => i !== index))}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setCreditPlans((prev) => [
                    ...prev,
                    {
                      id: `plan-${Date.now()}`,
                      name: '',
                      credits: 0,
                      stripe_checkout_url: '',
                      order: prev.length,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg px-4 py-2"
              >
                <Plus size={18} />
                Adicionar plano de créditos
              </button>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
