import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

interface ServiceRequestBody {
  planId: string
  planName: string
  billingCycle: 'monthly' | 'annually'
  selectedServiceIds?: string[]
}

interface ServiceOption {
  id: string
  name: string
  priceMonthly: number
  priceAnnually: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ServiceRequestBody
    const { planId, planName, billingCycle, selectedServiceIds = [] } = body

    if (!planId || !planName || !billingCycle) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Você precisa estar logado para contratar este serviço.',
          requiresAuth: true
        },
        { status: 401 }
      )
    }

    const { data: settings, error: settingsError } = await (supabase as any)
      .from('site_settings')
      .select('*')
      .eq('key', 'general')
      .maybeSingle()

    if (settingsError) {
      return NextResponse.json({ error: 'Erro ao carregar configurações do site.' }, { status: 500 })
    }

    const pricing = settings?.homepage_content?.pricing || {}
    const plans = pricing?.pricing_plans || []
    const plan = plans.find((item: any) => item.id === planId)

    if (!plan || plan.planType !== 'service') {
      return NextResponse.json({ error: 'Plano de serviços inválido.' }, { status: 400 })
    }

    const serviceOptions: ServiceOption[] = Array.isArray(plan.serviceOptions) ? plan.serviceOptions : []
    const selectedIds = selectedServiceIds.length > 0
      ? selectedServiceIds
      : serviceOptions.map(option => option.id)

    const selectedOptions = serviceOptions.filter(option => selectedIds.includes(option.id))
    const basePrice = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnually
    const optionsTotal = selectedOptions.reduce((sum: number, option: ServiceOption) => {
      const optionPrice = billingCycle === 'monthly' ? option.priceMonthly : option.priceAnnually
      return sum + optionPrice
    }, 0)

    const totalPrice = basePrice + optionsTotal

    if (totalPrice <= 0) {
      return NextResponse.json({ error: 'Preço total inválido.' }, { status: 400 })
    }

    const whatsappNumber = (pricing?.pricing_whatsapp_number || settings?.contact_whatsapp || '').toString()
    const selectedNames = selectedOptions.map(option => option.name).join(', ')
    const message = `Olá! Gostaria de contratar o plano ${planName} com os serviços: ${selectedNames || 'Nenhum'}. Valor total: R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${billingCycle === 'monthly' ? '/mês' : '/ano'}.`

    if (!process.env.STRIPE_SECRET_KEY) {
      if (!whatsappNumber) {
        return NextResponse.json({ error: 'Stripe não configurado e WhatsApp não disponível.' }, { status: 500 })
      }
      const encodedMessage = encodeURIComponent(message)
      return NextResponse.json({ whatsappUrl: `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}` })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goghlab.com.br'
    const interval = billingCycle === 'monthly' ? 'month' : 'year'
    const unitAmount = Math.round(totalPrice * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: `Serviços ${planName}`,
              description: selectedNames || 'Serviços personalizados'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/precos`,
      customer_email: user?.email || undefined,
      metadata: {
        planId,
        planName,
        billingCycle,
        userId: user?.id || '',
        planType: 'service',
        selectedServices: selectedNames
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        metadata: {
          planId,
          planName,
          billingCycle,
          userId: user?.id || '',
          planType: 'service',
          selectedServices: selectedNames
        }
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Erro ao criar sessão de serviço:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de serviço' },
      { status: 500 }
    )
  }
}

