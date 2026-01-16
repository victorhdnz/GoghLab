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
      const { data, error } = await (supabase as any)
        .from('subscriptions')
        .select('id, plan_id, status, billing_cycle, current_period_end, cancel_at_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // PGRST116 = not found, que é esperado se não tem assinatura
        if (error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error)
        }
        return null
      }
      return data as UserSubscription | null
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
  }

  // Inicialização e listeners
  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 3
    
    // Timeout de segurança para não ficar loading infinito (aumentado para 30s)
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing completion')
        setLoading(false)
      }
    }, 30000) // 30 segundos de timeout

    // Buscar sessão inicial com retry
    const initializeAuth = async (retry = 0) => {
      try {
        // Pequeno delay para garantir que cookies foram atualizados pelo middleware
        if (retry > 0) {
          await new Promise(resolve => setTimeout(resolve, 500 * retry))
        }
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          // Se der erro e ainda tiver tentativas, tentar novamente
          if (retry < maxRetries && isMounted) {
            setTimeout(() => initializeAuth(retry + 1), 1000)
            return
          }
        }
        
        if (isMounted) {
          setSession(currentSession)
          setUser(currentSession?.user || null)
          
          if (currentSession?.user) {
            await updateUserData(currentSession.user)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Se der erro e ainda tiver tentativas, tentar novamente
        if (retry < maxRetries && isMounted) {
          setTimeout(() => initializeAuth(retry + 1), 1000)
          return
        }
      } finally {
        if (isMounted && retry === 0) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listener para mudanças de auth
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return
        
        console.log('[AuthContext] Auth state changed:', event, currentSession?.user?.email)
        
        setSession(currentSession)
        setUser(currentSession?.user || null)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await updateUserData(currentSession?.user || null)
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

