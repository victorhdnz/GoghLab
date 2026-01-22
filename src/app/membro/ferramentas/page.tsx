'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Send,
  AlertCircle,
  Palette,
  Scissors,
  ExternalLink,
  Link as LinkIcon,
  AlertTriangle,
  X,
  Play
} from 'lucide-react'

// Função para detectar se é YouTube e extrair ID (suporta todos os formatos)
function getYouTubeId(url: string): string | null {
  if (!url) return null
  // Regex mais completa que funciona com todos os formatos
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2] && match[2].length === 11) ? match[2] : null
}
import toast from 'react-hot-toast'

interface ToolAccess {
  id: string
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

interface SupportTicket {
  id: string
  ticket_type: string
  status: string
  subject: string
  created_at: string
}

export default function ToolsPage() {
  const { user, subscription, hasActiveSubscription, isPro } = useAuth()
  const [toolAccess, setToolAccess] = useState<ToolAccess[]>([])
  const [pendingTickets, setPendingTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [canvaVideoUrl, setCanvaVideoUrl] = useState<string | null>(null)
  const [capcutVideoUrl, setCapcutVideoUrl] = useState<string | null>(null)
  const [showCanvaVideoModal, setShowCanvaVideoModal] = useState(false)
  const [showCapcutVideoModal, setShowCapcutVideoModal] = useState(false)
  const [reportingError, setReportingError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showCapcutCredentials, setShowCapcutCredentials] = useState(false)
  
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

        // Buscar URLs dos vídeos tutorial separados por plataforma
        const canvaAccess = accessData?.find((t: ToolAccess) => t.tool_type === 'canva')
        const capcutAccess = accessData?.find((t: ToolAccess) => t.tool_type === 'capcut')
        
        if (canvaAccess?.tutorial_video_url) {
          setCanvaVideoUrl(canvaAccess.tutorial_video_url)
        }
        if (capcutAccess?.tutorial_video_url) {
          setCapcutVideoUrl(capcutAccess.tutorial_video_url)
        }
      } catch (error) {
        console.error('Error fetching tools data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, subscription]) // Recarregar quando a assinatura for atualizada (renovação)

  // Verificar se o acesso foi concedido no período atual ou anterior
  const isAccessFromCurrentPeriod = (access: ToolAccess): boolean => {
    if (!subscription?.current_period_start || !access.access_granted_at) return false
    
    const periodStart = new Date(subscription.current_period_start)
    const accessGranted = new Date(access.access_granted_at)
    
    // Se o acesso foi concedido após o início do período atual, é do período atual
    return accessGranted >= periodStart
  }

  // Verificar se já tem acesso do período atual ou ticket pendente
  const hasCanvaAccessCurrentPeriod = toolAccess.some(t => 
    t.tool_type === 'canva' && t.is_active && isAccessFromCurrentPeriod(t)
  )
  const hasCapcutAccessCurrentPeriod = toolAccess.some(t => 
    t.tool_type === 'capcut' && t.is_active && isAccessFromCurrentPeriod(t)
  )
  const hasBothAccessCurrentPeriod = hasCanvaAccessCurrentPeriod && hasCapcutAccessCurrentPeriod
  
  // Verificar se tem acesso de período anterior (para mostrar que pode solicitar novamente)
  const hasCanvaAccessOldPeriod = toolAccess.some(t => 
    t.tool_type === 'canva' && t.is_active && !isAccessFromCurrentPeriod(t)
  )
  const hasCapcutAccessOldPeriod = toolAccess.some(t => 
    t.tool_type === 'capcut' && t.is_active && !isAccessFromCurrentPeriod(t)
  )
  const hasAccessFromOldPeriod = hasCanvaAccessOldPeriod || hasCapcutAccessOldPeriod
  
  const hasPendingRequest = pendingTickets.length > 0

  // Verificar se já passaram 8 dias desde o início da assinatura (oitavo dia)
  // Funciona tanto para novos clientes quanto para renovações
  const canRequestTools = () => {
    if (!subscription) return false
    
    // Buscar a data de início da assinatura
    // Prioridade: current_period_start (período atual) > created_at (data de criação)
    let subscriptionStartDate: Date | null = null
    
    if (subscription.current_period_start) {
      subscriptionStartDate = new Date(subscription.current_period_start)
    } else if ((subscription as any).created_at) {
      // Fallback para created_at se current_period_start não existir
      subscriptionStartDate = new Date((subscription as any).created_at)
    }
    
    if (!subscriptionStartDate) {
      // Se não tem nenhuma data, retornar false
      return false
    }
    
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Oitavo dia = já passou o período de arrependimento de 7 dias
    // Funciona para novos clientes (primeira compra) e renovações
    return daysSinceStart >= 8
  }

  // Calcular dias restantes até poder solicitar
  // Funciona tanto para novos clientes quanto para renovações
  const daysUntilCanRequest = () => {
    if (!subscription) return null
    
    // Buscar a data de início da assinatura
    // Prioridade: current_period_start (período atual) > created_at (data de criação)
    let subscriptionStartDate: Date | null = null
    
    if (subscription.current_period_start) {
      subscriptionStartDate = new Date(subscription.current_period_start)
    } else if ((subscription as any).created_at) {
      // Fallback para created_at se current_period_start não existir
      subscriptionStartDate = new Date((subscription as any).created_at)
    }
    
    if (!subscriptionStartDate) return null
    
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = 8 - daysSinceStart
    
    return daysRemaining > 0 ? daysRemaining : 0
  }

  // Solicitar acesso para ambas as ferramentas
  const requestToolsAccess = async () => {
    if (!user) return
    
    // Verificar se já passaram 8 dias (oitavo dia)
    if (!canRequestTools()) {
      const daysRemaining = daysUntilCanRequest()
      toast.error(
        daysRemaining 
          ? `Você poderá solicitar acesso às ferramentas em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}. Isso é necessário para garantir o período de arrependimento de 7 dias conforme o Código de Defesa do Consumidor.`
          : 'Não foi possível verificar o período de sua assinatura. Entre em contato com o suporte.'
      )
      return
    }
    
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

      // Disparar evento Lead do Meta Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Solicitação de Acesso às Ferramentas Pro'
        })
      }

      toast.success('Solicitação enviada! Você receberá o acesso em até 24 horas após a aprovação.')
      
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

      toast.success('Erro reportado! Nossa equipe irá verificar e enviar uma nova conta.')
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
      hasAccess: hasCanvaAccessCurrentPeriod, // Apenas acesso do período atual
      accessData: toolAccess.find(t => t.tool_type === 'canva' && isAccessFromCurrentPeriod(t)),
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
      hasAccess: hasCapcutAccessCurrentPeriod, // Apenas acesso do período atual
      accessData: toolAccess.find(t => t.tool_type === 'capcut' && isAccessFromCurrentPeriod(t)),
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

  // Verificar se tem assinatura ativa
  if (!hasActiveSubscription) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
            Ferramentas Pro
          </h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Assinatura Necessária</h3>
              <p className="text-amber-800 mb-4">
                Você precisa de uma assinatura ativa para acessar as ferramentas Pro (Canva Pro e CapCut Pro).
                {subscription && subscription.current_period_end && new Date(subscription.current_period_end) < new Date() && (
                  <span className="block mt-2 font-medium">
                    Sua assinatura expirou em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}. Renove sua assinatura para continuar usando.
                  </span>
                )}
              </p>
              <Link 
                href="/#pricing" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/80 transition-colors"
              >
                Ver Planos e Assinar
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Verificar se tem acesso às ferramentas (apenas Pro)
  const hasToolsAccess = isPro && hasActiveSubscription

