import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// Cliente Supabase com service_role para bypass de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Mapeamento de price_id para plan_id
const PRICE_TO_PLAN: Record<string, { plan_id: string; billing_cycle: string }> = {
  // Gogh Essencial
  'price_1SpjGIJmSvvqlkSQGIpVMt0H': { plan_id: 'gogh_essencial', billing_cycle: 'monthly' },
  'price_1SpjHyJmSvvqlkSQRBubxB7K': { plan_id: 'gogh_essencial', billing_cycle: 'annual' },
  // Gogh Pro
  'price_1SpjJIJmSvvqlkSQpBHztwk6': { plan_id: 'gogh_pro', billing_cycle: 'monthly' },
  'price_1SpjKSJmSvvqlkSQlr8jNDTf': { plan_id: 'gogh_pro', billing_cycle: 'annual' },
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const customerEmail = session.customer_details?.email

  if (!customerEmail) {
    console.error('No customer email in checkout session')
    return
  }

  // Buscar usuário pelo email
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single()

  if (profileError || !profile) {
    console.error('User not found for email:', customerEmail)
    return
  }

  // Buscar detalhes da assinatura no Stripe
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  const subscription = subscriptionResponse as Stripe.Subscription
  const priceId = subscription.items.data[0]?.price.id
  const planInfo = PRICE_TO_PLAN[priceId]

  if (!planInfo) {
    console.error('Unknown price ID:', priceId)
    return
  }

  // Criar ou atualizar assinatura no banco
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan_id: planInfo.plan_id,
      billing_cycle: planInfo.billing_cycle,
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'stripe_subscription_id'
    })

  if (error) {
    console.error('Error creating subscription:', error)
    throw error
  }

  console.log(`Subscription created for user ${profile.id}: ${planInfo.plan_id}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id
  const planInfo = PRICE_TO_PLAN[priceId]

  if (!planInfo) {
    console.error('Unknown price ID:', priceId)
    return
  }

  const sub = subscription as any
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      plan_id: planInfo.plan_id,
      billing_cycle: planInfo.billing_cycle,
      status: subscription.status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: sub.canceled_at 
        ? new Date(sub.canceled_at * 1000).toISOString() 
        : null,
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  console.log(`Subscription ${subscription.id} updated to status: ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }

  console.log(`Subscription ${subscription.id} canceled`)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (!subscriptionId) return

  // Atualizar período da assinatura
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  const sub = subscriptionResponse as any
  
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription after payment:', error)
  }

  console.log(`Invoice paid for subscription ${subscriptionId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (!subscriptionId) return

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription status to past_due:', error)
  }

  console.log(`Payment failed for subscription ${subscriptionId}`)
}

