'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Agentes de IA foram descontinuados.
 * Redireciona para a área do membro.
 */
export default function AgentsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/membro')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gogh-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gogh-grayDark">Redirecionando...</p>
      </div>
    </div>
  )
}
