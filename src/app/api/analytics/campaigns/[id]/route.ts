import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (typeof body.start_date === 'string') updates.start_date = body.start_date
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
    if (body.valor_venda != null) updates.valor_venda = Number(body.valor_venda)
    if (body.custo_venda != null) updates.custo_venda = Number(body.custo_venda)
    if (body.custo_por_aquisicao != null) updates.custo_por_aquisicao = Number(body.custo_por_aquisicao)
    if (typeof body.roi_enabled === 'boolean') updates.roi_enabled = body.roi_enabled
    if (body.alcance != null) updates.alcance = Number(body.alcance)
    if (body.impressoes != null) updates.impressoes = Number(body.impressoes)
    if (body.cliques_link != null) updates.cliques_link = Number(body.cliques_link)
    if (body.valor_investido != null) updates.valor_investido = Number(body.valor_investido)
    if (body.compras != null) updates.compras = Number(body.compras)
    if (body.valor_total_faturado != null) updates.valor_total_faturado = Number(body.valor_total_faturado)
    if (body.meta_lucro_por_venda != null) updates.meta_lucro_por_venda = Number(body.meta_lucro_por_venda)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from('analytics_campaigns')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaign: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao atualizar campanha' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

    const { error } = await (supabase as any)
      .from('analytics_campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao excluir campanha' }, { status: 500 })
  }
}
