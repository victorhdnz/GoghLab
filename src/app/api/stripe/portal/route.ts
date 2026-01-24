import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()

    // Tentar obter sessão primeiro
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[Portal Stripe] Sessão obtida:', session ? 'Sim' : 'Não', sessionError ? `Erro: ${sessionError.message}` : '')

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[Portal Stripe] Tentativa de autenticação:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError ? {
        message: authError.message,
        status: authError.status
      } : null
    })
    
    if (authError) {
      console.error('[Portal Stripe] Erro de autenticação completo:', JSON.stringify(authError, null, 2))
      return NextResponse.json({ 
        error: 'Erro de autenticação. Faça login novamente.',
        details: process.env.NODE_ENV === 'development' ? authError.message : undefined,
        errorCode: authError.name || 'AUTH_ERROR'
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('[Portal Stripe] Usuário não autenticado - nenhum user retornado')
      return NextResponse.json({ 
        error: 'Usuário não autenticado. Faça login novamente.',
        details: process.env.NODE_ENV === 'development' ? 'getUser() retornou null' : undefined
      }, { status: 401 })
    }

    console.log('[Portal Stripe] Usuário autenticado com sucesso:', user.id)
    
    // Buscar a assinatura ativa do usuário (prioridade: subscriptions, depois service_subscriptions)
    type SubscriptionData = {
      stripe_customer_id: string | null
      plan_id: string
      status: string
    }

    // Primeiro, tentar buscar assinatura de plano normal
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, plan_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let subscriptionData = subscription as SubscriptionData | null
    let isServiceSubscription = false

    // Se não encontrou assinatura de plano, buscar service subscription
    if (!subscriptionData || subError) {
      const { data: serviceSubscription, error: serviceError } = await supabase
        .from('service_subscriptions')
        .select('stripe_customer_id, plan_id, status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (serviceSubscription && !serviceError) {
        subscriptionData = serviceSubscription as SubscriptionData
        isServiceSubscription = true
      }
    }

    console.log('[Portal Stripe] Busca de assinatura:', {
      found: !!subscriptionData,
      hasStripeId: !!subscriptionData?.stripe_customer_id,
      stripeId: subscriptionData?.stripe_customer_id,
      planId: subscriptionData?.plan_id,
      isServiceSubscription,
      error: subError ? subError.message : null
    })

    if (!subscriptionData) {
      console.log('[Portal Stripe] Assinatura não encontrada para usuário:', user.id)
      return NextResponse.json({ 
        error: 'Nenhuma assinatura ativa encontrada. Se você tem uma assinatura manual, entre em contato com o suporte.',
        isManual: true
      }, { status: 404 })
    }

    // Se não tem stripe_customer_id, é uma assinatura manual
    // Não pode usar o portal do Stripe
    if (!subscriptionData.stripe_customer_id || subscriptionData.stripe_customer_id.startsWith('manual_') || subscriptionData.stripe_customer_id === null) {
      console.log('Tentativa de acessar portal com assinatura manual:', {
        user_id: user.id,
        subscription_id: subscriptionData.plan_id,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        isServiceSubscription
      })
      return NextResponse.json({ 
        error: 'Esta assinatura foi criada manualmente e não pode ser gerenciada através do portal do Stripe. Entre em contato com o suporte através do WhatsApp para gerenciar sua assinatura.',
        isManual: true
      }, { status: 400 })
    }

    // Criar sessão do portal de gerenciamento do Stripe
    // O portal do Stripe funciona com qualquer subscription do customer, mesmo que seja de produto dinâmico
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscriptionData.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://goghlab.com.br'}/membro/conta`,
      // Usar a configuração do portal se especificada
      ...(process.env.STRIPE_PORTAL_CONFIGURATION_ID && {
        configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
      }),
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Erro ao criar sessão do portal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

