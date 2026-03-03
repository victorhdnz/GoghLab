import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isActionDay(daysSinceStart: number): boolean {
  return daysSinceStart === 7 || (daysSinceStart >= 10 && daysSinceStart <= 14) || daysSinceStart >= 18
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ notifications: [] })
    }

    const { data: campaigns, error } = await (supabase as any)
      .from('analytics_campaigns')
      .select('id, name, start_date')
      .eq('user_id', user.id)
      .not('start_date', 'is', null)

    if (error) {
      return NextResponse.json({ notifications: [], error: error.message })
    }

    const list = Array.isArray(campaigns) ? campaigns : []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const actionCampaigns: { id: string; name: string }[] = []
    for (const c of list) {
      const start = c.start_date ? new Date(c.start_date + 'T12:00:00') : null
      if (!start) continue
      start.setHours(0, 0, 0, 0)
      const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      if (daysSinceStart >= 0 && isActionDay(daysSinceStart)) {
        actionCampaigns.push({ id: c.id, name: c.name || 'Campanha' })
      }
    }

    const notifications: { id: string; variant: 'info' | 'warning'; title: string; description: string }[] = []
    if (actionCampaigns.length > 0) {
      notifications.push({
        id: `analytics-action-${today.toISOString().slice(0, 10)}`,
        variant: 'info',
        title: 'Atualizar dados da campanha',
        description:
          actionCampaigns.length === 1
            ? `Hoje é dia de preencher os dados no Analytics para a análise (${actionCampaigns[0].name}). Acesse a seção Campanhas.`
            : `Hoje é dia de preencher os dados no Analytics para ${actionCampaigns.length} campanhas. Acesse a seção Campanhas.`,
      })
    }

    return NextResponse.json({ notifications })
  } catch (e: any) {
    return NextResponse.json({ notifications: [], error: e?.message ?? 'Erro ao carregar notificações' })
  }
}