  // Se não for Pro, mostrar tela de bloqueio similar à de cursos
  if (!hasToolsAccess && hasActiveSubscription) {
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

        {/* Banner de Upgrade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <p className="text-amber-800">
            As ferramentas Pro são exclusivas para o plano Pro. <Link href="/#pricing" className="font-medium underline">Faça upgrade agora</Link>
          </p>
        </motion.div>

        {/* Tools Grid com Overlay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Overlay de bloqueio */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
            <div className="text-center p-8">
              <Wrench className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gogh-black mb-2">
                Ferramentas Exclusivas do Plano Pro
              </h3>
              <p className="text-gogh-grayDark mb-6 max-w-md">
                Faça upgrade para o plano Pro e tenha acesso completo às ferramentas Canva Pro e CapCut Pro.
              </p>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
              >
                Fazer Upgrade
              </Link>
            </div>
          </div>

          {/* Cards das ferramentas (borrados) */}
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden blur-sm pointer-events-none"
            >
              <div className={`bg-gradient-to-r ${tool.color} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <tool.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tool.name}</h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gogh-grayDark text-sm mb-4">
                  {tool.description}
                </p>
                <ul className="space-y-2">
                  {tool.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gogh-yellow flex-shrink-0" />
                      <span className="text-gogh-grayDark">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
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
              Os links de ativação e o vídeo tutorial aparecerão aqui nesta página em até <strong>24 horas úteis</strong>.
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

              {/* Link de Ativação / Credenciais */}
              {tool.hasAccess && tool.accessData && (
                <div className="space-y-3">
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
                                Nossa equipe está verificando e enviará uma nova conta em breve.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Informação de duração */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <p className="text-xs text-blue-700">
                          <strong>Duração:</strong> O acesso é válido por <strong>30 dias</strong> a partir da liberação.
                        </p>
                      </div>
                      
                      {/* Canva: Link clicável */}
                      {tool.id === 'canva' && (
                        <>
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
                          
                          {/* Botão para assistir vídeo tutorial do Canva */}
                          {canvaVideoUrl && (
                            <button
                              onClick={() => setShowCanvaVideoModal(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                              Assistir Tutorial de Ativação
                            </button>
                          )}
                          
                          <button
                            onClick={() => reportLinkError(tool.id as 'canva' | 'capcut')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Reportar Erro na Conta
                          </button>
                        </>
                      )}
                      
                      {/* CapCut: Botão para mostrar credenciais em modal */}
                      {tool.id === 'capcut' && (
                        <>
                          <button
                            onClick={() => setShowCapcutCredentials(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 transition-colors"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Ver Credenciais de Acesso {tool.name}
                          </button>
                          
                          {/* Botão para assistir vídeo tutorial do CapCut */}
                          {capcutVideoUrl && (
                            <button
                              onClick={() => setShowCapcutVideoModal(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                              Assistir Tutorial de Ativação
                            </button>
                          )}
                          
                          <button
                            onClick={() => reportLinkError(tool.id as 'canva' | 'capcut')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Reportar Erro na Conta
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Request Button - Single button for both tools */}
      {/* Mostrar botão se não tem acesso do período atual OU se tem acesso de período anterior (renovação) */}
      {!hasBothAccessCurrentPeriod && (
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
                {hasAccessFromOldPeriod ? 'Solicitar Novo Acesso às Ferramentas' : 'Solicitar Acesso às Ferramentas'}
              </h3>
              
              {hasAccessFromOldPeriod ? (
                <>
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 mb-6">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Renovação Detectada</span>
                    </div>
                    <p className="text-sm text-emerald-700 text-left mb-2">
                      Detectamos que sua assinatura foi renovada! Você pode solicitar um novo acesso às ferramentas Canva Pro e CapCut Pro para este novo período.
                    </p>
                    {!canRequestTools() ? (
                      <p className="text-sm text-emerald-700 text-left">
                        Aguarde <strong>{daysUntilCanRequest()} dia{daysUntilCanRequest()! > 1 ? 's' : ''}</strong> após a renovação para solicitar o novo acesso (período de arrependimento de 7 dias).
                      </p>
                    ) : (
                      <p className="text-sm text-emerald-700 text-left">
                        Você já pode solicitar o novo acesso! Após a aprovação, você terá <strong>30 dias de uso</strong> das ferramentas.
                      </p>
                    )}
                  </div>
                  {!canRequestTools() ? (
                    <button
                      disabled={true}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-gogh-grayLight text-gogh-grayDark cursor-not-allowed"
                    >
                      <Clock className="w-4 h-4" />
                      Aguardando Oitavo Dia Após Renovação
                    </button>
                  ) : (
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
                          Solicitar Novo Acesso às Ferramentas
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : !canRequestTools() ? (
                <>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Período de Arrependimento</span>
                    </div>
                    <p className="text-sm text-blue-600 text-left mb-2">
                      Conforme o Código de Defesa do Consumidor (CDC), você tem 7 dias para exercer seu direito de arrependimento. 
                      Por isso, o acesso às ferramentas Canva Pro e CapCut Pro será liberado apenas após o <strong>oitavo dia</strong> da sua assinatura, garantindo que o período de arrependimento já tenha sido concluído.
                    </p>
                    <p className="text-sm text-blue-600 text-left mb-2">
                      Após a liberação, você terá <strong>30 dias de uso</strong> das ferramentas para aproveitar ao máximo seus recursos.
                    </p>
                    <p className="text-sm text-blue-600 text-left">
                      Para mais informações sobre esta política, consulte nossos{' '}
                      <Link 
                        href="/termos-assinatura-planos" 
                        target="_blank"
                        className="underline font-medium text-blue-700 hover:text-blue-900"
                      >
                        Termos de Assinatura e Planos
                      </Link>.
                    </p>
                    {daysUntilCanRequest() !== null && daysUntilCanRequest()! > 0 && (
                      <p className="text-sm font-medium text-blue-700 mt-3">
                        Você poderá solicitar acesso em {daysUntilCanRequest()} dia{daysUntilCanRequest()! > 1 ? 's' : ''}.
                      </p>
                    )}
                  </div>
                  <button
                    disabled={true}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-gogh-grayLight text-gogh-grayDark cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4" />
                    Aguardando Oitavo Dia
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gogh-grayDark mb-6">
                    Clique no botão abaixo para solicitar acesso ao Canva Pro e CapCut Pro simultaneamente.
                    O acesso será liberado após a aprovação da solicitação e você terá <strong>30 dias de uso</strong> das ferramentas.
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
                </>
              )}
            </div>
          )}
        </motion.div>
      )}


      {/* Modal de Vídeo Tutorial Canva */}
      {showCanvaVideoModal && canvaVideoUrl && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCanvaVideoModal(false)
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold text-gogh-black">
                Tutorial de Ativação - Canva Pro
              </h3>
              <button
                onClick={() => {
                  setShowCanvaVideoModal(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative max-w-sm mx-auto">
              {canvaVideoUrl && getYouTubeId(canvaVideoUrl) ? (
                <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
                  <div className="bg-black rounded-lg overflow-hidden">
                    <div className="relative aspect-[9/16] bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(canvaVideoUrl)}`}
                        title="Tutorial de Ativação Canva Pro"
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[9/16] w-full flex items-center justify-center bg-black rounded-lg">
                  <p className="text-white text-sm">Vídeo não disponível</p>
                </div>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-4">
              Assista este tutorial para aprender como ativar e fazer login no Canva Pro.
            </p>
          </motion.div>
        </div>
      )}

