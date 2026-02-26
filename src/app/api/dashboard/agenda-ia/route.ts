import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
}

/**
 * GET - Lista usuários com resumo da agenda (meses que têm itens).
 * Se passar userId (e opcionalmente month=YYYY-MM), retorna os itens da agenda desse usuário.
 * Apenas admin/editor.
 */
export async function GET(request: Request) {
  try {
    const routeClient = createRouteHandlerClient()
    const { data: { user } } = await routeClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await routeClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string | null } | null }

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')

    const supabase = createSupabaseAdmin() as any

    if (userId) {
      let query = supabase
        .from('content_calendar_items')
        .select('id, date, time, platform, topic, status, meta')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .order('time', { ascending: true, nullsFirst: true })

      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const [y, m] = month.split('-').map(Number)
        const start = `${y}-${String(m).padStart(2, '0')}-01`
        const end = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
        query = query.gte('date', start).lte('date', end)
      }

      const { data: items, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ items: items ?? [] })
    }

    const { data: profilesRaw, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name', { ascending: true, nullsFirst: false })

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }
    const profiles = Array.isArray(profilesRaw) ? profilesRaw : []

    const { data: itemsRaw, error: itemsError } = await supabase
      .from('content_calendar_items')
      .select('user_id, date')

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
    const items = Array.isArray(itemsRaw) ? itemsRaw : []

    const byUser: Record<string, Record<string, number>> = {}
    for (const item of items) {
      const uid = item.user_id
      if (!uid) continue
      const date = (item.date || '').toString().trim()
      const match = date.match(/^(\d{4})-(\d{2})/)
      if (!match) continue
      const key = `${match[1]}-${match[2]}`
      if (!byUser[uid]) byUser[uid] = {}
      byUser[uid][key] = (byUser[uid][key] || 0) + 1
    }

    const users = profiles
      .map((p: { id: string; email: string | null; full_name: string | null }) => {
        const months = byUser[p.id]
          ? Object.entries(byUser[p.id])
              .map(([monthKeyStr, count]) => {
                const [, m] = monthKeyStr.split('-')
                const label = MONTH_LABELS[m] || m
                return { month: monthKeyStr, count, label: `${label} ${monthKeyStr.slice(0, 4)}` }
              })
              .sort((a, b) => a.month.localeCompare(b.month))
          : []
        return {
          id: p.id,
          email: p.email ?? null,
          full_name: p.full_name ?? null,
          months,
        }
      })
      .filter((u: { months: unknown[] }) => u.months.length > 0)

    return NextResponse.json({ users })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao carregar agendas' }, { status: 500 })
  }
}

/**
 * DELETE - Apaga toda a agenda de um usuário em um mês e libera o botão "Gerar agenda" para esse mês.
 * Body: { userId: string, month: string } (month = YYYY-MM).
 * Apenas admin/editor.
 */
export async function DELETE(request: Request) {
  try {
    const routeClient = createRouteHandlerClient()
    const { data: { user } } = await routeClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await routeClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string | null } | null }

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const userId = typeof body.userId === 'string' ? body.userId.trim() : null
    const month = typeof body.month === 'string' ? body.month.trim() : null

    if (!userId || !month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'userId e month (YYYY-MM) são obrigatórios' }, { status: 400 })
    }

    const [year, monthNum] = month.split('-').map(Number)
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const supabase = createSupabaseAdmin() as any

    const { error: deleteError } = await supabase
      .from('content_calendar_items')
      .delete()
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const { data: contentProfile, error: profileFetchError } = await supabase
      .from('content_profiles')
      .select('extra_preferences')
      .eq('user_id', userId)
      .maybeSingle()

    if (!profileFetchError && contentProfile?.extra_preferences) {
      const prefs = { ...(contentProfile.extra_preferences as Record<string, unknown>) }
      if (prefs.auto_plan_last_month === month) {
        prefs.auto_plan_last_month = null
        await supabase
          .from('content_profiles')
          .update({ extra_preferences: prefs })
          .eq('user_id', userId)
      }
    }

    return NextResponse.json({ ok: true, message: 'Agenda do mês apagada. O botão "Gerar agenda" será liberado para esse mês.' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao apagar agenda' }, { status: 500 })
  }
}
