import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import {
  getMonthBounds,
  getCreditsConfigKey,
  getMonthlyCreditsForPlan,
  getCreditCost,
  type CreditsConfig,
  type CreditActionId,
} from '@/lib/credits'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const routeClient = createRouteHandlerClient()
    const { data: { user } } = await routeClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = createSupabaseAdmin() as any

    const { data: configRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle() as { data: { value: unknown } | null }
    const config = (configRow?.value as CreditsConfig) ?? null

    const { periodStart, periodEnd } = getMonthBounds()

    const { data: usageRow } = await supabase
      .from('user_usage')
      .select('id, usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_credits')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle()

    let balance = usageRow?.usage_count ?? null

    const fetchPlanCredits = async () => {
      let planId: string | undefined
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id, plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      planId = sub?.plan_id ?? undefined
      if (!planId && sub?.plan_type) {
        planId = sub.plan_type === 'premium' ? 'gogh_pro' : sub.plan_type === 'essential' ? 'gogh_essencial' : undefined
      }
      if (!planId) {
        const { data: serviceSub } = await supabase
          .from('service_subscriptions')
          .select('plan_id')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (serviceSub?.plan_id && ['gogh_essencial', 'gogh_pro'].includes(serviceSub.plan_id)) {
          planId = serviceSub.plan_id
        }
      }
      return getMonthlyCreditsForPlan(planId, config)
    }

    const monthly = await fetchPlanCredits()

    if (balance === null) {
      const { error: insertErr } = await supabase
        .from('user_usage')
        .insert({
          user_id: user.id,
          feature_key: 'ai_credits',
          usage_count: monthly,
          period_start: periodStart,
          period_end: periodEnd,
        })
      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
      balance = monthly
    } else {
      const currentBalance = Number(balance)
      // Reconciliação: se o plano tem mais créditos que o saldo armazenado (ex.: admin aumentou o plano ou assinatura manual com 0), atualiza
      if (monthly > currentBalance && usageRow?.id) {
        await supabase
          .from('user_usage')
          .update({ usage_count: monthly, updated_at: new Date().toISOString() })
          .eq('id', usageRow.id)
        balance = monthly
      }
    }

    // Créditos comprados à parte (não renovam por mês)
    const { data: purchasedRows } = await supabase
      .from('user_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_credits_purchased')
    const balancePurchased = Array.isArray(purchasedRows)
      ? purchasedRows.reduce((sum: number, r: { usage_count?: number }) => sum + (Number(r?.usage_count) || 0), 0)
      : 0
    const balanceMonthly = Number(balance)
    const totalBalance = balanceMonthly + balancePurchased

    const costByAction: Record<CreditActionId, number> = {
      foto: getCreditCost('foto', config),
      video: getCreditCost('video', config),
      roteiro: getCreditCost('roteiro', config),
      prompts: getCreditCost('prompts', config),
    }

    return NextResponse.json({
      balance: totalBalance,
      balanceMonthly,
      balancePurchased,
      periodStart,
      periodEnd,
      costByAction,
      config: config ?? undefined,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao buscar saldo' }, { status: 500 })
  }
}
