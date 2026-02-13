'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  RefreshCw,
  AlertCircle,
  Sparkles,
  Trash2
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import ReactMarkdown from 'react-markdown'

interface AIAgent {
  id: string
  slug: string
  name: string
  description: string | null
  avatar_url: string | null
  system_prompt: string
  model: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  user_id: string
  agent_id: string
  title: string
  ai_agents: AIAgent
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string
  
  const { user, profile, subscription, isPro, hasActiveSubscription, loading: authLoading } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number } | null>(null)
  const [nicheProfile, setNicheProfile] = useState<any>(null)
  const [showNicheModal, setShowNicheModal] = useState(false)
  const [nicheProfileLoaded, setNicheProfileLoaded] = useState(false)
  const [shouldSendNicheContext, setShouldSendNicheContext] = useState(false)
  const [isSendingNicheContext, setIsSendingNicheContext] = useState(false)
  const nicheContextSentRef = useRef(false)
  const hasQuotaErrorRef = useRef(false) // Flag para evitar recarregamentos quando há erro de saldo
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Scroll para o final das mensagens
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Função para verificar se o perfil de nicho está completo
  const isNicheProfileComplete = useCallback((profile: any): boolean => {
    if (!profile) return false
    
    // Verificar todos os campos obrigatórios
    if (!profile.business_name?.trim()) return false
    if (!profile.niche?.trim()) return false
    if (!profile.target_audience?.trim()) return false
    if (!profile.brand_voice?.trim()) return false
    if (!profile.goals?.trim()) return false
    if (!profile.content_pillars || !Array.isArray(profile.content_pillars) || profile.content_pillars.length === 0) return false
    if (!profile.platforms || !Array.isArray(profile.platforms) || profile.platforms.length === 0) return false
    
    return true
  }, [])

  // Função para construir contexto do nicho
  const buildNicheContext = useCallback((profile: any): string => {
    let context = '=== CONTEXTO DO MEU NEGÓCIO ===\n\n'
    
    // Informações básicas do negócio
    if (profile.business_name) {
      context += `📌 NOME DO NEGÓCIO/MARCA:\n${profile.business_name}\n\n`
    }
    
    if (profile.niche) {
      context += `🎯 NICHO/ÁREA DE ATUAÇÃO:\n${profile.niche}\n\n`
    }
    
    // Público-alvo
    if (profile.target_audience) {
      context += `👥 PÚBLICO-ALVO:\n${profile.target_audience}\n\n`
    }
    
    // Tom de voz
    if (profile.brand_voice) {
      const brandVoiceLabels: { [key: string]: string } = {
        'profissional': 'Profissional (Formal, técnico, corporativo)',
        'casual': 'Casual (Descontraído, amigável, acessível)',
        'inspirador': 'Inspirador (Motivacional, energético, positivo)',
        'educativo': 'Educativo (Didático, informativo, detalhado)',
        'humoristico': 'Humorístico (Divertido, leve, com humor)',
        'autoridade': 'Autoridade (Expert, confiante, referência)'
      }
      context += `💬 TOM DE VOZ DA MARCA:\n${brandVoiceLabels[profile.brand_voice] || profile.brand_voice}\n\n`
    }
    
    // Pilares de conteúdo
    if (profile.content_pillars && Array.isArray(profile.content_pillars) && profile.content_pillars.length > 0) {
      context += `📚 PILARES DE CONTEÚDO (Temas principais que abordo):\n${profile.content_pillars.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}\n\n`
    }
    
    // Plataformas
    if (profile.platforms && Array.isArray(profile.platforms) && profile.platforms.length > 0) {
      context += `📱 PLATAFORMAS QUE UTILIZO:\n${profile.platforms.join(', ')}\n\n`
    }
    
    // Objetivos
    if (profile.goals) {
      context += `🎯 OBJETIVOS PRINCIPAIS:\n${profile.goals}\n\n`
    }
    
    // Contexto adicional
    if (profile.additional_context) {
      context += `ℹ️ INFORMAÇÕES ADICIONAIS IMPORTANTES:\n${profile.additional_context}\n\n`
    }
    
    context += '=== INSTRUÇÕES PARA O AGENTE ===\n\n'
    context += 'Use TODAS essas informações acima para:\n'
    context += '1. Personalizar completamente suas respostas e sugestões\n'
    context += '2. Adaptar o tom de voz conforme especificado\n'
    context += '3. Considerar o público-alvo em todas as recomendações\n'
    context += '4. Focar nos pilares de conteúdo mencionados\n'
    context += '5. Considerar as plataformas que utilizo\n'
    context += '6. Alinhar tudo com os objetivos do negócio\n\n'
    context += 'Agora estou pronto para começar a trabalhar com você!'
    
    return context
  }, [])

  // Função para enviar contexto do nicho automaticamente na primeira mensagem
  const sendInitialNicheContext = useCallback(async (conv: any, profile: any) => {
    // Evitar múltiplas chamadas
    if (nicheContextSentRef.current || !user || !conv) {
      console.log('[Niche Context] Cancelado:', { 
        alreadySent: nicheContextSentRef.current, 
        hasUser: !!user, 
        hasConv: !!conv 
      })
      return
    }
    
    // Verificar se já está enviando
    if (isSending) {
      console.log('[Niche Context] Já está enviando, aguardando...')
      // Aguardar um pouco e tentar novamente
      setTimeout(() => {
        if (!nicheContextSentRef.current && user && conv) {
          sendInitialNicheContext(conv, profile)
        }
      }, 1000)
      return
    }
    
    nicheContextSentRef.current = true
    console.log('[Niche Context] Iniciando envio do contexto do nicho')

    const nicheContext = buildNicheContext(profile)
    setIsSendingNicheContext(true) // Indicador visual de que está enviando contexto
    setIsSending(true)
    setError(null)

    try {
      // Aguardar mais tempo para garantir que os cookies estejam prontos
      // E que o usuário esteja completamente autenticado
      await new Promise(resolve => setTimeout(resolve, 2000)) // Aumentado para 2 segundos

      console.log('[Niche Context] Enviando requisição para API...')
      
      // Chamar API de chat
      // IMPORTANTE: skipUsageCount = true para não contar a primeira mensagem do nicho
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANTE: Garantir que cookies sejam enviados
        body: JSON.stringify({
          conversationId: conv.id,
          message: nicheContext,
          agentId: conv.agent_id,
          skipUsageCount: true // Não contar como uso - é apenas configuração do agente
        })
      })

      const data = await response.json()
      
      console.log('[Niche Context] Resposta da API:', { 
        status: response.status, 
        ok: response.ok,
        error: data.error 
      })

      if (!response.ok) {
        // Verificar se é erro de saldo/quota
        const isQuotaError = data.code === 'OPENAI_INSUFFICIENT_QUOTA' || 
                            data.error?.includes('insufficient_quota') ||
                            data.error?.includes('muitas solicitações') ||
                            response.status === 402
        
        if (isQuotaError) {
          hasQuotaErrorRef.current = true
          setError('Estamos recebendo muitas solicitações no momento. Por favor, tente novamente mais tarde.')
          console.error('[Niche Context] Erro de saldo detectado, evitando novas tentativas')
        } else if (response.status === 403) {
          setError('Assinatura não encontrada. Configure sua assinatura para usar os agentes de IA.')
        } else if (response.status === 401) {
          setError('Erro de autenticação. Faça login novamente.')
          // Não resetar flag em caso de erro de autenticação - deixar para o usuário resolver
          console.error('[Niche Context] Erro de autenticação - usuário precisa fazer login novamente')
        } else {
          setError(data.error || 'Erro ao enviar contexto do perfil')
          // Resetar flag em caso de outros erros para permitir nova tentativa
          nicheContextSentRef.current = false
        }
        throw new Error(data.error || 'Erro ao enviar contexto do perfil')
      }

      console.log('[Niche Context] Contexto enviado com sucesso!')
      
      // Atualizar mensagens
      setMessages([data.userMessage, data.assistantMessage])

      // NÃO atualizar uso - a mensagem de contexto do nicho não conta como uso
      // O usoInfo já está correto, não precisa incrementar
      console.log('[Niche Context] Uso não incrementado - mensagem de contexto não conta')
    } catch (error: any) {
      console.error('[Niche Context] Erro ao enviar contexto:', error)
      setError(error.message || 'Erro ao enviar contexto do perfil')
      // Resetar flag em caso de erro para permitir nova tentativa (exceto erro de auth)
      if (error.message?.includes('autenticação') || error.message?.includes('login')) {
        // Não resetar em caso de erro de autenticação
        console.log('[Niche Context] Erro de autenticação detectado, não resetando flag')
      } else {
        nicheContextSentRef.current = false
      }
    } finally {
      setIsSendingNicheContext(false) // Remover indicador visual
      setIsSending(false)
    }
  }, [user, buildNicheContext, isPro, isSending])

  // Buscar dados da conversa
  useEffect(() => {
    // Não recarregar se houver erro de saldo (quota)
    if (hasQuotaErrorRef.current) {
      console.log('[Chat] Erro de saldo detectado, evitando recarregamento')
      return
    }

    const fetchConversation = async () => {
      if (!user || !conversationId) return
      setIsLoading(true)

      try {
        // Buscar conversa com agente
        const { data: convData, error: convError } = await (supabase as any)
          .from('ai_conversations')
          .select(`
            *,
            ai_agents (*)
          `)
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single()

        if (convError) throw convError
        if (!convData) {
          router.push('/membro/agentes')
          return
        }

        setConversation(convData as unknown as Conversation)

        // Buscar mensagens
        const { data: messagesData, error: messagesError } = await (supabase as any)
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (messagesError) throw messagesError
        setMessages(messagesData || [])

        // Buscar perfil de nicho
        const { data: nicheData } = await (supabase as any)
          .from('user_niche_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        setNicheProfile(nicheData)
        setNicheProfileLoaded(true)

        // Verificar se o perfil está completo
        const profileComplete = isNicheProfileComplete(nicheData)

        // Se não tem perfil configurado OU perfil incompleto, mostrar modal
        if ((!nicheData || !profileComplete) && (!messagesData || messagesData.length === 0)) {
          setShowNicheModal(true)
        } else if (nicheData && profileComplete && (!messagesData || messagesData.length === 0) && !nicheContextSentRef.current) {
          // Se tem perfil mas não há mensagens, enviar automaticamente o contexto
          // Aguardar que o AuthContext termine de carregar e o usuário esteja autenticado
          console.log('[Chat] Preparando para enviar contexto do nicho automaticamente...')
          const waitForAuth = async () => {
            let attempts = 0
            const maxAttempts = 10
            while (attempts < maxAttempts) {
              const { data: { user: currentUser } } = await supabase.auth.getUser()
              if (currentUser && !authLoading) { // `authLoading` from AuthContext
                console.log('[Chat] Usuário autenticado e AuthContext carregado. Enviando contexto do nicho agora...')
                sendInitialNicheContext(convData, nicheData)
                return
              }
              await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
              attempts++
            }
            console.warn('[Chat] Timeout: Não foi possível enviar contexto do nicho automaticamente. Usuário não autenticado ou AuthContext não carregou.')
          }
          waitForAuth()
        }

        // Buscar uso diário POR AGENTE (hoje)
        // IMPORTANTE: Cada agente tem seu próprio limite
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Usar agent_id da conversa para buscar uso específico do agente
        const agentIdForUsage = convData.agent_id
        const featureKeyForAgent = `ai_interactions_${agentIdForUsage}`

        const { data: usageData } = await (supabase as any)
          .from('user_usage')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('feature_key', featureKeyForAgent)
          .gte('period_start', today.toISOString().split('T')[0])
          .maybeSingle()

        // Limites diários POR AGENTE: Essencial = 8, Pro = 20
        const limit = isPro ? 20 : 8
        setUsageInfo({
          current: usageData?.usage_count || 0,
          limit: limit
        })
      } catch (error: any) {
        console.error('Error fetching conversation:', error)
        setError('Erro ao carregar conversa')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversation()
    // Resetar flags quando a conversa mudar
    nicheContextSentRef.current = false
    hasQuotaErrorRef.current = false // Resetar flag de erro de saldo quando mudar de conversa
  }, [conversationId, user, subscription, isNicheProfileComplete, sendInitialNicheContext, authLoading, isPro, supabase, router])

  // Verificar perfil quando a página ganha foco (usuário voltou de outra página)
  useEffect(() => {
    const handleFocus = async () => {
      if (!user || !nicheProfileLoaded) return
      
      try {
        const { data: nicheData } = await (supabase as any)
          .from('user_niche_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        setNicheProfile(nicheData)
        
        // Verificar se o perfil está completo
        const profileComplete = isNicheProfileComplete(nicheData)
        
        // Se o perfil não estiver completo e não houver mensagens, mostrar modal
        if ((!nicheData || !profileComplete) && messages.length === 0) {
          setShowNicheModal(true)
        } else {
          // Se o perfil estiver completo agora, fechar o modal
          setShowNicheModal(false)
        }
      } catch (error) {
        console.error('Error checking niche profile:', error)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, nicheProfileLoaded, messages.length, isNicheProfileComplete, supabase])

  // Resetar flag de erro de saldo quando a página perde/ganha foco
  // Isso permite que o usuário tente novamente quando voltar
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Quando a página perde foco, limpar erro e resetar flag
        // Assim quando voltar, se tentar novamente e ainda houver erro, aparecerá novamente
        if (hasQuotaErrorRef.current) {
          hasQuotaErrorRef.current = false
          setError(null)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Scroll quando mensagens mudam
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!inputValue.trim() || isSending || !user || !conversation) return

    // Verificar se o perfil de nicho está completo
    const profileComplete = isNicheProfileComplete(nicheProfile)
    if (!profileComplete) {
      setShowNicheModal(true)
      setError('Por favor, complete seu perfil de nicho antes de enviar mensagens.')
      return
    }

    // Verificar limite de uso ANTES de enviar
    if (usageInfo && usageInfo.current >= usageInfo.limit) {
      setError('Você atingiu o limite de interações de hoje. Volte amanhã ou faça upgrade para aumentar o limite.')
      return
    }

    let userMessage = inputValue.trim()
    
    // Se for a primeira mensagem e tiver perfil de nicho, adicionar contexto automaticamente
    // Usar a flag para verificar se já foi enviado contexto (não confiar em messages.length)
    const isFirstMessage = !nicheContextSentRef.current && messages.length === 0
    if (nicheProfile && isFirstMessage) {
      const nicheContext = buildNicheContext(nicheProfile)
      userMessage = `${nicheContext}\n\nAgora, sobre minha solicitação: ${userMessage}`
      nicheContextSentRef.current = true // Marcar como enviado
      console.log('[Chat] Contexto do nicho incluído na primeira mensagem')
    }
    
    setInputValue('')
    setIsSending(true)
    setError(null)

    // Adicionar mensagem do usuário otimisticamente (mostrar apenas o texto do usuário, não o contexto completo)
    const displayMessage = nicheProfile && isFirstMessage 
      ? inputValue.trim() // Mostrar apenas o que o usuário digitou
      : userMessage // Mostrar a mensagem completa
    
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: displayMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      // Verificar autenticação antes de enviar
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('[Chat] Erro ao verificar usuário antes de enviar:', userError)
        setError('Erro de autenticação. Faça login novamente.')
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
        return
      }
      
      console.log('[Chat] Usuário verificado antes de enviar:', currentUser.id)
      console.log('[Chat] Enviando mensagem para API...', { 
        conversationId: conversation.id,
        messageLength: userMessage.length,
        hasNicheContext: nicheProfile && isFirstMessage
      })
      
      // Chamar API de chat
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Garantir que cookies sejam enviados
        body: JSON.stringify({
          conversationId: conversation.id,
          message: userMessage,
          agentId: conversation.agent_id,
          skipUsageCount: false // Mensagens normais contam como uso
        })
      })
      
      console.log('[Chat] Resposta da API recebida:', { 
        status: response.status, 
        ok: response.ok 
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[Chat] Erro na resposta da API:', {
          status: response.status,
          error: data.error,
          details: data.details
        })
        
        // Tratar diferentes tipos de erro
        if (response.status === 403) {
          setError('Assinatura não encontrada. Configure sua assinatura para usar os agentes de IA.')
        } else if (response.status === 401) {
          setError('Erro de autenticação. Faça login novamente.')
          // Se for erro de autenticação, resetar flag para permitir nova tentativa
          nicheContextSentRef.current = false
        } else if (response.status === 402 && data.code === 'OPENAI_INSUFFICIENT_QUOTA') {
          // Erro específico de quota da OpenAI esgotada - mensagem sobre muitos usuários
          setError(data.error || 'Estamos recebendo muitas solicitações no momento. Por favor, aguarde alguns instantes e tente novamente. O agente estará disponível em breve.')
        } else if (response.status === 429) {
          // Pode ser limite do usuário ou rate limit da OpenAI
          if (data.code === 'OPENAI_RATE_LIMIT') {
            setError(data.error || 'Limite de requisições excedido. Tente novamente em alguns instantes.')
          } else {
            // Limite de uso do usuário atingido
            setError(data.error || 'Você atingiu o limite de interações de hoje. Volte amanhã ou faça upgrade para aumentar o limite.')
            // Atualizar usageInfo para refletir o limite atingido
            if (usageInfo) {
              setUsageInfo(prev => prev ? { ...prev, current: prev.limit } : null)
            }
          }
        } else {
          setError(data.error || 'Erro ao enviar mensagem')
        }
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }
      
      console.log('[Chat] Mensagem enviada com sucesso!')

      // Atualizar mensagens com as reais do banco
      setMessages(prev => [
        ...prev.filter(m => !m.id.startsWith('temp-')),
        data.userMessage,
        data.assistantMessage
      ])

      // Se a mensagem foi enviada com sucesso, resetar flag de erro de saldo
      // Isso permite que o usuário tente novamente se o saldo foi restaurado
      hasQuotaErrorRef.current = false
      setError(null) // Limpar qualquer erro anterior

      // Atualizar uso após envio bem-sucedido
      if (usageInfo) {
        const newUsage = usageInfo.current + 1
        setUsageInfo(prev => prev ? { ...prev, current: newUsage } : null)
        
        // Se atingiu o limite, mostrar mensagem
        if (newUsage >= usageInfo.limit) {
          setError(`Você atingiu o limite de interações de hoje para o agente "${conversation.ai_agents.name}". Volte amanhã ou faça upgrade para aumentar o limite.`)
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      
      // Verificar se é erro de saldo/quota da OpenAI
      const isQuotaError = error.message?.includes('insufficient_quota') || 
                          error.message?.includes('muitas solicitações') ||
                          error.message?.includes('OPENAI_INSUFFICIENT_QUOTA') ||
                          error.code === 'OPENAI_INSUFFICIENT_QUOTA'
      
      if (isQuotaError) {
        // Marcar flag para evitar recarregamentos
        hasQuotaErrorRef.current = true
        setError('Estamos recebendo muitas solicitações no momento. Por favor, tente novamente mais tarde.')
      } else {
        setError(error.message || 'Erro ao enviar mensagem')
      }
      
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }


  // Handler para Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LumaSpin size="default" className="mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando conversa...</p>
        </div>
      </div>
    )
  }

  // Verificar se tem assinatura ativa
  if (!hasActiveSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gogh-black mb-2">
            Assinatura Necessária
          </h3>
          <p className="text-gogh-grayDark mb-4">
            Você precisa de uma assinatura ativa para usar os agentes de IA.
            {subscription && subscription.current_period_end && new Date(subscription.current_period_end) < new Date() && (
              <span className="block mt-2 font-medium text-amber-600">
                Sua assinatura expirou em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}. Renove sua assinatura para continuar usando.
              </span>
            )}
          </p>
          <Link 
            href="/precos" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-lg hover:bg-gogh-yellow/80 transition-colors"
          >
            Ver planos (é necessário ter um plano para usar)
          </Link>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gogh-black mb-2">
          Conversa não encontrada
        </h3>
        <Link href="/membro/agentes" className="text-gogh-yellow hover:underline">
          Voltar para os agentes
        </Link>
      </div>
    )
  }

  const agent = conversation.ai_agents

  return (
    <>
      {/* Modal para configurar perfil de nicho - OBRIGATÓRIO */}
      {showNicheModal && nicheProfileLoaded && (() => {
        const profileExists = !!nicheProfile
        const profileComplete = isNicheProfileComplete(nicheProfile)
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gogh-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gogh-black" />
                </div>
                <h3 className="text-xl font-bold text-gogh-black mb-2">
                  {profileExists && !profileComplete ? 'Complete seu Perfil' : 'Configure seu Perfil'}
                </h3>
                <p className="text-gogh-grayDark mb-2">
                  {profileExists && !profileComplete ? (
                    <>
                      Seu perfil de nicho está <strong>incompleto</strong>. Para que os agentes de IA possam te ajudar da melhor forma, é <strong>obrigatório</strong> preencher todos os campos do perfil.
                    </>
                  ) : (
                    <>
                      Para que os agentes de IA possam te ajudar da melhor forma, é <strong>obrigatório</strong> configurar seu perfil de nicho primeiro.
                    </>
                  )}
                </p>
                <p className="text-sm text-gogh-grayDark">
                  Após {profileExists && !profileComplete ? 'completar' : 'configurar'}, o agente será treinado automaticamente com suas informações.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/conta"
                  className="flex-1 px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/80 transition-colors text-center font-medium"
                  onClick={() => setShowNicheModal(false)}
                >
                  {profileExists && !profileComplete ? 'Completar Perfil' : 'Configurar Agora'}
                </Link>
              </div>
            </motion.div>
          </div>
        )
      })()}

      <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gogh-grayLight mb-4">
        <Link
          href="/membro/agentes"
          className="p-2 hover:bg-gogh-grayLight rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gogh-grayDark" />
        </Link>
        
        <div className="w-12 h-12 bg-gradient-to-br from-gogh-yellow to-amber-500 rounded-xl flex items-center justify-center">
          <Bot className="w-6 h-6 text-gogh-black" />
        </div>
        
        <div className="flex-1">
          <h1 className="font-semibold text-gogh-black">{agent.name}</h1>
          <p className="text-sm text-gogh-grayDark truncate">{agent.description}</p>
        </div>

        {/* Usage Info */}
        {usageInfo && (
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            usageInfo.current >= usageInfo.limit
              ? 'bg-amber-100 border border-amber-300'
              : 'bg-gogh-grayLight/50'
          }`}>
            <Sparkles className={`w-4 h-4 ${
              usageInfo.current >= usageInfo.limit
                ? 'text-amber-600'
                : 'text-gogh-yellow'
            }`} />
            <span className={`text-sm ${
              usageInfo.current >= usageInfo.limit
                ? 'text-amber-800 font-medium'
                : 'text-gogh-grayDark'
            }`}>
              {usageInfo.current}/{usageInfo.limit} interações hoje
              {usageInfo.current >= usageInfo.limit && ' (Limite atingido)'}
            </span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {/* Indicador de envio automático do contexto do nicho */}
        {isSendingNicheContext && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 py-4"
          >
            <LumaSpin size="sm" />
            <span className="text-sm text-gogh-grayDark">
              Configurando o agente com suas informações do perfil... (não desconta do seu limite diário)
            </span>
          </motion.div>
        )}

        {/* Welcome Message */}
        {messages.length === 0 && !isSendingNicheContext && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gogh-yellow to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bot className="w-10 h-10 text-gogh-black" />
            </div>
            <h2 className="text-xl font-semibold text-gogh-black mb-2">
              Olá! Sou o {agent.name}
            </h2>
            <p className="text-gogh-grayDark max-w-md mx-auto mb-6">
              {agent.description}
            </p>
            <p className="text-sm text-gogh-grayDark">
              Como posso ajudar você hoje?
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-gogh-yellow to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-gogh-black" />
                </div>
              )}
              
              <div
                className={`
                  max-w-[80%] rounded-2xl px-4 py-3
                  ${message.role === 'user'
                    ? 'bg-gogh-black text-white rounded-br-md'
                    : 'bg-white border border-gogh-grayLight rounded-bl-md'
                  }
                `}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-gogh-black">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        code: ({ children }) => (
                          <code className="bg-gogh-grayLight px-1.5 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gogh-grayLight rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gogh-grayDark" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-gogh-yellow to-amber-500 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-gogh-black" />
            </div>
            <div className="bg-white border border-gogh-grayLight rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gogh-grayDark rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gogh-grayDark rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gogh-grayDark rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 mb-2">{error}</p>
              {hasQuotaErrorRef.current && (
                <p className="text-xs text-red-600 mt-2">
                  Você pode tentar novamente mais tarde. Se o problema persistir, entre em contato com o suporte.
                </p>
              )}
            </div>
            <button
              onClick={() => {
                hasQuotaErrorRef.current = false
                setError(null)
              }}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
              aria-label="Fechar mensagem de erro"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Mensagem de limite atingido */}
      {usageInfo && usageInfo.current >= usageInfo.limit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-1">
                Limite de interações atingido
              </h4>
              <p className="text-sm text-amber-800">
                Você utilizou todas as {usageInfo.limit} interações disponíveis hoje. O limite será renovado amanhã. Para aumentar seu limite diário, considere fazer upgrade para o plano Pro.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="pt-4 border-t border-gogh-grayLight">
        <div className={`relative bg-white border rounded-xl shadow-sm transition-all ${
          usageInfo && usageInfo.current >= usageInfo.limit
            ? 'border-amber-300 bg-amber-50/30'
            : 'border-gogh-grayLight focus-within:border-gogh-yellow focus-within:shadow-md'
        }`}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              usageInfo && usageInfo.current >= usageInfo.limit
                ? 'Limite de interações atingido para hoje'
                : `Mensagem para ${agent.name}...`
            }
            rows={1}
            className="w-full px-4 py-3 pr-12 bg-transparent resize-none focus:outline-none max-h-32 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ minHeight: '48px' }}
            disabled={isSending || (usageInfo !== null && usageInfo.current >= usageInfo.limit)}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isSending || (usageInfo !== null && usageInfo.current >= usageInfo.limit)}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all
              ${inputValue.trim() && !isSending && (!usageInfo || usageInfo.current < usageInfo.limit)
                ? 'bg-gogh-yellow text-gogh-black hover:bg-gogh-yellow/80'
                : 'bg-gogh-grayLight text-gogh-grayDark cursor-not-allowed'
              }
            `}
          >
            {isSending ? (
              <LumaSpin size="sm" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Mobile Usage Info */}
        {usageInfo && (
          <div className={`md:hidden flex items-center justify-center gap-2 mt-2 text-sm ${
            usageInfo.current >= usageInfo.limit
              ? 'text-amber-700 font-medium'
              : 'text-gogh-grayDark'
          }`}>
            <Sparkles className={`w-3 h-3 ${usageInfo.current >= usageInfo.limit ? 'text-amber-600' : 'text-gogh-yellow'}`} />
            <span>
              {usageInfo.current}/{usageInfo.limit} interações hoje
              {usageInfo.current >= usageInfo.limit && ' (Limite atingido)'}
            </span>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

