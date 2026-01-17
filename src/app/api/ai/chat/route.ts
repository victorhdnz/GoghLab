import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { Database } from '@/types/database.types'

export async function POST(request: Request) {
  try {
    // IMPORTANTE: Criar cliente Supabase PRIMEIRO para ler cookies corretamente
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar autenticação ANTES de qualquer outra coisa
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[AI Chat] Erro de autenticação:', authError)
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
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[AI Chat] Erro de autenticação:', authError)
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

    // Verificar assinatura ativa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada ou expirada' }, { status: 403 })
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
    // Limites diários: Essencial = 8, Pro = 20
    const limit = subscription.plan_id === 'gogh_pro' ? 20 : 8

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

