import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID não fornecido' },
        { status: 400 }
      )
    }

    // Recuperar a sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const isServiceSubscription = session.metadata?.planType === 'service'

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      paymentStatus: session.payment_status,
      planId: session.metadata?.planId,
      planName: session.metadata?.planName,
      billingCycle: session.metadata?.billingCycle,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total, // Valor total em centavos
      isServiceSubscription: !!isServiceSubscription,
      session_id: session.id, // Para event_id do Meta Pixel (deduplicação)
    })
  } catch (error: any) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar sessão' },
      { status: 500 }
    )
  }
}

