import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  business_name: string | null
  niche: string | null
  audience: string | null
  tone_of_voice: string | null
  goals: string | null
  platforms: string[] | null
  frequency_per_week: number | null
  extra_preferences: {
    availability_days?: number[]
  } | null
}

const SERVICE_ERROR_MESSAGE =
  'Ocorreu uma instabilidade ao processar sua solicitação. Tente novamente em alguns instantes.'

function toDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const parsedMonth = typeof body.month === 'string' ? toDate(body.month) : null
    const base = parsedMonth || new Date()
    const year = base.getFullYear()
    const monthIndex = base.getMonth()

    const { data: profile, error: profileError } = await (supabase
      .from('content_profiles') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() as { data: ProfileRow | null; error: { message: string } | null }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Salve o Perfil de Conteúdo da sua Marca antes de usar o automático.' },
        { status: 400 }
      )
    }

    const availabilityDays = Array.isArray(profile.extra_preferences?.availability_days)
      ? profile.extra_preferences?.availability_days ?? []
      : [1, 2, 3, 4, 5]
    const freqPerWeek = Math.max(1, Math.min(7, Number(profile.frequency_per_week || 3)))

    const { data: existingItems } = await (supabase
      .from('content_calendar_items') as any)
      .select('date, topic')
      .eq('user_id', user.id)
      .gte('date', `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`)
      .lte('date', `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth(year, monthIndex)).padStart(2, '0')}`)

    const occupiedDates = new Set((existingItems || []).map((it: any) => it.date))
    const existingTopics = (existingItems || [])
      .map((it: any) => (it.topic || '').toString().trim())
      .filter(Boolean)

    const today = new Date()
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex
    const startDay = isCurrentMonth ? today.getDate() : 1
    const endDay = daysInMonth(year, monthIndex)

    const candidateDates: string[] = []
    for (let day = startDay; day <= endDay; day += 1) {
      const date = new Date(year, monthIndex, day)
      const weekDay = date.getDay()
      const dateStr = formatDate(date)
      if (!availabilityDays.includes(weekDay)) continue
      if (occupiedDates.has(dateStr)) continue
      candidateDates.push(dateStr)
    }

    const approxWeeksLeft = Math.max(1, Math.ceil((endDay - startDay + 1) / 7))
    const targetCount = Math.max(1, Math.min(12, freqPerWeek * approxWeeksLeft))
    const selectedDates = candidateDates.slice(0, targetCount)

    if (selectedDates.length === 0) {
      return NextResponse.json({ items: [], message: 'Sem datas livres para geração automática no período.' })
    }

    const profileSummary = [
      profile.business_name && `Nome do projeto/empresa: ${profile.business_name}`,
      profile.niche && `Nicho: ${profile.niche}`,
      profile.audience && `Público-alvo: ${profile.audience}`,
      profile.tone_of_voice && `Tom de voz: ${profile.tone_of_voice}`,
      profile.goals && `Objetivos: ${profile.goals}`,
      Array.isArray(profile.platforms) && profile.platforms.length
        ? `Plataformas: ${profile.platforms.join(', ')}`
        : null,
      `Frequência desejada por semana: ${freqPerWeek}`,
    ]
      .filter(Boolean)
      .join('\n')

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = process.env.OPENAI_ROTEIRO_MODEL_ID || 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'Você é estrategista de conteúdo e roteirista. Gere planos completos e evite repetir temas.',
        },
        {
          role: 'user',
          content:
            `Perfil:\n${profileSummary || '(sem detalhes)'}\n\n` +
            `Datas para gerar: ${selectedDates.join(', ')}\n` +
            `Temas já existentes para evitar duplicação: ${existingTopics.length ? existingTopics.join(' | ') : '(nenhum)'}\n\n` +
            'Retorne SOMENTE JSON válido no formato:\n' +
            '{ "items": [\n' +
            '  { "date": "YYYY-MM-DD", "topic": "...", "script": "...", "caption": "...", "hashtags": "...", "recommended_time": "HH:MM" }\n' +
            ']}\n' +
            `A lista deve conter EXATAMENTE ${selectedDates.length} itens, com uma data única para cada item, sem repetir tema.`,
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    if (!raw) {
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    let jsonText = raw.trim()
    const firstBrace = jsonText.indexOf('{')
    const lastBrace = jsonText.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1)
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const aiItems = Array.isArray(parsed?.items) ? parsed.items : []
    const selectedSet = new Set(selectedDates)
    const usedTopics = new Set(existingTopics.map((topic) => topic.toLowerCase()))
    const payloads: any[] = []

    for (const rawItem of aiItems) {
      const date = typeof rawItem?.date === 'string' ? rawItem.date : null
      if (!date || !selectedSet.has(date)) continue

      const topic = (rawItem?.topic || '').toString().trim()
      if (!topic) continue
      const key = topic.toLowerCase()
      if (usedTopics.has(key)) continue
      usedTopics.add(key)

      const recommendedTime = (rawItem?.recommended_time || '').toString().trim()
      payloads.push({
        user_id: user.id,
        date,
        status: 'generated',
        topic,
        script: (rawItem?.script || '').toString().trim() || null,
        caption: (rawItem?.caption || '').toString().trim() || null,
        hashtags: (rawItem?.hashtags || '').toString().trim() || null,
        time: /^\d{1,2}:\d{2}$/.test(recommendedTime) ? `${recommendedTime}:00+00` : null,
        meta: {
          recommended_time: /^\d{1,2}:\d{2}$/.test(recommendedTime) ? recommendedTime : null,
          auto_generated: true,
          regenerate_count: 0,
        },
      })
    }

    if (payloads.length === 0) {
      return NextResponse.json(
        { items: [], message: 'A IA não retornou itens válidos para as datas selecionadas.' },
        { status: 200 }
      )
    }

    const { data: inserted, error: insertError } = await (supabase
      .from('content_calendar_items') as any)
      .insert(payloads)
      .select('*')

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ items: inserted || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || SERVICE_ERROR_MESSAGE }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { getCreditCost, getCreditsConfigKey, getMonthBounds, getMonthlyCreditsForPlan, type CreditsConfig } from '@/lib/credits'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

