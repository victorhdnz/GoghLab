'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { LumaSpin } from '@/components/ui/luma-spin'
import { 
  User, 
  Shield, 
  CreditCard, 
  Crown,
  Check,
  ExternalLink,
  MessageSquare,
  BookOpen,
  Palette,
  Scissors,
  Sparkles,
  RefreshCw,
  Wrench,
  Coins,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

type TabType = 'profile' | 'plan'

/** Recursos do plano vindo do dashboard (plan_products + products) */
interface PlanFeatureItem {
  text: string
  icon: React.ComponentType<{ className?: string }>
}

export default function AccountPage() {
  const { user, profile, subscription, hasActiveSubscription, isPro, refreshSubscription } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [saving, setSaving] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [hasServiceSubscriptions, setHasServiceSubscriptions] = useState(false)
  const [hasStripeServiceSubscription, setHasStripeServiceSubscription] = useState(false)
  const [creditsBalanceMonthly, setCreditsBalanceMonthly] = useState<number | null>(null)
  const [creditsBalancePurchased, setCreditsBalancePurchased] = useState<number | null>(null)
  const [creditPlans, setCreditPlans] = useState<Array<{ id: string; name: string; credits: number; stripe_checkout_url: string }>>([])
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureItem[]>([])
  const [planResourcesExpanded, setPlanResourcesExpanded] = useState(false)
  
  // Form state
  const [fullName, setFullName] = useState('')

  const supabase = createClient()

  // Verificar se o usuário tem serviços contratados
  useEffect(() => {
    const checkServiceSubscriptions = async () => {
      if (!user) {
        setHasServiceSubscriptions(false)
        setHasStripeServiceSubscription(false)
        return
      }

      try {
        const { data, error } = await (supabase as any)
          .from('service_subscriptions')
          .select('id, stripe_customer_id, stripe_subscription_id')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .limit(1)

        if (error) {
          console.error('Erro ao verificar serviços:', error)
          setHasServiceSubscriptions(false)
          setHasStripeServiceSubscription(false)
          return
        }

        const hasServices = (data && data.length > 0) || false
        setHasServiceSubscriptions(hasServices)
        
        // Verificar se tem stripe_customer_id (não é manual)
        if (hasServices && data[0]) {
          const hasStripeId = data[0].stripe_customer_id && 
                             !data[0].stripe_customer_id.startsWith('manual_') &&
                             data[0].stripe_subscription_id
          setHasStripeServiceSubscription(hasStripeId || false)
        } else {
          setHasStripeServiceSubscription(false)
        }
      } catch (error) {
        console.error('Erro ao verificar serviços:', error)
        setHasServiceSubscriptions(false)
        setHasStripeServiceSubscription(false)
      }
    }

    checkServiceSubscriptions()
  }, [user, supabase])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
    }
  }, [profile])

  // Abrir aba Plano e rolar até #usage quando o link for /conta#usage
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash === '#usage') {
      setActiveTab('plan')
      setTimeout(() => {
        document.getElementById('usage')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [])

  // Créditos IA (mensais + comprados separados)
  useEffect(() => {
    if (!user || !hasActiveSubscription) {
      setCreditsBalanceMonthly(null)
      setCreditsBalancePurchased(null)
      return
    }
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits/balance', { credentials: 'include' })
        const data = await res.json()
        if (res.ok) {
          setCreditsBalanceMonthly(typeof data.balanceMonthly === 'number' ? data.balanceMonthly : data.balance ?? null)
          setCreditsBalancePurchased(typeof data.balancePurchased === 'number' ? data.balancePurchased : 0)
        } else {
          setCreditsBalanceMonthly(null)
          setCreditsBalancePurchased(null)
        }
      } catch {
        setCreditsBalanceMonthly(null)
        setCreditsBalancePurchased(null)
      }
    }
    fetchCredits()
  }, [user, hasActiveSubscription])

  // Recursos do plano (espelhar o que está cadastrado no dashboard: plan_products + products)
  useEffect(() => {
    if (!hasActiveSubscription || !subscription?.plan_id) {
      setPlanFeatures([])
      return
    }
    const load = async () => {
      try {
        const planId = subscription.plan_id
        const { data: planProductsData } = await (supabase as any)
          .from('plan_products')
          .select('product_id')
          .eq('plan_id', planId)
        const productIds = (planProductsData || []).map((pp: { product_id: string }) => pp.product_id)
        if (productIds.length === 0) {
          setPlanFeatures([])
          return
        }
        const { data: productsData } = await (supabase as any)
          .from('products')
          .select('id, name')
          .in('id', productIds)
          .eq('is_active', true)
          .order('order_position', { ascending: true })
        const features: PlanFeatureItem[] = (productsData || []).map((p: { id: string; name: string }) => ({
          text: p.name || 'Recurso do plano',
          icon: Sparkles,
        }))
        setPlanFeatures(features)
      } catch {
        setPlanFeatures([])
      }
    }
    load()
  }, [hasActiveSubscription, subscription?.plan_id])

  // Planos de créditos avulsos (para exibir na seção Uso)
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', 'ai_credits_plans')
          .maybeSingle()
        const plans = Array.isArray(data?.value) ? data.value : []
        setCreditPlans(plans)
      } catch {
        setCreditPlans([])
      }
    }
    load()
  }, [supabase])


  // Listener para atualização de assinatura
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('[AccountPage] Subscription update event received, refreshing...')
      refreshSubscription()
    }
    
    window.addEventListener('subscription-updated', handleSubscriptionUpdate)
    
    // Verificar quando a página ganha foco (usuário volta para a aba)
    const handleFocus = () => {
      refreshSubscription()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshSubscription])

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Você precisa estar logado')
      return
    }
    
    setSaving(true)
    try {
      // Timeout de segurança
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )

      // Tentar update primeiro
      const updatePromise = (supabase as any)
        .from('profiles')
        .update({
          full_name: fullName || null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', user.id)
        .select()
        .single()

      const { data, error } = await Promise.race([
        updatePromise,
        timeoutPromise
      ]) as { data: any, error: any }

      if (error) {
        // Se não encontrou o profile, criar um novo
        if (error.code === 'PGRST116') {
          const insertPromise = (supabase as any)
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: fullName || null
            } as any)
          
          const { error: insertError } = await Promise.race([
            insertPromise,
            timeoutPromise
          ]) as { error: any }
          
          if (insertError) {
            console.error('Erro ao inserir:', insertError)
            throw insertError
          }
        } else {
          console.error('Erro ao atualizar:', error)
          throw error
        }
      }
      
      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      if (error?.message === 'Timeout') {
        toast.error('Tempo limite excedido. Tente novamente.')
      } else {
        toast.error(error?.message || 'Erro ao salvar perfil')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true)
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Garantir que cookies sejam enviados
      })
      
      const data = await response.json()
      
      // Verificar status da resposta
      if (!response.ok) {
        // Se for assinatura manual, mostrar mensagem informativa (não é erro)
        if (data.isManual || response.status === 400) {
          toast('Esta assinatura foi liberada manualmente e não pode ser gerenciada através do portal do Stripe. Para gerenciar sua assinatura, entre em contato com o suporte através do WhatsApp.', {
            duration: 8000,
            icon: 'ℹ️',
            style: {
              background: '#fef3c7',
              color: '#92400e',
            }
          })
        } else if (response.status === 401) {
          toast.error('Erro de autenticação. Faça login novamente.', {
            duration: 5000
          })
        } else if (response.status === 404) {
          toast('Nenhuma assinatura ativa encontrada. Se você tem uma assinatura manual, entre em contato com o suporte.', {
            duration: 6000,
            icon: 'ℹ️',
            style: {
              background: '#fef3c7',
              color: '#92400e',
            }
          })
        } else {
          toast.error(data.error || 'Erro ao abrir portal de assinatura', {
            duration: 5000
          })
        }
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Erro ao obter URL do portal')
      }
    } catch (error: any) {
      console.error('Erro ao abrir portal:', error)
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.', {
        duration: 5000
      })
    } finally {
      setOpeningPortal(false)
    }
  }

  const tabs = [
    { id: 'profile' as TabType, label: 'Perfil', icon: User },
    { id: 'plan' as TabType, label: 'Plano & Uso', icon: CreditCard },
  ]

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
          Minha Conta
        </h1>
        <p className="text-gogh-grayDark">
          Gerencie suas informações pessoais e plano
        </p>
      </div>

      {/* Tabs — espaço extra em mobile para não cortar "Plano & Uso" */}
      <div className="flex bg-gogh-grayLight/50 rounded-xl p-1.5 sm:p-1 mb-8 gap-1 min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 rounded-lg min-w-0
              font-medium text-sm sm:text-base transition-all duration-200 relative
              ${activeTab === tab.id 
                ? 'bg-white text-gogh-black shadow-sm' 
                : 'text-gogh-grayDark hover:text-gogh-black'
              }
            `}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gogh-grayLight p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-gogh-grayDark" />
              <h2 className="text-xl font-bold text-gogh-black">Informações Pessoais</h2>
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gogh-black mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 border border-gogh-grayLight rounded-xl focus:outline-none focus:border-gogh-yellow transition-colors"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gogh-black mb-2">
                  Email <span className="text-gogh-grayDark font-normal">(somente leitura)</span>
                </label>
                <input
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gogh-grayLight rounded-xl bg-gogh-grayLight/30 text-gogh-grayDark cursor-not-allowed"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className="bg-white rounded-2xl border border-gogh-grayLight p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gogh-grayDark" />
                  <h2 className="text-xl font-bold text-gogh-black">Plano Atual</h2>
                </div>
                <button
                  onClick={() => {
                    refreshSubscription()
                    toast.success('Plano atualizado!')
                  }}
                  className="p-2 text-gogh-grayDark hover:text-gogh-black hover:bg-gogh-grayLight rounded-lg transition-colors"
                  title="Atualizar informações do plano"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-6">
                {hasActiveSubscription && subscription ? (
                  <>
                    <div className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4
                      ${isPro ? 'bg-amber-100 text-amber-700' : 'bg-gogh-yellow/20 text-gogh-black'}
                    `}>
                      <Crown className="w-5 h-5" />
                      <span className="font-bold">
                        {isPro ? 'Gogh Pro' : 'Gogh Essencial'}
                      </span>
                    </div>
                    <p className="text-gogh-grayDark mb-6">
                      Você está aproveitando todos os recursos do seu plano.
                    </p>
                    <button
                      onClick={handleManageSubscription}
                      disabled={openingPortal}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-black text-white font-medium rounded-xl hover:bg-gogh-black/90 transition-colors disabled:opacity-50"
                    >
                      {openingPortal ? (
                        <>
                          <LumaSpin size="sm" />
                          Abrindo...
                        </>
                      ) : (
                        <>
                          Gerenciar Assinatura
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                ) : hasServiceSubscriptions ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow/20 text-gogh-black rounded-full mb-4">
                      <Wrench className="w-5 h-5" />
                      <span className="font-bold">Serviços Personalizados</span>
                    </div>
                    <p className="text-gogh-grayDark mb-6">
                      Você tem serviços personalizados contratados. Gerencie sua assinatura para cancelar ou alterar.
                    </p>
                    <button
                      onClick={handleManageSubscription}
                      disabled={openingPortal}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-black text-white font-medium rounded-xl hover:bg-gogh-black/90 transition-colors disabled:opacity-50"
                    >
                      {openingPortal ? (
                        <>
                          <LumaSpin size="sm" />
                          Abrindo...
                        </>
                      ) : (
                        <>
                          Gerenciar Assinatura
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-grayLight rounded-full mb-4">
                      <Crown className="w-5 h-5 text-gogh-grayDark" />
                      <span className="font-bold text-gogh-grayDark">Plano Gratuito</span>
                    </div>
                    <p className="text-gogh-grayDark mb-2">
                      Você não está usando todo o potencial do Gogh Lab.
                    </p>
                    <p className="text-gogh-grayDark text-sm mb-6">
                      Faça upgrade para desbloquear todos os recursos disponíveis.
                    </p>
                    <Link
                      href="/precos"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
                    >
                      Ver todos os planos
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Usage & Features */}
            <div id="usage" className="bg-white rounded-2xl border border-gogh-grayLight p-6 lg:p-8 space-y-6 scroll-mt-6">
              {/* Créditos IA / Uso */}
              {hasActiveSubscription && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Coins className="w-5 h-5 text-gogh-grayDark" />
                      <h3 className="text-lg font-bold text-gogh-black">Créditos para criação com IA</h3>
                    </div>
                    <p className="text-xs text-gogh-grayDark mb-4">
                      Os créditos são usados ao criar fotos, vídeos, roteiros e prompts com IA.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-gogh-grayLight bg-gogh-beige/30 p-4">
                        <p className="text-xs font-medium text-gogh-grayDark mb-1">Créditos mensais</p>
                        <p className="text-2xl font-bold text-gogh-black">
                          {creditsBalanceMonthly !== null ? creditsBalanceMonthly : '—'}
                        </p>
                        <p className="text-xs text-gogh-grayDark mt-1">Renovam todo mês conforme seu plano.</p>
                      </div>
                      <div className="rounded-xl border border-gogh-grayLight bg-gogh-beige/30 p-4">
                        <p className="text-xs font-medium text-gogh-grayDark mb-1">Créditos comprados</p>
                        <p className="text-2xl font-bold text-gogh-black">
                          {creditsBalancePurchased !== null ? creditsBalancePurchased : '—'}
                        </p>
                        <p className="text-xs text-gogh-grayDark mt-1">Pacotes avulsos que você comprou.</p>
                      </div>
                    </div>
                    {creditPlans.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm font-medium text-gogh-black mb-2">Comprar mais créditos</p>
                        <div className="flex flex-wrap gap-2">
                          {creditPlans.map((plan) => (
                            <a
                              key={plan.id}
                              href={plan.stripe_checkout_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gogh-yellow text-gogh-black font-medium hover:bg-gogh-yellow/90 transition-colors text-sm"
                            >
                              {plan.name} ({plan.credits} créditos)
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gogh-grayDark mt-4">Planos de créditos avulsos serão exibidos aqui quando configurados.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Recursos do Plano */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-gogh-grayDark" />
                  <h3 className="text-lg font-bold text-gogh-black">
                    {hasActiveSubscription ? 'Recursos do Plano' : 'O que você terá'}
                  </h3>
                </div>

                {hasActiveSubscription ? (
                  <>
                    <ul className="space-y-3">
                      {planFeatures.length > 0 ?                       (() => {
                        const initialCount = 4
                        const visible = planResourcesExpanded ? planFeatures : planFeatures.slice(0, initialCount)
                        return (
                          <>
                            {visible.map((feature, index) => (
                              <li key={index} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gogh-yellow/20 rounded-lg flex items-center justify-center">
                                  <feature.icon className="w-4 h-4 text-gogh-black" />
                                </div>
                                <span className="text-gogh-black">{feature.text}</span>
                              </li>
                            ))}
                          </>
                        )
                      })() : (
                        <li className="text-sm text-gogh-grayDark">Recursos do plano são configurados no dashboard. Nenhum recurso vinculado ao seu plano no momento.</li>
                      )}
                    </ul>
                    {planFeatures.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setPlanResourcesExpanded((v) => !v)}
                        className="mt-3 text-sm font-medium text-gogh-black hover:text-gogh-black/80 flex items-center gap-1"
                      >
                        {planResourcesExpanded ? (
                          <> <ChevronUp className="w-4 h-4" /> Ver menos </>

                        ) : (
                          <> <ChevronDown className="w-4 h-4" /> Ver mais recursos ({planFeatures.length - 4}) </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <ul className="space-y-3">
                    {[
                      { text: 'Agentes de IA especializados', icon: MessageSquare },
                      { text: 'Cursos completos', icon: BookOpen },
                      { text: 'Acesso Canva Pro', icon: Palette },
                      { text: 'Acesso CapCut Pro', icon: Scissors },
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gogh-grayLight rounded-lg flex items-center justify-center">
                          <feature.icon className="w-4 h-4 text-gogh-grayDark" />
                        </div>
                        <span className="text-gogh-grayDark">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Subscription Period */}
              {hasActiveSubscription && subscription && (
                <div className="pt-6 border-t border-gogh-grayLight">
                  <p className="text-sm text-gogh-grayDark">
                    Ciclo atual: {subscription.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}
                  </p>
                  <p className="text-sm text-gogh-grayDark">
                    Próxima cobrança: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

