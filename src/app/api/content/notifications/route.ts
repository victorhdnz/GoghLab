import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

type ContentNotification = {
  id: string
  variant: 'info' | 'warning' | 'success'
  title: string
  description: string
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ notifications: [] })
    }

    const today = new Date()
    const plus2 = addDays(today, 2)
    const plus14 = addDays(today, 14)

    const start = formatDate(today)
    const end2 = formatDate(plus2)
    const end14 = formatDate(plus14)

    const { data: nearItemsRaw } = await (supabase
      .from('content_calendar_items') as any)
      .select('id, date, topic, meta')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end2)
      .order('date', { ascending: true })

    const { data: overdueItemsRaw } = await (supabase
      .from('content_calendar_items') as any)
      .select('id, date, meta')
      .eq('user_id', user.id)
      .lt('date', start)

    const { data: futureItems } = await (supabase
      .from('content_calendar_items') as any)
      .select('id')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end14)
      .limit(1)

    const notifications: ContentNotification[] = []

    const overdueList = Array.isArray(overdueItemsRaw) ? overdueItemsRaw : []
    const overdueCount = overdueList.filter((item: any) => item?.meta?.marked_done !== true).length
    if (overdueCount > 0) {
      notifications.push({
        id: 'content-overdue',
        variant: 'warning',
        title: 'Conteúdos em atraso',
        description:
          overdueCount === 1
            ? 'Você tem 1 conteúdo planejado que passou da data. Marque como feito na agenda ou grave quando puder.'
            : `Você tem ${overdueCount} conteúdos planejados que passaram da data. Marque como feito na agenda ou grave quando puder.`,
      })
    }

    const nearList = Array.isArray(nearItemsRaw) ? nearItemsRaw : []
    const nearItems = nearList.filter((item: any) => item?.meta?.marked_done !== true)
    if (nearItems.length > 0) {
      const grouped = nearItems.reduce<Record<string, number>>((acc, item) => {
        acc[item.date] = (acc[item.date] || 0) + 1
        return acc
      }, {})

      for (const [date, count] of Object.entries(grouped)) {
        notifications.push({
          id: `content-reminder-${date}`,
          variant: 'info',
          title: 'Lembrete de gravação',
          description:
            count > 1
              ? `Você tem ${count} conteúdos planejados para ${new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')}.`
              : `Você tem 1 conteúdo planejado para ${new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')}.`,
        })
      }
    }

    if (!futureItems || futureItems.length === 0) {
      const monthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      notifications.push({
        id: `content-empty-${monthId}`,
        variant: 'warning',
        title: 'Sua agenda está vazia',
        description: 'Você ainda não tem conteúdo planejado para os próximos dias. Crie sua agenda para não perder consistência.',
      })
    }

    return NextResponse.json({ notifications })
  } catch (e: any) {
    return NextResponse.json({ notifications: [], error: e?.message || 'Erro ao carregar notificações' })
  }
}

