'use client'

import { useState, useEffect } from 'react'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { CalendarDays, Eye, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type MonthSummary = { month: string; count: number; label: string }

type UserAgenda = {
  id: string
  email: string | null
  full_name: string | null
  months: MonthSummary[]
}

type AgendaItem = {
  id: string
  date: string
  time: string | null
  platform: string | null
  topic: string | null
  status: string
  meta: { marked_done?: boolean; [key: string]: unknown } | null
}

export default function AgendaIAPage() {
  const [users, setUsers] = useState<UserAgenda[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [viewingMonth, setViewingMonth] = useState<string | null>(null)
  const [viewItems, setViewItems] = useState<AgendaItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/agenda-ia', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao carregar agendas')
        setUsers([])
        return
      }
      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar agendas')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const openViewAgenda = async (userId: string, month: string) => {
    setViewingUserId(userId)
    setViewingMonth(month)
    setViewItems([])
    setLoadingItems(true)
    try {
      const res = await fetch(
        `/api/dashboard/agenda-ia?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(month)}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar itens')
      setViewItems(Array.isArray(data.items) ? data.items : [])
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar itens')
      setViewItems([])
    } finally {
      setLoadingItems(false)
    }
  }

  const closeViewAgenda = () => {
    setViewingUserId(null)
    setViewingMonth(null)
    setViewItems([])
  }

  const handleDeleteMonth = async (userId: string, month: string, label: string) => {
    if (!confirm(`Apagar toda a agenda de ${label} deste usuário? O botão "Gerar agenda" será liberado para esse mês.`)) return
    setDeleting(`${userId}-${month}`)
    try {
      const res = await fetch('/api/dashboard/agenda-ia', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, month }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao apagar')
      toast.success('Agenda do mês apagada. O usuário poderá gerar a agenda novamente para esse mês.')
      if (viewingUserId === userId && viewingMonth === month) closeViewAgenda()
      loadUsers()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao apagar agenda')
    } finally {
      setDeleting(null)
    }
  }

  const displayName = (u: UserAgenda) => u.full_name?.trim() || u.email || u.id.slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <DashboardNavigation
          title="Agenda IA"
          backUrl="/dashboard"
          subtitle="Visualize a agenda de conteúdo dos usuários e apague por mês para liberar nova geração"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum usuário com agenda encontrado.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-gray-900">{displayName(u)}</p>
                      {u.email && <p className="text-xs text-gray-500">{u.email}</p>}
                    </div>
                  </div>
                  <div className="p-4">
                    {u.months.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum mês com conteúdo.</p>
                    ) : (
                      <ul className="space-y-2">
                        {u.months.map((m) => (
                          <li
                            key={m.month}
                            className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {m.label} — {m.count} vídeo{m.count !== 1 ? 's' : ''}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openViewAgenda(u.id, m.month)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Ver agenda
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteMonth(u.id, m.month, m.label)}
                                disabled={deleting === `${u.id}-${m.month}`}
                                className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                {deleting === `${u.id}-${m.month}` ? 'Apagando...' : 'Apagar este mês'}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Ver agenda */}
      {(viewingUserId !== null && viewingMonth !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeViewAgenda}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Itens da agenda {viewingMonth ? `— ${viewingMonth.slice(0, 4)}/${viewingMonth.slice(5)}` : ''}
              </h3>
              <button
                type="button"
                onClick={closeViewAgenda}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {loadingItems ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : viewItems.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum item neste período.</p>
              ) : (
                <ul className="space-y-3">
                  {viewItems.map((item) => (
                    <li key={item.id} className="text-sm border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                      <p className="font-medium text-gray-900">{item.topic || 'Sem tema'}</p>
                      <p className="text-gray-500 mt-0.5">
                        {item.date}
                        {item.time ? ` · ${String(item.time).slice(0, 5)}` : ''}
                        {item.platform ? ` · ${item.platform}` : ''}
                      </p>
                      {item.meta?.marked_done && (
                        <span className="inline-block mt-1 text-xs text-emerald-600">Marcado como feito</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