type AutoPlanBody = {
  weeks?: number
}

type ContentProfileRow = {
  business_name: string | null
  niche: string | null
  audience: string | null
  tone_of_voice: string | null
  goals: string | null
  platforms: string[] | null
  frequency_per_week: number | null
  extra_preferences: Record<string, unknown> | null
}

const SERVICE_ERROR_MESSAGE =
  'Ocorreu uma instabilidade ao processar sua solicitação. Tente novamente em alguns instantes.'

const MAX_AUTO_ITEMS = 14

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function parseWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return [1, 2, 3, 4, 5]
  const normalized = value
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
  return normalized.length ? Array.from(new Set(normalized)) : [1, 2, 3, 4, 5]
}

async function deductCredits(userId: string, amount: number, config: CreditsConfig | null) {
  const supabaseAdmin = createSupabaseAdmin() as any
  const { periodStart, periodEnd } = getMonthBounds()

  let { data: usageRow } = await supabaseAdmin
    .from('user_usage')
    .select('id, usage_count')
    .eq('user_id', userId)
    .eq('feature_key', 'ai_credits')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle()

  if (!usageRow) {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id, plan_type')
      .eq('user_id', userId)
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

    const monthly = getMonthlyCreditsForPlan(planId, config)
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('user_usage')
      .insert({
        user_id: userId,
        feature_key: 'ai_credits',
        usage_count: monthly,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .select('id, usage_count')
      .single()

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? 'Erro ao criar período de créditos')
    }
    usageRow = inserted
  }

  const monthlyCount = Number(usageRow.usage_count) || 0
  const { data: purchasedRows } = await supabaseAdmin
    .from('user_usage')
    .select('id, usage_count')
    .eq('user_id', userId)
    .eq('feature_key', 'ai_credits_purchased')
    .order('id', { ascending: true })

  const purchasedList = Array.isArray(purchasedRows) ? purchasedRows : []
  const purchasedTotal = purchasedList.reduce((sum: number, row: { usage_count?: number }) => {
    return sum + (Number(row?.usage_count) || 0)
  }, 0)

  const totalAvailable = monthlyCount + purchasedTotal
  if (totalAvailable < amount) {
    const err = new Error('Créditos insuficientes')
    ;(err as any).code = 'insufficient_credits'
    ;(err as any).available = totalAvailable
    ;(err as any).required = amount
    throw err
  }

  let remaining = amount
  const deductFromMonthly = Math.min(monthlyCount, remaining)
  remaining -= deductFromMonthly

  const { error: monthlyError } = await supabaseAdmin
    .from('user_usage')
    .update({ usage_count: monthlyCount - deductFromMonthly, updated_at: new Date().toISOString() })
    .eq('id', usageRow.id)
  if (monthlyError) throw new Error(monthlyError.message)

  for (const row of purchasedList) {
    if (remaining <= 0) break
    const current = Number(row.usage_count) || 0
    const take = Math.min(current, remaining)
    if (take <= 0) continue
    remaining -= take
    const { error } = await supabaseAdmin
      .from('user_usage')
      .update({ usage_count: current - take, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (error) throw new Error(error.message)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const body = (await request.json().catch(() => ({}))) as AutoPlanBody
    const weeks = Math.max(1, Math.min(4, Number(body.weeks || 2)))

    const { data: profile, error: profileError } = await (supabase
      .from('content_profiles') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() as { data: ContentProfileRow | null; error: { message: string } | null }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    if (!profile) {
      return NextResponse.json({ error: 'Salve seu perfil de conteúdo antes de usar o automático.' }, { status: 400 })
    }

    const frequency = Math.max(1, Math.min(7, Number(profile.frequency_per_week || 3)))
    const requestedCount = Math.min(MAX_AUTO_ITEMS, frequency * weeks)
    const availability = parseWeekdays(profile.extra_preferences?.availability_weekdays)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(today)
    end.setDate(end.getDate() + (weeks * 7) + 10)

    const plannedDates: string[] = []
    for (let cursor = new Date(today); cursor <= end && plannedDates.length < requestedCount; cursor.setDate(cursor.getDate() + 1)) {
      if (!availability.includes(cursor.getDay())) continue
      plannedDates.push(formatDate(cursor))
    }
    if (plannedDates.length === 0) {
      return NextResponse.json({ error: 'Nenhum dia disponível para gerar conteúdos automáticos.' }, { status: 400 })
    }

    const { data: existingInWindow } = await (supabase
      .from('content_calendar_items') as any)
      .select('topic')
      .eq('user_id', user.id)
      .gte('date', plannedDates[0])
      .lte('date', plannedDates[plannedDates.length - 1])
    const usedTopics = new Set(
      (existingInWindow || [])
        .map((row: { topic?: string | null }) => row.topic?.trim().toLowerCase())
        .filter(Boolean)
    )

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = process.env.OPENAI_ROTEIRO_MODEL_ID || 'gpt-4o-mini'
    const profileSummary = [
      profile.business_name && `Nome do projeto/empresa: ${profile.business_name}`,
      profile.niche && `Nicho: ${profile.niche}`,
      profile.audience && `Público-alvo: ${profile.audience}`,
      profile.tone_of_voice && `Tom de voz: ${profile.tone_of_voice}`,
      profile.goals && `Objetivos: ${profile.goals}`,
      Array.isArray(profile.platforms) && profile.platforms.length ? `Plataformas: ${profile.platforms.join(', ')}` : null,
      `Frequência: ${frequency} vídeos por semana.`,
    ].filter(Boolean).join('\n')

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Você é um estrategista de conteúdo. Crie temas únicos e completos para calendário de vídeos.',
        },
        {
          role: 'user',
          content:
            `Perfil:\n${profileSummary || '(sem dados)'}\n\n` +
            `Gere ${plannedDates.length} conteúdos, um para cada data abaixo, sem repetir tema:\n${plannedDates.join(', ')}\n\n` +
            `Não use temas parecidos com estes já existentes: ${Array.from(usedTopics).join(' | ') || '(nenhum)'}\n\n` +
            'Retorne SOMENTE JSON válido no formato:\n' +
            '{ "items": [ { "date":"YYYY-MM-DD", "topic":"...", "script":"...", "caption":"...", "hashtags":"#.. #..", "recommended_time":"HH:MM" } ] }',
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    const firstBrace = raw.indexOf('{')
    const lastBrace = raw.lastIndexOf('}')
    const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? raw.slice(firstBrace, lastBrace + 1) : raw
    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const generatedItems = Array.isArray(parsed?.items) ? parsed.items : []
    const normalized = plannedDates.map((date, index) => {
      const fromAi = generatedItems[index] || {}
      const topic = String(fromAi.topic || '').trim() || `Tema ${index + 1}`
      const script = String(fromAi.script || '').trim()
      const caption = String(fromAi.caption || '').trim()
      const hashtags = String(fromAi.hashtags || '').trim()
      const recommendedTime = String(fromAi.recommended_time || '').trim()
      return { date, topic, script, caption, hashtags, recommendedTime }
    })

    const { data: configRow } = await (createSupabaseAdmin() as any)
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle() as { data: { value: unknown } | null }
    const config = (configRow?.value as CreditsConfig) ?? null
    const totalCost = getCreditCost('roteiro', config) * normalized.length

    try {
      await deductCredits(user.id, totalCost, config)
    } catch (e: any) {
      if (e?.code === 'insufficient_credits') {
        return NextResponse.json(
          {
            error: 'Créditos insuficientes para o planejamento automático.',
            code: 'insufficient_credits',
            balance: e.available,
            required: e.required,
            redirectTo: '/conta?tab=planos-e-uso',
          },
          { status: 402 }
        )
      }
      throw e
    }

    const payload = normalized.map((item) => ({
      user_id: user.id,
      date: item.date,
      topic: item.topic,
      status: 'generated',
      script: item.script,
      caption: item.caption,
      hashtags: item.hashtags,
      time: /^\d{1,2}:\d{2}$/.test(item.recommendedTime) ? `${item.recommendedTime}:00+00` : null,
      meta: {
        recommended_time: item.recommendedTime || null,
        auto_generated: true,
        regenerate_count: 0,
      },
    }))

    const { data: inserted, error: insertError } = await (supabase
      .from('content_calendar_items') as any)
      .insert(payload)
      .select('*')

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      count: inserted?.length || 0,
      items: inserted || [],
      creditsUsed: totalCost,
    })
  } catch (e: any) {
    console.error('[content/auto-plan] erro inesperado', e)
    return NextResponse.json({ error: e?.message || SERVICE_ERROR_MESSAGE }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

type ContentProfileRow = {
  business_name: string | null
  niche: string | null
  audience: string | null
  tone_of_voice: string | null
  goals: string | null
  platforms: string[] | null
  frequency_per_week: number | null
  extra_preferences?: {
    availability_days?: number[]
    [key: string]: unknown
  } | null
}

type ExistingItem = {
  id: string
  date: string
  topic: string | null
}

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getMonthBounds(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  return { start, end }
}

function buildScheduleDates(month: Date, availabilityDays: number[], frequencyPerWeek: number) {
  const { start, end } = getMonthBounds(month)
  const allDates: Date[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (availabilityDays.includes(d.getDay())) allDates.push(new Date(d))
  }

  // Distribui por semana, respeitando frequência
  const byWeek = new Map<string, Date[]>()
  for (const date of allDates) {
    const weekRef = new Date(date)
    weekRef.setDate(weekRef.getDate() - weekRef.getDay() + 1)
    const key = toYmd(weekRef)
    const curr = byWeek.get(key) ?? []
    curr.push(date)
    byWeek.set(key, curr)
  }

  const picked: Date[] = []
  for (const dates of byWeek.values()) {
    picked.push(...dates.slice(0, Math.max(1, Math.min(7, frequencyPerWeek))))
  }
  return picked
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Serviço de IA indisponível no momento. Tente novamente em instantes.' },
        { status: 503 }
      )
    }

    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const monthInput = typeof body.month === 'string' ? new Date(`${body.month}T00:00:00`) : new Date()
    if (Number.isNaN(monthInput.getTime())) {
      return NextResponse.json({ error: 'Mês inválido.' }, { status: 400 })
    }
    const month = new Date(monthInput.getFullYear(), monthInput.getMonth(), 1)
    const { start, end } = getMonthBounds(month)

    const { data: profile, error: profileError } = await (supabase
      .from('content_profiles') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() as { data: ContentProfileRow | null; error: { message: string } | null }

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
    if (!profile) {
      return NextResponse.json(
        { error: 'Configure primeiro o Perfil de Conteúdo da sua Marca para gerar a agenda automática.' },
        { status: 400 }
      )
    }

    const availabilityDays = Array.isArray(profile.extra_preferences?.availability_days) && profile.extra_preferences?.availability_days.length
      ? profile.extra_preferences.availability_days
      : [1, 2, 3, 4, 5]
    const frequencyPerWeek = Math.max(1, Math.min(7, Number(profile.frequency_per_week ?? 3)))
    const scheduleDates = buildScheduleDates(month, availabilityDays, frequencyPerWeek).slice(0, 20)

    if (scheduleDates.length === 0) {
      return NextResponse.json({ error: 'Nenhum dia disponível para gerar agenda neste mês.' }, { status: 400 })
    }

    const { data: existingItems } = await (supabase
      .from('content_calendar_items') as any)
      .select('id, date, topic')
      .eq('user_id', user.id)
      .gte('date', toYmd(start))
      .lte('date', toYmd(end))
      .order('date', { ascending: true }) as { data: ExistingItem[] | null }

    const existing = Array.isArray(existingItems) ? existingItems : []
    const existingDates = new Set(existing.map((it) => it.date))
    const targetDates = scheduleDates.filter((d) => !existingDates.has(toYmd(d)))

    if (targetDates.length === 0) {
      return NextResponse.json({ items: [], message: 'Este mês já possui vídeos nos dias planejados.' })
    }

    const profileSummary = [
      profile.business_name && `Nome do projeto/empresa: ${profile.business_name}`,
      profile.niche && `Nicho: ${profile.niche}`,
      profile.audience && `Público-alvo: ${profile.audience}`,
      profile.tone_of_voice && `Tom de voz: ${profile.tone_of_voice}`,
      profile.goals && `Objetivos: ${profile.goals}`,
      Array.isArray(profile.platforms) && profile.platforms.length
        ? `Plataformas: ${profile.platforms.join(', ')}`
        : null,
      `Frequência desejada: ${frequencyPerWeek} vídeos por semana.`,
    ].filter(Boolean).join('\n')

    const planDaysText = targetDates
      .map((d) => toYmd(d))
      .join(', ')

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = process.env.OPENAI_ROTEIRO_MODEL_ID || 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'Você é um planejador de conteúdo especialista em vídeos curtos. Responda SOMENTE JSON válido.',
        },
        {
          role: 'user',
          content:
            `Perfil do cliente:\n${profileSummary}\n\n` +
            `Crie um plano com conteúdo completo para as seguintes datas: ${planDaysText}.\n` +
            'Regras:\n' +
            '- NÃO repetir temas\n' +
            '- Entregar exatamente 1 item por data\n' +
            '- Tema deve ser específico e prático\n' +
            '- Incluir roteiro, legenda, hashtags e horário recomendado\n\n' +
            'Formato de resposta (JSON):\n' +
            '{ "items": [ { "date": "YYYY-MM-DD", "topic": "...", "script": "...", "caption": "...", "hashtags": "...", "recommended_time": "HH:MM", "platform": "instagram|tiktok|youtube" } ] }',
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content?.trim() || ''
    const firstBrace = raw.indexOf('{')
    const lastBrace = raw.lastIndexOf('}')
    const jsonText =
      firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? raw.slice(firstBrace, lastBrace + 1)
        : raw

    let parsed: any = null
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: 'Falha ao montar a agenda automática. Tente novamente.' }, { status: 503 })
    }

    const aiItems = Array.isArray(parsed?.items) ? parsed.items : []
    const aiMap = new Map<string, any>()
    for (const row of aiItems) {
      if (typeof row?.date === 'string') aiMap.set(row.date, row)
    }

    const payload = targetDates.map((date) => {
      const key = toYmd(date)
      const row = aiMap.get(key) ?? {}
      const recTime = typeof row.recommended_time === 'string' ? row.recommended_time.trim() : ''
      const timeValue = /^\d{1,2}:\d{2}$/.test(recTime) ? `${recTime}:00+00` : null
      return {
        user_id: user.id,
        date: key,
        topic: typeof row.topic === 'string' ? row.topic.trim() : null,
        script: typeof row.script === 'string' ? row.script.trim() : null,
        caption: typeof row.caption === 'string' ? row.caption.trim() : null,
        hashtags: typeof row.hashtags === 'string' ? row.hashtags.trim() : null,
        platform: typeof row.platform === 'string' ? row.platform.trim() : null,
        status: 'generated',
        time: timeValue,
        meta: {
          recommended_time: recTime || null,
          generation_source: 'auto_plan',
          regenerate_count: 0,
        },
      }
    })

    const { data: inserted, error: insertError } = await (supabase
      .from('content_calendar_items') as any)
      .insert(payload)
      .select('*')

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({ items: inserted ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao gerar agenda automática' }, { status: 500 })
  }
}

