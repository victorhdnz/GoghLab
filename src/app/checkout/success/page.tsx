'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LumaSpin } from '@/components/ui/luma-spin'

const PURCHASE_NOTIFICATION_DISMISSED_KEY = 'gogh_purchase_notification_dismissed'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (hasRedirectedRef.current) return
    if (!sessionId) {
      hasRedirectedRef.current = true
      router.replace('/conta')
      return
    }
    fetch(`/api/checkout/verify?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (hasRedirectedRef.current) return
        hasRedirectedRef.current = true

        const alreadyDismissed = typeof window !== 'undefined' && sessionStorage.getItem(PURCHASE_NOTIFICATION_DISMISSED_KEY) === '1'

        if (typeof window !== 'undefined' && data && !alreadyDismissed) {
          sessionStorage.setItem(
            'gogh_purchase_notification_pending',
            JSON.stringify({
              planName: data.planName,
              isServiceSubscription: !!data.isServiceSubscription,
            })
          )
        }

        if (data && typeof window !== 'undefined' && (window as any).fbq) {
          const price = data.amountTotal ? data.amountTotal / 100 : 0
          ;(window as any).fbq('track', 'Purchase', {
            value: price,
            currency: 'BRL',
            content_name: data.planName || 'Assinatura',
          })
        }

        setLoading(false)
        router.replace('/conta?tab=plan')
      })
      .catch(() => {
        if (hasRedirectedRef.current) return
        hasRedirectedRef.current = true
        setLoading(false)
        router.replace('/conta')
      })
  }, [sessionId, router])

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
      <div className="text-center">
        <LumaSpin size="default" className="mx-auto mb-4" />
        <p className="text-[#0A0A0A]">Processando sua assinatura...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecionando para sua conta.</p>
      </div>
    </div>
  )
}

