'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}
