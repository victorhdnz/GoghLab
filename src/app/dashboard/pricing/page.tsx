'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { PriceTier, Feature } from '@/components/ui/pricing-card'
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'

interface ComparisonFeature {
  id: string
  name: string
  order: number
}

interface PlanFeatureValue {
  feature_id: string
  text: string // Se vazio, significa que não tem o recurso
}

interface PricingSettings {
  pricing_enabled?: boolean
  pricing_title?: string
  pricing_description?: string
  pricing_annual_discount?: number
  pricing_plans?: [PriceTier, PriceTier, PriceTier]
  pricing_whatsapp_number?: string
  comparison_features?: ComparisonFeature[] // Recursos globais para comparação
}

export default function PricingEditorPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [comparisonFeaturesExpanded, setComparisonFeaturesExpanded] = useState(true)
  const [comparisonFeatures, setComparisonFeatures] = useState<ComparisonFeature[]>([])
  const [formData, setFormData] = useState<PricingSettings>({
    pricing_enabled: false,
    pricing_title: 'Escolha o plano ideal para sua empresa',
    pricing_description: 'Soluções completas de gestão digital para impulsionar seu negócio. Do básico ao enterprise, temos o plano certo para você.',
    pricing_annual_discount: 20,
    pricing_whatsapp_number: '',
    pricing_plans: [
      {
        id: 'basico',
        name: 'Básico',
        description: 'Ideal para pequenas empresas que estão começando sua jornada digital.',
        priceMonthly: 497,
        priceAnnually: 4766,
        isPopular: false,
        buttonLabel: 'Saiba mais',
        features: [
          { name: 'Criação de site institucional', isIncluded: true },
          { name: 'Gestão de redes sociais (3 plataformas)', isIncluded: true },
          { name: 'Criação de conteúdo (8 posts/mês)', isIncluded: true },
          { name: 'Relatórios mensais básicos', isIncluded: true },
          { name: 'Suporte por e-mail', isIncluded: true },
          { name: 'Tráfego pago', isIncluded: false },
          { name: 'Consultoria estratégica', isIncluded: false },
        ],
        whatsappMessageMonthly: 'Olá! Tenho interesse no plano Básico mensal. Gostaria de saber mais informações.',
        whatsappMessageAnnually: 'Olá! Tenho interesse no plano Básico anual. Gostaria de saber mais informações.',
      },
      {
        id: 'profissional',
        name: 'Profissional',
        description: 'Perfeito para empresas em crescimento que precisam de uma presença digital completa.',
        priceMonthly: 997,
        priceAnnually: 9565,
        isPopular: true,
        buttonLabel: 'Como iniciar',
        features: [
          { name: 'Criação de site institucional', isIncluded: true },
          { name: 'Gestão de redes sociais (5 plataformas)', isIncluded: true },
          { name: 'Criação de conteúdo (16 posts/mês)', isIncluded: true },
          { name: 'Tráfego pago (até R$ 1.000/mês)', isIncluded: true },
          { name: 'Relatórios mensais detalhados', isIncluded: true },
          { name: 'Suporte prioritário WhatsApp', isIncluded: true },
          { name: 'Consultoria estratégica mensal', isIncluded: true },
          { name: 'E-mail marketing', isIncluded: false },
        ],
        whatsappMessageMonthly: 'Olá! Tenho interesse no plano Profissional mensal. Gostaria de saber como iniciar.',
        whatsappMessageAnnually: 'Olá! Tenho interesse no plano Profissional anual. Gostaria de saber como iniciar.',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Solução completa para grandes empresas que precisam de máxima performance e suporte dedicado.',
        priceMonthly: 2497,
        priceAnnually: 23965,
        isPopular: false,
        buttonLabel: 'Saiba mais',
        features: [
          { name: 'Criação de site institucional + e-commerce', isIncluded: true },
          { name: 'Gestão de redes sociais (ilimitado)', isIncluded: true },
          { name: 'Criação de conteúdo (ilimitado)', isIncluded: true },
          { name: 'Tráfego pago (até R$ 5.000/mês)', isIncluded: true },
          { name: 'Relatórios semanais detalhados', isIncluded: true },
          { name: 'Suporte 24/7 dedicado', isIncluded: true },
          { name: 'Consultoria estratégica semanal', isIncluded: true },
          { name: 'E-mail marketing completo', isIncluded: true },
          { name: 'Gerente de conta dedicado', isIncluded: true },
        ],
        whatsappMessageMonthly: 'Olá! Tenho interesse no plano Enterprise mensal. Gostaria de agendar uma conversa.',
        whatsappMessageAnnually: 'Olá! Tenho interesse no plano Enterprise anual. Gostaria de agendar uma conversa.',
      },
    ],
  })

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else {
        loadSettings()
      }
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await getSiteSettings()

      if (error) {
        console.error('Erro ao carregar configurações:', error)
        toast.error('Erro ao carregar configurações de pricing.')
        return
      }

      if (data?.homepage_content?.pricing) {
        const pricing = data.homepage_content.pricing
        setFormData(prev => ({
          ...prev,
          ...pricing,
          pricing_plans: pricing.pricing_plans || prev.pricing_plans,
        }))
      }

      // Carregar recursos de comparação
      if (data?.homepage_content?.pricing?.comparison_features) {
        const features = data.homepage_content.pricing.comparison_features as ComparisonFeature[]
        setComparisonFeatures(features.sort((a, b) => a.order - b.order))
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações de pricing.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: currentData } = await getSiteSettings()
      const currentHomepageContent = currentData?.homepage_content || {}

      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: {
          homepage_content: {
            ...currentHomepageContent,
            pricing: {
              ...formData,
              comparison_features: comparisonFeatures,
            },
          },
        },
      })

      if (!success) {
        console.error('Erro ao salvar configurações:', error)
        toast.error(error?.message || 'Erro ao salvar configurações de pricing.')
        return
      }

      toast.success('Configurações de pricing salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações de pricing.')
    } finally {
      setSaving(false)
    }
  }

  const updatePlan = (index: number, field: keyof PriceTier, value: any) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans] as [PriceTier, PriceTier, PriceTier]
    newPlans[index] = { ...newPlans[index], [field]: value }
    
    // Se o preço mensal foi alterado, calcular automaticamente o preço anual
    if (field === 'priceMonthly' && typeof value === 'number' && value > 0) {
      const discountPercent = formData.pricing_annual_discount || 20
      const monthlyPrice = value
      const yearlyTotal = monthlyPrice * 12
      const discountAmount = yearlyTotal * (discountPercent / 100)
      const annualPrice = yearlyTotal - discountAmount
      newPlans[index].priceAnnually = Math.round(annualPrice)
    }
    
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const updateFeature = (planIndex: number, featureIndex: number, field: keyof Feature, value: any) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans] as [PriceTier, PriceTier, PriceTier]
    const newFeatures = [...newPlans[planIndex].features]
    newFeatures[featureIndex] = { ...newFeatures[featureIndex], [field]: value }
    newPlans[planIndex] = { ...newPlans[planIndex], features: newFeatures }
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const addFeature = (planIndex: number) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans] as [PriceTier, PriceTier, PriceTier]
    newPlans[planIndex].features.push({ name: '', isIncluded: true })
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const removeFeature = (planIndex: number, featureIndex: number) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans] as [PriceTier, PriceTier, PriceTier]
    newPlans[planIndex].features.splice(featureIndex, 1)
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  // Funções para gerenciar recursos de comparação globais
  const generateFeatureId = () => {
    return `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const handleAddComparisonFeature = () => {
    const newFeature: ComparisonFeature = {
      id: generateFeatureId(),
      name: '',
      order: comparisonFeatures.length,
    }
    setComparisonFeatures([...comparisonFeatures, newFeature])
  }

  const handleRemoveComparisonFeature = (featureId: string) => {
    setComparisonFeatures(comparisonFeatures.filter(f => f.id !== featureId))
    // Remover também dos feature_values de todos os planos
    if (formData.pricing_plans) {
      const newPlans = formData.pricing_plans.map(plan => ({
        ...plan,
        feature_values: (plan.feature_values || []).filter(fv => fv.feature_id !== featureId),
      })) as [PriceTier, PriceTier, PriceTier]
      setFormData({ ...formData, pricing_plans: newPlans })
    }
  }

  const handleUpdateComparisonFeature = (featureId: string, field: 'name', value: string) => {
    setComparisonFeatures(prev => prev.map(feature => 
      feature.id === featureId ? { ...feature, [field]: value } : feature
    ))
  }

  const handleMoveComparisonFeature = (featureId: string, direction: 'up' | 'down') => {
    const currentIndex = comparisonFeatures.findIndex(f => f.id === featureId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= comparisonFeatures.length) return

    const newFeatures = [...comparisonFeatures]
    const [removed] = newFeatures.splice(currentIndex, 1)
    newFeatures.splice(newIndex, 0, removed)
    
    // Atualizar ordem
    const updatedFeatures = newFeatures.map((feature, index) => ({
      ...feature,
      order: index,
    }))
    
    setComparisonFeatures(updatedFeatures)
  }

  // Função para atualizar o texto de um recurso de comparação em um plano
  const updatePlanFeatureValue = (planIndex: number, featureId: string, text: string) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans] as [PriceTier, PriceTier, PriceTier]
    const plan = newPlans[planIndex]
    const featureValues = plan.feature_values || []
    
    const existingIndex = featureValues.findIndex(fv => fv.feature_id === featureId)
    
    if (existingIndex >= 0) {
      // Atualizar existente
      featureValues[existingIndex].text = text
    } else {
      // Adicionar novo
      featureValues.push({ feature_id: featureId, text })
    }
    
    newPlans[planIndex] = { ...plan, feature_values: featureValues }
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  // Função para obter o texto de um recurso em um plano
  const getPlanFeatureText = (planIndex: number, featureId: string): string => {
    if (!formData.pricing_plans) return ''
    const plan = formData.pricing_plans[planIndex]
    const featureValue = (plan.feature_values || []).find(fv => fv.feature_id === featureId)
    return featureValue?.text || ''
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
        <DashboardNavigation
          title="Gerenciar Planos de Assinatura"
          subtitle="Configure os planos mensais e anuais de assinatura"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
          actions={
            <div className="flex gap-3">
              <Link href="/" target="_blank">
                <Button variant="outline" size="lg">
                  <Eye size={18} className="mr-2" />
                  Ver Preview
                </Button>
              </Link>
              <Button onClick={handleSave} isLoading={saving} size="lg">
                <Save size={18} className="mr-2" />
                Salvar Alterações
              </Button>
            </div>
          }
        />

        <div className="mt-8 space-y-6">
          {/* Configurações Gerais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Configurações Gerais</h2>
            <div className="space-y-4">
              <Switch
                label="Habilitar Seção de Pricing"
                checked={formData.pricing_enabled ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, pricing_enabled: checked })}
              />
              {formData.pricing_enabled && (
                <>
                  <Input
                    label="Título"
                    value={formData.pricing_title || ''}
                    onChange={(e) => setFormData({ ...formData, pricing_title: e.target.value })}
                    placeholder="Ex: Escolha o plano ideal para sua empresa"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <textarea
                      value={formData.pricing_description || ''}
                      onChange={(e) => setFormData({ ...formData, pricing_description: e.target.value })}
                      placeholder="Ex: Soluções completas de gestão digital para impulsionar seu negócio..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Input
                    label="Percentual de Desconto Anual (%)"
                    value={formData.pricing_annual_discount?.toString() || '20'}
                    onChange={(e) => {
                      const newDiscount = parseInt(e.target.value) || 20
                      setFormData((prev) => {
                        // Recalcular preços anuais de todos os planos quando o desconto mudar
                        const updatedPlans = prev.pricing_plans?.map((plan) => {
                          const yearlyTotal = plan.priceMonthly * 12
                          const discountAmount = yearlyTotal * (newDiscount / 100)
                          const annualPrice = yearlyTotal - discountAmount
                          return {
                            ...plan,
                            priceAnnually: Math.round(annualPrice)
                          }
                        }) as [PriceTier, PriceTier, PriceTier] | undefined
                        
                        return {
                          ...prev,
                          pricing_annual_discount: newDiscount,
                          pricing_plans: updatedPlans
                        }
                      })
                    }}
                    type="number"
                    min="0"
                    max="100"
                  />
                  <Input
                    label="Número do WhatsApp para Redirecionamento"
                    value={formData.pricing_whatsapp_number || ''}
                    onChange={(e) => setFormData({ ...formData, pricing_whatsapp_number: e.target.value })}
                    placeholder="Ex: 5534984136291"
                  />
                </>
              )}
            </div>
          </div>

          {/* Recursos de Comparação Globais */}
          {formData.pricing_enabled && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <button
                onClick={() => setComparisonFeaturesExpanded(!comparisonFeaturesExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">Recursos de Comparação (Globais)</h2>
                  <span className="text-sm text-gray-500">({comparisonFeatures.length} recursos)</span>
                </div>
                {comparisonFeaturesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {comparisonFeaturesExpanded && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Dica:</strong> Crie os recursos de comparação aqui. Depois, configure o texto de cada recurso em cada plano. Se deixar vazio, aparecerá como "não tem" (✗) na tabela de comparação.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {comparisonFeatures.map((feature, index) => (
                      <div key={feature.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMoveComparisonFeature(feature.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveComparisonFeature(feature.id, 'down')}
                            disabled={index === comparisonFeatures.length - 1}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <Input
                          value={feature.name}
                          onChange={(e) => handleUpdateComparisonFeature(feature.id, 'name', e.target.value)}
                          placeholder="Nome do recurso (ex: Desenvolvimento Web Essencial)"
                          className="flex-1"
                        />
                        <button
                          onClick={() => handleRemoveComparisonFeature(feature.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                          title="Remover recurso"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleAddComparisonFeature}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus size={18} className="mr-2" />
                    Adicionar Recurso de Comparação
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Planos */}
          {formData.pricing_enabled && formData.pricing_plans && (
            <div className="space-y-6">
              {formData.pricing_plans.map((plan, planIndex) => (
                <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold mb-4">Plano {planIndex + 1}: {plan.name}</h3>
                  
                  <div className="space-y-4">
                    <Input
                      label="Nome do Plano"
                      value={plan.name}
                      onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição</label>
                      <textarea
                        value={plan.description}
                        onChange={(e) => updatePlan(planIndex, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <Input
                        label="Preço Mensal (R$)"
                        value={plan.priceMonthly.toString()}
                        onChange={(e) => updatePlan(planIndex, 'priceMonthly', parseFloat(e.target.value) || 0)}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800 mb-1">
                          <strong>💡 Dica:</strong> O preço anual é calculado automaticamente com base no desconto de {formData.pricing_annual_discount || 20}%.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Preço Anual (R$) - Calculado automaticamente
                          </label>
                          <Input
                            value={plan.priceAnnually.toString()}
                            onChange={(e) => updatePlan(planIndex, 'priceAnnually', parseFloat(e.target.value) || 0)}
                            type="number"
                            min="0"
                            step="0.01"
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            <strong>Parcela mensal equivalente:</strong> R$ {(plan.priceAnnually / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Informações de Economia</label>
                          <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm space-y-1">
                            <p className="text-gray-700">
                              <strong>Total sem desconto (12x):</strong> R$ {(plan.priceMonthly * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-green-600 font-semibold">
                              <strong>Economia total:</strong> R$ {((plan.priceMonthly * 12) - plan.priceAnnually).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-blue-600 font-semibold">
                              <strong>Desconto aplicado:</strong> {formData.pricing_annual_discount || 20}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <strong>💡 Nota:</strong> O preço anual é calculado automaticamente quando você altera o preço mensal. Você pode editá-lo manualmente se necessário, mas será recalculado novamente se alterar o preço mensal.
                      </div>
                    </div>
                    <Switch
                      label="Marcar como 'Most Popular'"
                      checked={plan.isPopular}
                      onCheckedChange={(checked) => updatePlan(planIndex, 'isPopular', checked)}
                    />
                    <Input
                      label="Texto do Botão"
                      value={plan.buttonLabel}
                      onChange={(e) => updatePlan(planIndex, 'buttonLabel', e.target.value)}
                    />
                    
                    {/* Mensagens WhatsApp */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Mensagens WhatsApp</h4>
                      <div>
                        <label className="block text-sm font-medium mb-2">Mensagem para Plano Mensal</label>
                        <textarea
                          value={plan.whatsappMessageMonthly || ''}
                          onChange={(e) => updatePlan(planIndex, 'whatsappMessageMonthly', e.target.value)}
                          placeholder="Mensagem que será enviada ao clicar no botão do plano mensal"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-2">Mensagem para Plano Anual</label>
                        <textarea
                          value={plan.whatsappMessageAnnually || ''}
                          onChange={(e) => updatePlan(planIndex, 'whatsappMessageAnnually', e.target.value)}
                          placeholder="Mensagem que será enviada ao clicar no botão do plano anual"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Recursos de Comparação Detalhada */}
                    {comparisonFeatures.length > 0 ? (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-3">Textos dos Recursos de Comparação</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-blue-800">
                            <strong>💡 Dica:</strong> Configure o texto de cada recurso para este plano. Se deixar vazio, aparecerá como "não tem" (✗) na tabela de comparação detalhada. Os recursos são criados na seção "Recursos de Comparação (Globais)" acima.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {comparisonFeatures.map((comparisonFeature) => {
                            const currentText = getPlanFeatureText(planIndex, comparisonFeature.id)
                            return (
                              <div key={comparisonFeature.id} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {comparisonFeature.name || 'Recurso sem nome'}
                                </label>
                                <textarea
                                  value={currentText}
                                  onChange={(e) => updatePlanFeatureValue(planIndex, comparisonFeature.id, e.target.value)}
                                  placeholder={`Digite o texto para ${comparisonFeature.name || 'este recurso'} neste plano (deixe vazio se não tiver)`}
                                  rows={2}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {currentText && (
                                  <p className="text-xs text-green-600">
                                    ✓ Este recurso aparecerá na tabela de comparação
                                  </p>
                                )}
                                {!currentText && (
                                  <p className="text-xs text-gray-500">
                                    ✗ Este recurso aparecerá como "não tem" na tabela de comparação
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4 mt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            <strong>⚠️ Atenção:</strong> Crie recursos de comparação na seção "Recursos de Comparação (Globais)" acima para poder configurá-los aqui.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

