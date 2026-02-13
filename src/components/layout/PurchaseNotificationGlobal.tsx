'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PURCHASE_PENDING_KEY = 'gogh_purchase_notification_pending'
const PURCHASE_DISMISSED_KEY = 'gogh_purchase_notification_dismissed'

interface PendingData {
  planName?: string
  isServiceSubscription?: boolean
}

export function PurchaseNotificationGlobal() {
  const [pending, setPending] = useState<PendingData | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem(PURCHASE_PENDING_KEY)
    const alreadyDismissed = sessionStorage.getItem(PURCHASE_DISMISSED_KEY) === '1'
    if (raw && !alreadyDismissed) {
      try {
        const data = JSON.parse(raw) as PendingData
        setPending(data)
        setDismissed(false)
      } catch {
        sessionStorage.removeItem(PURCHASE_PENDING_KEY)
      }
    } else {
      setPending(null)
      setDismissed(true)
    }
  }, [])

  const dismiss = () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(PURCHASE_PENDING_KEY)
    sessionStorage.setItem(PURCHASE_DISMISSED_KEY, '1')
    sessionStorage.setItem('gogh_purchase_notification_dismissed', '1') // mesma chave da página de success
    setPending(null)
    setDismissed(true)
  }

  if (!pending || dismissed) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] max-w-lg mx-auto pointer-events-auto">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-[#F7C948]/50 p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[#F7C948]/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-[#0A0A0A]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#0A0A0A] mb-1">Acesso liberado!</h3>
          <p className="text-sm text-gray-600 mb-3">
            Você já pode acessar as abas da plataforma de acordo com seu plano. Aproveite os recursos disponíveis.
          </p>
          {pending.isServiceSubscription && (
            <Link href="/membro/servicos" onClick={dismiss}>
              <Button size="sm" className="bg-[#F7C948] hover:bg-[#E5A800] text-[#0A0A0A]">
                Ir para Meus Serviços
              </Button>
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
