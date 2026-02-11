'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LumaSpin } from '@/components/ui/luma-spin'

/**
 * Política de Entrega não se aplica à Gogh Lab (plataforma digital).
 * Redireciona para a página central de termos.
 */
export default function PoliticaEntrega() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/termos')
  }, [router])
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <LumaSpin size="md" className="mx-auto mb-4" />
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}
