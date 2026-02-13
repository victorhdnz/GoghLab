'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, Wrench, AlertCircle, Users, Check, ChevronRight } from 'lucide-react'

const SITE_SETTINGS_KEY_READ_AT = 'admin_notifications_read_at'

export interface NotificationCounts {
  solicitacoes: number
  reportes: number
  novosMembros: number
  readAt: string | null
}

function getTotal(counts: NotificationCounts): number {
  return counts.solicitacoes + counts.reportes + counts.novosMembros
}

export function DashboardNotificationBell() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<NotificationCounts>({
    solicitacoes: 0,
    reportes: 0,
    novosMembros: 0,
    readAt: null,
  })
  const [markingRead, setMarkingRead] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchCounts = async () => {
    try {
      const { data: readAtData } = await (supabase as any)
        .from('site_settings')
        .select('value')
        .eq('key', SITE_SETTINGS_KEY_READ_AT)
        .maybeSingle()
      const raw = readAtData?.value
      const readAt: string | null = typeof raw === 'string' ? raw : (raw != null ? String(raw) : null)

      const since = readAt || '1970-01-01T00:00:00.000Z'

      const [ticketsRes, reportesRes, profilesRes] = await Promise.all([
        (supabase as any)
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_type', 'tools_access')
          .in('status', ['open', 'in_progress', 'waiting_response'])
          .gt('created_at', since),
        (supabase as any)
          .from('tool_access_credentials')
          .select('*', { count: 'exact', head: true })
          .eq('error_reported', true)
          .gt('updated_at', since),
        (supabase as any)
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('created_at', since),
      ])

      const solicitacoes = typeof (ticketsRes as any)?.count === 'number' ? (ticketsRes as any).count : 0
      const reportes = typeof (reportesRes as any)?.count === 'number' ? (reportesRes as any).count : 0
      const novosMembros = typeof (profilesRes as any)?.count === 'number' ? (profilesRes as any).count : 0

      setCounts({
        solicitacoes,
        reportes,
        novosMembros,
        readAt,
      })
    } catch (e) {
      console.error('Erro ao carregar notificações:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
    const t = setInterval(fetchCounts, 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [open])

  const markAllAsRead = async () => {
    setMarkingRead(true)
    const now = new Date().toISOString()
    const row = {
      key: SITE_SETTINGS_KEY_READ_AT,
      value: now,
      description: 'Última vez que o admin marcou notificações como lidas',
      updated_at: now,
    }
    try {
      const { data: existing } = await (supabase as any)
        .from('site_settings')
        .select('key')
        .eq('key', SITE_SETTINGS_KEY_READ_AT)
        .maybeSingle()

      if (existing) {
        const { error: updateError } = await (supabase as any)
          .from('site_settings')
          .update({ value: row.value, description: row.description, updated_at: row.updated_at })
          .eq('key', SITE_SETTINGS_KEY_READ_AT)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await (supabase as any)
          .from('site_settings')
          .insert({ key: row.key, value: row.value, description: row.description, updated_at: row.updated_at })
        if (insertError) throw insertError
      }
      await fetchCounts()
      setOpen(false)
    } catch (e) {
      console.error('Erro ao marcar como lidas:', e)
    } finally {
      setMarkingRead(false)
    }
  }

  const goTo = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  const total = getTotal(counts)

  return (
    <div className="fixed top-4 right-4 z-50" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Notificações"
      >
        <Bell size={22} className="text-gray-700" />
        {!loading && total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white px-1">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Notificações</span>
            {total > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
              >
                <Check size={14} />
                {markingRead ? 'Salvando...' : 'Marcar todas como lidas'}
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Carregando...</div>
            ) : total === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Nenhuma notificação nova. Quando houver solicitações de ferramentas, reportes ou novos membros, elas aparecerão aqui.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {counts.solicitacoes > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/solicitacoes')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <Wrench size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {counts.solicitacoes} solicitações de ferramentas
                        </p>
                        <p className="text-xs text-gray-500">Clique para abrir</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 shrink-0" />
                    </button>
                  </li>
                )}
                {counts.reportes > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/solicitacoes')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                        <AlertCircle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {counts.reportes} reportes de problemas
                        </p>
                        <p className="text-xs text-gray-500">Clique para abrir</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 shrink-0" />
                    </button>
                  </li>
                )}
                {counts.novosMembros > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/membros')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Users size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {counts.novosMembros} novo(s) membro(s)
                        </p>
                        <p className="text-xs text-gray-500">Clique para ver membros</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 shrink-0" />
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
