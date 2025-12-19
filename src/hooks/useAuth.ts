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
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      // Se não existe, criar
      if (!existingProfile && checkError?.code === 'PGRST116') {
        // Selecionar apenas campos necessários após inserção
        const { data: newProfile, error: insertError } = await supabase
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

      return existingProfile as AppUser
    } catch (error) {
      return null
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const getUser = async () => {
      if (!mounted) return
      
      setLoading(true)
      
      try {
        // Verificar sessão de forma simples
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (session?.user) {
          // Atualizar user imediatamente
          setUser(session.user)
          
          // Buscar perfil de forma assíncrona (não bloqueia o loading)
          // Isso permite que a UI seja atualizada rapidamente
          const loadProfileAsync = async () => {
            try {
              // Usar timeout curto para buscar profile (1 segundo)
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
                  // Profile não existe, criar (primeiro login) - mas não bloquear
                  ensureProfileExists(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata
                  ).then((newProfile) => {
                    if (mounted) {
                      setProfile(newProfile)
                    }
                  }).catch(() => {
                    // Falhou ao criar profile - continuar sem profile
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
                // Timeout ao buscar profile - continuar sem profile
                if (mounted) {
                  setProfile(null)
                }
              }
            } catch (error: any) {
              // Erro ao buscar perfil - continuar sem profile
              if (mounted) {
                setProfile(null)
              }
            }
          }

          // Iniciar busca do profile em background
          loadProfileAsync()
          
          // Finalizar loading imediatamente após obter a sessão
          // O profile será carregado em background sem bloquear a UI
          if (mounted && timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          if (mounted) {
            setLoading(false)
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

  // Verificar se é admin/editor através da role do profile
  const isAdmin = profile?.role === 'admin'
  const isEditor = profile?.role === 'admin' || profile?.role === 'editor'

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
  }
}

