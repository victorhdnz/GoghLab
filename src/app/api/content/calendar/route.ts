import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/content/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
 *      → lista itens do calendário do usuário logado nesse intervalo (ou todos se não passar datas).
 *
 * POST /api/content/calendar
 *      body: { date: string; time?: string; platform?: string; topic?: string }
 *      → cria um novo item de calendário "planned".
 *
 * PUT  /api/content/calendar
 *      body: { id: string; ...camposParaAtualizar }
 *      → atualiza um item existente do usuário.
 */

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    let query = supabase
      .from('content_calendar_items')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: true }) as any

    if (start) query = query.gte('date', start)
    if (end) query = query.lte('date', end)

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao carregar calendário' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const date = typeof body.date === 'string' ? body.date : null
    if (!date) {
      return NextResponse.json({ error: 'date é obrigatório (YYYY-MM-DD)' }, { status: 400 })
    }

    const payload: any = {
      user_id: user.id,
      date,
      time: body.time ?? null,
      platform: body.platform ?? null,
      topic: body.topic ?? null,
      status: body.status ?? 'planned',
      script: body.script ?? null,
      caption: body.caption ?? null,
      hashtags: body.hashtags ?? null,
      cover_prompt: body.cover_prompt ?? null,
      meta: body.meta ?? null,
    }

    const { data, error } = await supabase
      .from('content_calendar_items')
      .insert(payload)
      .select('*')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao criar item no calendário' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const id = typeof body.id === 'string' ? body.id : null
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    const updates: any = {}
    const updatableFields = [
      'date',
      'time',
      'platform',
      'topic',
      'status',
      'script',
      'caption',
      'hashtags',
      'cover_prompt',
      'meta',
    ] as const

    for (const field of updatableFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('content_calendar_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao atualizar item do calendário' }, { status: 500 })
  }
}

