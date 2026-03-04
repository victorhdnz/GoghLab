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
      .from('analytics_ad_sets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ adSets: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao listar conjuntos' }, { status: 500 })
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
      .select('id, budget_type_meta')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    if (campaign.budget_type_meta !== 'abo') {
      return NextResponse.json({ error: 'Conjuntos de anúncios só existem em campanhas ABO' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() || 'Conjunto' : 'Conjunto'

    const { data: existing } = await (supabase as any)
      .from('analytics_ad_sets')
      .select('sort_order')
      .eq('campaign_id', campaignId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = existing?.sort_order != null ? Number(existing.sort_order) + 1 : 0

    const { data: adSet, error } = await (supabase as any)
      .from('analytics_ad_sets')
      .insert({ campaign_id: campaignId, name, sort_order: sortOrder })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ adSet })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao criar conjunto' }, { status: 500 })
  }
}
