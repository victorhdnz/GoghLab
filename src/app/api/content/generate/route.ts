import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { getCreditCost, getCreditsConfigKey, getMonthBounds, getMonthlyCreditsForPlan, type CreditsConfig } from '@/lib/credits'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

type GenerateBody = {
  calendarItemId: string
  /** Se o usuário quiser forçar um tema específico nesse slot */
  overrideTopic?: string | null
  mode?: 'generate' | 'regenerate'
}

type ContentProfileRow = {
  business_name: string | null
  niche: string | null
  audience: string | null
  tone_of_voice: string | null
  goals: string | null
  platforms: string[] | null
  frequency_per_week: number | null
}

type CalendarItemRow = {
  topic: string | null
  platform: string | null
  date: string | null
  time: string | null
  meta: Record<string, unknown> | null
}

const SERVICE_ERROR_MESSAGE =
  'Ocorreu uma instabilidade ao processar sua solicitação. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.'

/** POST /api/content/generate
 * body: { calendarItemId, overrideTopic? }
 *
 * Usa o perfil de conteúdo + item do calendário para gerar:
 * - topic
 * - script
 * - caption
 * - hashtags
 * - recommended_time
 *
 * Atualiza o item no banco e retorna o payload gerado.
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[content/generate] OPENAI_API_KEY não configurada')
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const body = (await request.json().catch(() => ({}))) as GenerateBody
    const calendarItemId = typeof body.calendarItemId === 'string' ? body.calendarItemId : null
    if (!calendarItemId) {
      return NextResponse.json({ error: 'calendarItemId é obrigatório' }, { status: 400 })
    }

    // Carregar perfil de conteúdo do usuário
    const { data: profile, error: profileError } = await supabase
      .from('content_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() as { data: ContentProfileRow | null; error: { message: string } | null }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Configure primeiro seu perfil de conteúdo antes de gerar roteiros.', code: 'NO_PROFILE' },
        { status: 400 }
      )
    }

    // Carregar item do calendário
    const { data: item, error: itemError } = await supabase
      .from('content_calendar_items')
      .select('*')
      .eq('id', calendarItemId)
      .eq('user_id', user.id)
      .maybeSingle() as { data: CalendarItemRow | null; error: { message: string } | null }

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 })
    }
    if (!item) {
      return NextResponse.json({ error: 'Item de calendário não encontrado' }, { status: 404 })
    }

    // Deduz créditos antes da geração para manter a regra global (manual e Stripe)
    const supabaseAdmin = createSupabaseAdmin() as any
    const { data: configRow } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle() as { data: { value: unknown } | null }
    const config = (configRow?.value as CreditsConfig) ?? null
    const cost = getCreditCost('roteiro', config)
    const { periodStart, periodEnd } = getMonthBounds()

    let { data: usageRow } = await supabaseAdmin
      .from('user_usage')
      .select('id, usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_credits')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle()

    if (!usageRow) {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('plan_id, plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let planId = subscription?.plan_id
      if (!planId && subscription?.plan_type) {
        planId = subscription.plan_type === 'premium'
          ? 'gogh_pro'
          : subscription.plan_type === 'essential'
            ? 'gogh_essencial'
            : undefined
      }

      if (!planId) {
        const { data: serviceSub } = await supabaseAdmin
          .from('service_subscriptions')
          .select('plan_id')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (serviceSub?.plan_id && ['gogh_essencial', 'gogh_pro'].includes(serviceSub.plan_id)) {
          planId = serviceSub.plan_id
        }
      }

      const monthly = getMonthlyCreditsForPlan(planId, config)
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('user_usage')
        .insert({
          user_id: user.id,
          feature_key: 'ai_credits',
          usage_count: monthly,
          period_start: periodStart,
          period_end: periodEnd,
        })
        .select('id, usage_count')
        .single()

      if (insertError || !inserted) {
        return NextResponse.json({ error: insertError?.message ?? 'Erro ao criar período de créditos' }, { status: 500 })
      }

      usageRow = inserted
    }

    const monthlyCount = Number(usageRow.usage_count) || 0
    const { data: purchasedRows } = await supabaseAdmin
      .from('user_usage')
      .select('id, usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', 'ai_credits_purchased')
      .order('id', { ascending: true })

    const purchasedList = Array.isArray(purchasedRows) ? purchasedRows : []
    const purchasedTotal = purchasedList.reduce((sum: number, row: { usage_count?: number }) => {
      return sum + (Number(row?.usage_count) || 0)
    }, 0)

    const totalAvailable = monthlyCount + purchasedTotal
    if (totalAvailable < cost) {
      return NextResponse.json(
        {
          error: 'Créditos insuficientes para gerar o roteiro. Recarregue em Plano & Uso.',
          code: 'insufficient_credits',
          balance: totalAvailable,
          required: cost,
          redirectTo: '/conta?tab=planos-e-uso',
        },
        { status: 402 }
      )
    }

    let remaining = cost
    const deductFromMonthly = Math.min(monthlyCount, remaining)
    const newMonthly = monthlyCount - deductFromMonthly
    remaining -= deductFromMonthly

    const { error: updateMonthlyError } = await supabaseAdmin
      .from('user_usage')
      .update({ usage_count: newMonthly, updated_at: new Date().toISOString() })
      .eq('id', usageRow.id)
    if (updateMonthlyError) {
      return NextResponse.json({ error: updateMonthlyError.message }, { status: 500 })
    }

    for (const row of purchasedList) {
      if (remaining <= 0) break
      const current = Number(row.usage_count) || 0
      const take = Math.min(current, remaining)
      if (take <= 0) continue
      remaining -= take

      const { error: updatePurchasedError } = await supabaseAdmin
        .from('user_usage')
        .update({ usage_count: current - take, updated_at: new Date().toISOString() })
        .eq('id', row.id)
      if (updatePurchasedError) {
        return NextResponse.json({ error: updatePurchasedError.message }, { status: 500 })
      }
    }

    const mode: 'generate' | 'regenerate' = body.mode === 'regenerate' ? 'regenerate' : 'generate'
    const topic = body.overrideTopic?.trim() || item.topic?.trim() || ''
    const regenerateCount = Number(item.meta?.regenerate_count ?? 0) || 0
    if (mode === 'regenerate' && regenerateCount >= 3) {
      return NextResponse.json(
        { error: 'Limite atingido: você pode gerar novo conteúdo até 3 vezes por vídeo.' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = process.env.OPENAI_ROTEIRO_MODEL_ID || 'gpt-4o-mini'

    // Montar descrição do perfil
    const profileSummary = [
      profile.business_name && `Nome do projeto/empresa: ${profile.business_name}`,
      profile.niche && `Nicho: ${profile.niche}`,
      profile.audience && `Público-alvo: ${profile.audience}`,
      profile.tone_of_voice && `Tom de voz: ${profile.tone_of_voice}`,
      profile.goals && `Objetivos: ${profile.goals}`,
      Array.isArray(profile.platforms) && profile.platforms.length
        ? `Plataformas: ${profile.platforms.join(', ')}`
        : null,
      typeof profile.frequency_per_week === 'number' && profile.frequency_per_week > 0
        ? `Frequência desejada: ${profile.frequency_per_week} vídeos por semana.`
        : null,
    ]
      .filter(Boolean)
      .join('\n')

    const platformInfo = item.platform ? `Plataforma principal para este vídeo: ${item.platform}.` : ''
    const dateInfo = item.date ? `Data planejada: ${item.date}.` : ''

    const userInstruction = mode === 'regenerate'
      ? `Gere uma NOVA estrutura completa para este vídeo, com tema diferente do tema atual "${topic || 'sem tema'}". Não repita ideias já usadas e mantenha aderência ao perfil do cliente.`
      : topic
        ? `Gere conteúdo para o seguinte tema específico: "${topic}".`
        : 'Sugira um tema relevante para o nicho e gere o conteúdo completo com base nesse tema sugerido.'

    const messages = [
      {
        role: 'system' as const,
        content:
          'Você é um roteirista e planejador de conteúdo para redes sociais. Gere respostas objetivas e práticas para criadores de conteúdo.',
      },
      {
        role: 'user' as const,
        content:
          `Perfil de conteúdo do cliente:\n${profileSummary || '(sem detalhes adicionais)'}\n\n` +
          `${platformInfo}\n${dateInfo}\n\n` +
          `${userInstruction}\n\n` +
          'Retorne SOMENTE um JSON válido, sem explicações extras, no formato:' +
          '\n{\n' +
          '  "topic": "título/tema do vídeo",\n' +
          '  "script": "roteiro detalhado do vídeo",\n' +
          '  "caption": "legenda pronta para postar",\n' +
          '  "hashtags": "#tag1 #tag2 #tag3...",\n' +
          '  "recommended_time": "HH:MM"  // horário sugerido no fuso local do cliente, se fizer sentido\n' +
          '}\n',
      },
    ]

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    if (!raw) {
      console.error('[content/generate] resposta vazia do modelo')
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    // Tentar extrair JSON da resposta (caso venha com texto extra)
    let jsonText = raw.trim()
    const firstBrace = jsonText.indexOf('{')
    const lastBrace = jsonText.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1)
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch (err) {
      console.error('[content/generate] erro ao fazer JSON.parse', err, 'raw=', raw)
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const generatedTopic = (parsed.topic ?? '').toString().trim()
    const script = (parsed.script ?? '').toString().trim()
    const caption = (parsed.caption ?? '').toString().trim()
    const hashtags = (parsed.hashtags ?? '').toString().trim()
    const recommendedTime = (parsed.recommended_time ?? '').toString().trim()

    // Atualizar item no calendário
    const updates: any = {
      status: 'generated',
      topic: generatedTopic || topic || item.topic,
      script,
      caption,
      hashtags,
      meta: {
        ...(item.meta || {}),
        recommended_time: recommendedTime || null,
        regenerate_count: mode === 'regenerate' ? regenerateCount + 1 : regenerateCount,
      },
    }

    if (recommendedTime && /^\d{1,2}:\d{2}$/.test(recommendedTime)) {
      // Armazenar horário sugerido no campo time (usando formato HH:MM:00+00)
      updates.time = `${recommendedTime}:00+00`
    }

    const { data: updated, error: updateError } = await (supabase
      .from('content_calendar_items') as any)
      .update(updates)
      .eq('id', calendarItemId)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle()

    if (updateError) {
      console.error('[content/generate] erro ao atualizar item', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      item: updated,
      generated: {
        topic: updates.topic,
        script,
        caption,
        hashtags,
        recommended_time: recommendedTime || null,
      },
    })
  } catch (e: any) {
    console.error('[content/generate] erro inesperado', e)
    return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
  }
}

