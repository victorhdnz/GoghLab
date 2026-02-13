'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, X, Sparkles } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { Button } from '@/components/ui/button'

const PURCHASE_NOTIFICATION_DISMISSED_KEY = 'gogh_purchase_notification_dismissed'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [notificationDismissed, setNotificationDismissed] = useState(true)

  useEffect(() => {
    if (sessionId) {
      // Verificar a sessão do Stripe
      fetch(`/api/checkout/verify?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setSessionData(data)
          const alreadyDismissed = typeof window !== 'undefined' && sessionStorage.getItem(PURCHASE_NOTIFICATION_DISMISSED_KEY) === '1'
          setNotificationDismissed(alreadyDismissed)

          // Persistir dados da compra para a notificação global (fixa até o usuário fechar)
          if (typeof window !== 'undefined' && data && !alreadyDismissed) {
            sessionStorage.setItem('gogh_purchase_notification_pending', JSON.stringify({
              planName: data.planName,
              isServiceSubscription: !!data.isServiceSubscription,
            }))
          }

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

  const dismissNotification = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PURCHASE_NOTIFICATION_DISMISSED_KEY, '1')
      sessionStorage.removeItem('gogh_purchase_notification_pending')
    }
    setNotificationDismissed(true)
  }

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

  const showNotification = sessionData && !notificationDismissed

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex flex-col items-center justify-center px-4 py-8">
      {/* Notificação fixa de acesso liberado — fica até o usuário fechar */}
      {showNotification && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-[#F7C948]/50 p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#F7C948]/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-[#0A0A0A]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#0A0A0A] mb-1">Acesso liberado!</h3>
              <p className="text-sm text-gray-600 mb-3">
                Você já pode acessar as abas da plataforma de acordo com seu plano. Aproveite os recursos disponíveis.
              </p>
              {sessionData?.isServiceSubscription && (
                <Link href="/membro/servicos" onClick={dismissNotification}>
                  <Button size="sm" className="bg-[#F7C948] hover:bg-[#E5A800] text-[#0A0A0A]">
                    Ir para Meus Serviços
                  </Button>
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={dismissNotification}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

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
          <Link href="/conta">
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

