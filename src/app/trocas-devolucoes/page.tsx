'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LumaSpin } from '@/components/ui/luma-spin'

/**
 * Trocas e Devoluções de produtos físicos não se aplicam à Gogh Lab (plataforma digital).
 * Cancelamento e reembolso de assinaturas estão nos Termos de Assinatura e Planos.
 * Redireciona para a página central de termos.
 */
export default function TrocasDevolucoes() {
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
