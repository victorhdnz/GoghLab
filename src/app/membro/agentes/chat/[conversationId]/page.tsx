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
  Loader2, 
  Bot, 
  User, 
  RefreshCw,
  AlertCircle,
  Sparkles,
  Trash2
} from 'lucide-react'
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
  
  const { user, profile, subscription, isPro } = useAuth()
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
  const nicheContextSentRef = useRef(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Scroll para o final das mensagens
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Função para construir contexto do nicho
  const buildNicheContext = useCallback((profile: any): string => {
    let context = 'INFORMAÇÕES DO MEU PERFIL:\n\n'
    
    if (profile.business_name) {
      context += `Nome do negócio: ${profile.business_name}\n`
    }
    if (profile.niche) {
      context += `Nicho: ${profile.niche}\n`
    }
    if (profile.target_audience) {
      context += `Público-alvo: ${profile.target_audience}\n`
    }
    if (profile.brand_voice) {
      context += `Tom de voz: ${profile.brand_voice}\n`
    }
    if (profile.content_pillars && Array.isArray(profile.content_pillars) && profile.content_pillars.length > 0) {
      context += `Pilares de conteúdo: ${profile.content_pillars.join(', ')}\n`
    }
    if (profile.platforms && Array.isArray(profile.platforms) && profile.platforms.length > 0) {
      context += `Plataformas que uso: ${profile.platforms.join(', ')}\n`
    }
    if (profile.goals) {
      context += `Objetivos: ${profile.goals}\n`
    }
    if (profile.additional_context) {
      context += `Contexto adicional: ${profile.additional_context}\n`
    }
    
    context += '\nUse essas informações para personalizar suas respostas e sugestões. Agora estou pronto para começar a trabalhar com você!'
    return context
  }, [])

  // Função para enviar contexto do nicho automaticamente na primeira mensagem
  const sendInitialNicheContext = useCallback(async (conv: any, profile: any) => {
    // Evitar múltiplas chamadas
    if (nicheContextSentRef.current || !user || !conv) return
    
    // Verificar se já está enviando
    if (isSending) {
      // Aguardar um pouco e tentar novamente
      setTimeout(() => {
        if (!nicheContextSentRef.current && user && conv) {
          sendInitialNicheContext(conv, profile)
        }
      }, 500)
      return
    }
    
    nicheContextSentRef.current = true

    const nicheContext = buildNicheContext(profile)
    setIsSending(true)
    setError(null)

    try {
      // Aguardar um pouco para garantir que os cookies estejam prontos
      await new Promise(resolve => setTimeout(resolve, 200))

      // Chamar API de chat
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: conv.id,
          message: nicheContext,
          agentId: conv.agent_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Se for erro de assinatura, não mostrar como erro de autenticação
        if (response.status === 403) {
          setError('Assinatura não encontrada. Configure sua assinatura para usar os agentes de IA.')
        } else if (response.status === 401) {
          setError('Erro de autenticação. Faça login novamente.')
        } else {
          setError(data.error || 'Erro ao enviar contexto do perfil')
        }
        throw new Error(data.error || 'Erro ao enviar contexto do perfil')
      }

      // Atualizar mensagens
      setMessages([data.userMessage, data.assistantMessage])

      // Atualizar uso
      setUsageInfo(prev => prev ? { ...prev, current: (prev.current || 0) + 1 } : { current: 1, limit: isPro ? 20 : 8 })
    } catch (error: any) {
      console.error('Error sending niche context:', error)
      setError(error.message || 'Erro ao enviar contexto do perfil')
      // Resetar flag em caso de erro para permitir nova tentativa
      nicheContextSentRef.current = false
    } finally {
      setIsSending(false)
    }
  }, [user, buildNicheContext, isPro, isSending])

  // Buscar dados da conversa
  useEffect(() => {
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

        // Se não tem perfil configurado e não há mensagens, mostrar modal
        if (!nicheData && (!messagesData || messagesData.length === 0)) {
          setShowNicheModal(true)
        } else if (nicheData && (!messagesData || messagesData.length === 0) && !nicheContextSentRef.current) {
          // Se tem perfil mas não há mensagens, enviar automaticamente o contexto
          // Usar setTimeout para evitar chamada durante o render
          setTimeout(() => {
            sendInitialNicheContext(convData, nicheData)
          }, 100)
        }

        // Buscar uso diário (hoje)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: usageData } = await (supabase as any)
          .from('user_usage')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('feature_key', 'ai_interactions')
          .gte('period_start', today.toISOString().split('T')[0])
          .maybeSingle()

        // Limites diários: Essencial = 8, Pro = 20
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
    // Resetar flag quando a conversa mudar
    nicheContextSentRef.current = false
  }, [conversationId, user, subscription])

  // Scroll quando mensagens mudam
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!inputValue.trim() || isSending || !user || !conversation) return

    // Verificar limite de uso
    if (usageInfo && usageInfo.current >= usageInfo.limit) {
      setError('Você atingiu o limite de interações de hoje. Volte amanhã ou faça upgrade para aumentar o limite.')
      return
    }

    let userMessage = inputValue.trim()
    
    // Se for a primeira mensagem e tiver perfil de nicho, adicionar contexto automaticamente
    if (nicheProfile && messages.length === 0) {
      const nicheContext = buildNicheContext(nicheProfile)
      userMessage = `${nicheContext}\n\nAgora, sobre minha solicitação: ${userMessage}`
    }
    
    setInputValue('')
    setIsSending(true)
    setError(null)

    // Adicionar mensagem do usuário otimisticamente
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      // Chamar API de chat
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Garantir que cookies sejam enviados
        body: JSON.stringify({
          conversationId: conversation.id,
          message: userMessage,
          agentId: conversation.agent_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Tratar diferentes tipos de erro
        if (response.status === 403) {
          setError('Assinatura não encontrada. Configure sua assinatura para usar os agentes de IA.')
        } else if (response.status === 401) {
          setError('Erro de autenticação. Faça login novamente.')
        } else if (response.status === 429) {
          setError(data.error || 'Você atingiu o limite de interações de hoje.')
        } else {
          setError(data.error || 'Erro ao enviar mensagem')
        }
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      // Atualizar mensagens com as reais do banco
      setMessages(prev => [
        ...prev.filter(m => !m.id.startsWith('temp-')),
        data.userMessage,
        data.assistantMessage
      ])

      // Atualizar uso
      if (usageInfo) {
        setUsageInfo(prev => prev ? { ...prev, current: prev.current + 1 } : null)
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      setError(error.message || 'Erro ao enviar mensagem')
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gogh-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando conversa...</p>
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
      {/* Modal para configurar perfil de nicho */}
      {showNicheModal && nicheProfileLoaded && (
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
                Configure seu Perfil
              </h3>
              <p className="text-gogh-grayDark">
                Para que os agentes de IA possam te ajudar da melhor forma, configure seu perfil de nicho primeiro.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNicheModal(false)}
                className="flex-1 px-4 py-2 border border-gogh-grayLight rounded-lg text-gogh-grayDark hover:bg-gogh-grayLight transition-colors"
              >
                Depois
              </button>
              <Link
                href="/membro/perfil"
                className="flex-1 px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg hover:bg-gogh-yellow/80 transition-colors text-center font-medium"
              >
                Configurar Agora
              </Link>
            </div>
          </motion.div>
        </div>
      )}

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
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gogh-grayLight/50 rounded-lg">
            <Sparkles className="w-4 h-4 text-gogh-yellow" />
            <span className="text-sm text-gogh-grayDark">
              {usageInfo.current}/{usageInfo.limit} interações hoje
            </span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {/* Welcome Message */}
        {messages.length === 0 && (
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
          className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="pt-4 border-t border-gogh-grayLight">
        <div className="relative bg-white border border-gogh-grayLight rounded-xl shadow-sm focus-within:border-gogh-yellow focus-within:shadow-md transition-all">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Mensagem para ${agent.name}...`}
            rows={1}
            className="w-full px-4 py-3 pr-12 bg-transparent resize-none focus:outline-none max-h-32"
            style={{ minHeight: '48px' }}
            disabled={isSending}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isSending}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all
              ${inputValue.trim() && !isSending
                ? 'bg-gogh-yellow text-gogh-black hover:bg-gogh-yellow/80'
                : 'bg-gogh-grayLight text-gogh-grayDark cursor-not-allowed'
              }
            `}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Mobile Usage Info */}
        {usageInfo && (
          <div className="md:hidden flex items-center justify-center gap-2 mt-2 text-sm text-gogh-grayDark">
            <Sparkles className="w-3 h-3 text-gogh-yellow" />
            <span>{usageInfo.current}/{usageInfo.limit} interações hoje</span>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

