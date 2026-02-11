'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LumaSpin } from '@/components/ui/luma-spin'

export default function TermosAssinaturaPlanosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página de termos com o parâmetro correto
    router.replace('/termos?termo=termos-assinatura-planos')
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <LumaSpin size="md" className="mx-auto mb-4" />
        <p className="text-gray-600">Carregando termos...</p>
      </div>
    </div>
  )
}

