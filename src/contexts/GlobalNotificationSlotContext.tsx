'use client'

import { createContext, useCallback, useContext, useState } from 'react'

export type SlotOwner = 'agenda' | 'analytics'

type ContextValue = {
  /** Quem está exibindo no momento (null = nenhum). */
  slot: SlotOwner | null
  /** Tenta pegar o slot; só atribui se estiver livre. */
  claimSlot: (who: SlotOwner) => void
  /** Libera o slot ao fechar a notificação. */
  releaseSlot: () => void
}

const GlobalNotificationSlotContext = createContext<ContextValue | null>(null)

export function GlobalNotificationSlotProvider({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<SlotOwner | null>(null)

  const claimSlot = useCallback((who: SlotOwner) => {
    setSlot((current) => (current === null ? who : current))
  }, [])

  const releaseSlot = useCallback(() => {
    setSlot(null)
  }, [])

  const value: ContextValue = { slot, claimSlot, releaseSlot }

  return (
    <GlobalNotificationSlotContext.Provider value={value}>
      {children}
    </GlobalNotificationSlotContext.Provider>
  )
}

export function useGlobalNotificationSlot() {
  return useContext(GlobalNotificationSlotContext)
}
