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
  ExternalLink
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
  const [capcutLink, setCapcutLink] = useState('')
  const [tutorialVideo, setTutorialVideo] = useState<File | null>(null)
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState<string | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    if (selectedTicket) {
      loadToolAccess(selectedTicket.user_id)
    }
  }, [selectedTicket])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('support_tickets')
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(email, full_name)
        `)
        .eq('ticket_type', 'tools_access')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
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
      setCapcutLink(capcutAccess?.access_link || '')
    } catch (error: any) {
      console.error('Erro ao carregar acessos:', error)
    }
  }

  const uploadVideo = async (file: File): Promise<string | null> => {
    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload do vídeo')
      }

      const data = await response.json()
      return data.url || null
    } catch (error: any) {
      console.error('Erro ao fazer upload do vídeo:', error)
      toast.error(error.message || 'Erro ao fazer upload do vídeo')
      return null
    } finally {
      setUploadingVideo(false)
    }
  }

  const saveLinks = async () => {
    if (!selectedTicket) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Upload do vídeo se houver
      let videoUrl = tutorialVideoUrl
      if (tutorialVideo) {
        const uploadedUrl = await uploadVideo(tutorialVideo)
        if (uploadedUrl) {
          videoUrl = uploadedUrl
          setTutorialVideoUrl(uploadedUrl)
          setTutorialVideo(null)
        }
      }

      // Salvar/atualizar link do Canva
      if (canvaLink.trim()) {
        const canvaAccess = toolAccess.find(t => t.tool_type === 'canva')
        
        if (canvaAccess) {
          // Atualizar existente
          const { error } = await (supabase as any)
            .from('tool_access_credentials')
            .update({
              access_link: canvaLink.trim(),
              email: selectedTicket.user?.email || 'noreply@example.com',
              tutorial_video_url: videoUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', canvaAccess.id)

          if (error) throw error
        } else {
          // Criar novo
          const { error } = await (supabase as any)
            .from('tool_access_credentials')
            .insert({
              user_id: selectedTicket.user_id,
              tool_type: 'canva',
              email: selectedTicket.user?.email || 'noreply@example.com',
              access_link: canvaLink.trim(),
              tutorial_video_url: videoUrl,
              is_active: true
            })

          if (error) throw error
        }
      }

      // Salvar/atualizar link do CapCut
      if (capcutLink.trim()) {
        const capcutAccess = toolAccess.find(t => t.tool_type === 'capcut')
        
        if (capcutAccess) {
          // Atualizar existente
          const { error } = await (supabase as any)
            .from('tool_access_credentials')
            .update({
              access_link: capcutLink.trim(),
              email: selectedTicket.user?.email || 'noreply@example.com',
              tutorial_video_url: videoUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', capcutAccess.id)

          if (error) throw error
        } else {
          // Criar novo
          const { error } = await (supabase as any)
            .from('tool_access_credentials')
            .insert({
              user_id: selectedTicket.user_id,
              tool_type: 'capcut',
              email: selectedTicket.user?.email || 'noreply@example.com',
              access_link: capcutLink.trim(),
              tutorial_video_url: videoUrl,
              is_active: true
            })

          if (error) throw error
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

      if (capcutLink.trim()) {
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
      if (canvaLink.trim() && capcutLink.trim()) {
        await updateTicketStatus(selectedTicket.id, 'resolved')
      } else {
        await updateTicketStatus(selectedTicket.id, 'in_progress')
      }

      toast.success('Links salvos com sucesso! O cliente já pode ver os links na página de ferramentas.')
      await loadToolAccess(selectedTicket.user_id)
    } catch (error: any) {
      console.error('Erro ao salvar links:', error)
      toast.error('Erro ao salvar links')
    } finally {
      setSaving(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await (supabase as any)
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (error) throw error

      await loadTickets()
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status })
      }
      toast.success('Status atualizado')
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Link de Ativação do CapCut Pro
                      </div>
                    </label>
                    <input
                      type="url"
                      value={capcutLink}
                      onChange={(e) => setCapcutLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cole aqui o link de ativação do CapCut Pro para este cliente
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
                    disabled={saving || (!canvaLink.trim() && !capcutLink.trim())}
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
