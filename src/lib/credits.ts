/**
 * Sistema de créditos para criação com IA.
 * Config em site_settings key = 'ai_credits_config':
 * {
 *   monthlyCreditsByPlan: { gogh_essencial: number, gogh_pro: number },
 *   costByAction: { foto: number, video: number, roteiro: number, prompts: number }
 * }
 * Saldo do usuário em user_usage: feature_key = 'ai_credits', period_start/period_end = mês atual, usage_count = créditos restantes.
 */

export type CreditActionId = 'foto' | 'video' | 'roteiro' | 'prompts'

export interface CreditsConfig {
  monthlyCreditsByPlan?: Record<string, number>
  costByAction?: Record<CreditActionId, number>
}

const DEFAULT_COST: Record<CreditActionId, number> = {
  foto: 5,
  video: 10,
  roteiro: 15,
  prompts: 5,
}

const DEFAULT_MONTHLY: Record<string, number> = {
  gogh_essencial: 50,
  gogh_pro: 200,
}

function getMonthBounds(date: Date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  }
}

export function getCreditCost(actionId: CreditActionId, config?: CreditsConfig | null): number {
  const cost = config?.costByAction?.[actionId]
  return typeof cost === 'number' ? cost : DEFAULT_COST[actionId]
}

export function getMonthlyCreditsForPlan(planId: string | undefined, config?: CreditsConfig | null): number {
  if (!planId) return 0
  const n = config?.monthlyCreditsByPlan?.[planId]
  return typeof n === 'number' ? n : DEFAULT_MONTHLY[planId] ?? 0
}

export function getCreditsConfigKey(): string {
  return 'ai_credits_config'
}

/** Planos de créditos avulsos (compra na área de conta) - key: ai_credits_plans */
export interface CreditPlan {
  id: string
  name: string
  credits: number
  stripe_checkout_url: string
  /** Price ID do Stripe (ex.: price_xxx) para o webhook creditar na compra */
  stripe_price_id?: string
  order?: number
}

export function getCreditPlansKey(): string {
  return 'ai_credits_plans'
}

export { getMonthBounds }
