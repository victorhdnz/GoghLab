'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Send,
  AlertCircle,
  Palette,
  Scissors,
  ExternalLink,
  Play,
  Link as LinkIcon,
  AlertTriangle,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ToolAccess {
  id: string
  tool_type: 'canva' | 'capcut'
  email: string
  access_link?: string
  tutorial_video_url?: string
  access_granted_at: string
  is_active: boolean
  error_reported?: boolean
  error_message?: string
}

interface SupportTicket {
  id: string
  ticket_type: string
  status: string
  subject: string
  created_at: string
}

export default function ToolsPage() {
  const { user } = useAuth()
  const [toolAccess, setToolAccess] = useState<ToolAccess[]>([])
  const [pendingTickets, setPendingTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState<string | null>(null)
  const [reportingError, setReportingError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Buscar acessos já concedidos
        const { data: accessData } = await (supabase as any)
          .from('tool_access_credentials')
          .select('*')
          .eq('user_id', user.id)

        setToolAccess(accessData || [])

        // Buscar tickets pendentes de ferramentas
        const { data: ticketsData } = await (supabase as any)
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .eq('ticket_type', 'tools_access')
          .in('status', ['open', 'in_progress'])

        setPendingTickets(ticketsData || [])

        // Buscar URL do vídeo tutorial dos acessos
        const canvaAccess = accessData?.find((t: ToolAccess) => t.tool_type === 'canva')
        const capcutAccess = accessData?.find((t: ToolAccess) => t.tool_type === 'capcut')
        
        // Priorizar vídeo do Canva, se não tiver, usar do CapCut
        const videoUrl = canvaAccess?.tutorial_video_url || capcutAccess?.tutorial_video_url || null
        if (videoUrl) {
          setTutorialVideoUrl(videoUrl)
        }
      } catch (error) {
        console.error('Error fetching tools data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Verificar se já tem acesso ou ticket pendente
  const hasCanvaAccess = toolAccess.some(t => t.tool_type === 'canva' && t.is_active)
  const hasCapcutAccess = toolAccess.some(t => t.tool_type === 'capcut' && t.is_active)
  const hasBothAccess = hasCanvaAccess && hasCapcutAccess
  const hasPendingRequest = pendingTickets.length > 0

  // Solicitar acesso para ambas as ferramentas
  const requestToolsAccess = async () => {
    if (!user) return
    setSubmitting(true)

    try {
      // Criar ticket único para ambas as ferramentas
      const { data: ticketData, error: ticketError } = await (supabase as any)
        .from('support_tickets')
        .insert({
          user_id: user.id,
          ticket_type: 'tools_access',
          subject: 'Solicitação de acesso às ferramentas Pro (Canva e CapCut)',
          status: 'open',
          priority: 'normal'
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      // Criar mensagem inicial
      const { error: messageError } = await (supabase as any)
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: user.id,
          content: 'Olá! Gostaria de solicitar acesso às ferramentas Canva Pro e CapCut Pro. Aguardo instruções para receber as credenciais.'
        })

      if (messageError) throw messageError

      toast.success('Solicitação enviada! Você receberá o acesso em até 24 horas.')
      
      // Atualizar lista de tickets pendentes
      const { data: ticketsData } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('ticket_type', 'tools_access')
        .in('status', ['open', 'in_progress'])

      setPendingTickets(ticketsData || [])
    } catch (error) {
      console.error('Error requesting tools access:', error)
      toast.error('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const reportLinkError = async (toolType: 'canva' | 'capcut') => {
    if (!user) return
    setReportingError(toolType)
    setShowErrorModal(true)
  }

  const submitErrorReport = async () => {
    if (!user || !reportingError || !errorMessage.trim()) return

    try {
      const toolAccessData = toolAccess.find(t => t.tool_type === reportingError)
      if (!toolAccessData) {
        toast.error('Acesso não encontrado')
        return
      }

      const { error } = await (supabase as any)
        .from('tool_access_credentials')
        .update({
          error_reported: true,
          error_message: errorMessage.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', toolAccessData.id)

      if (error) throw error

      toast.success('Erro reportado! Nossa equipe irá verificar e enviar um novo link.')
      setShowErrorModal(false)
      setErrorMessage('')
      setReportingError(null)

      // Recarregar dados
      const { data: accessData } = await (supabase as any)
        .from('tool_access_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      setToolAccess(accessData || [])
    } catch (error) {
      console.error('Error reporting link error:', error)
      toast.error('Erro ao reportar problema. Tente novamente.')
    }
  }

  const tools = [
    {
      id: 'canva',
      name: 'Canva Pro',
      description: 'Crie designs profissionais com templates premium, elementos exclusivos e recursos avançados de edição.',
      icon: Palette,
      color: 'from-purple-500 to-indigo-600',
      hasAccess: hasCanvaAccess,
      accessData: toolAccess.find(t => t.tool_type === 'canva'),
      features: [
        'Templates premium ilimitados',
        'Remoção de fundo com 1 clique',
        'Kit de marca',
        'Magic Resize',
        '100GB de armazenamento'
      ]
    },
    {
      id: 'capcut',
      name: 'CapCut Pro',
      description: 'Editor de vídeo profissional com efeitos avançados, templates virais e sem marca d\'água.',
      icon: Scissors,
      color: 'from-emerald-500 to-teal-600',
      hasAccess: hasCapcutAccess,
      accessData: toolAccess.find(t => t.tool_type === 'capcut'),
      features: [
        'Sem marca d\'água',
        'Efeitos e transições premium',
        'Templates de tendência',
        'Legendas automáticas',
        'Exportação em 4K'
      ]
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gogh-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando ferramentas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
          Ferramentas Pro
        </h1>
        <p className="text-gogh-grayDark">
          Acesse as melhores ferramentas de criação incluídas na sua assinatura.
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gogh-yellow/20 to-amber-100 rounded-xl p-5 border border-gogh-yellow/30"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-gogh-yellow rounded-lg">
            <AlertCircle className="w-5 h-5 text-gogh-black" />
          </div>
          <div>
            <h3 className="font-semibold text-gogh-black mb-1">Como funciona?</h3>
            <p className="text-sm text-gogh-grayDark">
              Ao solicitar acesso, nossa equipe irá adicionar você às contas Pro compartilhadas.
              Você receberá um e-mail com as instruções de acesso em até <strong>24 horas úteis</strong>.
              O acesso é válido enquanto sua assinatura estiver ativa.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden"
          >
            {/* Tool Header */}
            <div className={`bg-gradient-to-r ${tool.color} p-6 text-white`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <tool.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{tool.name}</h3>
                  {tool.hasAccess && (
                    <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Acesso liberado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tool Content */}
            <div className="p-6">
              <p className="text-gogh-grayDark text-sm mb-4">
                {tool.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {tool.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-gogh-yellow flex-shrink-0" />
                    <span className="text-gogh-grayDark">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Access Status */}
              {tool.hasAccess && tool.accessData && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Acesso Ativo</span>
                    </div>
                    <p className="text-sm text-emerald-600">
                      Email: <span className="font-mono">{tool.accessData.email}</span>
                    </p>
                    <p className="text-xs text-emerald-500 mt-1">
                      Liberado em {new Date(tool.accessData.access_granted_at || '').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  {/* Link de Ativação */}
                  {tool.accessData.access_link && (
                    <div className="space-y-2">
                      {/* Alerta de Erro Reportado */}
                      {tool.accessData.error_reported && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-800">
                                Erro reportado
                              </p>
                              <p className="text-xs text-amber-600 mt-1">
                                Nossa equipe está verificando e enviará um novo link em breve.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <a
                        href={tool.accessData.access_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Link de Ativação {tool.name}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      
                      <button
                        onClick={() => reportLinkError(tool.id as 'canva' | 'capcut')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Reportar Erro no Link
                      </button>
                    </div>
                  )}
                  
                  <a
                    href={tool.id === 'canva' ? 'https://canva.com' : 'https://capcut.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-black text-white rounded-lg hover:bg-gogh-black/90 transition-colors"
                  >
                    Acessar {tool.name}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Request Button - Single button for both tools */}
      {!hasBothAccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gogh-grayLight shadow-sm p-6"
        >
          {hasPendingRequest ? (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Solicitação Pendente</span>
              </div>
              <p className="text-sm text-amber-600">
                Sua solicitação está sendo processada. Você receberá um e-mail com as instruções em breve.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-lg font-bold text-gogh-black mb-2">
                Solicitar Acesso às Ferramentas
              </h3>
              <p className="text-sm text-gogh-grayDark mb-6">
                Clique no botão abaixo para solicitar acesso ao Canva Pro e CapCut Pro simultaneamente.
              </p>
              <button
                onClick={requestToolsAccess}
                disabled={submitting}
                className={`
                  inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                  ${submitting
                    ? 'bg-gogh-grayLight text-gogh-grayDark cursor-not-allowed'
                    : 'bg-gogh-yellow text-gogh-black hover:bg-gogh-yellow/80'
                  }
                `}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gogh-grayDark border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Solicitar Acesso às Ferramentas
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Tutorial Video - Mostrar apenas quando tiver links de acesso */}
      {hasBothAccess && tutorialVideoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gogh-grayLight shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Play className="w-5 h-5 text-gogh-grayDark" />
            <h3 className="text-lg font-bold text-gogh-black">
              Como Ativar e Acessar as Ferramentas
            </h3>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden bg-gogh-grayLight">
            <iframe
              src={tutorialVideoUrl}
              title="Tutorial de Ativação"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      )}

      {/* Modal de Reporte de Erro */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gogh-black">
                Reportar Erro no Link
              </h3>
              <button
                onClick={() => {
                  setShowErrorModal(false)
                  setErrorMessage('')
                  setReportingError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gogh-grayDark mb-4">
              Descreva o problema que você encontrou ao tentar usar o link de ativação:
            </p>
            
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Ex: O link não abre, aparece erro 404, o link expirou, etc..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow resize-none"
              rows={4}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowErrorModal(false)
                  setErrorMessage('')
                  setReportingError(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitErrorReport}
                disabled={!errorMessage.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Reporte
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