      {/* Modal de Vídeo Tutorial CapCut */}
      {showCapcutVideoModal && capcutVideoUrl && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCapcutVideoModal(false)
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold text-gogh-black">
                Tutorial de Ativação - CapCut Pro
              </h3>
              <button
                onClick={() => {
                  setShowCapcutVideoModal(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative max-w-sm mx-auto">
              {capcutVideoUrl && getYouTubeId(capcutVideoUrl) ? (
                <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
                  <div className="bg-black rounded-lg overflow-hidden">
                    <div className="relative aspect-[9/16] bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(capcutVideoUrl)}`}
                        title="Tutorial de Ativação CapCut Pro"
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[9/16] w-full flex items-center justify-center bg-black rounded-lg">
                  <p className="text-white text-sm">Vídeo não disponível</p>
                </div>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-4">
              Assista este tutorial para aprender como fazer login no CapCut Pro usando as credenciais fornecidas.
            </p>
          </motion.div>
        </div>
      )}

      {/* Modal de Credenciais CapCut */}
      {showCapcutCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gogh-black">
                Credenciais de Acesso CapCut Pro
              </h3>
              <button
                onClick={() => setShowCapcutCredentials(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <strong>Duração:</strong> O acesso é válido por <strong>30 dias</strong> a partir da liberação.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gogh-grayDark mb-2">
                  Email / Usuário:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={toolAccess.find(t => t.tool_type === 'capcut')?.access_link || ''}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      const text = toolAccess.find(t => t.tool_type === 'capcut')?.access_link || ''
                      navigator.clipboard.writeText(text)
                      toast.success('Email/Usuário copiado!')
                    }}
                    className="px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/90 transition-colors text-sm font-medium"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gogh-grayDark mb-2">
                  Senha:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={toolAccess.find(t => t.tool_type === 'capcut')?.password || ''}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      const text = toolAccess.find(t => t.tool_type === 'capcut')?.password || ''
                      navigator.clipboard.writeText(text)
                      toast.success('Senha copiada!')
                    }}
                    className="px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/90 transition-colors text-sm font-medium"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <strong>Importante:</strong> Use essas credenciais para fazer login no CapCut. Você pode copiar cada campo separadamente. Se encontrar algum problema, clique em "Reportar Erro na Conta".
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCapcutCredentials(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
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
                Reportar Erro na Conta
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
              Descreva o problema que você encontrou com a conta (ex: conta com menos dias de duração, credenciais não funcionam, etc.):
            </p>
            
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Ex: A conta tem menos de 30 dias, as credenciais não funcionam, preciso de uma nova conta, etc..."
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
