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
  subscription?: {
    id: string
    plan_id: string
    status: string
    billing_cycle: string
    current_period_end: string
    stripe_subscription_id: string | null
    is_manual?: boolean
  } | null
}

const planOptions = [
  { value: '', label: 'Sem plano (Gratuito)' },
  { value: 'gogh_essencial', label: 'Gogh Essencial' },
  { value: 'gogh_pro', label: 'Gogh Pro' },
]

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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Carregar membros - autenticação é verificada pelo middleware
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Buscar todas as assinaturas ativas
      // Tentar primeiro com a estrutura nova (plan_id, billing_cycle)
      // Se falhar, tentar com estrutura antiga (plan_type)
      let subscriptions = []
      try {
        // Primeiro, tentar buscar com select específico para ver quais colunas existem
        const { data: subsData, error: subsError } = await (supabase as any)
          .from('subscriptions')
          .select('*')
          .in('status', ['active', 'trialing'])
        
        if (subsError) {
          // Se der erro de coluna não encontrada, tentar buscar apenas colunas básicas
          if (subsError.code === '42703' || subsError.message?.includes('does not exist')) {
            console.warn('Estrutura antiga detectada, tentando buscar com campos alternativos')
            // Tentar buscar com estrutura antiga (plan_type)
            const { data: altData, error: altError } = await (supabase as any)
              .from('subscriptions')
              .select('id, user_id, plan_type, status, current_period_end, current_period_start')
              .in('status', ['active', 'trialing'])
            
            if (!altError && altData) {
              // Converter estrutura antiga para nova
              subscriptions = altData.map((sub: any) => ({
                ...sub,
                plan_id: sub.plan_type === 'premium' ? 'gogh_pro' : 
                        sub.plan_type === 'essential' ? 'gogh_essencial' : null,
                billing_cycle: 'monthly' // Default para estrutura antiga
              }))
            }
          } else if (subsError.code !== 'PGRST116') {
            console.error('Error fetching subscriptions:', subsError)
          }
        } else {
          subscriptions = subsData || []
        }
      } catch (error) {
        console.error('Erro ao buscar assinaturas:', error)
      }

      // Combinar dados
      const membersWithSubs: Member[] = (profiles || []).map((profile: any) => {
        const subscription = subscriptions.find(
          (sub: any) => sub.user_id === profile.id
        )
        
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: profile.role,
          created_at: profile.created_at,
          subscription: subscription ? {
            id: subscription.id,
            // Garantir que sempre temos plan_id, convertendo plan_type se necessário
            plan_id: subscription.plan_id || 
                    (subscription.plan_type === 'premium' ? 'gogh_pro' :
                     subscription.plan_type === 'essential' ? 'gogh_essencial' : null),
            status: subscription.status,
            billing_cycle: subscription.billing_cycle || 'monthly',
            current_period_end: subscription.current_period_end,
            stripe_subscription_id: subscription.stripe_subscription_id || null,
            is_manual: !subscription.stripe_subscription_id
          } : null
        }
      })

      setMembers(membersWithSubs)
    } catch (error: any) {
      console.error('Error loading members:', error)
      toast.error('Erro ao carregar membros')
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
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setEditingPlan('')
    setEditingBillingCycle('monthly')
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
          // Atualizar existente
          const now = new Date()
          // Calcular novo período final baseado no billing_cycle escolhido
          const periodEnd = new Date(now)
          if (editingBillingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1)
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1)
          }
          
          // Tentar primeiro com estrutura nova (plan_id, billing_cycle)
          let updateData: any = {
            plan_id: editingPlan,
            billing_cycle: editingBillingCycle,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { error } = await (supabase as any)
            .from('subscriptions')
            .update(updateData)
            .eq('id', member.subscription.id)
          
          if (error) {
            // Se der erro de coluna não encontrada, tentar com estrutura antiga
            if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('does not exist')) {
              console.warn('Tentando atualizar com estrutura antiga (plan_type)')
              const planType = editingPlan === 'gogh_pro' ? 'premium' : 
                              editingPlan === 'gogh_essencial' ? 'essential' : 'essential'
              
              updateData = {
                plan_type: planType,
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
          // Criar nova (assinatura manual sem Stripe)
          const now = new Date()
          // Calcular período final baseado no billing_cycle escolhido
          const periodEnd = new Date(now)
          if (editingBillingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1)
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1)
          }
          const manualId = `manual_${memberId.slice(0, 8)}_${Date.now()}`
          
          // Tentar primeiro com estrutura nova (plan_id, billing_cycle)
          // Planos manuais NÃO têm stripe_subscription_id (deve ser NULL)
          let insertData: any = {
            user_id: memberId,
            plan_id: editingPlan,
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
            // Se der erro de coluna não encontrada, tentar com estrutura antiga
            if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('does not exist')) {
              console.warn('Tentando criar com estrutura antiga (plan_type)')
              // Converter para estrutura antiga
              const planType = editingPlan === 'gogh_pro' ? 'premium' : 
                              editingPlan === 'gogh_essencial' ? 'essential' : 'essential'
              
              insertData = {
                user_id: memberId,
                plan_type: planType,
                status: 'active',
                stripe_customer_id: null, // Planos manuais não têm customer do Stripe
                stripe_subscription_id: null, // Planos manuais não têm subscription do Stripe
                current_period_start: now.toISOString(),
                current_period_end: oneYearLater.toISOString(),
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
    
    const matchesPlan = 
      filterPlan === 'all' ||
      (filterPlan === 'none' && !member.subscription) ||
      (filterPlan !== 'none' && member.subscription?.plan_id === filterPlan)

    return matchesSearch && matchesPlan
  })

  const getPlanBadge = (member: Member) => {
    if (!member.subscription) {
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
              {members.filter(m => m.subscription?.plan_id === 'gogh_pro').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Plano Essencial</p>
            <p className="text-2xl font-bold text-yellow-600">
              {members.filter(m => m.subscription?.plan_id === 'gogh_essencial').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Gratuitos</p>
            <p className="text-2xl font-bold text-gray-600">
              {members.filter(m => !m.subscription).length}
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
              <option value="all">Todos os planos</option>
              <option value="gogh_pro">Gogh Pro</option>
              <option value="gogh_essencial">Gogh Essencial</option>
              <option value="none">Sem plano</option>
            </select>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
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
                            onChange={(e) => setEditingPlan(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                          >
                            {planOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {editingPlan !== '' && (
                            <select
                              value={editingBillingCycle}
                              onChange={(e) => setEditingBillingCycle(e.target.value as 'monthly' | 'annual')}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                            >
                              <option value="monthly">Mensal</option>
                              <option value="annual">Anual</option>
                            </select>
                          )}
                        </div>
                      ) : (
                        <div>
                          {getPlanBadge(member)}
                          {member.subscription && (
                            <div className="mt-1 space-y-0.5">
                              {member.subscription.billing_cycle && (
                                <p className="text-xs text-gray-500">
                                  {member.subscription.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}
                                  {member.subscription.current_period_end && (
                                    <> • Até {new Date(member.subscription.current_period_end).toLocaleDateString('pt-BR')}</>
                                  )}
                                </p>
                              )}
                              {member.subscription.is_manual && (
                                <p className="text-xs text-amber-600 font-medium">
                                  Plano Manual
                                </p>
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
                        <button
                          onClick={() => handleEditPlan(member)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar plano"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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

