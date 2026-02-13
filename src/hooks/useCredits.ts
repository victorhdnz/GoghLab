'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CreditActionId } from '@/lib/credits'

interface CreditsState {
  balance: number | null
  costByAction: Record<CreditActionId, number> | null
  loading: boolean
  error: string | null
}

export function useCredits() {
  const [state, setState] = useState<CreditsState>({
    balance: null,
    costByAction: null,
    loading: true,
    error: null,
  })

  const fetchBalance = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/credits/balance', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        setState((s) => ({ ...s, loading: false, balance: null, costByAction: null, error: data.error ?? 'Erro' }))
        return
      }
      setState({
        balance: data.balance ?? 0,
        costByAction: data.costByAction ?? null,
        loading: false,
        error: null,
      })
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message ?? 'Erro ao carregar créditos' }))
    }
  }, [])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Atualizar saldo ao voltar para a aba (ex.: após mudança de créditos no dashboard ou compra)
  useEffect(() => {
    const onFocus = () => { fetchBalance() }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
      return () => window.removeEventListener('focus', onFocus)
    }
  }, [fetchBalance])

  const deduct = useCallback(async (actionId: CreditActionId, amount?: number): Promise<{ ok: boolean; balance?: number; code?: string }> => {
    try {
      const res = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ actionId, ...(typeof amount === 'number' && amount > 0 ? { amount } : {}) }),
      })
      const data = await res.json()
      if (res.status === 402) {
        return { ok: false, code: 'insufficient_credits', balance: data.balance }
      }
      if (!res.ok) {
        return { ok: false }
      }
      setState((s) => ({ ...s, balance: data.balance ?? s.balance }))
      return { ok: true, balance: data.balance }
    } catch {
      return { ok: false }
    }
  }, [])

  return { ...state, refetch: fetchBalance, deduct }
}
