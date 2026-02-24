'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { 
  Users, 
  Search, 
  Crown, 
  Mail, 
  Calendar,
  Edit2,
  Save,
  X,
  ChevronDown,
  Check
} from 'lucide-react'

interface Member {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
  contact_phone?: string | null
  subscription?: {
    id: string
    plan_id: string
    status: string
    billing_cycle: string
    current_period_end: string
    current_period_start?: string | null
    cancel_at_period_end?: boolean
    canceled_at?: string | null
    stripe_subscription_id: string | null
    is_manual?: boolean
    manually_edited?: boolean
    manually_edited_at?: string | null
    updated_at?: string | null
  } | null
  serviceSubscriptions?: {
    id: string
    plan_name: string | null
    status: string
    billing_cycle: string
    current_period_end: string | null
    selected_services: string[]
  }[]
}

const planOptions = [
  { value: '', label: 'Sem plano (Gratuito)' },
  { value: 'gogh_essencial', label: 'Gogh Essencial' },
  { value: 'gogh_pro', label: 'Gogh Pro' },
]

const toDateInputValue = (isoDate?: string | null) => {
  if (!isoDate) return ''
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

const formatDatePtBr = (isoDate?: string | null) => {
  if (!isoDate) return null
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('pt-BR')
}

const hasCustomPeriodEnd = (subscription?: Member['subscription']) => {
  if (!subscription?.current_period_start || !subscription.current_period_end) return false
  if (!subscription.billing_cycle) return false

  const start = new Date(subscription.current_period_start)
  const end = new Date(subscription.current_period_end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false

  const expectedEnd = new Date(start)
  if (subscription.billing_cycle === 'annual') {
    expectedEnd.setFullYear(expectedEnd.getFullYear() + 1)
  } else {
    expectedEnd.setMonth(expectedEnd.getMonth() + 1)
  }

  // Margem para diferenças pequenas de horário/fuso.
  const diffMs = Math.abs(end.getTime() - expectedEnd.getTime())
  return diffMs > 36 * 60 * 60 * 1000
}

export default function MembrosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<string>('')
  const [editingBillingCycle, setEditingBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [useCustomPeriodEnd, setUseCustomPeriodEnd] = useState(false)
  const [editingCustomPeriodEnd, setEditingCustomPeriodEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingServiceMember, setEditingServiceMember] = useState<string | null>(null)
  const [editingServiceOptions, setEditingServiceOptions] = useState<string[]>([])
  const [editingServiceBillingCycle, setEditingServiceBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    // Carregar membros - autenticação é verificada pelo middleware
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/members', { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Erro ao carregar membros')
        setMembers([])
        return
      }
      setMembers(Array.isArray(data.members) ? data.members : [])
    } catch (error: any) {
      console.error('Error loading members:', error)
      toast.error('Erro ao carregar membros')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlan = (member: Member) => {
    setEditingMember(member.id)
    // Garantir que pega o plan_id corretamente, mesmo se vier como plan_type
    let currentPlanId = member.subscription?.plan_id || ''
    
    // Se não tem plan_id, tentar converter de plan_type
    if (!currentPlanId && member.subscription) {
      const planType = (member.subscription as any)?.plan_type
      if (planType === 'premium') {
        currentPlanId = 'gogh_pro'
      } else if (planType === 'essential') {
        currentPlanId = 'gogh_essencial'
      }
    }
    
    setEditingPlan(currentPlanId)
    // Definir billing cycle atual ou padrão
    const currentBillingCycle = member.subscription?.billing_cycle as 'monthly' | 'annual' | undefined
    setEditingBillingCycle(currentBillingCycle || 'monthly')
    setUseCustomPeriodEnd(hasCustomPeriodEnd(member.subscription))
    setEditingCustomPeriodEnd(toDateInputValue(member.subscription?.current_period_end))
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setEditingPlan('')
    setEditingBillingCycle('monthly')
    setUseCustomPeriodEnd(false)
    setEditingCustomPeriodEnd('')
  }

  const handleSaveService = async (memberId: string) => {
    try {
      setSaving(true)
      
      // Se não há serviços selecionados, remover todas as assinaturas de serviço
      if (editingServiceOptions.length === 0) {
        // Buscar todas as assinaturas de serviço ativas para este usuário
        const { data: existingServices, error: fetchError } = await (supabase as any)
          .from('service_subscriptions')
          .select('*')
          .eq('user_id', memberId)
          .in('status', ['active', 'trialing'])

        if (fetchError) {
          throw new Error(fetchError.message || 'Erro ao buscar assinaturas de serviço')
        }

        // Deletar todas as assinaturas de serviço
        if (existingServices && existingServices.length > 0) {
          const { error: deleteError } = await (supabase as any)
            .from('service_subscriptions')
            .delete()
            .eq('user_id', memberId)
            .in('status', ['active', 'trialing'])

          if (deleteError) {
            throw new Error(deleteError.message || 'Erro ao remover assinaturas de serviço')
          }
        }

        toast.success('Serviços removidos com sucesso!')
        setEditingServiceMember(null)
        setEditingServiceOptions([])
        setEditingServiceBillingCycle('monthly')
        await loadMembers()
        return
      }

      const now = new Date()
      const periodEnd = new Date(now)
      if (editingServiceBillingCycle === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      // Buscar nomes dos serviços do site_settings
      const { data: settings } = await (supabase as any)
        .from('site_settings')
        .select('homepage_content')
        .eq('key', 'general')
        .maybeSingle()

      const serviceNames: string[] = []
      if (settings?.homepage_content?.pricing?.pricing_plans) {
        const agencyPlan = settings.homepage_content.pricing.pricing_plans.find((p: any) => p.id === 'gogh-agencia' || p.planType === 'service')
        if (agencyPlan?.serviceOptions) {
          editingServiceOptions.forEach(serviceId => {
            const service = agencyPlan.serviceOptions.find((opt: any) => opt.id === serviceId)
            if (service) serviceNames.push(service.name)
          })
        }
      }

      // Se não encontrou os nomes, usar IDs como fallback
      const finalServiceNames = serviceNames.length > 0 ? serviceNames : editingServiceOptions
      
      // Remover duplicatas dos nomes de serviços
      const uniqueServiceNames = [...new Set(finalServiceNames)]

      // Buscar TODAS as assinaturas de serviço ativas para este usuário (pode haver duplicatas)
      const { data: existingServices, error: fetchError } = await (supabase as any)
        .from('service_subscriptions')
        .select('*')
        .eq('user_id', memberId)
        .in('status', ['active', 'trialing'])

      if (fetchError) {
        throw new Error(fetchError.message || 'Erro ao buscar assinaturas de serviço')
      }

      // Se existem múltiplas assinaturas, deletar todas e criar uma nova consolidada
      if (existingServices && existingServices.length > 0) {
        // Deletar todas as assinaturas existentes
        const { error: deleteError } = await (supabase as any)
          .from('service_subscriptions')
          .delete()
          .eq('user_id', memberId)
          .in('status', ['active', 'trialing'])

        if (deleteError) {
          throw new Error(deleteError.message || 'Erro ao remover assinaturas duplicadas')
        }
      }

      // Criar uma única assinatura consolidada
      const insertData: any = {
        user_id: memberId,
        plan_id: 'gogh-agencia',
        plan_name: 'Gogh Agency',
        status: 'active',
        billing_cycle: editingServiceBillingCycle,
        stripe_subscription_id: null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        selected_services: uniqueServiceNames,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }

      const { error: insertError } = await (supabase as any)
        .from('service_subscriptions')
        .insert(insertData)

      if (insertError) {
        console.error('Erro ao criar assinatura de serviço:', insertError)
        throw new Error(insertError.message || 'Erro ao criar assinatura de serviço')
      }

      toast.success('Serviços atualizados com sucesso!')
      setEditingServiceMember(null)
      setEditingServiceOptions([])
      setEditingServiceBillingCycle('monthly')
      
      await loadMembers()
      
      // Disparar evento para atualizar o layout do usuário se ele estiver logado
      window.dispatchEvent(new CustomEvent('service-subscription-updated'))
    } catch (error: any) {
      console.error('Error saving service:', error)
      toast.error(error?.message || 'Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePlan = async (memberId: string) => {
    try {
      setSaving(true)
      
      const member = members.find(m => m.id === memberId)
      if (!member) {
        toast.error('Membro não encontrado')
        return
      }

      if (editingPlan === '') {
        // Remover plano - deletar assinatura se existir
        if (member.subscription) {
          const { error } = await (supabase as any)
            .from('subscriptions')
            .delete()
            .eq('id', member.subscription.id)
          
          if (error) {
            console.error('Erro ao deletar assinatura:', error)
            throw new Error(error.message || 'Erro ao remover plano')
          }
        }
      } else {
        // Atualizar ou criar assinatura
        if (member.subscription) {
          // Verificar se é assinatura do Stripe
          const stripeSubId = member.subscription.stripe_subscription_id
          const isManual = member.subscription.is_manual === true
          
          // É do Stripe se: tem stripe_subscription_id válido E não é manual
          const isStripeSubscription = !isManual && 
                                      stripeSubId && 
                                      stripeSubId.trim() !== '' && 
                                      !stripeSubId.startsWith('manual_')
          
          const now = new Date()
          // Permite vencimento personalizado para casos operacionais (extensão, testes, correções manuais).
          const periodEnd = useCustomPeriodEnd && editingCustomPeriodEnd
            ? new Date(`${editingCustomPeriodEnd}T23:59:59`)
            : (() => {
                const calculated = new Date(now)
                if (editingBillingCycle === 'annual') {
                  calculated.setFullYear(calculated.getFullYear() + 1)
                } else {
                  calculated.setMonth(calculated.getMonth() + 1)
                }
                return calculated
              })()

          if (Number.isNaN(periodEnd.getTime())) {
            toast.error('Data personalizada inválida.')
            return
          }
          if (periodEnd.getTime() <= now.getTime()) {
            toast.error('A data de vencimento deve ser futura.')
            return
          }
          
          // Converter plan_id para plan_type (para compatibilidade com estrutura antiga)
          const planType = editingPlan === 'gogh_pro' ? 'premium' : 
                          editingPlan === 'gogh_essencial' ? 'essential' : null
          
          // Tentar primeiro com estrutura nova (plan_id, billing_cycle)
          // MAS também preencher plan_type para compatibilidade com estrutura antiga
          let updateData: any = {
            plan_id: editingPlan,
            plan_type: planType, // Preencher também para compatibilidade
            billing_cycle: editingBillingCycle,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // Se for assinatura do Stripe editada manualmente, marcar como editada
          if (isStripeSubscription) {
            updateData.manually_edited = true
            updateData.manually_edited_at = now.toISOString()
            toast.success('Plano atualizado! Esta assinatura do Stripe foi editada manualmente e será marcada com um selo.', {
              duration: 5000
            })
          }
          
          const { error } = await (supabase as any)
            .from('subscriptions')
            .update(updateData)
            .eq('id', member.subscription.id)
          
          if (error) {
            // Se der erro de constraint (NOT NULL), tentar com estrutura antiga incluindo plan_type
            if (error.code === '23502' || error.message?.includes('null value') || error.message?.includes('plan_type')) {
              console.warn('Erro de constraint, tentando atualizar com plan_type incluído')
              // Já temos planType definido acima, só garantir que está no updateData
              updateData.plan_type = planType
              
              const { error: retryError } = await (supabase as any)
                .from('subscriptions')
                .update(updateData)
                .eq('id', member.subscription.id)
              
              if (retryError) {
                console.error('Erro ao atualizar assinatura (com plan_type):', retryError)
                throw new Error(retryError.message || 'Erro ao atualizar plano')
              }
            } else if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('does not exist')) {
              console.warn('Tentando atualizar com estrutura antiga (plan_type)')
              const planTypeAlt = editingPlan === 'gogh_pro' ? 'premium' : 
                              editingPlan === 'gogh_essencial' ? 'essential' : 'essential'
              
              updateData = {
                plan_type: planTypeAlt,
                updated_at: new Date().toISOString()
              }
              
              const { error: altError } = await (supabase as any)
                .from('subscriptions')
                .update(updateData)
                .eq('id', member.subscription.id)
              
              if (altError) {
                console.error('Erro ao atualizar assinatura (estrutura antiga):', altError)
                throw new Error(altError.message || 'Erro ao atualizar plano. A tabela pode ter estrutura incompatível.')
              }
            } else {
              console.error('Erro ao atualizar assinatura:', error)
              throw new Error(error.message || 'Erro ao atualizar plano')
            }
          }
        } else {
          const now = new Date()
          const periodEnd = useCustomPeriodEnd && editingCustomPeriodEnd
            ? new Date(`${editingCustomPeriodEnd}T23:59:59`)
            : (() => {
                const calculated = new Date(now)
                if (editingBillingCycle === 'annual') {
                  calculated.setFullYear(calculated.getFullYear() + 1)
                } else {
                  calculated.setMonth(calculated.getMonth() + 1)
                }
                return calculated
              })()

          if (Number.isNaN(periodEnd.getTime())) {
            toast.error('Data personalizada inválida.')
            return
          }
          if (periodEnd.getTime() <= now.getTime()) {
            toast.error('A data de vencimento deve ser futura.')
            return
          }
          const manualId = `manual_${memberId.slice(0, 8)}_${Date.now()}`
          
          // Converter plan_id para plan_type (para compatibilidade com estrutura antiga)
          const planType = editingPlan === 'gogh_pro' ? 'premium' : 
                          editingPlan === 'gogh_essencial' ? 'essential' : null
          
          // Tentar primeiro com estrutura nova (plan_id, billing_cycle)
          // MAS também preencher plan_type para compatibilidade com estrutura antiga
          // Planos manuais NÃO têm stripe_subscription_id (deve ser NULL)
          let insertData: any = {
            user_id: memberId,
            plan_id: editingPlan,
            plan_type: planType, // Preencher também para compatibilidade
            status: 'active',
            billing_cycle: editingBillingCycle,
            stripe_customer_id: null, // Planos manuais não têm customer do Stripe
            stripe_subscription_id: null, // Planos manuais não têm subscription do Stripe
            stripe_price_id: null, // Planos manuais não têm price do Stripe
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          }
          
          const { error } = await (supabase as any)
            .from('subscriptions')
            .insert(insertData)
          
          if (error) {
            // Se der erro de constraint (NOT NULL), tentar novamente (plan_type já está incluído)
            if (error.code === '23502' || error.message?.includes('null value') || error.message?.includes('plan_type')) {
              console.warn('Erro de constraint plan_type, mas já está incluído. Verificando...')
              // O plan_type já está no insertData, então o erro pode ser de outro campo
              // Mas vamos garantir que está correto
              if (!insertData.plan_type && planType) {
                insertData.plan_type = planType
              }
              
              const { error: retryError } = await (supabase as any)
                .from('subscriptions')
                .insert(insertData)
              
              if (retryError) {
                console.error('Erro ao criar assinatura (com plan_type):', retryError)
                throw new Error(retryError.message || 'Erro ao criar plano. Verifique se todos os campos obrigatórios estão preenchidos.')
              }
            } else if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('does not exist')) {
              console.warn('Tentando criar com estrutura antiga (plan_type)')
              // Converter para estrutura antiga
              const planTypeAlt = editingPlan === 'gogh_pro' ? 'premium' : 
                              editingPlan === 'gogh_essencial' ? 'essential' : 'essential'
              
              insertData = {
                user_id: memberId,
                plan_type: planTypeAlt,
                status: 'active',
                stripe_customer_id: null, // Planos manuais não têm customer do Stripe
                stripe_subscription_id: null, // Planos manuais não têm subscription do Stripe
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                cancel_at_period_end: false,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
              }
              
              const { error: altError } = await (supabase as any)
                .from('subscriptions')
                .insert(insertData)
              
              if (altError) {
                console.error('Erro ao criar assinatura (estrutura antiga):', altError)
                throw new Error(altError.message || 'Erro ao criar plano. A tabela de assinaturas pode ter estrutura incompatível.')
              }
            } else {
              console.error('Erro ao criar assinatura:', error)
              throw new Error(error.message || 'Erro ao criar plano. Verifique se o usuário já possui uma assinatura ativa.')
            }
          }
        }
      }

      toast.success('Plano atualizado com sucesso!')
      setEditingMember(null)
      setEditingPlan('')
      setEditingBillingCycle('monthly')
      setUseCustomPeriodEnd(false)
      setEditingCustomPeriodEnd('')
      
      // Recarregar membros para atualizar a exibição
      await loadMembers()
      
      // Se o usuário editado for o usuário atual logado, atualizar o AuthContext
      // Isso garante que a área de membros mostre o plano atualizado
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser && memberId === currentUser.id) {
          // Disparar evento customizado para atualizar o AuthContext
          window.dispatchEvent(new CustomEvent('subscription-updated'))
        }
      } catch (error) {
        // Ignorar erro se não conseguir verificar usuário atual
        console.warn('Não foi possível verificar usuário atual para atualizar AuthContext')
      }
    } catch (error: any) {
      console.error('Error saving plan:', error)
      toast.error(error?.message || 'Erro ao salvar plano')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar membros
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const hasSubscription = !!member.subscription

    const matchesPlan =
      filterPlan === 'all' ||
      (filterPlan === 'subscription' && hasSubscription) ||
      (filterPlan === 'none' && !hasSubscription)

    return matchesSearch && matchesPlan
  })

  const hasPaidAccess = (member: Member) => {
    if (!member.subscription) return false
    const normalizedStatus = (member.subscription.status || '').toLowerCase()
    const statusAllowsAccess = normalizedStatus === 'active' || normalizedStatus === 'trialing'
    if (!statusAllowsAccess) return false

    const periodEnd = new Date(member.subscription.current_period_end)
    if (Number.isNaN(periodEnd.getTime())) return false
    return periodEnd.getTime() >= Date.now()
  }

  const getPlanBadge = (member: Member) => {
    if (!member.subscription || !hasPaidAccess(member)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Gratuito
        </span>
      )
    }

    // Converter plan_type para plan_id se necessário
    const planId = member.subscription.plan_id || 
                   ((member.subscription as any).plan_type === 'premium' ? 'gogh_pro' :
                    (member.subscription as any).plan_type === 'essential' ? 'gogh_essencial' : null)
    
    const isPro = planId === 'gogh_pro'
    const isEssencial = planId === 'gogh_essencial'
    
    if (!isPro && !isEssencial) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Gratuito
        </span>
      )
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isPro 
          ? 'bg-amber-100 text-amber-700' 
          : 'bg-yellow-100 text-yellow-700'
      }`}>
        <Crown className="w-3 h-3" />
        {isPro ? 'Pro' : 'Essencial'}
      </span>
    )
  }

  const getSubscriptionStatusBadge = (status?: string) => {
    const normalized = (status || '').toLowerCase()
    switch (normalized) {
      case 'active':
        return { label: 'Ativa', className: 'bg-emerald-100 text-emerald-700' }
      case 'trialing':
        return { label: 'Teste', className: 'bg-sky-100 text-sky-700' }
      case 'past_due':
        return { label: 'Pagamento pendente', className: 'bg-amber-100 text-amber-800' }
      case 'unpaid':
        return { label: 'Não paga', className: 'bg-rose-100 text-rose-700' }
      case 'canceled':
        return { label: 'Cancelada', className: 'bg-gray-200 text-gray-700' }
      case 'incomplete':
        return { label: 'Incompleta', className: 'bg-yellow-100 text-yellow-700' }
      case 'incomplete_expired':
        return { label: 'Expirada', className: 'bg-gray-200 text-gray-700' }
      default:
        return { label: normalized || 'Desconhecido', className: 'bg-gray-100 text-gray-600' }
    }
  }


  // Carregando dados
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavigation title="Gerenciar Membros" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation title="Gerenciar Membros" subtitle="Visualize e gerencie os usuários cadastrados" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total de Membros</p>
            <p className="text-2xl font-bold text-gray-900">{members.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Plano Pro</p>
            <p className="text-2xl font-bold text-amber-600">
              {members.filter(m => hasPaidAccess(m) && m.subscription?.plan_id === 'gogh_pro').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Plano Essencial</p>
            <p className="text-2xl font-bold text-yellow-600">
              {members.filter(m => hasPaidAccess(m) && m.subscription?.plan_id === 'gogh_essencial').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Gratuitos</p>
            <p className="text-2xl font-bold text-gray-600">
              {members.filter(m => !hasPaidAccess(m)).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Plan Filter */}
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="all">Todos os membros</option>
              <option value="subscription">Com assinatura</option>
              <option value="none">Gratuito (sem plano)</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assinatura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.full_name || 'Sem nome'}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingMember === member.id ? (
                          <div className="space-y-2">
                            <select
                              value={editingPlan}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditingPlan(value)
                                if (!value) {
                                  setUseCustomPeriodEnd(false)
                                  setEditingCustomPeriodEnd('')
                                }
                              }}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                            >
                              {planOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {editingPlan !== '' && (
                              <>
                                <select
                                  value={editingBillingCycle}
                                  onChange={(e) => setEditingBillingCycle(e.target.value as 'monthly' | 'annual')}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                                >
                                  <option value="monthly">Mensal</option>
                                  <option value="annual">Anual</option>
                                </select>

                                <label className="flex items-center gap-2 text-xs text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={useCustomPeriodEnd}
                                    onChange={(e) => setUseCustomPeriodEnd(e.target.checked)}
                                    className="rounded border-gray-300"
                                  />
                                  Definir vencimento personalizado
                                </label>

                                {useCustomPeriodEnd && (
                                  <input
                                    type="date"
                                    value={editingCustomPeriodEnd}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setEditingCustomPeriodEnd(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                                  />
                                )}

                                {!useCustomPeriodEnd && hasCustomPeriodEnd(member.subscription) && (
                                  <p className="text-[11px] text-amber-700">
                                    Este plano está com vencimento personalizado salvo.
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div>
                            {getPlanBadge(member)}
                            {member.subscription && (
                              <div className="mt-1 space-y-0.5">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getSubscriptionStatusBadge(member.subscription.status).className}`}>
                                  {getSubscriptionStatusBadge(member.subscription.status).label}
                                </span>
                                {member.subscription.billing_cycle && (
                                  <p className="text-xs text-gray-500">
                                    {member.subscription.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}
                                    {member.subscription.current_period_end && (
                                      <> • Até {new Date(member.subscription.current_period_end).toLocaleDateString('pt-BR')}</>
                                    )}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Origem: {member.subscription.is_manual ? 'Manual' : 'Stripe'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Vencimento: {hasCustomPeriodEnd(member.subscription) ? 'Personalizado' : 'Padrão do ciclo'}
                                </p>
                                {(member.subscription.status === 'active' || member.subscription.status === 'trialing') && (
                                  <p className="text-xs text-gray-500">
                                    Próxima cobrança: {formatDatePtBr(member.subscription.current_period_end) || '-'}
                                  </p>
                                )}
                                {member.subscription.cancel_at_period_end && (
                                  <p className="text-xs text-amber-700">
                                    Cancelamento agendado para {formatDatePtBr(member.subscription.current_period_end) || '-'}
                                  </p>
                                )}
                                {hasCustomPeriodEnd(member.subscription) && (
                                  <p className="text-xs text-amber-700 font-medium">
                                    Vencimento personalizado: {formatDatePtBr(member.subscription.current_period_end) || '-'}
                                  </p>
                                )}
                                {member.subscription.status === 'canceled' && (
                                  <p className="text-xs text-gray-500">
                                    Cancelada em {formatDatePtBr(member.subscription.canceled_at) || formatDatePtBr(member.subscription.updated_at) || '-'}
                                  </p>
                                )}
                                {member.subscription.manually_edited && !member.subscription.is_manual && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                                    Editado Manualmente
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingMember === member.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSavePlan(member.id)}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {saving ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditPlan(member)}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar assinatura"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        Nenhum membro encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  )
}

