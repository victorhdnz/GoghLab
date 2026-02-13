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
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Pencil, X, Check, Zap } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { getCreditsConfigKey, getCreditPlansKey, type CreditsConfig, type CreditActionId, type CreditPlan } from '@/lib/credits'

interface PricingSettings {
  pricing_enabled?: boolean
  pricing_title?: string
  pricing_description?: string
  pricing_annual_discount?: number
  pricing_plans?: PriceTier[]
  pricing_whatsapp_number?: string // Legado
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  product_type: string
  order_position: number
  is_active: boolean
  icon_url?: string | null
}

interface PlanProduct {
  plan_id: string
  product_id: string
}

export default function PricingEditorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [productsExpanded, setProductsExpanded] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [planProducts, setPlanProducts] = useState<PlanProduct[]>([])
  const [newProductName, setNewProductName] = useState('')
  const [newProductSlug, setNewProductSlug] = useState('')
  const [newProductType, setNewProductType] = useState<'tool' | 'course' | 'credits' | 'other'>('tool')
  const [addingProduct, setAddingProduct] = useState(false)
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null)
  const [reorderingProductId, setReorderingProductId] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingProductName, setEditingProductName] = useState('')
  const [editingProductSlug, setEditingProductSlug] = useState('')
  const [savingProductId, setSavingProductId] = useState<string | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [savingCredits, setSavingCredits] = useState(false)
  const [monthlyCredits, setMonthlyCredits] = useState<Record<string, number>>({ gogh_essencial: 50, gogh_pro: 200 })
  const [costByAction, setCostByAction] = useState<Record<CreditActionId, number>>({
    foto: 5,
    video: 10,
    roteiro: 15,
    vangogh: 5,
  })
  const [creditPlans, setCreditPlans] = useState<CreditPlan[]>([])
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
      {
        id: 'manutencao-sites',
        name: 'Manutenção e Alteração em sites existentes',
        description: 'Manutenção, correções, e adição em sites existentes.',
        priceMonthly: 400,
        priceAnnually: 3840, // 400 * 12 * 0.8 = 3840 (20% desconto)
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
          const plansWithDefaults = plans
          
          return {
            ...prev,
            ...pricing,
            pricing_annual_discount: pricing.pricing_annual_discount || prev.pricing_annual_discount || 20,
            pricing_plans: plansWithDefaults,
          }
        })
      }

      // Carregar produtos e plan_products e espelhar nos planos (features = produtos incluídos)
      try {
        const { data: productsData } = await (supabase as any).from('products').select('*').eq('is_active', true).order('order_position', { ascending: true })
        const { data: planProductsData } = await (supabase as any).from('plan_products').select('plan_id, product_id')
        if (productsData) setProducts(sortProductsCreditsFirst(productsData as Product[]))
        if (planProductsData) setPlanProducts(planProductsData as PlanProduct[])

        // Sincronizar features dos planos Essencial/Pro a partir dos produtos atribuídos
        const prods = (productsData || []) as Product[]
        const pps = (planProductsData || []) as PlanProduct[]
        const planIdToDb = (id: string) => id === 'gogh-essencial' ? 'gogh_essencial' : id === 'gogh-pro' ? 'gogh_pro' : id
        setFormData(prev => {
          if (!prev.pricing_plans) return prev
          const plans = prev.pricing_plans.map(plan => {
            if (plan.id !== 'gogh-essencial' && plan.id !== 'gogh-pro') return plan
            const dbPlanId = planIdToDb(plan.id)
            const productIds = new Set(pps.filter(pp => pp.plan_id === dbPlanId).map(pp => pp.product_id))
            const features = prods
              .filter(p => productIds.has(p.id))
              .map(p => ({ name: p.name, isIncluded: true, iconUrl: p.icon_url ?? undefined }))
            return { ...plan, features }
          })
          return { ...prev, pricing_plans: plans }
        })
      } catch (_) {
        // Tabelas podem não existir ainda (migration não rodada)
      }

      // Config de Créditos IA (site_settings)
      try {
        const { data: configRow } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', getCreditsConfigKey())
          .maybeSingle()
        const config = (configRow?.value as CreditsConfig) ?? null
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
      } catch (_) {
        // ignorar
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

      // Sincronizar features dos planos Essencial/Pro a partir dos produtos (para exibir na home)
      const planIdToDb = (id: string) => id === 'gogh-essencial' ? 'gogh_essencial' : id === 'gogh-pro' ? 'gogh_pro' : id
      const plansToSave = formData.pricing_plans?.map(plan => {
        if (plan.id !== 'gogh-essencial' && plan.id !== 'gogh-pro') return plan
        const dbPlanId = planIdToDb(plan.id)
        const productIds = new Set(planProducts.filter(pp => pp.plan_id === dbPlanId).map(pp => pp.product_id))
        const features = products
          .filter(p => productIds.has(p.id))
          .map(p => ({ name: p.name, isIncluded: true, iconUrl: p.icon_url ?? undefined }))
        return { ...plan, features }
      }) ?? formData.pricing_plans

      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: {
          homepage_content: {
            ...currentHomepageContent,
            pricing: {
              ...formData,
              pricing_plans: plansToSave,
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

  const CREDIT_ACTION_LABELS: Record<CreditActionId, string> = {
    foto: 'Foto',
    video: 'Vídeo',
    roteiro: 'Roteiro de Vídeos',
    vangogh: 'Criação de Prompts',
  }
  const PLAN_IDS_CREDITS = ['gogh_essencial', 'gogh_pro'] as const

  const handleSaveCredits = async () => {
    setSavingCredits(true)
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
      toast.error(e?.message ?? 'Erro ao salvar créditos')
    } finally {
      setSavingCredits(false)
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

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const sortProductsCreditsFirst = (list: Product[]) =>
    [...list].sort((a, b) => {
      if (a.product_type === 'credits' && b.product_type !== 'credits') return -1
      if (b.product_type === 'credits' && a.product_type !== 'credits') return 1
      return a.order_position - b.order_position
    })

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      toast.error('Nome do produto é obrigatório')
      return
    }
    const slug = newProductSlug.trim() || slugFromName(newProductName)
    setAddingProduct(true)
    try {
      if (newProductType === 'credits') {
        for (const p of products) {
          await (supabase as any).from('products').update({ order_position: p.order_position + 1 }).eq('id', p.id)
        }
      }
      const insertPayload: Record<string, unknown> = {
        name: newProductName.trim(),
        slug,
        product_type: newProductType,
        order_position: newProductType === 'credits' ? 0 : products.length,
        is_active: true,
      }
      if (newProductType === 'credits') {
        insertPayload.icon_url = '/icons/lightning-credits.svg'
      }
      const { data: insertedProduct, error } = await (supabase as any)
        .from('products')
        .insert(insertPayload)
        .select()
        .single()
      if (error) throw error
      if (newProductType === 'tool' && insertedProduct?.id) {
        const { data: existingTool } = await (supabase as any)
          .from('tools')
          .select('id')
          .eq('product_id', insertedProduct.id)
          .maybeSingle()
        if (!existingTool) {
          const { error: toolError } = await (supabase as any)
            .from('tools')
            .insert({
              product_id: insertedProduct.id,
              name: insertedProduct.name,
              slug: insertedProduct.slug,
              description: null,
              tutorial_video_url: null,
              requires_8_days: true,
              order_position: products.length,
              is_active: true,
            })
          if (toolError) {
            console.error('Erro ao espelhar ferramenta:', toolError)
            toast.success('Produto criado. Crie a ferramenta manualmente em Gerenciar Ferramentas se precisar.')
          } else {
            toast.success('Produto e ferramenta criados. Configure o vídeo e o prazo em Gerenciar Ferramentas.')
          }
        } else {
          toast.success('Produto criado. A ferramenta já existe em Gerenciar Ferramentas.')
        }
      } else {
        toast.success('Produto criado')
      }
      setNewProductName('')
      setNewProductSlug('')
      const { data } = await (supabase as any).from('products').select('*').eq('is_active', true).order('order_position', { ascending: true })
      if (data) {
        setProducts(sortProductsCreditsFirst(data as Product[]))
        syncPlanFeaturesFromProducts(planProducts, sortProductsCreditsFirst(data as Product[]))
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar produto')
    } finally {
      setAddingProduct(false)
    }
  }

  const planHasProduct = (planId: string, productId: string) =>
    planProducts.some(pp => pp.plan_id === planId && pp.product_id === productId)

  const handleMoveProductOrder = async (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= products.length) return
    const fromProduct = products[fromIndex]
    const toProduct = products[toIndex]
    setReorderingProductId(fromProduct.id)
    try {
      await (supabase as any).from('products').update({ order_position: toProduct.order_position }).eq('id', fromProduct.id)
      await (supabase as any).from('products').update({ order_position: fromProduct.order_position }).eq('id', toProduct.id)
      const { data } = await (supabase as any).from('products').select('*').eq('is_active', true).order('order_position', { ascending: true })
      if (data) setProducts(sortProductsCreditsFirst(data as Product[]))
      syncPlanFeaturesFromProducts(planProducts, data || products)
      toast.success('Ordem atualizada')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao reordenar')
    } finally {
      setReorderingProductId(null)
    }
  }

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id)
    setEditingProductName(p.name)
    setEditingProductSlug(p.slug)
  }

  const cancelEditProduct = () => {
    setEditingProductId(null)
    setEditingProductName('')
    setEditingProductSlug('')
  }

  const handleUpdateProduct = async (productId: string, name: string, slug: string) => {
    if (!name.trim()) {
      toast.error('Nome do produto é obrigatório')
      return
    }
    const slugFinal = slug.trim() || slugFromName(name)
    setSavingProductId(productId)
    try {
      const { error: productError } = await (supabase as any)
        .from('products')
        .update({ name: name.trim(), slug: slugFinal })
        .eq('id', productId)
      if (productError) throw productError
      // Espelhar nome/slug em tools para Gerenciar Ferramentas e área do membro sempre refletirem a alteração
      const product = products.find(pr => pr.id === productId)
      if (product?.product_type === 'tool') {
        await (supabase as any)
          .from('tools')
          .update({ name: name.trim(), slug: slugFinal })
          .eq('product_id', productId)
      }
      const { data } = await (supabase as any).from('products').select('*').eq('is_active', true).order('order_position', { ascending: true })
      if (data) {
        setProducts(sortProductsCreditsFirst(data as Product[]))
        syncPlanFeaturesFromProducts(planProducts, data as Product[])
      }
      setEditingProductId(null)
      setEditingProductName('')
      setEditingProductSlug('')
      toast.success('Produto atualizado')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar produto')
    } finally {
      setSavingProductId(null)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(pr => pr.id === productId)
    if (!product) return
    const msg = product.product_type === 'tool'
      ? `Excluir o produto "${product.name}"? A ferramenta vinculada em Gerenciar Ferramentas também será excluída.`
      : `Excluir o produto "${product.name}"? Ele será removido de todos os planos.`
    if (!confirm(msg)) return
    setDeletingProductId(productId)
    try {
      await (supabase as any).from('plan_products').delete().eq('product_id', productId)
      if (product.product_type === 'tool') {
        await (supabase as any).from('tools').delete().eq('product_id', productId)
      }
      const { error } = await (supabase as any).from('products').delete().eq('id', productId)
      if (error) throw error
      const { data: productsData } = await (supabase as any).from('products').select('*').eq('is_active', true).order('order_position', { ascending: true })
      const { data: planProductsData } = await (supabase as any).from('plan_products').select('plan_id, product_id')
      if (productsData) setProducts(sortProductsCreditsFirst(productsData as Product[]))
      if (planProductsData) setPlanProducts(planProductsData as PlanProduct[])
      syncPlanFeaturesFromProducts(planProductsData || [], productsData || [])
      toast.success(product.product_type === 'tool' ? 'Produto e ferramenta excluídos' : 'Produto excluído')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir produto')
    } finally {
      setDeletingProductId(null)
    }
  }

  const handleProductIconUpload = async (productId: string, file: File) => {
    setUploadingProductId(productId)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'product-icons')
      formDataUpload.append('preserveTransparency', 'true')
      const response = await fetch('/api/upload', { method: 'POST', body: formDataUpload })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Erro no upload')
      const { error } = await (supabase as any).from('products').update({ icon_url: data.url }).eq('id', productId)
      if (error) throw error
      // Ícone fica em products; Gerenciar Ferramentas e área do membro leem products(icon_url) via join, então já refletem o novo logo
      const { data: updated } = await (supabase as any).from('products').select('*').eq('is_active', true).order('order_position', { ascending: true })
      if (updated) setProducts(sortProductsCreditsFirst(updated as Product[]))
      syncPlanFeaturesFromProducts(planProducts, updated || products)
      toast.success('Ícone do produto atualizado')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao enviar ícone')
    } finally {
      setUploadingProductId(null)
    }
  }

  const planIdToDb = (id: string) => id === 'gogh-essencial' ? 'gogh_essencial' : id === 'gogh-pro' ? 'gogh_pro' : id
  const syncPlanFeaturesFromProducts = (ppList: PlanProduct[], prodList: Product[]) => {
    setFormData(prev => {
      if (!prev.pricing_plans) return prev
      return {
        ...prev,
        pricing_plans: prev.pricing_plans.map(plan => {
          if (plan.id !== 'gogh-essencial' && plan.id !== 'gogh-pro') return plan
          const dbPlanId = planIdToDb(plan.id)
          const productIds = new Set(ppList.filter(pp => pp.plan_id === dbPlanId).map(pp => pp.product_id))
          const features = prodList
            .filter(p => productIds.has(p.id))
            .map(p => ({ name: p.name, isIncluded: true, iconUrl: p.icon_url ?? undefined }))
          return { ...plan, features }
        }),
      }
    })
  }

  const togglePlanProduct = async (planId: string, productId: string) => {
    const has = planHasProduct(planId, productId)
    try {
      if (has) {
        await (supabase as any).from('plan_products').delete().eq('plan_id', planId).eq('product_id', productId)
        const next = planProducts.filter(pp => !(pp.plan_id === planId && pp.product_id === productId))
        setPlanProducts(next)
        syncPlanFeaturesFromProducts(next, products)
      } else {
        await (supabase as any).from('plan_products').insert({ plan_id: planId, product_id: productId })
        const next = [...planProducts, { plan_id: planId, product_id: productId }]
        setPlanProducts(next)
        syncPlanFeaturesFromProducts(next, products)
      }
      toast.success(has ? 'Produto removido do plano' : 'Produto adicionado ao plano')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LumaSpin size="default" />
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

          {/* Produtos globais e atribuição aos planos (Essencial / Pro) */}
          {formData.pricing_enabled && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <button
                onClick={() => setProductsExpanded(!productsExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">Produtos e atribuição aos planos</h2>
                  <span className="text-sm text-gray-500">({products.length} produtos)</span>
                </div>
                {productsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {productsExpanded && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Produtos</strong> definem o que cada plano inclui (ferramentas, cursos, créditos). Crie produtos aqui e marque em cada plano (Gogh Essencial / Gogh Pro) quais produtos estão incluídos. Abaixo você também configura os <strong>créditos IA</strong> (mensais por plano, custo por criação e planos avulsos). O checkout continua usando os <strong>Price IDs fixos do Stripe</strong> configurados em cada plano.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder="Nome do produto"
                      value={newProductName}
                      onChange={(e) => {
                        setNewProductName(e.target.value)
                        if (!newProductSlug) setNewProductSlug(slugFromName(e.target.value))
                      }}
                      className="max-w-[200px]"
                    />
                    <Input
                      placeholder="Slug (opcional)"
                      value={newProductSlug}
                      onChange={(e) => setNewProductSlug(e.target.value)}
                      className="max-w-[160px]"
                    />
                    <select
                      value={newProductType}
                      onChange={(e) => setNewProductType(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="tool">Ferramenta</option>
                      <option value="course">Curso</option>
                      <option value="credits">Créditos</option>
                      <option value="other">Outro</option>
                    </select>
                    <Button onClick={handleAddProduct} disabled={addingProduct}>
                      {addingProduct ? '...' : 'Adicionar produto'}
                    </Button>
                  </div>
                  {products.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-2">Incluir produto no plano</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 pr-2 w-20">Ordem</th>
                              <th className="text-left py-2 pr-4">Ícone</th>
                              <th className="text-left py-2 pr-4">Produto</th>
                              <th className="text-center py-2 px-2">Gogh Essencial</th>
                              <th className="text-center py-2 px-2">Gogh Pro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((p, index) => (
                              <tr key={p.id} className="border-b border-gray-100">
                                <td className="py-2 pr-2 align-middle">
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveProductOrder(index, 'up')}
                                      disabled={index === 0 || reorderingProductId === p.id}
                                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Subir"
                                    >
                                      <ArrowUp size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveProductOrder(index, 'down')}
                                      disabled={index === products.length - 1 || reorderingProductId === p.id}
                                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Descer"
                                    >
                                      <ArrowDown size={16} />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <div className="flex items-center gap-2">
                                    {p.product_type === 'credits' ? (
                                      <div className="h-10 w-10 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-600" title="Créditos">
                                        <Zap size={22} strokeWidth={2} />
                                      </div>
                                    ) : p.icon_url ? (
                                      <img src={p.icon_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">Ícone</div>
                                    )}
                                    {p.product_type !== 'credits' && (
                                      <label className="cursor-pointer">
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp,image/gif"
                                          className="sr-only"
                                          disabled={uploadingProductId === p.id}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleProductIconUpload(p.id, file)
                                            e.target.value = ''
                                          }}
                                        />
                                        <span className="text-xs text-blue-600 hover:underline">
                                          {uploadingProductId === p.id ? 'Enviando...' : p.icon_url ? 'Trocar' : 'Upload'}
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 pr-4 align-middle">
                                  {editingProductId === p.id ? (
                                    <div className="flex flex-col gap-2 max-w-xs">
                                      <input
                                        type="text"
                                        value={editingProductName}
                                        onChange={(e) => setEditingProductName(e.target.value)}
                                        placeholder="Nome do produto"
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <input
                                        type="text"
                                        value={editingProductSlug}
                                        onChange={(e) => setEditingProductSlug(e.target.value)}
                                        placeholder="Slug (opcional)"
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateProduct(p.id, editingProductName, editingProductSlug)}
                                          disabled={savingProductId === p.id}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          {savingProductId === p.id ? '...' : <><Check size={14} /> Salvar</>}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelEditProduct}
                                          disabled={savingProductId === p.id}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                        >
                                          <X size={14} /> Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{p.name}</span>
                                      <span className="text-gray-500">({p.slug})</span>
                                      <button
                                        type="button"
                                        onClick={() => startEditProduct(p)}
                                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        title="Editar nome do produto"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteProduct(p.id)}
                                        disabled={deletingProductId === p.id}
                                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                        title="Excluir produto"
                                      >
                                        {deletingProductId === p.id ? (
                                          <span className="text-xs">...</span>
                                        ) : (
                                          <Trash2 size={14} />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="text-center py-2">
                                  <input
                                    type="checkbox"
                                    checked={planHasProduct('gogh_essencial', p.id)}
                                    onChange={() => togglePlanProduct('gogh_essencial', p.id)}
                                    className="rounded border-gray-300"
                                  />
                                </td>
                                <td className="text-center py-2">
                                  <input
                                    type="checkbox"
                                    checked={planHasProduct('gogh_pro', p.id)}
                                    onChange={() => togglePlanProduct('gogh_pro', p.id)}
                                    className="rounded border-gray-300"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Configuração de Créditos IA */}
                  <div className="border-t pt-6 mt-6 space-y-6">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap size={18} className="text-amber-500" />
                      Configuração de Créditos IA
                    </h4>
                    <p className="text-sm text-gray-600">
                      Créditos mensais por plano, custo por tipo de criação e planos avulsos (compra na área de conta).
                    </p>
                    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Créditos mensais por plano</h5>
                        {PLAN_IDS_CREDITS.map((planId) => (
                          <div key={planId} className="flex items-center gap-4">
                            <label className="w-36 text-sm text-gray-700 capitalize">
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
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Custo em créditos por função</h5>
                        {(Object.keys(CREDIT_ACTION_LABELS) as CreditActionId[]).map((actionId) => (
                          <div key={actionId} className="flex items-center gap-4">
                            <label className="flex-1 text-sm text-gray-700">
                              {CREDIT_ACTION_LABELS[actionId]}
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
                              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                            <span className="text-sm text-gray-500">créditos</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">Planos de créditos avulsos</h5>
                        <p className="text-xs text-gray-500">
                        Aparecem na área de conta (Uso) para compra de créditos extras. Informe a URL do checkout Stripe e o <strong>Price ID</strong> (ex.: price_xxx) do produto no Stripe para que os créditos sejam creditados automaticamente após o pagamento.
                      </p>
                      <div className="space-y-3">
                        {creditPlans.map((plan, index) => (
                          <div key={plan.id} className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                            <input
                              type="text"
                              placeholder="Nome (ex: 50 créditos)"
                              value={plan.name}
                              onChange={(e) => {
                                const next = [...creditPlans]
                                next[index] = { ...next[index], name: e.target.value }
                                setCreditPlans(next)
                              }}
                              className="flex-1 min-w-[120px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
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
                              className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
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
                              className="flex-1 min-w-[180px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Price ID (ex: price_xxx)"
                              value={plan.stripe_price_id || ''}
                              onChange={(e) => {
                                const next = [...creditPlans]
                                next[index] = { ...next[index], stripe_price_id: e.target.value.trim() || undefined }
                                setCreditPlans(next)
                              }}
                              className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                              title="Obrigatório para o webhook creditar na conta após a compra. Copie o Price ID do produto no Stripe."
                            />
                            <button
                              type="button"
                              onClick={() => setCreditPlans((prev) => prev.filter((_, i) => i !== index))}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={16} />
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
                                stripe_price_id: undefined,
                                order: prev.length,
                              },
                            ])
                          }
                          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg px-3 py-2"
                        >
                          <Plus size={16} />
                          Adicionar plano de créditos
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveCredits} disabled={savingCredits} className="gap-2">
                        <Save size={18} />
                        {savingCredits ? 'Salvando...' : 'Salvar créditos'}
                      </Button>
                    </div>
                  </div>
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
                    {/* Tipo do plano: apenas Gogh Agency usa modelo de serviços personalizados */}
                    {(plan.id === 'gogh-agencia' || plan.planType === 'service') && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Tipo do Plano</label>
                        <select
                          value={plan.planType || 'service'}
                          onChange={(e) => updatePlan(planIndex, 'planType', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="service">Serviços Personalizados</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Planos de serviços permitem seleção de itens e preço total dinâmico (Gogh Agency).
                        </p>
                      </div>
                    )}
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
                            <strong>Como funciona:</strong> O usuário seleciona os serviços desejados no checkout. O preço é calculado automaticamente com base nas seleções.
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

