'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { PriceTier, Feature, ServiceOption } from '@/components/ui/pricing-card'
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'

interface FeatureCategory {
  id: string
  name: string
  order: number
}

interface PlanCategoryValue {
  category_id: string
  text: string // Se vazio, significa que não tem o recurso
}

interface PricingSettings {
  pricing_enabled?: boolean
  pricing_title?: string
  pricing_description?: string
  pricing_annual_discount?: number
  pricing_plans?: PriceTier[]
  pricing_whatsapp_number?: string // Legado
  feature_categories?: FeatureCategory[]
}

export default function PricingEditorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)
  const [featureCategories, setFeatureCategories] = useState<FeatureCategory[]>([])
  const defaultAgencyPlan: PriceTier = {
    id: 'gogh-agencia',
    name: 'Gogh Agency',
    description: 'Serviços completos de agência. Escolha o que você quer que a gente faça por você.',
    priceMonthly: 0,
    priceAnnually: 0,
    isPopular: false,
    buttonLabel: 'Solicitar serviço',
    planType: 'service',
    features: [
      { name: 'Gestão feita pela equipe', isIncluded: true },
      { name: 'Planejamento e execução completos', isIncluded: true },
      { name: 'Relatórios e acompanhamento', isIncluded: true },
    ],
    serviceOptions: [
      {
        id: 'marketing-trafego-pago',
        name: 'Marketing (Tráfego Pago)',
        description: 'Campanhas, otimizações e relatórios contínuos.',
        priceMonthly: 800,
        priceAnnually: 7680, // 800 * 12 * 0.8 = 7680 (20% desconto)
      },
      {
        id: 'criacao-sites',
        name: 'Criação de sites completos',
        description: 'Projeto, design, desenvolvimento e publicação.',
        priceMonthly: 1200,
        priceAnnually: 11520, // 1200 * 12 * 0.8 = 11520 (20% desconto)
      },
      {
        id: 'criacao-conteudo',
        name: 'Criação de conteúdo completa',
        description: 'Roteiro, produção, edição e pós-produção.',
        priceMonthly: 1500,
        priceAnnually: 14400, // 1500 * 12 * 0.8 = 14400 (20% desconto)
      },
      {
        id: 'gestao-redes-sociais',
        name: 'Gestão de redes sociais',
        description: 'Calendário, postagem e interação com a audiência.',
        priceMonthly: 1000,
        priceAnnually: 9600, // 1000 * 12 * 0.8 = 9600 (20% desconto)
      },
    ],
    // Textos padrão específicos para serviços (não espelham dos planos de assinatura)
    category_values: [
      {
        category_id: 'agentes-ia',
        text: 'Serviços executados pela equipe da agência'
      },
      {
        category_id: 'limite-uso-diario',
        text: 'Sem limites - execução completa pela equipe'
      },
      {
        category_id: 'cursos-edicao',
        text: 'Não incluído - foco em execução de serviços'
      },
      {
        category_id: 'canva-pro',
        text: 'Não incluído - foco em execução de serviços'
      },
      {
        category_id: 'capcut-pro',
        text: 'Não incluído - foco em execução de serviços'
      },
      {
        category_id: 'materiais-exclusivos',
        text: 'Não incluído - foco em execução de serviços'
      },
      {
        category_id: 'suporte',
        text: 'Suporte dedicado via WhatsApp para clientes de serviços'
      },
    ],
  }

  const ensureAgencyPlan = (plans: PriceTier[] | undefined) => {
    const currentPlans = plans || []
    const hasAgency = currentPlans.some(plan => plan.id === defaultAgencyPlan.id)
    if (hasAgency) return currentPlans
    return [...currentPlans, defaultAgencyPlan]
  }

  const [formData, setFormData] = useState<PricingSettings>({
    pricing_enabled: true,
    pricing_title: 'Escolha seu plano e comece a criar',
    pricing_description: 'Acesse a plataforma com IA e, se preferir, contrate nossa equipe para executar tudo como agência completa.',
    pricing_annual_discount: 20, // 20% de desconto no plano anual
    pricing_whatsapp_number: '',
    pricing_plans: ensureAgencyPlan([
      {
        id: 'gogh-essencial',
        name: 'Gogh Essencial',
        description: 'Acesso a todos os agentes de IA para criar conteúdos de vídeo, redes sociais e anúncios.',
        priceMonthly: 67.90,
        priceAnnually: 651.90,
        isPopular: false,
        buttonLabel: 'Começar agora',
        planType: 'subscription',
        features: [
          { name: 'Agente de IA para Vídeos', isIncluded: true },
          { name: 'Agente de IA para Redes Sociais', isIncluded: true },
          { name: 'Agente de IA para Anúncios', isIncluded: true },
          { name: '8 interações por dia', isIncluded: true },
          { name: 'Suporte por e-mail', isIncluded: true },
          { name: 'Cursos de edição', isIncluded: false },
          { name: 'Canva Pro + CapCut Pro', isIncluded: false },
        ],
        stripePriceIdMonthly: 'price_1SpjGIJmSvvqlkSQGIpVMt0H',
        stripePriceIdAnnually: 'price_1SpjHyJmSvvqlkSQRBubxB7K',
      },
      {
        id: 'gogh-pro',
        name: 'Gogh Pro',
        description: 'Tudo do Essencial + cursos completos de edição + acesso ao Canva Pro e CapCut Pro.',
        priceMonthly: 127.90,
        priceAnnually: 1226.90,
        isPopular: true,
        buttonLabel: 'Assinar Pro',
        planType: 'subscription',
        features: [
          { name: 'Tudo do plano Essencial', isIncluded: true },
          { name: '20 interações por dia (2,5x mais)', isIncluded: true },
          { name: 'Respostas mais completas', isIncluded: true },
          { name: 'Cursos de edição (Canva + CapCut)', isIncluded: true },
          { name: 'Acesso ao Canva Pro', isIncluded: true },
          { name: 'Acesso ao CapCut Pro', isIncluded: true },
          { name: 'Suporte prioritário', isIncluded: true },
        ],
        stripePriceIdMonthly: 'price_1SpjJIJmSvvqlkSQpBHztwk6',
        stripePriceIdAnnually: 'price_1SpjKSJmSvvqlkSQlr8jNDTf',
      },
    ]),
  })

  useEffect(() => {
    // Carregar configurações - autenticação é verificada pelo middleware
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await getSiteSettings()

      if (error) {
        console.error('Erro ao carregar configurações:', error)
        toast.error('Erro ao carregar configurações de pricing.')
        setLoading(false)
        return
      }

      if (data?.homepage_content?.pricing) {
        const pricing = data.homepage_content.pricing
        
        setFormData(prev => {
          const dbPlans = pricing.pricing_plans || []
          const plans = ensureAgencyPlan(dbPlans.length > 0 ? dbPlans : prev.pricing_plans)
          
          // Garantir que o plano de serviço tenha textos padrão se não tiver
          const plansWithDefaults = plans.map(plan => {
            if (plan.planType === 'service' && (!plan.category_values || plan.category_values.length === 0)) {
              // Se não tem category_values, usar os padrões do defaultAgencyPlan
              return {
                ...plan,
                category_values: defaultAgencyPlan.category_values || []
              }
            }
            return plan
          })
          
          return {
            ...prev,
            ...pricing,
            pricing_annual_discount: pricing.pricing_annual_discount || prev.pricing_annual_discount || 20,
            pricing_plans: plansWithDefaults,
          }
        })
      }

      // Carregar categorias de recursos
      // Verificar em múltiplos locais possíveis
      let categories: FeatureCategory[] = []
      
      if (data?.homepage_content?.pricing?.feature_categories) {
        categories = data.homepage_content.pricing.feature_categories as FeatureCategory[]
      } else if (data?.pricing?.feature_categories) {
        categories = data.pricing.feature_categories as FeatureCategory[]
      } else if ((data as any)?.feature_categories) {
        categories = (data as any).feature_categories as FeatureCategory[]
      }
      
      if (categories && categories.length > 0) {
        console.log('📦 Categorias carregadas:', categories.length)
        setFeatureCategories(categories.sort((a, b) => a.order - b.order))
      } else {
        console.log('⚠️ Nenhuma categoria encontrada nos dados:', data)
      }
    } catch (error: any) {
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
              feature_categories: featureCategories,
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
    
    const newPlans = [...formData.pricing_plans]
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
    
    const newPlans = [...formData.pricing_plans]
    const newFeatures = [...newPlans[planIndex].features]
    newFeatures[featureIndex] = { ...newFeatures[featureIndex], [field]: value }
    newPlans[planIndex] = { ...newPlans[planIndex], features: newFeatures }
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const addFeature = (planIndex: number) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans]
    newPlans[planIndex].features.push({ name: '', isIncluded: true })
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const removeFeature = (planIndex: number, featureIndex: number) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans]
    newPlans[planIndex].features.splice(featureIndex, 1)
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const updateServiceOption = (planIndex: number, optionIndex: number, field: keyof ServiceOption, value: any) => {
    if (!formData.pricing_plans) return

    const newPlans = [...formData.pricing_plans]
    const options = [...(newPlans[planIndex].serviceOptions || [])]
    const updatedOption = { ...options[optionIndex], [field]: value }
    
    // Se o preço mensal foi alterado, calcular automaticamente o preço anual com desconto
    if (field === 'priceMonthly' && typeof value === 'number' && value > 0) {
      const discountPercent = formData.pricing_annual_discount || 20
      const monthlyPrice = value
      const yearlyTotal = monthlyPrice * 12
      const discountAmount = yearlyTotal * (discountPercent / 100)
      const annualPrice = yearlyTotal - discountAmount
      updatedOption.priceAnnually = Math.round(annualPrice * 100) / 100 // Arredondar para 2 casas decimais
    }
    
    options[optionIndex] = updatedOption
    newPlans[planIndex] = { ...newPlans[planIndex], serviceOptions: options }
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const addServiceOption = (planIndex: number) => {
    if (!formData.pricing_plans) return

    const newPlans = [...formData.pricing_plans]
    const options = [...(newPlans[planIndex].serviceOptions || [])]
    options.push({
      id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: '',
      description: '',
      priceMonthly: 0,
      priceAnnually: 0,
    })
    newPlans[planIndex] = { ...newPlans[planIndex], serviceOptions: options }
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  const removeServiceOption = (planIndex: number, optionIndex: number) => {
    if (!formData.pricing_plans) return

    const newPlans = [...formData.pricing_plans]
    const options = [...(newPlans[planIndex].serviceOptions || [])]
    options.splice(optionIndex, 1)
    newPlans[planIndex] = { ...newPlans[planIndex], serviceOptions: options }
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  // Funções para gerenciar categorias
  const generateCategoryId = () => {
    return `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const handleAddCategory = () => {
    const newCategory: FeatureCategory = {
      id: generateCategoryId(),
      name: '',
      order: featureCategories.length,
    }
    setFeatureCategories([...featureCategories, newCategory])
  }

  const handleRemoveCategory = (categoryId: string) => {
    setFeatureCategories(featureCategories.filter(c => c.id !== categoryId))
    // Remover também dos category_values de todos os planos
    if (formData.pricing_plans) {
      const newPlans = formData.pricing_plans.map(plan => ({
        ...plan,
        category_values: (plan.category_values || []).filter(cv => cv.category_id !== categoryId),
      }))
      setFormData({ ...formData, pricing_plans: newPlans })
    }
  }

  const handleUpdateCategory = (categoryId: string, field: 'name', value: string) => {
    setFeatureCategories(prev => prev.map(c => 
      c.id === categoryId ? { ...c, [field]: value } : c
    ))
  }

  const handleMoveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = featureCategories.findIndex(c => c.id === categoryId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= featureCategories.length) return

    const newCategories = [...featureCategories]
    const [removed] = newCategories.splice(currentIndex, 1)
    newCategories.splice(newIndex, 0, removed)
    
    // Atualizar ordem
    const updatedCategories = newCategories.map((category, index) => ({
      ...category,
      order: index,
    }))
    
    setFeatureCategories(updatedCategories)
  }

  // Função para atualizar o texto de uma categoria em um plano
  const updatePlanCategoryValue = (planIndex: number, categoryId: string, text: string) => {
    if (!formData.pricing_plans) return
    
    const newPlans = [...formData.pricing_plans] as [PriceTier, PriceTier, PriceTier]
    const plan = newPlans[planIndex]
    const categoryValues = plan.category_values || []
    
    const existingIndex = categoryValues.findIndex(cv => cv.category_id === categoryId)
    
    if (existingIndex >= 0) {
      // Atualizar existente
      categoryValues[existingIndex].text = text
    } else {
      // Adicionar novo
      categoryValues.push({ category_id: categoryId, text })
    }
    
    newPlans[planIndex] = { ...plan, category_values: categoryValues }
    setFormData({ ...formData, pricing_plans: newPlans })
  }

  // Função para obter o texto de uma categoria em um plano
  const getPlanCategoryText = (planIndex: number, categoryId: string): string => {
    if (!formData.pricing_plans) return ''
    const plan = formData.pricing_plans[planIndex]
    const categoryValue = (plan.category_values || []).find(cv => cv.category_id === categoryId)
    return categoryValue?.text || ''
  }

  if (loading) {
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
                        })
                        
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>💳 Integração Stripe:</strong> Os Price IDs do Stripe serão configurados em cada plano abaixo. Após criar os produtos no Stripe, copie os Price IDs para os campos correspondentes.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Categorias de Recursos */}
          {formData.pricing_enabled && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">Categorias de Recursos</h2>
                  <span className="text-sm text-gray-500">({featureCategories.length} categorias)</span>
                </div>
                {categoriesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {categoriesExpanded && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Dica:</strong> Crie categorias para agrupar recursos similares. Ex: "Criação de Site", "Gestão de Redes Sociais", etc. Isso permite que diferentes planos tenham o mesmo recurso com textos diferentes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {featureCategories.map((category, index) => (
                      <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMoveCategory(category.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveCategory(category.id, 'down')}
                            disabled={index === featureCategories.length - 1}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <Input
                          value={category.name}
                          onChange={(e) => handleUpdateCategory(category.id, 'name', e.target.value)}
                          placeholder="Nome da categoria (ex: Criação de Site)"
                          className="flex-1"
                        />
                        <button
                          onClick={() => handleRemoveCategory(category.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                          title="Remover categoria"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleAddCategory}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus size={18} className="mr-2" />
                    Adicionar Categoria
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
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo do Plano</label>
                      <select
                        value={plan.planType || 'subscription'}
                        onChange={(e) => updatePlan(planIndex, 'planType', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="subscription">Assinatura</option>
                        <option value="service">Serviços Personalizados</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Planos de serviços permitem seleção de itens e preço total dinâmico.
                      </p>
                    </div>
                    {/* Preços - Apenas para planos de assinatura */}
                    {plan.planType !== 'service' && (
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
                    )}
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
                    
                    {plan.planType === 'service' && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-3">🧩 Serviços Selecionáveis</h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-yellow-800">
                            <strong>Como funciona:</strong> Todos os serviços começam selecionados no checkout. O usuário pode remover itens antes de contratar.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {(plan.serviceOptions || []).map((option, optionIndex) => (
                            <div key={option.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  label="Nome do Serviço"
                                  value={option.name}
                                  onChange={(e) => updateServiceOption(planIndex, optionIndex, 'name', e.target.value)}
                                />
                                <Input
                                  label="Descrição (opcional)"
                                  value={option.description || ''}
                                  onChange={(e) => updateServiceOption(planIndex, optionIndex, 'description', e.target.value)}
                                />
                              </div>
                              <div className="space-y-4 mt-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input
                                    label="Preço Mensal (R$)"
                                    value={option.priceMonthly.toString()}
                                    onChange={(e) => updateServiceOption(planIndex, optionIndex, 'priceMonthly', parseFloat(e.target.value) || 0)}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                  />
                                  <div>
                                    <label className="block text-sm font-medium mb-2">
                                      Preço Anual (R$) - Calculado automaticamente
                                    </label>
                                    <Input
                                      value={option.priceAnnually.toString()}
                                      readOnly
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="bg-gray-50 cursor-not-allowed"
                                    />
                                  </div>
                                </div>
                                {option.priceMonthly > 0 && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-600">
                                          <strong>Parcela mensal equivalente:</strong> R$ {(option.priceAnnually / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-gray-600">
                                          <strong>Total sem desconto (12x):</strong> R$ {(option.priceMonthly * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-green-600 font-semibold">
                                          <strong>Economia total:</strong> R$ {((option.priceMonthly * 12) - option.priceAnnually).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-blue-600 font-semibold">
                                          <strong>Desconto aplicado:</strong> {formData.pricing_annual_discount || 20}%
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                                      <strong>💡 Nota:</strong> O preço anual é calculado automaticamente quando você altera o preço mensal. Você pode editá-lo manualmente se necessário, mas será recalculado novamente se alterar o preço mensal.
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={() => removeServiceOption(planIndex, optionIndex)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remover serviço
                                </button>
                              </div>
                            </div>
                          ))}
                          <Button
                            onClick={() => addServiceOption(planIndex)}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus size={18} className="mr-2" />
                            Adicionar Serviço
                          </Button>
                        </div>
                      </div>
                    )}

                    {plan.planType !== 'service' && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-3">💳 Configuração Stripe</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-blue-800">
                            <strong>Como obter os Price IDs:</strong> No Stripe Dashboard, vá em Products → Crie o produto → Adicione os preços (mensal e anual) → Copie o ID de cada preço (começa com "price_").
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Stripe Price ID (Mensal)"
                            value={plan.stripePriceIdMonthly || ''}
                            onChange={(e) => updatePlan(planIndex, 'stripePriceIdMonthly', e.target.value)}
                            placeholder="price_xxxxxxxxxxxxx"
                          />
                          <Input
                            label="Stripe Price ID (Anual)"
                            value={plan.stripePriceIdAnnually || ''}
                            onChange={(e) => updatePlan(planIndex, 'stripePriceIdAnnually', e.target.value)}
                            placeholder="price_xxxxxxxxxxxxx"
                          />
                        </div>
                      </div>
                    )}

                    {/* Textos das Categorias de Comparação - Apenas para planos de assinatura */}
                    {plan.planType !== 'service' && featureCategories.length > 0 ? (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-3">Textos das Categorias de Comparação</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-blue-800 mb-2">
                            <strong>💡 Como funciona:</strong>
                          </p>
                          <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                            <li><strong>Nome da categoria:</strong> Aparece como título principal na tabela</li>
                            <li><strong>Quando TODOS os planos têm texto:</strong> A tabela mostra ✓ + o texto específico de cada plano lado a lado</li>
                            <li><strong>Quando APENAS ALGUNS planos têm:</strong> Mostra ✓ + texto para quem tem, e ✗ para quem não tem</li>
                            <li><strong>Se deixar vazio:</strong> Aparecerá como ✗ na tabela, indicando que o plano não tem essa categoria</li>
                          </ul>
                        </div>
                        
                        {/* Mostrar categorias com campo de texto */}
                        <div className="space-y-4">
                          {featureCategories.map((category) => {
                            const currentText = getPlanCategoryText(planIndex, category.id)
                            return (
                              <div key={category.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h5 className="font-semibold text-gray-900 mb-3">{category.name}</h5>
                                <div className="space-y-2 bg-white p-3 rounded border border-gray-200">
                                  <textarea
                                    value={currentText}
                                    onChange={(e) => updatePlanCategoryValue(planIndex, category.id, e.target.value)}
                                    placeholder={`Digite o texto para ${category.name} neste plano (deixe vazio se não tiver)`}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  {currentText && (
                                    <p className="text-xs text-green-600">
                                      ✓ Esta categoria aparecerá na tabela de comparação
                                    </p>
                                  )}
                                  {!currentText && (
                                    <p className="text-xs text-gray-500">
                                      ✗ Esta categoria aparecerá como "não tem" na tabela de comparação
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4 mt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            <strong>⚠️ Atenção:</strong> Crie categorias na seção "Categorias de Recursos" acima para poder configurá-las aqui.
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

