'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}
