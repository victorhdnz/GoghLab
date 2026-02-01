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
  icon_url?: string | null
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
  const [reportingErrorToolName, setReportingErrorToolName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showCapcutCredentials, setShowCapcutCredentials] = useState(false)
  const [toolsFromPlan, setToolsFromPlan] = useState<ToolFromDB[]>([])
  const [tutorialModalTool, setTutorialModalTool] = useState<{ name: string; videoUrl: string } | null>(null)
  const [credentialsModal, setCredentialsModal] = useState<{ toolName: string; emailOrUser: string; password?: string } | null>(null)

  const isAccessLinkUrl = (s: string) => /^https?:\/\//i.test(s?.trim() ?? '')

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
          .in('status', ['open', 'in_progress', 'error'])

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
                .select('id, product_id, name, slug, description, tutorial_video_url, requires_8_days, order_position, products(icon_url)')
                .eq('is_active', true)
                .in('product_id', productIds)
                .order('order_position', { ascending: true })
              const toolsWithIcon = (toolsData || []).map((t: any) => ({
                id: t.id,
                product_id: t.product_id,
                name: t.name,
                slug: t.slug,
                description: t.description,
                tutorial_video_url: t.tutorial_video_url,
                requires_8_days: t.requires_8_days,
                order_position: t.order_position,
                icon_url: t.products?.icon_url ?? null,
              }))
              setToolsFromPlan(toolsWithIcon)
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
            .in('status', ['open', 'in_progress', 'error'])
          setPendingTickets(ticketsData || [])
        } catch (_) {}
      })()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [user])

  // Verificar se o acesso foi concedido no perÃ­odo atual ou anterior
  const isAccessFromCurrentPeriod = (access: ToolAccess): boolean => {
    if (!subscription?.current_period_start || !access.access_granted_at) return false
    
    const periodStart = new Date(subscription.current_period_start)
    const accessGranted = new Date(access.access_granted_at)
    
    // Se o acesso foi concedido apÃ³s o inÃ­cio do perÃ­odo atual, Ã© do perÃ­odo atual
    return accessGranted >= periodStart
  }

  // Verificar se jÃ¡ tem acesso do perÃ­odo atual ou ticket pendente
  const hasCanvaAccessCurrentPeriod = toolAccess.some(t => 
    t.tool_type === 'canva' && t.is_active && isAccessFromCurrentPeriod(t)
  )
  const hasCapcutAccessCurrentPeriod = toolAccess.some(t => 
    t.tool_type === 'capcut' && t.is_active && isAccessFromCurrentPeriod(t)
  )
  const hasBothAccessCurrentPeriod = hasCanvaAccessCurrentPeriod && hasCapcutAccessCurrentPeriod
  
  // Verificar se tem acesso de perÃ­odo anterior (para mostrar que pode solicitar novamente)
  const hasCanvaAccessOldPeriod = toolAccess.some(t => 
    t.tool_type === 'canva' && t.is_active && !isAccessFromCurrentPeriod(t)
  )
  const hasCapcutAccessOldPeriod = toolAccess.some(t => 
    t.tool_type === 'capcut' && t.is_active && !isAccessFromCurrentPeriod(t)
  )
  const hasAccessFromOldPeriod = hasCanvaAccessOldPeriod || hasCapcutAccessOldPeriod
  
  const hasPendingRequest = pendingTickets.length > 0

  // Verificar se jÃ¡ passaram 8 dias desde o inÃ­cio da assinatura (oitavo dia)
  // Funciona tanto para novos clientes quanto para renovaÃ§Ãµes
  const canRequestTools = () => {
    if (!subscription) return false
    
    // Buscar a data de inÃ­cio da assinatura
    // Prioridade: current_period_start (perÃ­odo atual) > created_at (data de criaÃ§Ã£o)
    let subscriptionStartDate: Date | null = null
    
    if (subscription.current_period_start) {
      subscriptionStartDate = new Date(subscription.current_period_start)
    } else if ((subscription as any).created_at) {
      // Fallback para created_at se current_period_start nÃ£o existir
      subscriptionStartDate = new Date((subscription as any).created_at)
    }
    
    if (!subscriptionStartDate) {
      // Se nÃ£o tem nenhuma data, retornar false
      return false
    }
    
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Oitavo dia = jÃ¡ passou o perÃ­odo de arrependimento de 7 dias
    // Funciona para novos clientes (primeira compra) e renovaÃ§Ãµes
    return daysSinceStart >= 8
  }

  // Calcular dias restantes atÃ© poder solicitar
  // Funciona tanto para novos clientes quanto para renovaÃ§Ãµes
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

  // Texto do countdown: dias e, quando no Ãºltimo dia, "X dia(s) e Y hora(s)" ou sÃ³ horas/min
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
    const hoursInLastDay = hoursRemaining % 24
    if (daysRemaining >= 1) {
      if (hoursInLastDay > 0) {
        return `${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} e ${hoursInLastDay} hora${hoursInLastDay > 1 ? 's' : ''} restante${daysRemaining > 1 || hoursInLastDay > 1 ? 's' : ''}`
      }
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
          ? `VocÃª poderÃ¡ solicitar acesso em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}.`
          : 'NÃ£o foi possÃ­vel verificar o perÃ­odo da sua assinatura.'
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
          subject: `SolicitaÃ§Ã£o de acesso: ${tool.name}`,
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
          content: `Solicito acesso Ã  ferramenta ${tool.name}.`,
        })
      toast.success('SolicitaÃ§Ã£o enviada!')
      const { data: ticketsData } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('ticket_type', 'tools_access')
        .in('status', ['open', 'in_progress'])
      setPendingTickets(ticketsData || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar solicitaÃ§Ã£o.')
    } finally {
      setSubmitting(false)
    }
  }

  // Solicitar acesso para ambas as ferramentas (legado canva/capcut)
  const requestToolsAccess = async () => {
    if (!user) return
    
    // Verificar se jÃ¡ passaram 8 dias (oitavo dia)
    if (!canRequestTools()) {
      const daysRemaining = daysUntilCanRequest()
      toast.error(
        daysRemaining 
          ? `VocÃª poderÃ¡ solicitar acesso Ã s ferramentas em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}.`
          : 'NÃ£o foi possÃ­vel verificar o perÃ­odo de sua assinatura. Entre em contato com o suporte.'
      )
      return
    }
    
    setSubmitting(true)

    try {
      // Determinar se Ã© renovaÃ§Ã£o ou primeira solicitaÃ§Ã£o
      const isRenewal = hasAccessFromOldPeriod
      const subject = isRenewal 
        ? 'SolicitaÃ§Ã£o de acesso Ã s ferramentas Pro apÃ³s renovaÃ§Ã£o (Canva e CapCut)'
        : 'SolicitaÃ§Ã£o de acesso Ã s ferramentas Pro (Canva e CapCut)'
      const messageContent = isRenewal
        ? 'OlÃ¡! Minha assinatura foi renovada e gostaria de solicitar um novo acesso Ã s ferramentas Canva Pro e CapCut Pro para este novo perÃ­odo. Aguardo instruÃ§Ãµes para receber as credenciais.'
        : 'OlÃ¡! Gostaria de solicitar acesso Ã s ferramentas Canva Pro e CapCut Pro. Aguardo instruÃ§Ãµes para receber as credenciais.'

      // Criar ticket Ãºnico para ambas as ferramentas
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
          content_name: 'SolicitaÃ§Ã£o de Acesso Ã s Ferramentas Pro'
        })
      }

      toast.success('SolicitaÃ§Ã£o enviada! VocÃª receberÃ¡ o acesso em atÃ© 24 horas apÃ³s a aprovaÃ§Ã£o.')
      
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
      toast.error('Erro ao enviar solicitaÃ§Ã£o. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const reportLinkError = async (toolType: string, toolName?: string) => {
    if (!user) return
    setReportingError(toolType)
    setReportingErrorToolName(toolName ?? (toolType === 'canva' ? 'Canva Pro' : toolType === 'capcut' ? 'CapCut Pro' : toolType))
    setShowErrorModal(true)
  }

  const submitErrorReport = async () => {
    if (!user || !reportingError || !errorMessage.trim()) return

    try {
      const toolAccessData = toolAccess.find(t => t.tool_type === reportingError || t.tool_id === reportingError)
      if (!toolAccessData) {
        toast.error('Acesso nÃ£o encontrado')
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
      // Primeiro, verificar se existe ticket aberto para este usuÃ¡rio e tipo
      const toolName = reportingErrorToolName || (reportingError === 'canva' ? 'Canva Pro' : reportingError === 'capcut' ? 'CapCut Pro' : reportingError)

      const { data: existingTickets } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('ticket_type', 'tools_access')
        .in('status', ['open', 'in_progress', 'error'])
        .order('created_at', { ascending: false })
        .limit(1)

      let ticketId: string

      if (existingTickets && existingTickets.length > 0) {
        const existingTicket = existingTickets[0]
        if (existingTicket.status === 'closed' || existingTicket.status === 'resolved') {
          const { data: reopenedTicket, error: reopenError } = await (supabase as any)
            .from('support_tickets')
            .update({
              status: 'error',
              subject: `[REPORTE] Problema na conta - ${toolName}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTicket.id)
            .select()
            .single()

          if (reopenError) throw reopenError
          ticketId = reopenedTicket.id
        } else {
          ticketId = existingTicket.id
          await (supabase as any)
            .from('support_tickets')
            .update({ status: 'error', subject: `[REPORTE] Problema na conta - ${toolName}`, updated_at: new Date().toISOString() })
            .eq('id', existingTicket.id)
        }
      } else {
        const { data: newTicket, error: ticketError } = await (supabase as any)
          .from('support_tickets')
          .insert({
            user_id: user.id,
            ticket_type: 'tools_access',
            subject: `[REPORTE] Problema na conta - ${toolName}`,
            status: 'error',
            priority: 'high'
          })
          .select()
          .single()

        if (ticketError) throw ticketError
        ticketId = newTicket.id
      }

      const { error: messageError } = await (supabase as any)
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          content: `[REPORTE DE PROBLEMA - ${toolName}]\n\n${errorMessage.trim()}\n\nPor favor, envie novas credenciais de acesso.`
        })

      if (messageError) throw messageError

      toast.success('Enviado para a equipe. Em breve entraremos em contato para resolver.')
      setShowErrorModal(false)
      setErrorMessage('')
      setReportingError(null)
      setReportingErrorToolName('')

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
      description: 'Crie designs profissionais com templates premium, elementos exclusivos e recursos avanÃ§ados de ediÃ§Ã£o.',
      icon: Palette,
      color: 'from-purple-500 to-indigo-600',
      hasAccess: hasCanvaAccessCurrentPeriod, // Apenas acesso do perÃ­odo atual
      accessData: toolAccess.find(t => t.tool_type === 'canva' && isAccessFromCurrentPeriod(t)),
      features: [
        'Templates premium ilimitados',
        'RemoÃ§Ã£o de fundo com 1 clique',
        'Kit de marca',
        'Magic Resize',
        '100GB de armazenamento'
      ]
    },
    {
      id: 'capcut',
      name: 'CapCut Pro',
      description: 'Editor de vÃ­deo profissional com efeitos avanÃ§ados, templates virais e sem marca d\'Ã¡gua.',
      icon: Scissors,
      color: 'from-emerald-500 to-teal-600',
      hasAccess: hasCapcutAccessCurrentPeriod, // Apenas acesso do perÃ­odo atual
      accessData: toolAccess.find(t => t.tool_type === 'capcut' && isAccessFromCurrentPeriod(t)),
      features: [
        'Sem marca d\'Ã¡gua',
        'Efeitos e transiÃ§Ãµes premium',
        'Templates de tendÃªncia',
        'Legendas automÃ¡ticas',
        'ExportaÃ§Ã£o em 4K'
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
              <h3 className="font-semibold text-amber-900 mb-2">Assinatura NecessÃ¡ria</h3>
              <p className="text-amber-800 mb-4">
                Você precisa de uma assinatura ativa para acessar as ferramentas do seu plano.
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

  // Acesso Ã s ferramentas: plano tem produtos do tipo ferramenta OU legado (apenas Pro)
  const hasToolsAccess = (toolsFromPlan.length > 0) || (isPro && hasActiveSubscription)

  // Se nÃ£o for Pro, mostrar tela de bloqueio similar Ã  de cursos
  if (!hasToolsAccess && hasActiveSubscription) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
            Ferramentas Pro
          </h1>
          <p className="text-gogh-grayDark">
            Acesse as melhores ferramentas de criaÃ§Ã£o incluÃ­das na sua assinatura.
          </p>
        </div>

        {/* Banner de Upgrade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <p className="text-amber-800">
            As ferramentas Pro sÃ£o exclusivas para o plano Pro. <Link href="/#pricing" className="font-medium underline">FaÃ§a upgrade agora</Link>
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
                FaÃ§a upgrade para o plano Pro e tenha acesso completo Ã s ferramentas Canva Pro e CapCut Pro.
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

  // Layout dinÃ¢mico: ferramentas do plano (tabela tools)
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
    const hasOldPeriodAccessForTool = (t: ToolFromDB) =>
      toolAccess.some(
        (acc) =>
          acc.is_active &&
          !isAccessFromCurrentPeriod(acc) &&
          (acc.tool_id === t.id || acc.tool_type === t.slug)
      )

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">Ferramentas</h1>
          <p className="text-gogh-grayDark">
            Ferramentas incluÃ­das no seu plano. Solicite o acesso e use o vÃ­deo tutorial quando disponÃ­vel.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gogh-yellow/20 to-amber-100 rounded-xl p-5 border border-gogh-yellow/30"
        >
          <p className="text-sm text-gogh-grayDark">
            Ao solicitar acesso, nossa equipe liberarÃ¡ em atÃ© <strong>24 horas Ãºteis</strong>. O link do vÃ­deo tutorial aparece em cada ferramenta.
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
            const ticketForTool = pendingTickets.find((tk: SupportTicket & { tool_id?: string; subject?: string; status?: string }) => tk.tool_id === t.id)
            const isReportPending = !!ticketForTool && (ticketForTool.status === 'error' || (ticketForTool.subject && String(ticketForTool.subject).includes('[REPORTE]')))
            const hasNewCredentials = accessData?.updated_at && accessData?.access_granted_at && new Date(accessData.updated_at).getTime() > new Date(accessData.access_granted_at).getTime()
            const hasOldPeriodAccess = hasOldPeriodAccessForTool(t)
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
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {t.icon_url ? (
                        <img src={t.icon_url} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Wrench className="w-8 h-8" />
                      )}
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
                    isAccessLinkUrl(accessData.access_link) ? (
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
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCredentialsModal({
                          toolName: t.name,
                          emailOrUser: accessData.access_link ?? '',
                          password: accessData.password,
                        })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 mb-3"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Ver credenciais - {t.name}
                      </button>
                    )
                  )}
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setTutorialModalTool({ name: t.name, videoUrl })}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 mb-3"
                    >
                      <Play className="w-4 h-4" />
                      Ver tutorial
                    </button>
                  )}
                  {hasAccess && (accessData?.access_link || accessData?.password) && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => reportLinkError(t.slug, t.name)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        {hasNewCredentials ? 'Reportar novamente' : 'Reportar Erro na Conta'}
                      </button>
                      {hasNewCredentials && (
                        <p className="text-xs text-emerald-600 mt-1.5 text-center">
                          Problema jÃ¡ foi atendido; use o botÃ£o acima se precisar reportar de novo.
                        </p>
                      )}
                    </div>
                  )}
                  {!hasAccess && (
                    <div className="mt-4">
                      {hasOldPeriodAccess && (
                        <div className="rounded-lg p-3 border border-emerald-200 bg-emerald-50 mb-3">
                          <p className="text-sm text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            RenovaÃ§Ã£o detectada â€“ solicite o novo acesso para esta ferramenta.
                          </p>
                        </div>
                      )}
                      {pending ? (
                        <div className="rounded-lg p-3 border border-amber-200 bg-amber-50">
                          <p className="text-sm text-amber-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            {isReportPending ? 'Problema reportado â€“ em anÃ¡lise pela equipe' : 'SolicitaÃ§Ã£o em anÃ¡lise'}
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            {isReportPending ? 'Entraremos em contato em breve.' : 'VocÃª receberÃ¡ o acesso em atÃ© 24 horas Ãºteis.'}
                          </p>
                        </div>
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
                            <>Aguardando 8Âº dia da assinatura</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => requestToolAccess(t)}
                          disabled={submitting}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          {hasOldPeriodAccess ? 'Solicitar novo acesso' : 'Solicitar acesso'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Modal de Credenciais (ferramentas dinÃ¢micas: email/usuÃ¡rio + senha) */}
        {credentialsModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setCredentialsModal(null)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gogh-beige-light to-amber-50 rounded-xl shadow-xl border border-amber-200/80 max-w-md w-full p-4 md:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-bold text-gogh-black">
                  Credenciais - {credentialsModal.toolName}
                </h3>
                <button
                  onClick={() => setCredentialsModal(null)}
                  className="text-gogh-grayDark hover:text-gogh-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>DuraÃ§Ã£o:</strong> O acesso Ã© vÃ¡lido por <strong>30 dias</strong> a partir da liberaÃ§Ã£o.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gogh-grayDark mb-2">Email / UsuÃ¡rio:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={credentialsModal.emailOrUser}
                      readOnly
                      className="flex-1 px-4 py-2 border border-amber-200 rounded-lg bg-white/80 font-mono text-sm text-gogh-black"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialsModal.emailOrUser)
                        toast.success('Email/UsuÃ¡rio copiado!')
                      }}
                      className="px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/90 text-sm font-medium"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                {credentialsModal.password != null && credentialsModal.password !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-gogh-grayDark mb-2">Senha:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={credentialsModal.password}
                        readOnly
                        className="flex-1 px-4 py-2 border border-amber-200 rounded-lg bg-white/80 font-mono text-sm text-gogh-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(credentialsModal.password!)
                          toast.success('Senha copiada!')
                        }}
                        className="px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/90 text-sm font-medium"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gogh-grayDark">
                  Use essas credenciais para fazer login. VocÃª pode copiar cada campo. Se encontrar algum problema, use &quot;Reportar Erro na Conta&quot;.
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setCredentialsModal(null)}
                  className="w-full px-4 py-2 border border-amber-300 text-gogh-black rounded-lg hover:bg-amber-50/80 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de VÃ­deo Tutorial (ferramentas dinÃ¢micas) */}
        {tutorialModalTool && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setTutorialModalTool(null)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gogh-beige-light to-amber-50 rounded-xl shadow-xl border border-amber-200/80 max-w-sm w-full p-4 md:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-bold text-gogh-black">
                  Tutorial - {tutorialModalTool.name}
                </h3>
                <button
                  onClick={() => setTutorialModalTool(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative max-w-sm mx-auto">
                {tutorialModalTool.videoUrl && getYouTubeId(tutorialModalTool.videoUrl) ? (() => {
                  const containerClasses = getYouTubeContainerClasses(tutorialModalTool.videoUrl)
                  const embedUrl = getYouTubeEmbedUrl(tutorialModalTool.videoUrl)
                  return (
                    <div className={`${containerClasses.wrapper}`}>
                      <div className="bg-gradient-to-br from-gogh-yellow/10 to-gogh-yellow/5 p-1 rounded-xl">
                        <div className="bg-black rounded-lg overflow-hidden">
                          <div className={`relative ${containerClasses.aspectRatio} bg-black`}>
                            <iframe
                              src={embedUrl || ''}
                              title={`Tutorial - ${tutorialModalTool.name}`}
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
                    <p className="text-white text-sm">VÃ­deo nÃ£o disponÃ­vel</p>
                  </div>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-600 mt-4">
                Assista ao tutorial para aprender a entrar na conta e utilizar a ferramenta.
              </p>
            </motion.div>
          </div>
        )}

        {/* Modal de Reporte de Erro (ferramentas dinÃ¢micas) */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gogh-beige-light to-amber-50 rounded-xl shadow-xl border border-amber-200/80 max-w-md w-full p-6"
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
                    setReportingErrorToolName('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gogh-grayDark mb-4">
                Descreva o problema que vocÃª encontrou com a conta (ex: conta com menos dias de duraÃ§Ã£o, credenciais nÃ£o funcionam, etc.):
              </p>
              <textarea
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="Ex: A conta tem menos de 30 dias, as credenciais nÃ£o funcionam, preciso de uma nova conta, etc..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow resize-none"
                rows={4}
              />
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowErrorModal(false)
                    setErrorMessage('')
                    setReportingError(null)
                    setReportingErrorToolName('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
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

  // Sem ferramentas no plano: empty state (nÃ£o mostrar Canva/CapCut legado)
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">Ferramentas</h1>
        <p className="text-gogh-grayDark">
          Ferramentas incluÃ­das no seu plano. Solicite o acesso e use o vÃ­deo tutorial quando disponÃ­vel.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gogh-grayLight shadow-sm p-8 text-center"
      >
        <Wrench className="w-16 h-16 text-gogh-grayLight mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gogh-black mb-2">Nenhuma ferramenta no momento</h3>
        <p className="text-gogh-grayDark max-w-md mx-auto">
          NÃ£o hÃ¡ ferramentas configuradas no seu plano. As ferramentas sÃ£o definidas pelo administrador conforme seu plano.
        </p>
      </motion.div>
    </div>
  )
}

