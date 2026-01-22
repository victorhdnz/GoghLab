'use client'

import { useState, useEffect } from 'react'
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
  user?: {
    email: string
    full_name: string
  }
}

interface ToolAccess {
  id: string
  user_id: string
  tool_type: 'canva' | 'capcut'
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
  
  // Form states para links
  const [canvaLink, setCanvaLink] = useState('')
  const [capcutEmail, setCapcutEmail] = useState('')
  const [capcutPassword, setCapcutPassword] = useState('')
  const [canvaTutorialVideoUrl, setCanvaTutorialVideoUrl] = useState<string | null>(null)
  const [capcutTutorialVideoUrl, setCapcutTutorialVideoUrl] = useState<string | null>(null)

  // Função para validar URL do YouTube (suporta todos os formatos)
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null
    // Regex mais completa que funciona com todos os formatos
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
      loadToolAccess(selectedTicket.user_id)
      loadSubscriptionInfo(selectedTicket.user_id)
    } else {
      setSubscriptionInfo(null)
    }
  }, [selectedTicket])

  const loadSubscriptionInfo = async (userId: string) => {
    try {
      const { data: subscriptionData } = await (supabase as any)
        .from('subscriptions')
        .select('current_period_start, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subscriptionData) {
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

  const loadTickets = async () => {
    setLoading(true)
    try {
      // Buscar tickets primeiro
      const { data: ticketsData, error: ticketsError } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('ticket_type', 'tools_access')
        .order('created_at', { ascending: false })

      if (ticketsError) throw ticketsError

      // Buscar perfis dos usuários separadamente
      if (ticketsData && ticketsData.length > 0) {
        const userIds = [...new Set(ticketsData.map((t: any) => t.user_id))]
        const { data: profilesData } = await (supabase as any)
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)

        // Combinar dados
        const ticketsWithUsers = ticketsData.map((ticket: any) => ({
          ...ticket,
          user: profilesData?.find((p: any) => p.id === ticket.user_id) || null
        }))

        setTickets(ticketsWithUsers)
      } else {
        setTickets([])
      }
    } catch (error: any) {
      console.error('Erro ao carregar tickets:', error)
      toast.error('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }

  const loadToolAccess = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('tool_access_credentials')
        .select('*')
        .eq('user_id', userId)
        .in('tool_type', ['canva', 'capcut'])

      if (error) throw error
      
      setToolAccess(data || [])
      
      // Preencher campos com links existentes
      const canvaAccess = data?.find((t: ToolAccess) => t.tool_type === 'canva')
      const capcutAccess = data?.find((t: ToolAccess) => t.tool_type === 'capcut')
      
      setCanvaLink(canvaAccess?.access_link || '')
      // Para CapCut, access_link contém o email/usuário e precisamos buscar a senha separadamente
      setCapcutEmail(capcutAccess?.access_link || capcutAccess?.email || '')
      setCapcutPassword(capcutAccess?.password || '')
      
      // Buscar vídeos tutorial separadamente
      setCanvaTutorialVideoUrl(canvaAccess?.tutorial_video_url || null)
      setCapcutTutorialVideoUrl(capcutAccess?.tutorial_video_url || null)
    } catch (error: any) {
      console.error('Erro ao carregar acessos:', error)
    }
  }


  const saveLinks = async () => {
    if (!selectedTicket) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Verificar se já passaram 8 dias desde o início da assinatura (oitavo dia)
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
          : subscriptionData.created_at 
            ? new Date(subscriptionData.created_at)
            : null

        if (subscriptionStartDate) {
          const now = new Date()
          const daysSinceStart = Math.floor((now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysSinceStart < 8) {
            const daysRemaining = 8 - daysSinceStart
            toast.error(
              `Não é possível liberar o acesso ainda. O cliente precisa aguardar ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para completar o período de arrependimento de 7 dias conforme o CDC. O acesso será liberado no oitavo dia.`
            )
            setSaving(false)
            return
          }
        }
      }

      // Validar URLs do YouTube
      let canvaVideoUrl = canvaTutorialVideoUrl
      if (canvaVideoUrl && !getYouTubeId(canvaVideoUrl)) {
        toast.error('URL do vídeo tutorial do Canva deve ser do YouTube')
        setSaving(false)
        return
      }

      let capcutVideoUrl = capcutTutorialVideoUrl
      if (capcutVideoUrl && !getYouTubeId(capcutVideoUrl)) {
        toast.error('URL do vídeo tutorial do CapCut deve ser do YouTube')
        setSaving(false)
        return
      }

      // Salvar/atualizar link do Canva
      if (canvaLink.trim()) {
        const canvaAccess = toolAccess.find(t => t.tool_type === 'canva')
        
        if (canvaAccess) {
          // Atualizar existente
          const { data, error } = await (supabase as any)
            .from('tool_access_credentials')
            .update({
              access_link: canvaLink.trim(),
              email: selectedTicket.user?.email || 'noreply@example.com',
              tutorial_video_url: canvaVideoUrl, // Vídeo específico do Canva
              updated_at: new Date().toISOString()
            })
            .eq('id', canvaAccess.id)
            .select()

          if (error) {
            console.error('Erro ao atualizar link do Canva:', error)
            throw new Error(`Erro ao atualizar link do Canva: ${error.message || 'Erro desconhecido'}`)
          }
          
          if (!data || data.length === 0) {
            throw new Error('Erro ao atualizar link do Canva: nenhuma linha foi atualizada. Verifique as políticas RLS.')
          }
        } else {
          // Criar novo
          const { data, error } = await (supabase as any)
            .from('tool_access_credentials')
            .insert({
              user_id: selectedTicket.user_id,
              tool_type: 'canva',
              email: selectedTicket.user?.email || 'noreply@example.com',
              access_link: canvaLink.trim(),
              tutorial_video_url: canvaVideoUrl, // Vídeo específico do Canva
              is_active: true
            })
            .select()

          if (error) {
            console.error('Erro ao criar link do Canva:', error)
            throw new Error(`Erro ao criar link do Canva: ${error.message || 'Erro desconhecido'}`)
          }
          
          if (!data || data.length === 0) {
            throw new Error('Erro ao criar link do Canva: nenhuma linha foi inserida. Verifique as políticas RLS.')
          }
        }
      }

      // Salvar/atualizar credenciais do CapCut
      if (capcutEmail.trim()) {
        const capcutAccess = toolAccess.find(t => t.tool_type === 'capcut')
        
        // Preparar objeto de atualização/inserção
        const capcutData: any = {
          access_link: capcutEmail.trim(), // Armazena email/usuário no access_link
          email: selectedTicket.user?.email || 'noreply@example.com',
          tutorial_video_url: capcutVideoUrl, // Vídeo específico do CapCut
          updated_at: new Date().toISOString()
        }
        
        // Adicionar password apenas se a coluna existir (pode não existir se o SQL não foi executado)
        // Tentar adicionar password, mas não falhar se a coluna não existir
        if (capcutPassword.trim()) {
          capcutData.password = capcutPassword.trim()
        }
        
        if (capcutAccess) {
          // Atualizar existente
          const { data, error } = await (supabase as any)
            .from('tool_access_credentials')
            .update(capcutData)
            .eq('id', capcutAccess.id)
            .select()

          if (error) {
            console.error('Erro ao atualizar credenciais do CapCut:', error)
            // Se o erro for sobre coluna não encontrada, tentar sem password
            if (error.message?.includes('password') || error.message?.includes('column')) {
              delete capcutData.password
              const { data: retryData, error: retryError } = await (supabase as any)
                .from('tool_access_credentials')
                .update(capcutData)
                .eq('id', capcutAccess.id)
                .select()
              
              if (retryError) {
                throw new Error(`Erro ao atualizar credenciais do CapCut: ${retryError.message || 'Erro desconhecido'}`)
              }
              
              if (!retryData || retryData.length === 0) {
                throw new Error('Erro ao atualizar credenciais do CapCut: nenhuma linha foi atualizada. Verifique as políticas RLS.')
              }
            } else {
              throw new Error(`Erro ao atualizar credenciais do CapCut: ${error.message || 'Erro desconhecido'}`)
            }
          } else {
            if (!data || data.length === 0) {
              throw new Error('Erro ao atualizar credenciais do CapCut: nenhuma linha foi atualizada. Verifique as políticas RLS.')
            }
          }
        } else {
          // Criar novo
          const insertData: any = {
            user_id: selectedTicket.user_id,
            tool_type: 'capcut',
            email: selectedTicket.user?.email || 'noreply@example.com',
            access_link: capcutEmail.trim(),
            tutorial_video_url: capcutVideoUrl, // Vídeo específico do CapCut
            is_active: true
          }
          
          // Adicionar password apenas se fornecido
          if (capcutPassword.trim()) {
            insertData.password = capcutPassword.trim()
          }
          
          const { data, error } = await (supabase as any)
            .from('tool_access_credentials')
            .insert(insertData)
            .select()

          if (error) {
            console.error('Erro ao criar credenciais do CapCut:', error)
            // Se o erro for sobre coluna não encontrada, tentar sem password
            if (error.message?.includes('password') || error.message?.includes('column')) {
              delete insertData.password
              const { data: retryData, error: retryError } = await (supabase as any)
                .from('tool_access_credentials')
                .insert(insertData)
                .select()
              
              if (retryError) {
                throw new Error(`Erro ao criar credenciais do CapCut: ${retryError.message || 'Erro desconhecido'}`)
              }
              
              if (!retryData || retryData.length === 0) {
                throw new Error('Erro ao criar credenciais do CapCut: nenhuma linha foi inserida. Verifique as políticas RLS.')
              }
            } else {
              throw new Error(`Erro ao criar credenciais do CapCut: ${error.message || 'Erro desconhecido'}`)
            }
          } else {
            if (!data || data.length === 0) {
              throw new Error('Erro ao criar credenciais do CapCut: nenhuma linha foi inserida. Verifique as políticas RLS.')
            }
          }
        }
      }

      // Limpar erros reportados quando novos links são salvos
      if (canvaLink.trim()) {
        const canvaAccess = toolAccess.find(t => t.tool_type === 'canva')
        if (canvaAccess && canvaAccess.error_reported) {
          await (supabase as any)
            .from('tool_access_credentials')
            .update({
              error_reported: false,
              error_message: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', canvaAccess.id)
        }
      }

      if (capcutEmail.trim()) {
        const capcutAccess = toolAccess.find(t => t.tool_type === 'capcut')
        if (capcutAccess && capcutAccess.error_reported) {
          await (supabase as any)
            .from('tool_access_credentials')
            .update({
              error_reported: false,
              error_message: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', capcutAccess.id)
        }
      }

      // Atualizar status do ticket para "resolved" se ambos os links foram enviados
      // Não atualizar status aqui se o usuário já mudou manualmente
      // O status será atualizado apenas se ainda estiver como "open"
      if (selectedTicket.status === 'open') {
        if (canvaLink.trim() && capcutEmail.trim()) {
          await updateTicketStatus(selectedTicket.id, 'resolved')
        } else if (canvaLink.trim() || capcutEmail.trim()) {
          await updateTicketStatus(selectedTicket.id, 'in_progress')
        }
      }

      toast.success('Links salvos com sucesso! O cliente já pode ver os links na página de ferramentas.')
      await loadToolAccess(selectedTicket.user_id)
      
      // Recarregar tickets para garantir que tudo está sincronizado, mas preservar o ticket selecionado
      const currentSelectedId = selectedTicket.id
      await loadTickets()
      
      // Restaurar o ticket selecionado após recarregar
      setTimeout(() => {
        const reloadedTicket = tickets.find(t => t.id === currentSelectedId)
        if (reloadedTicket) {
          setSelectedTicket(reloadedTicket)
        }
      }, 100)
    } catch (error: any) {
      console.error('Erro ao salvar links:', error)
      toast.error('Erro ao salvar links')
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
            Gerencie solicitações de acesso ao Canva Pro e CapCut Pro
          </p>
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

                  {/* Alertas de Erro Reportado */}
                  {toolAccess.some(t => t.tool_type === 'canva' && t.error_reported) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-amber-800 mb-1">
                            Erro Reportado - Canva Pro
                          </h4>
                          <p className="text-sm text-amber-700 mb-2">
                            {toolAccess.find(t => t.tool_type === 'canva' && t.error_reported)?.error_message || 'Cliente reportou problema com o link'}
                          </p>
                          <p className="text-xs text-amber-600">
                            Atualize o link abaixo para resolver o problema.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {toolAccess.some(t => t.tool_type === 'capcut' && t.error_reported) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-amber-800 mb-1">
                            Erro Reportado - CapCut Pro
                          </h4>
                          <p className="text-sm text-amber-700 mb-2">
                            {toolAccess.find(t => t.tool_type === 'capcut' && t.error_reported)?.error_message || 'Cliente reportou problema com o link'}
                          </p>
                          <p className="text-xs text-amber-600">
                            Atualize o link abaixo para resolver o problema.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Link de Ativação do Canva Pro
                      </div>
                    </label>
                    <input
                      type="url"
                      value={canvaLink}
                      onChange={(e) => setCanvaLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cole aqui o link de ativação do Canva Pro para este cliente
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Credenciais de Login do CapCut Pro
                      </div>
                    </label>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Email / Usuário:
                      </label>
                      <input
                        type="text"
                        value={capcutEmail}
                        onChange={(e) => setCapcutEmail(e.target.value)}
                        placeholder="Email ou usuário para login no CapCut"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Senha:
                      </label>
                      <input
                        type="text"
                        value={capcutPassword}
                        onChange={(e) => setCapcutPassword(e.target.value)}
                        placeholder="Senha de acesso ao CapCut"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Cole aqui as credenciais de login do CapCut Pro para este cliente. Você pode copiar cada campo separadamente.
                    </p>
                  </div>

                  {/* Upload de Vídeo Tutorial - Canva */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Vídeo Tutorial de Ativação - Canva Pro
                      </div>
                    </label>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={canvaTutorialVideoUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value
                            setCanvaTutorialVideoUrl(url || null)
                            if (url && !getYouTubeId(url)) {
                              toast.error('URL deve ser do YouTube (youtube.com ou youtu.be)')
                            }
                          }}
                          placeholder="Cole a URL do vídeo do YouTube (ex: https://www.youtube.com/watch?v=...)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {canvaTutorialVideoUrl && getYouTubeId(canvaTutorialVideoUrl) && (
                          <div className="mt-2">
                            <div className="relative max-w-[200px] mx-auto">
                              <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
                                <div className="bg-black rounded-lg overflow-hidden">
                                  <div className="relative aspect-[9/16] bg-black">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${getYouTubeId(canvaTutorialVideoUrl)}`}
                                      title="Preview Canva"
                                      className="w-full h-full rounded-lg"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setCanvaTutorialVideoUrl(null)}
                              className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                              Remover vídeo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      O vídeo aparecerá na página de ferramentas do cliente quando o link do Canva estiver disponível
                    </p>
                  </div>

                  {/* Upload de Vídeo Tutorial - CapCut */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Vídeo Tutorial de Ativação - CapCut Pro
                      </div>
                    </label>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={capcutTutorialVideoUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value
                            setCapcutTutorialVideoUrl(url || null)
                            if (url && !getYouTubeId(url)) {
                              toast.error('URL deve ser do YouTube (youtube.com ou youtu.be)')
                            }
                          }}
                          placeholder="Cole a URL do vídeo do YouTube (ex: https://www.youtube.com/watch?v=...)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {capcutTutorialVideoUrl && getYouTubeId(capcutTutorialVideoUrl) && (
                          <div className="mt-2">
                            <div className="relative max-w-[200px] mx-auto">
                              <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
                                <div className="bg-black rounded-lg overflow-hidden">
                                  <div className="relative aspect-[9/16] bg-black">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${getYouTubeId(capcutTutorialVideoUrl)}`}
                                      title="Preview CapCut"
                                      className="w-full h-full rounded-lg"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setCapcutTutorialVideoUrl(null)}
                              className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                              Remover vídeo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      O vídeo aparecerá na página de ferramentas do cliente quando as credenciais do CapCut estiverem disponíveis
                    </p>
                  </div>

                  {/* Status dos Links */}
                  {toolAccess.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Status dos Links Enviados:</p>
                      {toolAccess.map((access) => (
                        <div key={access.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {access.tool_type === 'canva' ? 'Canva Pro' : 'CapCut Pro'}:
                          </span>
                          {access.access_link ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Link enviado
                            </span>
                          ) : (
                            <span className="text-gray-400">Aguardando link</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={saveLinks}
                    disabled={saving || (!canvaLink.trim() && !capcutEmail.trim())}
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
