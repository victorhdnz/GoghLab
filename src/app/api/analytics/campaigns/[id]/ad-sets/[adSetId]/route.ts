import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; adSetId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id: campaignId, adSetId } = await params
    if (!campaignId || !adSetId) return NextResponse.json({ error: 'id e adSetId são obrigatórios' }, { status: 400 })

    const { data: campaign } = await (supabase as any)
      .from('analytics_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string') updates.name = body.name.trim() || 'Conjunto'
    if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data: adSet, error } = await (supabase as any)
      .from('analytics_ad_sets')
      .update(updates)
      .eq('id', adSetId)
      .eq('campaign_id', campaignId)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ adSet })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao atualizar conjunto' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; adSetId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id: campaignId, adSetId } = await params
    if (!campaignId || !adSetId) return NextResponse.json({ error: 'id e adSetId são obrigatórios' }, { status: 400 })

    const { data: campaign } = await (supabase as any)
      .from('analytics_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    const { error } = await (supabase as any)
      .from('analytics_ad_sets')
      .delete()
      .eq('id', adSetId)
      .eq('campaign_id', campaignId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao excluir conjunto' }, { status: 500 })
  }
}
