import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Lista todos os membros (profiles + subscriptions + service_subscriptions) para o dashboard.
 * Só responde para usuários com role admin ou editor; usa cliente admin para evitar RLS.
 */
export async function GET() {
  try {
    const routeClient = createRouteHandlerClient()
    const { data: { user } } = await routeClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await routeClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const supabase = createSupabaseAdmin() as any

    const { data: profilesRaw, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }
    const profiles = Array.isArray(profilesRaw) ? profilesRaw : []

    let subscriptions: any[] = []
    try {
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .in('status', ['active', 'trialing'])

      if (!subsError) {
        subscriptions = subsData || []
      } else if (subsError.code === '42703' || subsError.message?.includes('does not exist')) {
        const { data: altData, error: altError } = await supabase
          .from('subscriptions')
          .select('id, user_id, plan_type, status, current_period_end, current_period_start, stripe_subscription_id, manually_edited, manually_edited_at')
          .in('status', ['active', 'trialing'])
        if (!altError && altData) {
          subscriptions = altData.map((sub: any) => ({
            ...sub,
            plan_id: sub.plan_type === 'premium' ? 'gogh_pro' : sub.plan_type === 'essential' ? 'gogh_essencial' : null,
            billing_cycle: 'monthly',
          }))
        }
      }
    } catch {
      // ignore
    }

    let serviceSubscriptions: any[] = []
    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_subscriptions')
        .select('*')
      if (!serviceError && serviceData) serviceSubscriptions = serviceData
    } catch {
      // ignore
    }

    const members = (profiles || []).map((profile: any) => {
      const subscription = subscriptions.find((sub: any) => sub.user_id === profile.id)
      let memberServices = serviceSubscriptions.filter((sub: any) => sub.user_id === profile.id)

      if (memberServices.length > 1) {
        const serviceMap = new Map<string, any>()
        memberServices.forEach((service: any) => {
          const serviceKey = JSON.stringify(((service.selected_services || []) as string[]).sort().join(','))
          const existing = serviceMap.get(serviceKey)
          if (!existing || new Date(service.created_at) > new Date(existing.created_at)) {
            serviceMap.set(serviceKey, {
              ...service,
              selected_services: [...new Set(service.selected_services || [])] as string[],
            })
          }
        })
        memberServices = Array.from(serviceMap.values())
        if (memberServices.length > 1) {
          memberServices = [memberServices.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]]
        }
      } else if (memberServices.length === 1) {
        memberServices = [{
          ...memberServices[0],
          selected_services: [...new Set(memberServices[0].selected_services || [])] as string[],
        }]
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: profile.role,
        created_at: profile.created_at,
        contact_phone: profile.contact_phone ?? profile.phone ?? null,
        subscription: subscription
          ? {
              id: subscription.id,
              plan_id:
                subscription.plan_id ||
                (subscription.plan_type === 'premium' ? 'gogh_pro' : subscription.plan_type === 'essential' ? 'gogh_essencial' : null),
              status: subscription.status,
              billing_cycle:
                subscription.billing_cycle ||
                (subscription.current_period_end && subscription.current_period_start
                  ? new Date(subscription.current_period_end).getTime() - new Date(subscription.current_period_start).getTime() > 30 * 24 * 60 * 60 * 1000
                    ? 'annual'
                    : 'monthly'
                  : 'monthly'),
              current_period_end: subscription.current_period_end,
              stripe_subscription_id:
                subscription.stripe_subscription_id && String(subscription.stripe_subscription_id).trim() !== ''
                  ? subscription.stripe_subscription_id
                  : null,
              is_manual: !subscription.stripe_subscription_id || String(subscription.stripe_subscription_id).trim() === '',
              manually_edited: subscription.manually_edited || false,
              manually_edited_at: subscription.manually_edited_at || null,
            }
          : null,
        serviceSubscriptions: memberServices || [],
      }
    })

    return NextResponse.json({ members })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao carregar membros' }, { status: 500 })
  }
}
