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
import toast from 'react-hot-toast'
import { 
  getYouTubeId, 
  getYouTubeEmbedUrl,
  getYouTubeContainerClasses 
} from '@/lib/utils/youtube'

interface ToolAccess {
  id: string
  tool_type: string
  tool_id?: string | null
  email: string
  access_link?: string
  password?: string
  tutorial_video_url?: string
  access_granted_at: string
  updated_at?: string
  is_active: boolean
  error_reported?: boolean
  error_message?: string
}

interface ToolFromDB {
  id: string
  product_id: string | null
  name: string
  slug: string
  description: string | null
  tutorial_video_url: string | null
  requires_8_days: boolean
  order_position: number
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
  const [toolsFromPlan, setToolsFromPlan] = useState<ToolFromDB[]>([])

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const { data: accessData } = await (supabase as any)
          .from('tool_access_credentials')
          .select('*')
          .eq('user_id', user.id)

        setToolAccess(accessData || [])

        const { data: ticketsData } = await (supabase as any)
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .eq('ticket_type', 'tools_access')
          .in('status', ['open', 'in_progress'])

        setPendingTickets(ticketsData || [])

        const canvaAccess = accessData?.find((t: ToolAccess) => t.tool_type === 'canva')
        const capcutAccess = accessData?.find((t: ToolAccess) => t.tool_type === 'capcut')
        const { data: settingsData } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', 'general')
          .maybeSingle()
        const defaultVideos = settingsData?.value?.tool_tutorial_videos || {}
        if (canvaAccess?.tutorial_video_url) setCanvaVideoUrl(canvaAccess.tutorial_video_url)
        else if (defaultVideos.canva) setCanvaVideoUrl(defaultVideos.canva)
        if (capcutAccess?.tutorial_video_url) setCapcutVideoUrl(capcutAccess.tutorial_video_url)
        else if (defaultVideos.capcut) setCapcutVideoUrl(defaultVideos.capcut)

