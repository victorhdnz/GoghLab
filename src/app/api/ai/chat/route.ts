import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { Database } from '@/types/database.types'

// Forçar renderização dinâmica para garantir que cookies sejam lidos corretamente
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // IMPORTANTE: Criar cliente Supabase PRIMEIRO para ler cookies corretamente
    // Usar o mesmo padrão das outras APIs que funcionam
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar cookies recebidos (opcional, apenas para debug)
    const cookieStore = cookies()
    const hasAuthCookies = cookieStore.has('sb-access-token') || cookieStore.has('sb-refresh-token')
    console.log('[AI Chat] Cookies de autenticação presentes:', hasAuthCookies)
    
    // Tentar obter sessão primeiro
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[AI Chat] Sessão obtida:', session ? 'Sim' : 'Não', sessionError ? `Erro: ${sessionError.message}` : '')
    
    // Verificar autenticação ANTES de qualquer outra coisa
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[AI Chat] Tentativa de autenticação:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError ? {
        message: authError.message,
        status: authError.status
      } : null
    })
    
    if (authError) {
      console.error('[AI Chat] Erro de autenticação completo:', JSON.stringify(authError, null, 2))
      return NextResponse.json({ 
        error: 'Erro de autenticação. Faça login novamente.',
        details: process.env.NODE_ENV === 'development' ? authError.message : undefined
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('[AI Chat] Usuário não autenticado')
      return NextResponse.json({ 
        error: 'Usuário não autenticado. Faça login novamente.' 
      }, { status: 401 })
    }
    
    console.log('[AI Chat] Usuário autenticado com sucesso:', user.id)

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

    const { conversationId, message, agentId } = await request.json()

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    // Verificar se a conversa pertence ao usuário
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*, ai_agents(*)')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Verificar assinatura ativa (aceita planos Stripe e manuais)
    // Planos manuais não têm stripe_subscription_id (é NULL), então aceitamos ambos
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end, current_period_start, stripe_subscription_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    console.log('[AI Chat] Verificação de assinatura:', {
      found: !!subscription,
      planId: subscription?.plan_id,
      status: subscription?.status,
      hasStripeId: !!subscription?.stripe_subscription_id,
      currentPeriodEnd: subscription?.current_period_end,
      isManual: !subscription?.stripe_subscription_id,
      error: subError ? subError.message : null
    })

    // Se encontrou assinatura, verificar se está dentro do período válido
    let hasValidSubscription = false
    if (subscription) {
      const now = new Date()
      const periodEnd = new Date(subscription.current_period_end)
      hasValidSubscription = periodEnd >= now
      
      console.log('[AI Chat] Validação de período:', {
        now: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
        isValid: hasValidSubscription
      })
      
      if (!hasValidSubscription) {
        console.log('[AI Chat] Assinatura encontrada mas período expirado')
      }
    } else {
      console.log('[AI Chat] Nenhuma assinatura ativa encontrada - permitindo uso com limite padrão')
    }

    // Verificar limite de uso diário
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: usageData } = await supabase
      .from('user_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_interactions')
      .gte('period_start', today.toISOString().split('T')[0])
      .maybeSingle()

    const currentUsage = usageData?.usage_count || 0
    // Limites diários: Pro = 20, Essencial ou sem assinatura = 8
    // Aceita planos manuais e Stripe
    const limit = (hasValidSubscription && subscription?.plan_id === 'gogh_pro') ? 20 : 8
    
    console.log('[AI Chat] Limite de uso:', {
      currentUsage,
      limit,
      planId: subscription?.plan_id,
      hasValidSubscription
    })

    if (currentUsage >= limit) {
      return NextResponse.json({ 
        error: 'Você atingiu o limite de interações de hoje. Volte amanhã ou faça upgrade para aumentar o limite.' 
      }, { status: 429 })
    }

    // Buscar perfil de nicho do usuário para personalização
    const { data: nicheProfile } = await supabase
      .from('user_niche_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Buscar histórico de mensagens (últimas 20)
    const { data: historyMessages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Construir system prompt personalizado
    const agent = conversation.ai_agents as any
    let systemPrompt = agent.system_prompt

    // Adicionar contexto do perfil de nicho se existir
    if (nicheProfile) {
      systemPrompt += `\n\n--- CONTEXTO DO USUÁRIO ---`
      if (nicheProfile.business_name) {
        systemPrompt += `\nNome do negócio: ${nicheProfile.business_name}`
      }
      if (nicheProfile.niche) {
        systemPrompt += `\nNicho: ${nicheProfile.niche}`
      }
      if (nicheProfile.target_audience) {
        systemPrompt += `\nPúblico-alvo: ${nicheProfile.target_audience}`
      }
      if (nicheProfile.brand_voice) {
        systemPrompt += `\nTom de voz da marca: ${nicheProfile.brand_voice}`
      }
      if (nicheProfile.goals) {
        systemPrompt += `\nObjetivos: ${nicheProfile.goals}`
      }
      if (nicheProfile.content_pillars && Array.isArray(nicheProfile.content_pillars) && nicheProfile.content_pillars.length > 0) {
        systemPrompt += `\nPilares de conteúdo: ${nicheProfile.content_pillars.join(', ')}`
      }
      if (nicheProfile.platforms && Array.isArray(nicheProfile.platforms) && nicheProfile.platforms.length > 0) {
        systemPrompt += `\nPlataformas: ${nicheProfile.platforms.join(', ')}`
      }
      systemPrompt += `\n--- FIM DO CONTEXTO ---`
    }

    // Construir mensagens para a OpenAI
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt }
    ]

    // Adicionar histórico
    if (historyMessages && historyMessages.length > 0) {
      historyMessages.forEach(msg => {
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
      
      if (openaiError.status === 429) {
        return NextResponse.json({ 
          error: 'Limite de requisições excedido. Tente novamente em alguns instantes.',
          code: 'OPENAI_RATE_LIMIT'
        }, { status: 429 })
      }
      
      if (openaiError.status === 402 || openaiError.code === 'insufficient_quota') {
        return NextResponse.json({ 
          error: 'Cota da API OpenAI esgotada. Entre em contato com o suporte.',
          code: 'OPENAI_INSUFFICIENT_QUOTA'
        }, { status: 402 })
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
    const { data: userMessageData, error: userMsgError } = await supabase
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
    const { data: assistantMessageData, error: assistantMsgError } = await supabase
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
    if (!historyMessages || historyMessages.length === 0) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message
      await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId)
    }

    // Atualizar ou criar registro de uso diário
    const todayForUsage = new Date()
    todayForUsage.setHours(0, 0, 0, 0)
    const tomorrow = new Date(todayForUsage)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { error: usageError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: user.id,
        feature_key: 'ai_interactions',
        usage_count: currentUsage + 1,
        period_start: todayForUsage.toISOString().split('T')[0],
        period_end: tomorrow.toISOString().split('T')[0]
      }, {
        onConflict: 'user_id,feature_key,period_start'
      })

    if (usageError) {
      console.error('Error updating usage:', usageError)
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

