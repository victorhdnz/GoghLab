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
    const amountOverride = typeof body?.amount === 'number' && body.amount > 0 ? Math.floor(body.amount) : undefined
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
    const cost = amountOverride ?? getCreditCost(actionId, config)

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
        .select('plan_id, plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      let planId = sub?.plan_id
      if (!planId && sub?.plan_type) {
        planId = sub.plan_type === 'premium' ? 'gogh_pro' : sub.plan_type === 'essential' ? 'gogh_essencial' : undefined
      }
      const monthly = getMonthlyCreditsForPlan(planId, config)
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

    const monthlyCount = Number(usageRow.usage_count)
    const { data: purchasedRows } = await (supabase as any)
      .from('user_usage')
      .select('id, usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_credits_purchased')
      .order('id', { ascending: true })
    const purchasedList = Array.isArray(purchasedRows) ? purchasedRows : []
    const purchasedTotal = purchasedList.reduce((s: number, r: { usage_count?: number }) => s + (Number(r?.usage_count) || 0), 0)
    const totalAvailable = monthlyCount + purchasedTotal
    if (totalAvailable < cost) {
      return NextResponse.json(
        { error: 'Créditos insuficientes', code: 'insufficient_credits', balance: totalAvailable, required: cost },
        { status: 402 }
      )
    }

    let remaining = cost
    const deductFromMonthly = Math.min(monthlyCount, remaining)
    const newMonthly = monthlyCount - deductFromMonthly
    remaining -= deductFromMonthly

    const { error: updateMonthlyErr } = await (supabase as any)
      .from('user_usage')
      .update({ usage_count: newMonthly, updated_at: new Date().toISOString() })
      .eq('id', usageRow.id)
    if (updateMonthlyErr) {
      return NextResponse.json({ error: updateMonthlyErr.message }, { status: 500 })
    }

    for (const row of purchasedList) {
      if (remaining <= 0) break
      const rowCount = Number(row.usage_count) || 0
      const take = Math.min(rowCount, remaining)
      if (take <= 0) continue
      const newRowCount = rowCount - take
      remaining -= take
      const { error: updateRowErr } = await (supabase as any)
        .from('user_usage')
        .update({ usage_count: newRowCount, updated_at: new Date().toISOString() })
        .eq('id', row.id)
      if (updateRowErr) {
        return NextResponse.json({ error: updateRowErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, balance: newMonthly + purchasedTotal - cost })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao deduzir créditos' }, { status: 500 })
  }
}
