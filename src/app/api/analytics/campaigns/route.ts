import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data, error } = await (supabase as any)
      .from('analytics_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaigns: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao listar campanhas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : null
    if (!name) return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })

    const startDate = typeof body.start_date === 'string' ? body.start_date : new Date().toISOString().split('T')[0]
    const payload = {
      user_id: user.id,
      name,
      start_date: startDate,
      is_active: body.is_active !== false,
      valor_venda: body.valor_venda != null ? Number(body.valor_venda) : null,
      custo_venda: body.custo_venda != null ? Number(body.custo_venda) : null,
      custo_por_aquisicao: body.custo_por_aquisicao != null ? Number(body.custo_por_aquisicao) : null,
      roi_enabled: Boolean(body.roi_enabled),
    }

    const { data, error } = await (supabase as any).from('analytics_campaigns').insert(payload).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaign: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao criar campanha' }, { status: 500 })
  }
}
