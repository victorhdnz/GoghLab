import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
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
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: configRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle()
    const config = (configRow?.value as CreditsConfig) ?? null

    const { periodStart, periodEnd } = getMonthBounds()

    const { data: usageRow } = await (supabase as any)
      .from('user_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_credits')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle()

    let balance = usageRow?.usage_count ?? null

    if (balance === null) {
      const { data: sub } = await (supabase as any)
        .from('subscriptions')
        .select('plan_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const planId = sub?.plan_id
      const monthly = getMonthlyCreditsForPlan(planId, config)
      const { error: insertErr } = await (supabase as any)
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
    }

    const costByAction: Record<CreditActionId, number> = {
      foto: getCreditCost('foto', config),
      video: getCreditCost('video', config),
      roteiro: getCreditCost('roteiro', config),
      prompts: getCreditCost('prompts', config),
      vangogh: getCreditCost('vangogh', config),
    }

    return NextResponse.json({
      balance: Number(balance),
      periodStart,
      periodEnd,
      costByAction,
      config: config ?? undefined,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao buscar saldo' }, { status: 500 })
  }
}
