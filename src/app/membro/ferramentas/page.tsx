'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
import { LumaSpin } from '@/components/ui/luma-spin'
import { GlowingShadow } from '@/components/ui/glowing-shadow'
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
  const pathname = usePathname()
  const router = useRouter()
  const isPublicRoute = pathname === '/ferramentas'
  const { user, subscription, hasActiveSubscription, isPro, loading: authLoading } = useAuth()
  const [toolAccess, setToolAccess] = useState<ToolAccess[]>([])
  const [publicTools, setPublicTools] = useState<ToolFromDB[]>([])
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
    if (authLoading) return
    if (!hasActiveSubscription) {
      router.replace('/precos')
    }
  }, [authLoading, hasActiveSubscription, router])

  // Lista de ferramentas para exibir em modo público (sem login) ou quando não tem assinatura
  useEffect(() => {
    if (user && hasActiveSubscription) return
    const loadPublicTools = async () => {
      try {
        const { data: toolsData } = await (supabase as any)
          .from('tools')
          .select('id, product_id, name, slug, description, tutorial_video_url, requires_8_days, order_position, products(icon_url)')
          .eq('is_active', true)
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
        setPublicTools(toolsWithIcon)
      } catch (_) {
        setPublicTools([])
      }
    }
    loadPublicTools()
  }, [user, hasActiveSubscription])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

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

  // 8 dias exatos em ms (tanto Stripe quanto liberação manual: sempre 8 dias desde current_period_start)
  const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000

  const getSubscriptionStart = (): Date | null => {
    if (!subscription) return null
    if (subscription.current_period_start) return new Date(subscription.current_period_start)
    if ((subscription as any).created_at) return new Date((subscription as any).created_at)
    return null
  }

  // Verificar se já passaram exatamente 8 dias desde o início da assinatura
  // Funciona tanto para compra pela Stripe quanto para liberação manual (current_period_start)
  const canRequestTools = () => {
    const start = getSubscriptionStart()
    if (!start) return false
    const now = new Date()
    return now.getTime() - start.getTime() >= EIGHT_DAYS_MS
  }

  // Calcular dias restantes até poder solicitar (exatamente 8 dias desde o início)
  const daysUntilCanRequest = (): number | null => {
    const start = getSubscriptionStart()
    if (!start) return null
    const endTime = start.getTime() + EIGHT_DAYS_MS
    const msRemaining = endTime - Date.now()
    if (msRemaining <= 0) return 0
    return Math.ceil(msRemaining / (24 * 60 * 60 * 1000))
  }

  // Texto do countdown: exatamente 8 dias desde o início do período (8 dias cravados)
  const countdownLabel = (): string | null => {
    const start = getSubscriptionStart()
    if (!start) return null
    const endTime = start.getTime() + EIGHT_DAYS_MS
    const msRemaining = endTime - Date.now()
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
        const updatePayload: Record<string, unknown> = {
          status: 'error',
          subject: `[REPORTE] Problema na conta - ${toolName}`,
          updated_at: new Date().toISOString()
        }
        if (toolAccessData.tool_id) updatePayload.tool_id = toolAccessData.tool_id
        if (existingTicket.status === 'closed' || existingTicket.status === 'resolved') {
          const { data: reopenedTicket, error: reopenError } = await (supabase as any)
            .from('support_tickets')
            .update(updatePayload)
            .eq('id', existingTicket.id)
            .select()
            .single()

          if (reopenError) throw reopenError
          ticketId = reopenedTicket.id
        } else {
          ticketId = existingTicket.id
          await (supabase as any)
            .from('support_tickets')
            .update(updatePayload)
            .eq('id', existingTicket.id)
        }
      } else {
        const insertPayload: Record<string, unknown> = {
          user_id: user.id,
          ticket_type: 'tools_access',
          subject: `[REPORTE] Problema na conta - ${toolName}`,
          status: 'error',
          priority: 'high'
        }
        if (toolAccessData.tool_id) insertPayload.tool_id = toolAccessData.tool_id
        const { data: newTicket, error: ticketError } = await (supabase as any)
          .from('support_tickets')
          .insert(insertPayload)
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
          content: `[REPORTE DE PROBLEMA - ${toolName}]\n\n${errorMessage.trim()}`
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

      const { data: ticketsData } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'in_progress', 'error'])
        .order('created_at', { ascending: false })

      setPendingTickets(ticketsData || [])
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

  if (authLoading || !hasActiveSubscription || (loading && user)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LumaSpin size="default" className="mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando ferramentas...</p>
        </div>
      </div>
    )
  }

  // Modo público: ver ferramentas sem login; ao tentar usar, pedir login ou assinatura
  const displayToolsForPreview = publicTools.length > 0 ? publicTools : []
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">Ferramentas</h1>
          <p className="text-gogh-grayDark">
            Ferramentas incluídas nos planos. Faça login e assine para solicitar acesso e usar.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gogh-yellow/20 to-amber-100 rounded-xl p-5 border border-gogh-yellow/30"
        >
          <p className="text-sm text-gogh-grayDark">
            Você está vendo o catálogo de ferramentas. Para solicitar acesso e usar, <strong>assine um plano</strong>.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {displayToolsForPreview.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl"
            >
              <GlowingShadow className="rounded-xl">
                <div className="bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden p-6">
                  <div className="flex items-center gap-4 mb-3">
                    {t.icon_url ? (
                      <img src={t.icon_url} alt="" className="w-14 h-14 rounded-xl object-contain" />
                    ) : (
                      <div className="w-14 h-14 bg-gogh-yellow/20 rounded-xl flex items-center justify-center">
                        <Wrench className="w-7 h-7 text-gogh-grayDark" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gogh-black">{t.name}</h3>
                  </div>
                  <p className="text-gogh-grayDark text-sm mb-4">{t.description || 'Ferramenta incluída no plano.'}</p>
                  <Link
                    href="/precos"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 transition-colors text-sm"
                  >
                    Ver planos para solicitar acesso
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </GlowingShadow>
            </motion.div>
          ))}
        </div>
        {displayToolsForPreview.length === 0 && (
          <p className="text-center text-gogh-grayDark">Nenhuma ferramenta configurada no momento.</p>
        )}
      </div>
    )
  }

  // Logado mas sem assinatura: mostrar visual e redirecionar para planos ao tentar usar
  if (!hasActiveSubscription) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">Ferramentas</h1>
          <p className="text-gogh-grayDark">
            Ferramentas incluídas nos planos. Assine um plano para solicitar acesso e usar.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Assinatura necessária para usar</h3>
              <p className="text-amber-800 mb-4">
                Você já está logado. Para solicitar acesso e usar as ferramentas, assine um plano.
              </p>
              <Link
                href="/precos"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/80 transition-colors"
              >
                Ver planos e assinar
              </Link>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {displayToolsForPreview.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl"
            >
              <GlowingShadow className="rounded-xl">
                <div className="bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden p-6">
                  <div className="flex items-center gap-4 mb-3">
                    {t.icon_url ? (
                      <img src={t.icon_url} alt="" className="w-14 h-14 rounded-xl object-contain" />
                    ) : (
                      <div className="w-14 h-14 bg-gogh-yellow/20 rounded-xl flex items-center justify-center">
                        <Wrench className="w-7 h-7 text-gogh-grayDark" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gogh-black">{t.name}</h3>
                  </div>
                  <p className="text-gogh-grayDark text-sm mb-4">{t.description || 'Ferramenta incluída no plano.'}</p>
                  <Link
                    href="/precos"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 transition-colors text-sm"
                  >
                    Assinar para usar
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </GlowingShadow>
            </motion.div>
          ))}
        </div>
        {displayToolsForPreview.length === 0 && (
          <p className="text-center text-gogh-grayDark">Nenhuma ferramenta configurada no momento.</p>
        )}
      </div>
    )
  }

  // Acesso às ferramentas: plano tem produtos do tipo ferramenta OU legado (apenas Pro)
  const hasToolsAccess = (toolsFromPlan.length > 0) || (isPro && hasActiveSubscription)

  // Se não for Pro, mostrar tela de bloqueio similar à de cursos
  if (!hasToolsAccess && hasActiveSubscription) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
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
            As ferramentas Pro são exclusivas para o plano Pro. <Link href="/precos" className="font-medium underline">Faça upgrade agora</Link>
          </p>
        </motion.div>

        {/* Tools Grid com Overlay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative">
          {/* Overlay de bloqueio */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
            <div className="text-center p-4 sm:p-6 md:p-8">
              <Wrench className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gogh-black mb-2">
                Ferramentas Exclusivas do Plano Pro
              </h3>
              <p className="text-gogh-grayDark mb-6 max-w-md">
                Faça upgrade para o plano Pro e tenha acesso completo às ferramentas Canva Pro e CapCut Pro.
              </p>
              <Link
                href="/precos"
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
    const hasOldPeriodAccessForTool = (t: ToolFromDB) =>
      toolAccess.some(
        (acc) =>
          acc.is_active &&
          !isAccessFromCurrentPeriod(acc) &&
          (acc.tool_id === t.id || acc.tool_type === t.slug)
      )

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-6 pb-8">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gogh-black mb-1">Ferramentas</h1>
          <p className="text-sm text-gogh-grayDark">
            Ferramentas incluídas no seu plano. Solicite o acesso e use o vídeo tutorial quando disponível.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gogh-yellow/20 to-amber-100 rounded-lg p-3 sm:p-4 border border-gogh-yellow/30"
        >
          <p className="text-xs sm:text-sm text-gogh-grayDark">
            Ao solicitar acesso, nossa equipe liberará em até <strong>24 horas úteis</strong>.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
            const hasNewCredentials = accessData?.updated_at && accessData?.access_granted_at && new Date(accessData.updated_at).getTime() > new Date(accessData.access_granted_at).getTime() && !accessData?.error_reported
            const hasOldPeriodAccess = hasOldPeriodAccessForTool(t)
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg"
              >
                <GlowingShadow className="rounded-lg">
                  <div className="bg-white rounded-lg border border-gogh-grayLight shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gogh-yellow to-amber-500 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {t.icon_url ? (
                            <img src={t.icon_url} alt="" className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold truncate">{t.name}</h3>
                          {hasAccess && (
                            <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Acesso liberado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 pb-5">
                  <div className="mb-3 min-h-[86px]">
                    {hasAccess && hasNewCredentials ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                        <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          Suas credenciais foram atualizadas pela equipe. Problema resolvido.
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          Use o botão &quot;Reportar novamente&quot; abaixo se precisar reportar outro problema.
                        </p>
                      </div>
                    ) : (
                      <div aria-hidden className="h-full" />
                    )}
                  </div>
                  {t.description && (
                    <p className="text-gogh-grayDark text-sm mb-3">{t.description}</p>
                  )}
                  {hasAccess && accessData?.access_link && (
                    isAccessLinkUrl(accessData.access_link) ? (
                      <a
                        href={accessData.access_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 mb-2"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Acessar {t.name}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCredentialsModal({
                          toolName: t.name,
                          emailOrUser: accessData.access_link ?? '',
                          password: accessData.password,
                        })}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 mb-2"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Ver credenciais - {t.name}
                      </button>
                    )
                  )}
                  {hasAccess && videoUrl && (
                    <button
                      type="button"
                      onClick={() => setTutorialModalTool({ name: t.name, videoUrl })}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 mb-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Ver tutorial
                    </button>
                  )}
                  {hasAccess && (accessData?.access_link || accessData?.password) && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => reportLinkError(t.slug, t.name)}
                        disabled={isReportPending}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isReportPending ? 'Reporte em análise' : hasNewCredentials ? 'Reportar novamente' : 'Reportar Erro na Conta'}
                      </button>
                    </div>
                  )}
                  {!hasAccess && (
                    <div className="mt-3">
                      {hasOldPeriodAccess && (
                        <div className="rounded-lg p-2.5 border border-emerald-200 bg-emerald-50 mb-2">
                          <p className="text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            Renovação detectada – solicite o novo acesso para esta ferramenta.
                          </p>
                        </div>
                      )}
                      {pending ? (
                        <div className="rounded-lg p-2.5 border border-amber-200 bg-amber-50">
                          <p className="text-xs sm:text-sm text-amber-800 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            {isReportPending ? 'Problema reportado – em análise pela equipe' : 'Solicitação em análise'}
                          </p>
                          <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5">
                            {isReportPending ? 'Entraremos em contato em breve.' : 'Você receberá o acesso em até 24 horas úteis.'}
                          </p>
                        </div>
                      ) : !canRequest && t.requires_8_days ? (
                        <button
                          type="button"
                          disabled
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-gogh-grayLight text-gogh-grayDark font-medium rounded-lg cursor-not-allowed border border-gogh-grayLight"
                        >
                          <Clock className="w-3.5 h-3.5" />
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
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/90 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {hasOldPeriodAccess ? 'Solicitar novo acesso' : 'Solicitar acesso'}
                        </button>
                      )}
                    </div>
                  )}
                    </div>
                  </div>
                </GlowingShadow>
              </motion.div>
            )
          })}
        </div>

        {/* Modal de Credenciais (ferramentas dinâmicas: email/usuário + senha) */}
        {credentialsModal && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[260] p-4"
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
                    <strong>Duração:</strong> O acesso é válido por <strong>30 dias</strong> a partir da liberação.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gogh-grayDark mb-2">Email / Usuário:</label>
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
                        toast.success('Email/Usuário copiado!')
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
                  Use essas credenciais para fazer login. Você pode copiar cada campo. Se encontrar algum problema, use &quot;Reportar Erro na Conta&quot;.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Vídeo Tutorial (ferramentas dinâmicas) */}
        {tutorialModalTool && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[260] p-4"
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
                    <p className="text-white text-sm">Vídeo não disponível</p>
                  </div>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-600 mt-4">
                Assista ao tutorial para aprender a entrar na conta e utilizar a ferramenta.
              </p>
            </motion.div>
          </div>
        )}

        {/* Modal de Reporte de Erro (ferramentas dinâmicas) */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[260] p-4">
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

  // Sem ferramentas no plano: empty state (não mostrar Canva/CapCut legado)
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
        className="bg-white rounded-xl border border-gogh-grayLight shadow-sm p-4 sm:p-6 md:p-8 text-center"
      >
        <Wrench className="w-16 h-16 text-gogh-grayLight mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gogh-black mb-2">Nenhuma ferramenta no momento</h3>
        <p className="text-gogh-grayDark max-w-md mx-auto">
          Não há ferramentas configuradas no seu plano. As ferramentas são definidas pelo administrador conforme seu plano.
        </p>
      </motion.div>
    </div>
  )
}

