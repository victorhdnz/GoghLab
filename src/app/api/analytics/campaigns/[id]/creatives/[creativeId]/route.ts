import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; creativeId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id: campaignId, creativeId } = await params
    if (!campaignId || !creativeId) return NextResponse.json({ error: 'id e creativeId são obrigatórios' }, { status: 400 })

    const { data: campaign } = await (supabase as any)
      .from('analytics_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string') updates.name = body.name.trim() || 'Criativo'
    if (body.alcance != null) updates.alcance = Number(body.alcance)
    if (body.impressoes != null) updates.impressoes = Number(body.impressoes)
    if (body.cliques_link != null) updates.cliques_link = Number(body.cliques_link)
    if (body.valor_investido != null) updates.valor_investido = Number(body.valor_investido)
    if (body.compras != null) updates.compras = Number(body.compras)
    if (body.valor_total_faturado != null) updates.valor_total_faturado = Number(body.valor_total_faturado)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data: creative, error } = await (supabase as any)
      .from('analytics_creatives')
      .update(updates)
      .eq('id', creativeId)
      .eq('campaign_id', campaignId)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ creative })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao atualizar criativo' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; creativeId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id: campaignId, creativeId } = await params
    if (!campaignId || !creativeId) return NextResponse.json({ error: 'id e creativeId são obrigatórios' }, { status: 400 })

    const { data: campaign } = await (supabase as any)
      .from('analytics_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    const { error } = await (supabase as any)
      .from('analytics_creatives')
      .delete()
      .eq('id', creativeId)
      .eq('campaign_id', campaignId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao excluir criativo' }, { status: 500 })
  }
}
