'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { getSiteUrl } from '@/lib/utils/siteUrl'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User as AppUser } from '@/types'
import { isAdminEmail } from '@/lib/utils/admin'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  // Criar cliente Supabase uma vez usando useMemo para evitar recriações
  const supabase = useMemo(() => createClient(), [])

  // Função auxiliar para garantir que o profile existe (memoizada)
  const ensureProfileExists = useCallback(async (userId: string, userEmail: string, userMetadata: any) => {
    try {
      // Verificar se o profile existe
      const { data: existingProfile, error: checkError } = await (supabase as any)
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, phone, created_at, updated_at')
        .eq('id', userId)
        .single()

      // Se não existe, criar
      if (!existingProfile && checkError?.code === 'PGRST116') {
        // Selecionar apenas campos necessários após inserção
        const { data: newProfile, error: insertError } = await (supabase as any)
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            full_name: userMetadata?.full_name || userMetadata?.name || null,
            avatar_url: userMetadata?.avatar_url || userMetadata?.picture || null,
            role: 'customer'
          })
          .select('id, email, full_name, avatar_url, role, phone, created_at, updated_at')
          .single()

        if (insertError) {
          return null
        }

        return newProfile as AppUser
      }

      return existingProfile ? (existingProfile as AppUser) : null
    } catch (error) {
      return null
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const getUser = async (retry = 0) => {
      if (!mounted) return
      
      // Só setar loading como true se ainda não temos user (primeira carga)
      // Isso evita "flash" de loading durante navegação
      if (!user) {
        setLoading(true)
      }
      
      try {
        // Pequeno delay para garantir que cookies foram atualizados pelo middleware
        if (retry > 0) {
          await new Promise(resolve => setTimeout(resolve, 500 * retry))
        }
        
        // Verificar sessão de forma simples
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        // Se der erro e ainda tiver tentativas, tentar novamente
        if (error && retry < 2) {
          setTimeout(() => getUser(retry + 1), 1000)
          return
        }
        
        if (session?.user) {
          // Atualizar user imediatamente
          setUser(session.user)
          
          // Buscar perfil de forma assíncrona (não bloqueia o loading)
          // Isso permite que a UI seja atualizada rapidamente
          const loadProfileAsync = async (): Promise<void> => {
            try {
              // Buscar profile sem timeout para garantir que carregue
              const { data: profile, error: profileError } = await (supabase as any)
                .from('profiles')
                .select('id, email, full_name, avatar_url, role, phone, created_at, updated_at')
                .eq('id', session.user.id)
                .single()

              if (!mounted) return

              if (profileError?.code === 'PGRST116') {
                // Profile não existe, criar (primeiro login)
                const newProfile = await ensureProfileExists(
                  session.user.id,
                  session.user.email || '',
                  session.user.user_metadata
                )
                if (mounted) {
                  setProfile(newProfile)
                }
              } else if (profileError) {
                console.error('Erro ao buscar profile:', profileError)
                if (mounted) {
                  setProfile(null)
                }
              } else {
                if (mounted) {
                  setProfile(profile as AppUser || null)
                }
              }
            } catch (error: any) {
              console.error('Erro ao buscar perfil:', error)
              // Erro ao buscar perfil - continuar sem profile
              if (mounted) {
                setProfile(null)
              }
            }
          }

          // Iniciar busca do profile e aguardar antes de finalizar loading
          // Isso garante que isEditor seja calculado corretamente
          // Mas com timeout para não travar se o profile não carregar
          const profileTimeout = new Promise<void>((resolve) => {
            setTimeout(() => {
              if (mounted) {
                resolve()
              }
            }, 2000) // Timeout de 2 segundos para carregar profile
          })

          try {
            await Promise.race([loadProfileAsync(), profileTimeout])
          } catch (error) {
            console.error('Erro ao carregar profile:', error)
          } finally {
            // Sempre finalizar loading, mesmo se o profile não carregou
            if (mounted && timeoutId) {
              clearTimeout(timeoutId)
              timeoutId = null
            }
            if (mounted) {
              setLoading(false)
            }
          }
        } else {
          // Não há sessão
          if (mounted && timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
        }
      } catch (error: any) {
        console.error('Erro ao buscar sessão:', error)
        if (mounted && timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    // Timeout de segurança: se passar de 5 segundos, forçar loading = false
    // Mas não logar warning para não poluir o console
    timeoutId = setTimeout(() => {
      if (mounted) {
        // Silenciosamente forçar loading = false se ainda estiver carregando
        setLoading(false)
        timeoutId = null
      }
    }, 5000)

    getUser().then(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        // Não alterar loading aqui para evitar conflitos
        // Apenas atualizar user e profile
        setUser(session?.user ?? null)

        if (session?.user) {
          // Buscar profile de forma assíncrona sem bloquear
          ;(async () => {
            try {
                  // Usar timeout curto (1 segundo) para não travar
                  // Selecionar apenas campos necessários para melhor performance
                  const profilePromise = supabase
                    .from('profiles')
                    .select('id, email, full_name, avatar_url, role, phone, created_at, updated_at')
                    .eq('id', session.user.id)
                    .single()

              const profileTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile timeout')), 1000)
              )

              try {
                const { data: profile, error: profileError } = await Promise.race([
                  profilePromise,
                  profileTimeout
                ]) as { data: any, error: any }

                if (!mounted) return
                
                if (profileError?.code === 'PGRST116') {
                  // Profile não existe - criar em background sem bloquear
                  ensureProfileExists(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata
                  ).then((newProfile) => {
                    if (mounted) {
                      setProfile(newProfile)
                    }
                  }).catch(() => {
                    if (mounted) {
                      setProfile(null)
                    }
                  })
                } else if (profileError) {
                  if (mounted) {
                    setProfile(null)
                  }
                } else {
                  if (mounted) {
                    setProfile(profile as AppUser || null)
                  }
                }
              } catch (timeoutError) {
                // Timeout - continuar sem profile
                if (mounted) {
                  setProfile(null)
                }
              }
            } catch (error) {
              if (mounted) {
                setProfile(null)
              }
            }
          })()
        } else {
          if (mounted) {
            setProfile(null)
          }
        }
      }
    )

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      subscription.unsubscribe()
    }
  }, [supabase, ensureProfileExists]) // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Erro ao fazer login:', error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) return

    try {
        // Selecionar apenas campos necessários para melhor performance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, role, phone, created_at, updated_at')
          .eq('id', user.id)
          .single()

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError)
        return
      }

      setProfile(profile as AppUser || null)
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Erro ao fazer logout:', error)
        throw error
      }
      
      // Limpar estado local
      setUser(null)
      setProfile(null)
      
      // Recarregar a página para limpar qualquer cache
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      setLoading(false)
      throw error
    }
  }

  // Verificar se é admin/editor através da role do profile OU email na lista de admins
  // Isso permite que emails na lista ADMIN_EMAILS tenham acesso mesmo com role diferente
  const emailIsAdmin = isAdminEmail(user?.email)
  const isAdmin = profile?.role === 'admin' || emailIsAdmin
  const isEditor = profile?.role === 'admin' || profile?.role === 'editor' || emailIsAdmin
  
  // Flag para indicar se a verificação de permissões está completa
  // Simplesmente: não está carregando = permissões prontas
  const permissionsReady = !loading

  return {
    user,
    profile,
    loading,
    signInWithEmail,
    signOut,
    refreshProfile,
    isAdmin,
    isEditor,
    isAuthenticated: !!user,
    permissionsReady, // Nova flag para verificar se as permissões estão prontas
    emailIsAdmin, // Expor para uso direto nas páginas
  }
}

