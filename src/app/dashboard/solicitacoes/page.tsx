'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Search,
  Link as LinkIcon,
  Save,
  ExternalLink,
  AlertTriangle,
  Video,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface SupportTicket {
  id: string
  user_id: string
  ticket_type: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  tool_id?: string | null
  user?: {
    email: string
    full_name: string
  }
}

interface ToolFromDB {
  id: string
  name: string
  slug: string
  tutorial_video_url: string | null
}

interface ToolAccess {
  id: string
  user_id: string
  tool_id?: string | null
  tool_type: string
  email: string
  access_link?: string
  password?: string
  tutorial_video_url?: string
  access_granted_at: string
  is_active: boolean
  error_reported?: boolean
  error_message?: string
}

export default function SolicitacoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [toolAccess, setToolAccess] = useState<ToolAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Form state: um conjunto por ticket (ferramenta solicitada)
  const [accessLink, setAccessLink] = useState('')
  const [accessPassword, setAccessPassword] = useState('')
  const [toolsMap, setToolsMap] = useState<Record<string, ToolFromDB>>({})
  const loadingForRef = useRef<{ userId: string; toolId: string | null } | null>(null)

  // Função para validar URL do YouTube (suporta todos os formatos incluindo Shorts)
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null
    
    // Primeiro, verificar se é formato Shorts: youtube.com/shorts/VIDEO_ID
    const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([^#&?\/\s]{11})/)
    if (shortsMatch && shortsMatch[1]) {
      return shortsMatch[1]
    }
    
    // Depois, verificar outros formatos
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2] && match[2].length === 11) ? match[2] : null
  }
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    daysSinceStart: number | null
    canRelease: boolean
    daysRemaining: number | null
  } | null>(null)

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    if (selectedTicket) {
      setAccessLink('')
      setAccessPassword('')
      const userId = selectedTicket.user_id
      const toolId = selectedTicket.tool_id ?? null
      const slug = toolId ? toolsMap[toolId]?.slug : undefined
      loadingForRef.current = { userId, toolId }
      loadToolAccessForTicket(userId, toolId, slug)
      loadSubscriptionInfo(selectedTicket.user_id)
    } else {
      loadingForRef.current = null
      setSubscriptionInfo(null)
      setToolAccess([])
    }
  }, [selectedTicket, toolsMap])

  const loadSubscriptionInfo = async (userId: string) => {
    try {
      const { data: subscriptionData } = await (supabase as any)
        .from('subscriptions')
        .select('current_period_start, created_at, stripe_subscription_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subscriptionData) {
        // Para assinaturas Stripe, usar current_period_start
        // Para assinaturas manuais (sem stripe_subscription_id), usar current_period_start ou created_at
        const subscriptionStartDate = subscriptionData.current_period_start 
          ? new Date(subscriptionData.current_period_start)
          : subscriptionData.created_at 
            ? new Date(subscriptionData.created_at)
            : null

        if (subscriptionStartDate) {
          const now = new Date()
          const daysSinceStart = Math.floor((now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
          const canRelease = daysSinceStart >= 8
          const daysRemaining = canRelease ? 0 : 8 - daysSinceStart

          setSubscriptionInfo({
            daysSinceStart,
            canRelease,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
          })
        } else {
          setSubscriptionInfo({
            daysSinceStart: null,
            canRelease: false,
            daysRemaining: null
          })
        }
      } else {
        setSubscriptionInfo({
          daysSinceStart: null,
          canRelease: false,
          daysRemaining: null
        })
      }
    } catch (error) {
      console.error('Erro ao carregar informações da assinatura:', error)
      setSubscriptionInfo({
        daysSinceStart: null,
        canRelease: false,
        daysRemaining: null
      })
    }
  }

  const loadTickets = async (): Promise<SupportTicket[]> => {
    setLoading(true)
    try {
      const { data: ticketsData, error: ticketsError } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('ticket_type', 'tools_access')
        .order('created_at', { ascending: false })

      if (ticketsError) throw ticketsError

      if (ticketsData && ticketsData.length > 0) {
        const userIds = [...new Set(ticketsData.map((t: any) => t.user_id))]
        const toolIds = [...new Set(ticketsData.map((t: any) => t.tool_id).filter(Boolean))]
        const { data: profilesData } = await (supabase as any)
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)
        let toolsMapNext: Record<string, ToolFromDB> = {}
        if (toolIds.length > 0) {
          const { data: toolsData } = await (supabase as any)
            .from('tools')
            .select('id, name, slug, tutorial_video_url')
            .in('id', toolIds)
          if (toolsData) {
            toolsData.forEach((t: ToolFromDB) => { toolsMapNext[t.id] = t })
          }
        }
        setToolsMap(toolsMapNext)
        const ticketsWithUsers: SupportTicket[] = ticketsData.map((ticket: any) => ({
          ...ticket,
          user: profilesData?.find((p: any) => p.id === ticket.user_id) || null
        }))
        setTickets(ticketsWithUsers)
        return ticketsWithUsers
      }
      setTickets([])
      return []
    } catch (error: any) {
      console.error('Erro ao carregar tickets:', error)
      toast.error('Erro ao carregar solicitações')
      return []
    } finally {
      setLoading(false)
    }
  }

  const loadToolAccessForTicket = async (userId: string, toolId: string | null, slug?: string) => {
    try {
      if (!toolId) {
        const stillCurrent = loadingForRef.current && loadingForRef.current.userId === userId && loadingForRef.current.toolId === null
        if (stillCurrent) {
          setToolAccess([])
          setAccessLink('')
          setAccessPassword('')
        }
        return
      }
      let query = (supabase as any).from('tool_access_credentials').select('*').eq('user_id', userId)
      if (slug) {
        query = query.or(`tool_id.eq.${toolId},tool_type.eq.${slug}`)
      } else {
        query = query.eq('tool_id', toolId)
      }
      const { data, error } = await query

      if (error) throw error
      const list = data || []
      const existing = list.find((r: any) => r.tool_id === toolId) || list[0]
      const stillCurrent = loadingForRef.current?.userId === userId && loadingForRef.current?.toolId === toolId
      if (stillCurrent) {
        setToolAccess(list)
        if (existing) {
          setAccessLink(existing.access_link || '')
          setAccessPassword(existing.password || '')
        } else {
          setAccessLink('')
          setAccessPassword('')
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar acessos:', error)
      const stillCurrent = loadingForRef.current?.userId === userId && loadingForRef.current?.toolId === toolId
      if (stillCurrent) {
        setToolAccess([])
        setAccessLink('')
        setAccessPassword('')
      }
    }
  }


  const saveLinks = async () => {
    if (!selectedTicket) return
    if (!selectedTicket.tool_id) {
      toast.error('Esta solicitação é antiga e não está vinculada a uma ferramenta. Peça ao cliente para solicitar novamente pela página de ferramentas.')
      return
    }
    const tool = toolsMap[selectedTicket.tool_id]
    if (!tool) {
      toast.error('Ferramenta não encontrada. Recarregue a página.')
      return
    }
    if (!accessLink.trim()) {
      toast.error('Preencha o link ou credencial de acesso.')
      return
    }

    let linkValue = accessLink.trim()
    if (linkValue && !/^https?:\/\//i.test(linkValue) && /\./.test(linkValue)) {
      linkValue = 'https://' + linkValue
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: subscriptionData } = await (supabase as any)
        .from('subscriptions')
        .select('current_period_start, created_at')
        .eq('user_id', selectedTicket.user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subscriptionData) {
        const subscriptionStartDate = subscriptionData.current_period_start
          ? new Date(subscriptionData.current_period_start)
          : subscriptionData.created_at ? new Date(subscriptionData.created_at) : null
        if (subscriptionStartDate) {
          const now = new Date()
          const daysSinceStart = Math.floor((now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysSinceStart < 8) {
            const daysRemaining = 8 - daysSinceStart
            toast.error(`Não é possível liberar o acesso ainda. O cliente precisa aguardar ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para completar o período de arrependimento (CDC).`)
            setSaving(false)
            return
          }
        }
      }

      const nowIso = new Date().toISOString()
      const payload: any = {
        user_id: selectedTicket.user_id,
        tool_id: selectedTicket.tool_id,
        tool_type: tool.slug,
        email: selectedTicket.user?.email || 'noreply@example.com',
        access_link: linkValue,
        tutorial_video_url: tool.tutorial_video_url || null,
        access_granted_at: nowIso,
        is_active: true,
        error_reported: false,
        error_message: null,
        updated_at: nowIso,
      }
      if (accessPassword.trim()) payload.password = accessPassword.trim()

      const { error } = await (supabase as any)
        .from('tool_access_credentials')
        .upsert(payload, { onConflict: 'user_id,tool_type' })
      if (error) throw error

      if (selectedTicket.status === 'open') {
        await updateTicketStatus(selectedTicket.id, 'resolved')
      }

      toast.success('Acesso salvo com sucesso! O cliente já pode ver o link/credenciais na página de ferramentas.')
      loadingForRef.current = { userId: selectedTicket.user_id, toolId: selectedTicket.tool_id ?? null }
      await loadToolAccessForTicket(selectedTicket.user_id, selectedTicket.tool_id ?? null, tool.slug)
      const currentSelectedId = selectedTicket.id
      const updatedList = await loadTickets()
      const reloaded = updatedList.find(t => t.id === currentSelectedId)
      if (reloaded) setSelectedTicket(reloaded)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error(error?.message || 'Erro ao salvar links')
    } finally {
      setSaving(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      // Verificar autenticação e permissões antes de atualizar
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Erro de autenticação:', authError)
        toast.error('Erro de autenticação. Faça login novamente.')
        return false
      }

      // Verificar se o usuário é admin ou editor
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Erro ao verificar permissões:', profileError)
        toast.error('Erro ao verificar permissões')
        return false
      }

      if (profile.role !== 'admin' && profile.role !== 'editor') {
        toast.error('Apenas administradores podem atualizar tickets')
        return false
      }

      // Atualizar e verificar se foi bem-sucedido
      const { data, error } = await (supabase as any)
        .from('support_tickets')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()

      if (error) {
        console.error('Erro ao atualizar status:', error)
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
        toast.error(`Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`)
        return false
      }

      // Verificar se realmente atualizou
      if (!data || data.length === 0) {
        console.error('Nenhum ticket foi atualizado')
        console.error('Ticket ID:', ticketId)
        console.error('Status desejado:', status)
        console.error('User ID:', user.id)
        console.error('Profile role:', profile.role)
        toast.error('Erro ao atualizar status: ticket não encontrado ou sem permissão. Verifique as políticas RLS no Supabase.')
        return false
      }

      const updatedTicket = data[0]

      // Atualizar o ticket na lista local imediatamente
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: updatedTicket.status, updated_at: updatedTicket.updated_at } : t
      ))

      // Se houver um ticket selecionado, atualizar também
      if (selectedTicket && selectedTicket.id === ticketId) {
        // Buscar perfil do usuário para manter os dados completos
        const { data: userProfile } = await (supabase as any)
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', updatedTicket.user_id)
          .single()
        
        setSelectedTicket({
          ...updatedTicket,
          user: userProfile || selectedTicket.user
        })
      }

      toast.success('Status atualizado com sucesso!')
      
      return true
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error(`Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`)
      return false
    }
  }


  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Clock className="w-3 h-3" /> Aberto</span>
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Em Andamento</span>
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Resolvido</span>
      case 'closed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="w-3 h-3" /> Fechado</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solicitações de Ferramentas
          </h1>
          <p className="text-gray-600">
            Gerencie solicitações de acesso às ferramentas. Cada ticket é da ferramenta que o cliente solicitou.
          </p>
        </div>

        {/* Nota: vídeos de tutorial configurados em Gerenciar Ferramentas */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                Os vídeos de tutorial são configurados em <strong>Gerenciar Ferramentas</strong> para cada ferramenta. Ao salvar o acesso aqui, o link do tutorial da ferramenta será usado automaticamente para o cliente.
              </p>
              <Link
                href="/dashboard/ferramentas"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 mt-2"
              >
                Ir para Gerenciar Ferramentas
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>

            {/* Tickets */}
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Carregando...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma solicitação encontrada</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`
                      p-4 border-b border-gray-200 cursor-pointer transition-colors
                      ${selectedTicket?.id === ticket.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {ticket.user?.full_name || ticket.user?.email || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {ticket.tool_id && toolsMap[ticket.tool_id] ? toolsMap[ticket.tool_id].name : 'Ferramenta'}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ticket.subject}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Links Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            {selectedTicket ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedTicket.user?.full_name || selectedTicket.user?.email || 'Usuário'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedTicket.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Aberto</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="resolved">Resolvido</option>
                        <option value="closed">Fechado</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{selectedTicket.subject}</p>
                </div>

                {/* Links Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Informações da Assinatura - Período de 8 dias (oitavo dia) */}
                  {subscriptionInfo && (
                    <div className={`rounded-lg p-4 border ${
                      subscriptionInfo.canRelease
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {subscriptionInfo.canRelease ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className={`font-medium mb-1 ${
                            subscriptionInfo.canRelease ? 'text-emerald-800' : 'text-blue-800'
                          }`}>
                            {subscriptionInfo.canRelease 
                              ? '✅ Pode Liberar Acesso' 
                              : '⏳ Aguardando Oitavo Dia'}
                          </h4>
                          {subscriptionInfo.daysSinceStart !== null ? (
                            <>
                              <p className={`text-sm mb-2 ${
                                subscriptionInfo.canRelease ? 'text-emerald-700' : 'text-blue-700'
                              }`}>
                                Cliente está com a assinatura ativa há <strong>{subscriptionInfo.daysSinceStart} dia{subscriptionInfo.daysSinceStart !== 1 ? 's' : ''}</strong>.
                              </p>
                              {!subscriptionInfo.canRelease && subscriptionInfo.daysRemaining !== null && (
                                <p className="text-sm font-medium text-blue-800">
                                  ⚠️ Faltam <strong>{subscriptionInfo.daysRemaining} dia{subscriptionInfo.daysRemaining !== 1 ? 's' : ''}</strong> para completar o período de arrependimento de 7 dias (CDC). O acesso será liberado no <strong>oitavo dia</strong>.
                                </p>
                              )}
                              {subscriptionInfo.canRelease && (
                                <p className="text-sm text-emerald-700">
                                  ✓ Período de arrependimento concluído. Você pode liberar o acesso às ferramentas. O cliente terá 30 dias de uso.
                                </p>
                              )}
                            </>
                          ) : (
                            <p className={`text-sm ${
                              subscriptionInfo.canRelease ? 'text-emerald-700' : 'text-blue-700'
                            }`}>
                              Não foi possível verificar o período da assinatura. Verifique manualmente antes de liberar.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ticket sem tool_id (solicitação antiga) */}
                  {selectedTicket.tool_id && !toolsMap[selectedTicket.tool_id] && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">Ferramenta não encontrada. Recarregue a página.</p>
                    </div>
                  )}

                  {selectedTicket.tool_id && toolsMap[selectedTicket.tool_id] && (
                    <>
                      {/* Alerta de Erro Reportado (desta ferramenta) */}
                      {toolAccess.some(t => t.error_reported) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-amber-800 mb-1">
                                Erro Reportado - {toolsMap[selectedTicket.tool_id].name}
                              </h4>
                              <p className="text-sm text-amber-700 mb-2">
                                {toolAccess.find(t => t.error_reported)?.error_message || 'Cliente reportou problema com o link/credenciais'}
                              </p>
                              <p className="text-xs text-amber-600">Atualize os campos abaixo para resolver.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Formulário: link/credenciais para esta ferramenta */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Link ou Email/Usuário - {toolsMap[selectedTicket.tool_id].name}
                          </div>
                        </label>
                        <input
                          type="text"
                          value={accessLink}
                          onChange={(e) => setAccessLink(e.target.value)}
                          placeholder="https://... ou email/usuário para login"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Cole o link de ativação ou o email/usuário de login para este cliente
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Senha (opcional)</label>
                        <input
                          type="text"
                          value={accessPassword}
                          onChange={(e) => setAccessPassword(e.target.value)}
                          placeholder="Senha de acesso, se aplicável"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {toolsMap[selectedTicket.tool_id].tutorial_video_url && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <Video className="w-4 h-4 inline mr-1" />
                            Vídeo tutorial desta ferramenta será enviado automaticamente ao cliente (configurado em Gerenciar Ferramentas).
                          </p>
                        </div>
                      )}

                      {/* Status */}
                      {toolAccess.length > 0 && toolAccess[0].access_link && (
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between text-sm">
                          <span className="text-gray-600">{toolsMap[selectedTicket.tool_id].name}:</span>
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Link/credenciais enviados
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {!selectedTicket.tool_id && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        Esta solicitação é antiga e não está vinculada a uma ferramenta. Peça ao cliente para solicitar novamente pela página de ferramentas.
                      </p>
                      <Link href="/dashboard/ferramentas" className="text-sm font-medium text-blue-600 hover:underline mt-2 inline-block">
                        Gerenciar Ferramentas
                      </Link>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={saveLinks}
                    disabled={saving || !selectedTicket.tool_id || !toolsMap[selectedTicket.tool_id] || !accessLink.trim()}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Links
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Os links serão enviados imediatamente para o cliente na página de ferramentas
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione uma solicitação para enviar os links</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
