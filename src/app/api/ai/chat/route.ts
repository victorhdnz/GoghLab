import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Forçar renderização dinâmica para garantir que cookies sejam lidos corretamente
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // IMPORTANTE: Autenticar PRIMEIRO (como na API de upload que funciona)
    // Isso garante que os cookies sejam lidos corretamente
    const supabase = createRouteHandlerClient()

    // Tentar getSession primeiro (mais tolerante)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[AI Chat] Sessão obtida:', session ? `Sim (user: ${session.user.id})` : 'Não', sessionError ? `Erro: ${sessionError.message}` : '')
    
    // Verificar autenticação usando getUser() que é mais confiável em API routes
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[AI Chat] Tentativa de autenticação:', {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      sessionError: sessionError?.message,
      authError: authError?.message
    })
    
    if (authError) {
      console.error('[AI Chat] Erro de autenticação no chat:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        hasSession: !!session
      })
      return NextResponse.json({ 
        error: 'Erro de autenticação. Faça login novamente.',
        details: process.env.NODE_ENV === 'development' ? authError.message : undefined
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('[AI Chat] Usuário não autenticado no chat')
      return NextResponse.json({ 
        error: 'Não autenticado. Faça login para usar o chat.' 
      }, { status: 401 })
    }
    
    console.log('[AI Chat] Usuário autenticado com sucesso:', user.id)

    // AGORA ler o body após autenticação
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('[AI Chat] Erro ao ler body da request:', error)
      return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 400 })
    }
    
    const { conversationId, message, agentId, skipUsageCount } = body

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    // Verificar se a chave da OpenAI está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada')
      return NextResponse.json({ 
        error: 'API da OpenAI não configurada. Entre em contato com o suporte.',
        code: 'OPENAI_NOT_CONFIGURED'
      }, { status: 500 })
    }

    // Inicializar OpenAI dentro da função para evitar erro no build
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Verificar se a conversa pertence ao usuário
    type ConversationData = {
      id: string
      user_id: string
      agent_id: string
      title: string | null
      created_at: string
      updated_at: string
      ai_agents: {
        id: string
        slug: string
        name: string
        description: string | null
        avatar_url: string | null
        system_prompt: string
        model: string
        is_active: boolean
        is_premium: boolean
        order_position: number
        created_at: string
        updated_at: string
      }
    }

    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*, ai_agents(*)')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError) {
      console.error('[AI Chat] Erro ao buscar conversa:', convError)
      // Se for erro de RLS/permissão, dar mensagem mais específica
      if (convError.code === 'PGRST301' || convError.message?.includes('permission') || convError.message?.includes('policy')) {
        return NextResponse.json({ 
          error: 'Erro de permissão. Verifique se a conversa pertence a você.',
          details: process.env.NODE_ENV === 'development' ? convError.message : undefined
        }, { status: 403 })
      }
      return NextResponse.json({ 
        error: 'Conversa não encontrada',
        details: process.env.NODE_ENV === 'development' ? convError.message : undefined
      }, { status: 404 })
    }
    
    const conversationData = conversation as ConversationData | null
    
    if (!conversationData) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Verificar assinatura ativa (aceita planos Stripe e manuais)
    // Planos manuais não têm stripe_subscription_id (é NULL), então aceitamos ambos
    type SubscriptionData = {
      plan_id: string
      status: string
      current_period_end: string
      current_period_start: string
      stripe_subscription_id: string | null
    }
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end, current_period_start, stripe_subscription_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    const subscriptionData = subscription as SubscriptionData | null

    console.log('[AI Chat] Verificação de assinatura:', {
      found: !!subscriptionData,
      planId: subscriptionData?.plan_id,
      status: subscriptionData?.status,
      hasStripeId: !!subscriptionData?.stripe_subscription_id,
      currentPeriodEnd: subscriptionData?.current_period_end,
      isManual: !subscriptionData?.stripe_subscription_id,
      error: subError ? subError.message : null
    })

    // Se encontrou assinatura, verificar se está dentro do período válido
    let hasValidSubscription = false
    if (subscriptionData) {
      // Regra única para Stripe e manual: acesso só até current_period_end.
      // Isso garante que liberações manuais expirem automaticamente no fim do prazo.
      const now = new Date()
      const periodEnd = new Date(subscriptionData.current_period_end)
      hasValidSubscription = periodEnd >= now

      console.log('[AI Chat] Validação de período:', {
        now: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
        isManual: subscriptionData.stripe_subscription_id === null,
        isValid: hasValidSubscription
      })

      if (!hasValidSubscription) {
        console.log('[AI Chat] Assinatura encontrada mas período expirado')
      }
    } else {
      console.log('[AI Chat] Nenhuma assinatura ativa encontrada - permitindo uso com limite padrão')
    }

    // Verificar limite de uso diário POR AGENTE
    // IMPORTANTE: Cada agente tem seu próprio limite diário
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Usar agent_id da conversa para rastrear uso por agente
    const agentIdForUsage = conversationData.ai_agents.id
    const featureKeyForAgent = `ai_interactions_${agentIdForUsage}`

    type UsageData = {
      usage_count: number
    }

    const { data: usageData } = await supabase
      .from('user_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', featureKeyForAgent)
      .gte('period_start', today.toISOString().split('T')[0])
      .maybeSingle()

    const usageDataTyped = usageData as UsageData | null
    const currentUsage = usageDataTyped?.usage_count || 0
    // Limites diários POR AGENTE: Pro = 20, Essencial ou sem assinatura = 8
    // Aceita planos manuais e Stripe
    const limit = (hasValidSubscription && subscriptionData?.plan_id === 'gogh_pro') ? 20 : 8
    
    console.log('[AI Chat] Limite de uso por agente:', {
      agentId: agentIdForUsage,
      agentName: conversationData.ai_agents.name,
      currentUsage,
      limit,
      planId: subscriptionData?.plan_id,
      hasValidSubscription,
      skipUsageCount: skipUsageCount || false
    })

    // Verificar limite apenas se não for mensagem de contexto do nicho (que não conta)
    if (!skipUsageCount && currentUsage >= limit) {
      return NextResponse.json({ 
        error: `Você atingiu o limite de interações de hoje para o agente "${conversationData.ai_agents.name}". Volte amanhã ou faça upgrade para aumentar o limite.` 
      }, { status: 429 })
    }

    // Buscar perfil de nicho do usuário para personalização
    type NicheProfileData = {
      id: string
      user_id: string
      business_name: string | null
      niche: string | null
      target_audience: string | null
      brand_voice: string | null
      goals: string | null
      content_pillars: string[] | null
      platforms: string[] | null
      additional_context: string | null
      created_at: string
      updated_at: string
    }

    const { data: nicheProfile } = await supabase
      .from('user_niche_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const nicheProfileData = nicheProfile as NicheProfileData | null

    // Buscar histórico de mensagens (últimas 20)
    type HistoryMessage = {
      role: string
      content: string
    }

    const { data: historyMessages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    const historyMessagesTyped = (historyMessages || []) as HistoryMessage[]

    // Construir system prompt personalizado
    const agent = conversationData.ai_agents
    let systemPrompt = agent.system_prompt

    // Adicionar contexto do perfil de nicho se existir
    if (nicheProfileData) {
      systemPrompt += `\n\n=== CONTEXTO DO USUÁRIO ===\n\n`
      
      if (nicheProfileData.business_name) {
        systemPrompt += `📌 NOME DO NEGÓCIO/MARCA: ${nicheProfileData.business_name}\n`
      }
      if (nicheProfileData.niche) {
        systemPrompt += `🎯 NICHO/ÁREA DE ATUAÇÃO: ${nicheProfileData.niche}\n`
      }
      if (nicheProfileData.target_audience) {
        systemPrompt += `👥 PÚBLICO-ALVO: ${nicheProfileData.target_audience}\n`
      }
      if (nicheProfileData.brand_voice) {
        const brandVoiceLabels: { [key: string]: string } = {
          'profissional': 'Profissional (Formal, técnico, corporativo)',
          'casual': 'Casual (Descontraído, amigável, acessível)',
          'inspirador': 'Inspirador (Motivacional, energético, positivo)',
          'educativo': 'Educativo (Didático, informativo, detalhado)',
          'humoristico': 'Humorístico (Divertido, leve, com humor)',
          'autoridade': 'Autoridade (Expert, confiante, referência)'
        }
        systemPrompt += `💬 TOM DE VOZ DA MARCA: ${brandVoiceLabels[nicheProfileData.brand_voice] || nicheProfileData.brand_voice}\n`
      }
      if (nicheProfileData.content_pillars && Array.isArray(nicheProfileData.content_pillars) && nicheProfileData.content_pillars.length > 0) {
        systemPrompt += `📚 PILARES DE CONTEÚDO: ${nicheProfileData.content_pillars.join(', ')}\n`
      }
      if (nicheProfileData.platforms && Array.isArray(nicheProfileData.platforms) && nicheProfileData.platforms.length > 0) {
        systemPrompt += `📱 PLATAFORMAS: ${nicheProfileData.platforms.join(', ')}\n`
      }
      if (nicheProfileData.goals) {
        systemPrompt += `🎯 OBJETIVOS: ${nicheProfileData.goals}\n`
      }
      if (nicheProfileData.additional_context) {
        systemPrompt += `ℹ️ INFORMAÇÕES ADICIONAIS: ${nicheProfileData.additional_context}\n`
      }
      
      systemPrompt += `\nIMPORTANTE: Use TODAS essas informações para personalizar completamente suas respostas, adaptar o tom de voz, considerar o público-alvo, focar nos pilares de conteúdo e alinhar tudo com os objetivos do negócio.\n`
      systemPrompt += `=== FIM DO CONTEXTO ===`
    }

    // Construir mensagens para a OpenAI
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt }
    ]

    // Adicionar histórico
    if (historyMessagesTyped && historyMessagesTyped.length > 0) {
      historyMessagesTyped.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })
        }
      })
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: message })

    // Chamar OpenAI
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: agent.model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      })
    } catch (openaiError: any) {
      console.error('Erro ao chamar OpenAI:', openaiError)
      
      // Tratar erros específicos da OpenAI
      if (openaiError.status === 401) {
        return NextResponse.json({ 
          error: 'Chave da API OpenAI inválida. Verifique a configuração.',
          code: 'OPENAI_INVALID_KEY'
        }, { status: 500 })
      }
      
      // Erro de quota insuficiente (pode vir como 429 ou 402, mas sempre com code 'insufficient_quota')
      if (openaiError.code === 'insufficient_quota' || openaiError.error?.code === 'insufficient_quota') {
        return NextResponse.json({ 
          error: 'Estamos recebendo muitas solicitações no momento. Por favor, aguarde alguns instantes e tente novamente. O agente estará disponível em breve.',
          code: 'OPENAI_INSUFFICIENT_QUOTA'
        }, { status: 402 })
      }
      
      // Erro de rate limit (429 sem insufficient_quota)
      if (openaiError.status === 429) {
        return NextResponse.json({ 
          error: 'Limite de requisições excedido. Tente novamente em alguns instantes.',
          code: 'OPENAI_RATE_LIMIT'
        }, { status: 429 })
      }
      
      return NextResponse.json({ 
        error: 'Erro ao processar sua mensagem. Tente novamente.',
        code: 'OPENAI_ERROR',
        details: process.env.NODE_ENV === 'development' ? openaiError.message : undefined
      }, { status: 500 })
    }

    const assistantResponse = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'
    const tokensUsed = completion.usage?.total_tokens || 0

    // Salvar mensagem do usuário
    const { data: userMessageData, error: userMsgError } = await (supabase as any)
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        tokens_used: 0
      })
      .select()
      .single()

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
    }

    // Salvar resposta do assistente
    const { data: assistantMessageData, error: assistantMsgError } = await (supabase as any)
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantResponse,
        tokens_used: tokensUsed
      })
      .select()
      .single()

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
    }

    // Atualizar título da conversa se for a primeira mensagem
    if (!historyMessagesTyped || historyMessagesTyped.length === 0) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message
      await (supabase as any)
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId)
    }

    // Atualizar ou criar registro de uso diário POR AGENTE
    // IMPORTANTE: Não incrementar uso se for mensagem de contexto do nicho (skipUsageCount = true)
    // A primeira mensagem automática do nicho não deve contar no limite
    if (!skipUsageCount) {
      const todayForUsage = new Date()
      todayForUsage.setHours(0, 0, 0, 0)
      const tomorrow = new Date(todayForUsage)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { error: usageError } = await (supabase as any)
        .from('user_usage')
        .upsert({
          user_id: user.id,
          feature_key: featureKeyForAgent, // Limite POR AGENTE: ai_interactions_{agent_id}
          usage_count: currentUsage + 1,
          period_start: todayForUsage.toISOString().split('T')[0],
          period_end: tomorrow.toISOString().split('T')[0]
        }, {
          onConflict: 'user_id,feature_key,period_start'
        })

      if (usageError) {
        console.error('Error updating usage:', usageError)
      }
      
      console.log('[AI Chat] Uso incrementado para agente:', {
        agentId: agentIdForUsage,
        agentName: conversationData.ai_agents.name,
        newUsage: currentUsage + 1,
        limit: limit
      })
    } else {
      console.log('[AI Chat] Uso NÃO incrementado (mensagem de contexto do nicho)')
    }

    return NextResponse.json({
      success: true,
      userMessage: userMessageData,
      assistantMessage: assistantMessageData,
      tokensUsed
    })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

