'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useRef } from 'react'

export const AuthDebug = () => {
  const { isAuthenticated, profile, loading, user } = useAuth()
  const loggedRef = useRef<string>('')

  useEffect(() => {
    // Evitar logs duplicados do mesmo estado
    const currentState = JSON.stringify({
      loading,
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
      profileId: profile?.id,
    })

    if (loggedRef.current === currentState) {
      return // Não logar se o estado não mudou
    }

    loggedRef.current = currentState

    console.log('🔍 Auth Debug Status:', {
      loading,
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
      profileId: profile?.id,
      profileName: profile?.full_name,
      profileRole: profile?.role,
      hasValidSession: !!user && !!profile
    })
  }, [loading, isAuthenticated, user, profile])

  return null // Componente invisível, apenas para debug
}