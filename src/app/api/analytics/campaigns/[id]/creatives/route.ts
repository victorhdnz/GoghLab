import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id: campaignId } = await params
    if (!campaignId) return NextResponse.json({ error: 'id da campanha é obrigatório' }, { status: 400 })

    const { data: campaign } = await (supabase as any)
      .from('analytics_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    const { data, error } = await (supabase as any)
      .from('analytics_creatives')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ creatives: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao listar criativos' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id: campaignId } = await params
    if (!campaignId) return NextResponse.json({ error: 'id da campanha é obrigatório' }, { status: 400 })

    const { data: campaign } = await (supabase as any)
      .from('analytics_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() || 'Criativo' : 'Criativo'

    const payload: Record<string, unknown> = {
      campaign_id: campaignId,
      name,
    }
    if (body.alcance != null) payload.alcance = Number(body.alcance)
    if (body.impressoes != null) payload.impressoes = Number(body.impressoes)
    if (body.cliques_link != null) payload.cliques_link = Number(body.cliques_link)
    if (body.valor_investido != null) payload.valor_investido = Number(body.valor_investido)
    if (body.compras != null) payload.compras = Number(body.compras)
    if (body.valor_total_faturado != null) payload.valor_total_faturado = Number(body.valor_total_faturado)

    const { data: creative, error } = await (supabase as any)
      .from('analytics_creatives')
      .insert(payload)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ creative })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao criar criativo' }, { status: 500 })
  }
}
