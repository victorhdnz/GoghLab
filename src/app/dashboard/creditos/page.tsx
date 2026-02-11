'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Configuração de Créditos IA foi movida para Planos de Assinatura (Produtos e atribuição aos planos).
 */
export default function CreditosRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/pricing')
  }, [router])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Redirecionando para Planos de Assinatura...</p>
    </div>
  )
}
