'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
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
  Zap
} from 'lucide-react'

type TabType = 'profile' | 'plan'

interface UsageStats {
  ai_messages: { current: number; limit: number | null }
}

export default function AccountPage() {
  const { user, profile, subscription, hasActiveSubscription, isPro, refreshSubscription } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [saving, setSaving] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)
  
  // Form state
  const [fullName, setFullName] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
    }
  }, [profile])

  // Buscar uso do usuário
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user || !hasActiveSubscription) {
        setUsageStats(null)
        return
      }

      setLoadingUsage(true)
      try {
        // Buscar uso diário (hoje)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: usageData } = await (supabase as any)
          .from('user_usage')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('feature_key', 'ai_interactions')
          .gte('period_start', today.toISOString().split('T')[0])
          .maybeSingle()

        // Limites diários: Essencial = 8, Pro = 20
        const limit = isPro ? 20 : 8

        setUsageStats({
          ai_messages: {
            current: usageData?.usage_count || 0,
            limit: limit
          }
        })
      } catch (error) {
        console.error('Erro ao buscar uso:', error)
      } finally {
        setLoadingUsage(false)
      }
    }

    fetchUsage()
  }, [user, hasActiveSubscription, isPro])

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
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        // Se for assinatura manual, mostrar mensagem mais amigável
        if (data.isManual) {
          toast.error(data.error || 'Esta assinatura foi criada manualmente. Entre em contato com o suporte.')
        } else {
          toast.error(data.error || 'Erro ao abrir portal de assinatura')
        }
      }
    } catch (error: any) {
      console.error('Erro ao abrir portal:', error)
      toast.error(error.message || 'Erro ao abrir portal')
    } finally {
      setOpeningPortal(false)
    }
  }

  const tabs = [
    { id: 'profile' as TabType, label: 'Perfil', icon: User },
    { id: 'plan' as TabType, label: 'Plano & Uso', icon: CreditCard },
  ]

  const planFeatures = hasActiveSubscription ? (
    isPro ? [
      { text: '20 interações por dia', icon: MessageSquare },
      { text: 'Todos os agentes', icon: Sparkles },
      { text: 'Todos os cursos', icon: BookOpen },
      { text: 'Canva Pro', icon: Palette },
      { text: 'CapCut Pro', icon: Scissors },
    ] : [
      { text: '8 interações por dia', icon: MessageSquare },
      { text: 'Agentes básicos', icon: Sparkles },
      { text: 'Cursos de Canva e CapCut', icon: BookOpen },
      { text: 'Canva Pro', icon: Palette },
      { text: 'CapCut Pro', icon: Scissors },
    ]
  ) : []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
          Minha Conta
        </h1>
        <p className="text-gogh-grayDark">
          Gerencie suas informações pessoais e plano
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gogh-grayLight/50 rounded-xl p-1 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              font-medium transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-white text-gogh-black shadow-sm' 
                : 'text-gogh-grayDark hover:text-gogh-black'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
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
                {hasActiveSubscription ? (
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
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                      Você não está usando todo o potencial da Gogh Lab.
                    </p>
                    <p className="text-gogh-grayDark text-sm mb-6">
                      Faça upgrade para desbloquear todos os recursos disponíveis.
                    </p>
                    <Link
                      href="/#pricing"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
                    >
                      Ver todos os planos
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Usage & Features */}
            <div className="bg-white rounded-2xl border border-gogh-grayLight p-6 lg:p-8 space-y-6">
              {/* Uso de Mensagens de IA */}
              {hasActiveSubscription && usageStats && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-gogh-grayDark" />
                      <h3 className="text-lg font-bold text-gogh-black">Interações de IA</h3>
                    </div>
                    <span className="text-sm text-gogh-grayDark">Hoje</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gogh-black">
                        {usageStats.ai_messages.current}
                      </span>
                      <span className="text-sm text-gogh-grayDark">
                        / {usageStats.ai_messages.limit} interações
                      </span>
                    </div>
                    <div className="h-2 bg-gogh-grayLight rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(
                            (usageStats.ai_messages.current / (usageStats.ai_messages.limit || 1)) * 100, 
                            100
                          )}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gogh-grayDark">
                      {Math.round((usageStats.ai_messages.current / (usageStats.ai_messages.limit || 1)) * 100)}% do limite utilizado
                    </p>
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
                  <ul className="space-y-3">
                    {planFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gogh-yellow/20 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-4 h-4 text-gogh-black" />
                        </div>
                        <span className="text-gogh-black">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
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
        )}
      </motion.div>
    </div>
  )
}

