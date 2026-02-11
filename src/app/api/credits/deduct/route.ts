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

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const actionId = body?.actionId as CreditActionId | undefined
    const validActions: CreditActionId[] = ['foto', 'video', 'roteiro', 'vangogh']
    if (!actionId || !validActions.includes(actionId)) {
      return NextResponse.json({ error: 'actionId inválido' }, { status: 400 })
    }

    const { data: configRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle() as { data: { value: unknown } | null }
    const config = (configRow?.value as CreditsConfig) ?? null
    const cost = getCreditCost(actionId, config)

    const { periodStart, periodEnd } = getMonthBounds()

    let { data: usageRow } = await (supabase as any)
      .from('user_usage')
      .select('id, usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_credits')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle()

    if (!usageRow) {
      const { data: sub } = await (supabase as any)
        .from('subscriptions')
        .select('plan_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const monthly = getMonthlyCreditsForPlan(sub?.plan_id, config)
      const { data: inserted, error: insertErr } = await (supabase as any)
        .from('user_usage')
        .insert({
          user_id: user.id,
          feature_key: 'ai_credits',
          usage_count: monthly,
          period_start: periodStart,
          period_end: periodEnd,
        })
        .select('id, usage_count')
        .single()
      if (insertErr || !inserted) {
        return NextResponse.json({ error: insertErr?.message ?? 'Erro ao criar período' }, { status: 500 })
      }
      usageRow = inserted
    }

    const current = Number(usageRow.usage_count)
    if (current < cost) {
      return NextResponse.json(
        { error: 'Créditos insuficientes', code: 'insufficient_credits', balance: current, required: cost },
        { status: 402 }
      )
    }

    const newBalance = current - cost
    const { error: updateErr } = await (supabase as any)
      .from('user_usage')
      .update({ usage_count: newBalance, updated_at: new Date().toISOString() })
      .eq('id', usageRow.id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, balance: newBalance })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao deduzir créditos' }, { status: 500 })
  }
}
