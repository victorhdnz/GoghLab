'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LumaSpin } from '@/components/ui/luma-spin'

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
        <LumaSpin size="default" className="mx-auto mb-4" />
        <p className="text-gogh-grayDark">Redirecionando...</p>
      </div>
    </div>
  )
}
