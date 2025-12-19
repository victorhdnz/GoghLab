'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

/**
 * Componente para tratar redirecionamento após login bem-sucedido
 * Remove o parâmetro ?auth=success da URL e redireciona se necessário
 */
export function AuthRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const hasProcessedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Se já processou, não fazer nada
    if (hasProcessedRef.current) return

    const authSuccess = searchParams.get('auth')
    
    // Se não há parâmetro auth=success, não fazer nada
    if (authSuccess !== 'success') return

    const processRedirect = () => {
      if (hasProcessedRef.current) return
      hasProcessedRef.current = true

      // Limpar timeout se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const returnUrl = localStorage.getItem('auth_return_url')
      
      // Limpar returnUrl do localStorage após usar
      if (returnUrl) {
        localStorage.removeItem('auth_return_url')
        
        // Redirecionar para a URL salva se não for /login
        if (returnUrl && returnUrl !== '/login') {
          try {
            router.replace(decodeURIComponent(returnUrl))
          } catch {
            router.replace('/')
          }
        } else {
          // Remover apenas o parâmetro da URL atual
          router.replace('/')
        }
      } else {
        // Remover apenas o parâmetro da URL atual
        router.replace('/')
      }
    }

    // Timeout de segurança: se loading não terminar em 3 segundos, processar mesmo assim
    timeoutRef.current = setTimeout(() => {
      processRedirect()
    }, 3000)

    // Se não está carregando e está autenticado, processar imediatamente
    if (!loading && isAuthenticated) {
      processRedirect()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [searchParams, isAuthenticated, loading, router])

  return null
}

