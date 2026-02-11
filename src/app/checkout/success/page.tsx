'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { Button } from '@/components/ui/button'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // Verificar a sessão do Stripe
      fetch(`/api/checkout/verify?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setSessionData(data)
          
          // Disparar evento Purchase do Meta Pixel quando a compra for confirmada
          if (data && typeof window !== 'undefined' && (window as any).fbq) {
            const price = data.amountTotal ? data.amountTotal / 100 : 0 // Converter de centavos para reais
            ;(window as any).fbq('track', 'Purchase', {
              value: price,
              currency: 'BRL',
              content_name: data.planName || 'Assinatura'
            })
          }
          
          setLoading(false)
        })
        .catch(err => {
          console.error('Erro ao verificar sessão:', err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <LumaSpin size="default" className="mx-auto mb-4" />
          <p className="text-[#0A0A0A]">Processando sua assinatura...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#0A0A0A] mb-2">
          Parabéns! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          Sua assinatura foi ativada com sucesso. Agora você tem acesso completo à plataforma Gogh Lab!
        </p>

        {sessionData?.planName && (
          <div className="bg-[#F7C948]/10 border border-[#F7C948]/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#0A0A0A]">
              <strong>Plano:</strong> {sessionData.planName}
            </p>
            {sessionData?.billingCycle && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Ciclo:</strong> {sessionData.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link href="/minha-conta">
            <Button className="w-full bg-[#F7C948] hover:bg-[#E5A800] text-[#0A0A0A]">
              Acessar Minha Conta
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full border-[#F7C948]/50 hover:bg-[#F7C948]/10">
              Voltar para Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Você receberá um email de confirmação com os detalhes da sua assinatura.
        </p>
      </div>
    </div>
  )
}