        // Ferramentas do plano (plan_products -> products tipo tool -> tools)
        const planId = subscription?.plan_id
        if (planId) {
          try {
            const { data: planProductsData } = await (supabase as any)
              .from('plan_products')
              .select('product_id')
              .eq('plan_id', planId)
            const productIds = (planProductsData || []).map((pp: { product_id: string }) => pp.product_id)
            if (productIds.length > 0) {
              const { data: toolsData } = await (supabase as any)
                .from('tools')
                .select('id, product_id, name, slug, description, tutorial_video_url, requires_8_days, order_position')
                .eq('is_active', true)
                .in('product_id', productIds)
                .order('order_position', { ascending: true })
              setToolsFromPlan(toolsData || [])
            }
          } catch (_) {
            setToolsFromPlan([])
          }
        }
      } catch (error) {
        console.error('Error fetching tools data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, subscription])

  // Refetch ao voltar para a aba (ex.: admin acabou de liberar acesso)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !user) return
      ;(async () => {
        try {
          const { data: accessData } = await (supabase as any)
            .from('tool_access_credentials')
            .select('*')
            .eq('user_id', user.id)
          setToolAccess(accessData || [])
          const { data: ticketsData } = await (supabase as any)
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .eq('ticket_type', 'tools_access')
            .in('status', ['open', 'in_progress'])
          setPendingTickets(ticketsData || [])
        } catch (_) {}
      })()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [user])

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
  const daysUntilCanRequest = (): number | null => {
    if (!subscription) return null
    
    let subscriptionStartDate: Date | null = null
    if (subscription.current_period_start) {
      subscriptionStartDate = new Date(subscription.current_period_start)
    } else if ((subscription as any).created_at) {
      subscriptionStartDate = new Date((subscription as any).created_at)
    }
    if (!subscriptionStartDate) return null
    
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = 8 - daysSinceStart
    return daysRemaining > 0 ? daysRemaining : 0
  }

  // Texto do countdown: "X dias restantes" ou "X horas restantes" quando faltar menos de 24h
  const countdownLabel = (): string | null => {
    if (!subscription) return null
    let subscriptionStartDate: Date | null = null
    if (subscription.current_period_start) {
      subscriptionStartDate = new Date(subscription.current_period_start)
    } else if ((subscription as any).created_at) {
      subscriptionStartDate = new Date((subscription as any).created_at)
    }
    if (!subscriptionStartDate) return null
    const eighthDay = new Date(subscriptionStartDate)
    eighthDay.setDate(eighthDay.getDate() + 8)
    eighthDay.setHours(0, 0, 0, 0)
    const now = new Date()
    const msRemaining = eighthDay.getTime() - now.getTime()
    if (msRemaining <= 0) return null
    const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60))
    const daysRemaining = Math.floor(hoursRemaining / 24)
    if (daysRemaining >= 1) {
      return `${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''}`
    }
    if (hoursRemaining >= 1) {
      return `${hoursRemaining} hora${hoursRemaining > 1 ? 's' : ''} restante${hoursRemaining > 1 ? 's' : ''}`
    }
    const minutesRemaining = Math.ceil(msRemaining / (1000 * 60))
    return `${minutesRemaining} min restante${minutesRemaining > 1 ? 's' : ''}`
  }

  const canRequestForTool = (tool: ToolFromDB) =>
    tool.requires_8_days ? canRequestTools() : true

  const requestToolAccess = async (tool: ToolFromDB) => {
    if (!user) return
    if (!canRequestForTool(tool)) {
      const daysRemaining = daysUntilCanRequest()
      toast.error(
        daysRemaining
          ? `Você poderá solicitar acesso em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}.`
          : 'Não foi possível verificar o período da sua assinatura.'
      )
      return
    }
    setSubmitting(true)
    try {
      const { data: ticketData, error: ticketError } = await (supabase as any)
        .from('support_tickets')
        .insert({
          user_id: user.id,
          ticket_type: 'tools_access',
          subject: `Solicitação de acesso: ${tool.name}`,
          status: 'open',
          priority: 'normal',
          tool_id: tool.id,
        })
        .select()
        .single()
      if (ticketError) throw ticketError
      await (supabase as any)
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: user.id,
          content: `Solicito acesso à ferramenta ${tool.name}.`,
        })
      toast.success('Solicitação enviada!')
      const { data: ticketsData } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('ticket_type', 'tools_access')
        .in('status', ['open', 'in_progress'])
      setPendingTickets(ticketsData || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar solicitação.')
    } finally {
      setSubmitting(false)
    }
  }

  // Solicitar acesso para ambas as ferramentas (legado canva/capcut)
  const requestToolsAccess = async () => {
    if (!user) return
    
    // Verificar se já passaram 8 dias (oitavo dia)
    if (!canRequestTools()) {
      const daysRemaining = daysUntilCanRequest()
      toast.error(
        daysRemaining 
          ? `Você poderá solicitar acesso às ferramentas em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}.`
          : 'Não foi possível verificar o período de sua assinatura. Entre em contato com o suporte.'
      )
      return
    }
    
    setSubmitting(true)

    try {
      // Determinar se é renovação ou primeira solicitação
      const isRenewal = hasAccessFromOldPeriod
      const subject = isRenewal 
        ? 'Solicitação de acesso às ferramentas Pro após renovação (Canva e CapCut)'
        : 'Solicitação de acesso às ferramentas Pro (Canva e CapCut)'
      const messageContent = isRenewal
        ? 'Olá! Minha assinatura foi renovada e gostaria de solicitar um novo acesso às ferramentas Canva Pro e CapCut Pro para este novo período. Aguardo instruções para receber as credenciais.'
        : 'Olá! Gostaria de solicitar acesso às ferramentas Canva Pro e CapCut Pro. Aguardo instruções para receber as credenciais.'

      // Criar ticket único para ambas as ferramentas
      const { data: ticketData, error: ticketError } = await (supabase as any)
        .from('support_tickets')
        .insert({
          user_id: user.id,
          ticket_type: 'tools_access',
          subject: subject,
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
          content: messageContent
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

      // Atualizar credenciais com flag de erro reportado
      const { error: updateError } = await (supabase as any)
        .from('tool_access_credentials')
        .update({
          error_reported: true,
          error_message: errorMessage.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', toolAccessData.id)

      if (updateError) throw updateError

      // Buscar ou criar ticket para este reporte
      // Primeiro, verificar se existe ticket aberto para este usuário e tipo
      const { data: existingTickets } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('ticket_type', 'tools_access')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)

      let ticketId: string

      if (existingTickets && existingTickets.length > 0) {
        // Reabrir ticket existente se estiver fechado, ou usar o aberto
        const existingTicket = existingTickets[0]
        if (existingTicket.status === 'closed' || existingTicket.status === 'resolved') {
          // Reabrir ticket fechado
          const { data: reopenedTicket, error: reopenError } = await (supabase as any)
            .from('support_tickets')
            .update({
              status: 'open',
              subject: `[REPORTE] ${existingTicket.subject} - Problema com ${reportingError === 'canva' ? 'Canva Pro' : 'CapCut Pro'}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTicket.id)
            .select()
            .single()

          if (reopenError) throw reopenError
          ticketId = reopenedTicket.id
        } else {
          ticketId = existingTicket.id
        }
      } else {
        // Criar novo ticket para o reporte
        const { data: newTicket, error: ticketError } = await (supabase as any)
          .from('support_tickets')
          .insert({
            user_id: user.id,
            ticket_type: 'tools_access',
            subject: `[REPORTE] Problema reportado com ${reportingError === 'canva' ? 'Canva Pro' : 'CapCut Pro'}`,
            status: 'open',
            priority: 'high'
          })
          .select()
          .single()

        if (ticketError) throw ticketError
        ticketId = newTicket.id
      }

      // Criar mensagem no ticket explicando o problema
      const { error: messageError } = await (supabase as any)
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          content: `[REPORTE DE PROBLEMA - ${reportingError === 'canva' ? 'Canva Pro' : 'CapCut Pro'}]\n\n${errorMessage.trim()}\n\nPor favor, envie novas credenciais de acesso.`
        })

      if (messageError) throw messageError

      toast.success('Erro reportado! Nossa equipe irá verificar e enviar uma nova conta. Um ticket foi criado para acompanhamento.')
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

  // Acesso às ferramentas: plano tem produtos do tipo ferramenta OU legado (apenas Pro)
  const hasToolsAccess = (toolsFromPlan.length > 0) || (isPro && hasActiveSubscription)

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

  // Layout dinâmico: ferramentas do plano (tabela tools)
  if (toolsFromPlan.length > 0) {
    const hasAccessForTool = (t: ToolFromDB) =>
      toolAccess.some(
        (acc) =>
          acc.is_active &&
          isAccessFromCurrentPeriod(acc) &&
          (acc.tool_id === t.id || acc.tool_type === t.slug)
      )
    const pendingForTool = (t: ToolFromDB) =>
      pendingTickets.some((tk: SupportTicket & { tool_id?: string }) => tk.tool_id === t.id)

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">Ferramentas</h1>
          <p className="text-gogh-grayDark">
            Ferramentas incluídas no seu plano. Solicite o acesso e use o vídeo tutorial quando disponível.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gogh-yellow/20 to-amber-100 rounded-xl p-5 border border-gogh-yellow/30"
        >
          <p className="text-sm text-gogh-grayDark">
            Ao solicitar acesso, nossa equipe liberará em até <strong>24 horas úteis</strong>. O link do vídeo tutorial aparece em cada ferramenta.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {toolsFromPlan.map((t, index) => {
            const hasAccess = hasAccessForTool(t)
            const accessData = toolAccess.find(
              (acc) => (acc.tool_id === t.id || acc.tool_type === t.slug) && isAccessFromCurrentPeriod(acc)
            )
            const videoUrl = t.tutorial_video_url || accessData?.tutorial_video_url
            const canRequest = canRequestForTool(t)
            const pending = pendingForTool(t)
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-gogh-yellow to-amber-500 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <Wrench className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t.name}</h3>
                      {hasAccess && (
                        <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Acesso liberado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {t.description && (
                    <p className="text-gogh-grayDark text-sm mb-4">{t.description}</p>
                  )}
                  {hasAccess && accessData?.access_link && (
                    <a
                      href={accessData.access_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 mb-3"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Acessar {t.name}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {videoUrl && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 mb-3"
                    >
                      <Play className="w-4 h-4" />
                      Ver tutorial
                    </a>
                  )}
                  {!hasAccess && (
                    <div className="mt-4">
                      {pending ? (
                        <p className="text-sm text-amber-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Solicitação em análise
                        </p>
                      ) : !canRequest && t.requires_8_days ? (
                        <button
                          type="button"
                          disabled
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-grayLight text-gogh-grayDark font-medium rounded-lg cursor-not-allowed border border-gogh-grayLight"
                        >
                          <Clock className="w-4 h-4" />
                          {countdownLabel() ? (
                            <>Aguardando: {countdownLabel()}</>
                          ) : (
                            <>Aguardando 8º dia da assinatura</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => requestToolAccess(t)}
                          disabled={submitting}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          Solicitar acesso
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
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

      {/* Tools Grid (legado: Canva / CapCut) */}
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
              {tool.hasAccess && tool.accessData && (() => {
                // Verificar se há novos acessos após reporte
                // Se error_reported era true mas foi atualizado recentemente (últimas 24h), mostrar indicativo
                const accessData = tool.accessData
                const updatedAt = accessData.updated_at ? new Date(accessData.updated_at) : null
                const grantedAt = accessData.access_granted_at ? new Date(accessData.access_granted_at) : null
                const hasNewAccess = updatedAt && grantedAt && updatedAt > grantedAt && 
                  (new Date().getTime() - updatedAt.getTime()) < (24 * 60 * 60 * 1000) // Últimas 24h
                const wasErrorReported = accessData.error_reported
                
                return (
                  <div className="space-y-3">
                    {tool.accessData.access_link && (
                      <div className="space-y-2">
                        {/* Alerta de Novos Acessos Após Reporte */}
                        {hasNewAccess && wasErrorReported && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-800">
                                  ✅ Novos Acessos Disponíveis!
                                </p>
                                <p className="text-xs text-emerald-600 mt-1">
                                  Nossa equipe atualizou suas credenciais após o reporte. Verifique os novos acessos abaixo.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Alerta de Erro Reportado */}
                        {tool.accessData.error_reported && !hasNewAccess && (
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
              )})()}
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
                    {(() => {
                      const daysRemaining = daysUntilCanRequest()
                      const subscriptionStartDate = subscription?.current_period_start 
                        ? new Date(subscription.current_period_start)
                        : (subscription as any)?.created_at 
                          ? new Date((subscription as any).created_at)
                          : null
                      const daysActive = subscriptionStartDate 
                        ? Math.floor((new Date().getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      
                      return !canRequestTools() ? (
                        <>
                          {daysRemaining !== null && daysRemaining > 0 && (
                            <div className="mt-3 p-3 bg-emerald-100 rounded-lg border border-emerald-300">
                              <p className="text-sm font-semibold text-emerald-900 mb-1">
                                ⏳ Faltam {daysRemaining} dia{daysRemaining > 1 ? 's' : ''} para você poder solicitar acesso às ferramentas
                              </p>
                              <div className="w-full bg-emerald-200 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, ((8 - daysRemaining) / 8) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-emerald-700 text-left">
                          Você já pode solicitar o novo acesso! Após a aprovação, você terá <strong>30 dias de uso</strong> das ferramentas.
                        </p>
                      )
                    })()}
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
                      <span className="font-medium">Aguarde para Solicitar Acesso</span>
                    </div>
                    <p className="text-sm text-blue-600 text-left mb-2">
                      O acesso às ferramentas Canva Pro e CapCut Pro será liberado após o <strong>oitavo dia</strong> da sua assinatura.
                    </p>
                    {(() => {
                      const daysRemaining = daysUntilCanRequest()
                      
                      return (
                        <>
                          {daysRemaining !== null && daysRemaining > 0 && (
                            <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
                              <p className="text-sm font-semibold text-blue-900 mb-1">
                                ⏳ Faltam {daysRemaining} dia{daysRemaining > 1 ? 's' : ''} para você poder solicitar acesso às ferramentas
                              </p>
                              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, ((8 - daysRemaining) / 8) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-blue-600 text-left mt-3">
                            Para mais informações sobre esta política, consulte nossos{' '}
                            <Link 
                              href="/termos-assinatura-planos" 
                              target="_blank"
                              className="underline font-medium text-blue-700 hover:text-blue-900"
                            >
                              Termos de Assinatura e Planos
                            </Link>.
                          </p>
                        </>
                      )
                    })()}
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
              {canvaVideoUrl && getYouTubeId(canvaVideoUrl) ? (() => {
                const containerClasses = getYouTubeContainerClasses(canvaVideoUrl)
                const embedUrl = getYouTubeEmbedUrl(canvaVideoUrl)
                return (
                  <div className={`${containerClasses.wrapper}`}>
                    <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
                      <div className="bg-black rounded-lg overflow-hidden">
                        <div className={`relative ${containerClasses.aspectRatio} bg-black`}>
                          <iframe
                            src={embedUrl || ''}
                            title="Tutorial de Ativação Canva Pro"
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })() : (
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
              {capcutVideoUrl && getYouTubeId(capcutVideoUrl) ? (() => {
                const containerClasses = getYouTubeContainerClasses(capcutVideoUrl)
                const embedUrl = getYouTubeEmbedUrl(capcutVideoUrl)
                return (
                  <div className={`${containerClasses.wrapper}`}>
                    <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
                      <div className="bg-black rounded-lg overflow-hidden">
                        <div className={`relative ${containerClasses.aspectRatio} bg-black`}>
                          <iframe
                            src={embedUrl || ''}
                            title="Tutorial de Ativação CapCut Pro"
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })() : (
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
