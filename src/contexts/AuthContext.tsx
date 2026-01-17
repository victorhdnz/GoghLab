'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database, PlanId, SubscriptionStatus } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Subscription = Database['public']['Tables']['subscriptions']['Row']

interface UserSubscription {
  id: string
  plan_id: PlanId
  status: SubscriptionStatus
  billing_cycle: 'monthly' | 'annual'
  current_period_end: string
  cancel_at_period_end: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  subscription: UserSubscription | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  hasActiveSubscription: boolean
  isPro: boolean
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Buscar perfil do usuário
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 = not found, que é esperado se o profile ainda não existe
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }
        return null
      }
      return data
    } catch (err) {
      console.error('Exception fetching profile:', err)
      return null
    }
  }

  // Buscar assinatura ativa
  const fetchSubscription = async (userId: string): Promise<UserSubscription | null> => {
    try {
      // Tentar primeiro com estrutura nova (plan_id, billing_cycle)
      let { data, error } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        // PGRST116 = not found, que é esperado se não tem assinatura
        if (error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error)
        }
        return null
      }

      if (!data) {
        return null
      }

      // Converter estrutura antiga para nova se necessário
      let planId = data.plan_id
      if (!planId && data.plan_type) {
        planId = data.plan_type === 'premium' ? 'gogh_pro' :
                 data.plan_type === 'essential' ? 'gogh_essencial' : null
      }

      // Garantir billing_cycle
      const billingCycle = data.billing_cycle || 'monthly'

      return {
        id: data.id,
        plan_id: planId as PlanId,
        status: data.status as SubscriptionStatus,
        billing_cycle: billingCycle as 'monthly' | 'annual',
        current_period_end: data.current_period_end,
        cancel_at_period_end: data.cancel_at_period_end || false
      } as UserSubscription
    } catch (err) {
      console.error('Exception fetching subscription:', err)
      return null
    }
  }

  // Atualizar dados do usuário
  const updateUserData = async (currentUser: User | null) => {
    if (currentUser) {
      const [profileData, subscriptionData] = await Promise.all([
        fetchProfile(currentUser.id),
        fetchSubscription(currentUser.id)
      ])
      setProfile(profileData)
      setSubscription(subscriptionData)
    } else {
      setProfile(null)
      setSubscription(null)
    }
  }

  // Refresh subscription
  const refreshSubscription = async () => {
    if (user) {
      const subscriptionData = await fetchSubscription(user.id)
      setSubscription(subscriptionData)
    }
  }

  // Login com Google
  const signInWithGoogle = async (redirectTo?: string) => {
    const redirectUrl = redirectTo || '/'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  // Logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
    setUser(null)
    setProfile(null)
    setSubscription(null)
    setSession(null)
    // Limpar senha do dashboard ao fazer logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dashboard_password_verified')
    }
  }

  // Inicialização e listeners
  useEffect(() => {
    let isMounted = true
    
    // Timeout de segurança para não ficar loading infinito
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing completion')
        setLoading(false)
      }
    }, 5000) // 5 segundos de timeout

    // Buscar sessão inicial de forma simples
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }
        
        setSession(currentSession)
        setUser(currentSession?.user || null)
        
        if (currentSession?.user) {
          // Buscar dados do usuário de forma assíncrona (não bloqueia)
          updateUserData(currentSession.user).finally(() => {
            if (isMounted) {
              setLoading(false)
            }
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listener para atualização manual de assinatura (do dashboard)
    const handleSubscriptionUpdate = async () => {
      console.log('[AuthContext] Subscription update event received')
      // Buscar usuário atual do Supabase
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        console.log('[AuthContext] Refreshing subscription for user:', currentUser.id)
        await updateUserData(currentUser)
      }
    }
    
    window.addEventListener('subscription-updated', handleSubscriptionUpdate)

    // Listener para mudanças de auth
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return
        
        console.log('[AuthContext] Auth state changed:', event, currentSession?.user?.email)
        
        setSession(currentSession)
        setUser(currentSession?.user || null)
        
        if (event === 'SIGNED_IN') {
          // Quando faz login, buscar dados do usuário
          if (currentSession?.user) {
            updateUserData(currentSession.user)
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Durante refresh, apenas atualizar se tiver user
          if (currentSession?.user) {
            // Não bloquear com await - fazer de forma assíncrona
            updateUserData(currentSession.user)
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setSubscription(null)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      authSubscription.unsubscribe()
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate)
    }
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    subscription,
    session,
    loading,
    isAuthenticated: !!user,
    hasActiveSubscription: !!subscription && subscription.status === 'active',
    isPro: subscription?.plan_id === 'gogh_pro',
    signInWithGoogle,
    signOut,
    refreshSubscription,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook auxiliar para verificar acesso a recursos
export function useFeatureAccess(featureKey: string) {
  const { subscription, hasActiveSubscription } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      if (!hasActiveSubscription || !subscription) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      // Recursos básicos que ambos os planos têm
      const basicFeatures = ['ai_agents', 'courses', 'canva_access', 'capcut_access', 'ai_messages']
      
      // Recursos apenas do Pro
      const proOnlyFeatures = ['support_priority', 'custom_agents']

      if (basicFeatures.includes(featureKey)) {
        setHasAccess(true)
      } else if (proOnlyFeatures.includes(featureKey)) {
        setHasAccess(subscription.plan_id === 'gogh_pro')
      } else {
        setHasAccess(false)
      }
      
      setLoading(false)
    }

    checkAccess()
  }, [subscription, hasActiveSubscription, featureKey])

  return { hasAccess, loading }
}

