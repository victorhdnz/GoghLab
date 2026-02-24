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
  'Ocorreu uma instabilidade ao processar sua solicitacao. Tente novamente em alguns instantes.'

function normalizeHashtags(value: string) {
  const tags = (value.match(/#[\p{L}\p{N}_]+/gu) || []).map((tag) => tag.toLowerCase())
  return Array.from(new Set(tags)).join(' ')
}

function stripHashtags(value: string) {
  return value.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim()
}

function formatScriptForReadability(value: string) {
  const normalized = value.trim()
  if (!normalized) return ''

  if (normalized.includes('\n')) {
    return normalized
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n\n')
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length <= 2) return normalized

  const chunks: string[] = []
  for (let i = 0; i < sentences.length; i += 2) {
    chunks.push(`${sentences[i]}${sentences[i + 1] ? ` ${sentences[i + 1]}` : ''}`.trim())
  }
  return chunks.join('\n\n')
}

function splitGoals(goals: string | null) {
  return (goals || '')
    .split('|')
    .map((goal) => goal.trim())
    .filter(Boolean)
}

function mapGoalToCta(goal: string) {
  const normalized = goal.toLowerCase()
  if (normalized.includes('vendas') || normalized.includes('site')) return 'Direcione para o link da bio.'
  if (normalized.includes('seguidores')) return 'Peça para seguir o perfil.'
  if (normalized.includes('engajamento') || normalized.includes('coment')) return 'Peça comentário no final.'
  if (normalized.includes('whatsapp') || normalized.includes('lead')) return 'Direcione para mensagem no WhatsApp.'
  if (normalized.includes('autoridade')) return 'Peça para salvar o conteúdo.'
  if (normalized.includes('educar')) return 'Incentive compartilhar com alguém.'
  if (normalized.includes('lancamento') || normalized.includes('oferta')) return 'CTA direto para a ação da oferta.'
  if (normalized.includes('retencao') || normalized.includes('comunidade')) return 'Convite para acompanhar a comunidade.'
  return 'CTA específico para o objetivo principal.'
}

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
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const parsedMonth = typeof body.month === 'string' ? toDate(body.month) : null
    const base = parsedMonth || new Date()
    const year = base.getFullYear()
    const monthIndex = base.getMonth()

    const { data: profile, error: profileError } = (await (supabase
      .from('content_profiles') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()) as { data: ProfileRow | null; error: { message: string } | null }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Salve o Perfil de Conteudo da sua Marca antes de usar o automatico.' },
        { status: 400 }
      )
    }

    const availabilityDays = Array.isArray(profile.extra_preferences?.availability_days)
      ? profile.extra_preferences?.availability_days ?? []
      : [1, 2, 3, 4, 5]
    const freqPerWeek = Math.max(1, Math.min(7, Number(profile.frequency_per_week || 3)))

    const { data: existingItems } = await (supabase.from('content_calendar_items') as any)
      .select('date, topic')
      .eq('user_id', user.id)
      .gte('date', `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`)
      .lte(
        'date',
        `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth(year, monthIndex)).padStart(2, '0')}`
      )

    const occupiedDates = new Set((existingItems || []).map((it: any) => it.date))
    const existingTopics = ((existingItems || []) as Array<{ topic?: unknown }>)
      .map((it) => (it.topic || '').toString().trim())
      .filter((topic: string) => Boolean(topic))

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
      return NextResponse.json({
        items: [],
        message: 'Sem datas livres para geracao automatica no periodo.',
      })
    }

    const goalsList = splitGoals(profile.goals)
    const primaryGoal = goalsList[0] || ''
    const ctaInstruction = mapGoalToCta(primaryGoal)

    const profileSummary = [
      profile.business_name && `Nome do projeto/empresa: ${profile.business_name}`,
      profile.niche && `Nicho: ${profile.niche}`,
      profile.audience && `Publico-alvo: ${profile.audience}`,
      profile.tone_of_voice && `Tom de voz: ${profile.tone_of_voice}`,
      goalsList.length ? `Objetivos selecionados: ${goalsList.join(' | ')}` : null,
      Array.isArray(profile.platforms) && profile.platforms.length
        ? `Plataformas: ${profile.platforms.join(', ')}`
        : null,
      `Frequencia desejada por semana: ${freqPerWeek}`,
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
            'Voce e estrategista de conteudo e roteirista. Gere planos completos e evite repetir temas.',
        },
        {
          role: 'user',
          content:
            `Perfil:\n${profileSummary || '(sem detalhes)'}\n\n` +
            `Datas para gerar: ${selectedDates.join(', ')}\n` +
            `Temas ja existentes para evitar duplicacao: ${existingTopics.length ? existingTopics.join(' | ') : '(nenhum)'}\n\n` +
            `Objetivo principal detectado: ${primaryGoal || 'não informado'}\n` +
            `Diretriz de CTA obrigatória: ${ctaInstruction}\n\n` +
            'Retorne SOMENTE JSON valido no formato:\n' +
            '{ "items": [\n' +
            '  { "date": "YYYY-MM-DD", "topic": "...", "script": "roteiro com seções e emojis (🎣 Gancho, 🧠 Desenvolvimento, 🎬 Demonstração/Exemplo, 📣 CTA), com quebras de linha", "caption": "legenda sem hashtags no texto", "hashtags": "...", "recommended_time": "HH:MM", "recommended_time_reason": "...", "cover_text_options": ["...", "...", "..."], "ad_copy": { "headline": "...", "body": "...", "cta": "..." } }\n' +
            ']}\n' +
            `A lista deve conter EXATAMENTE ${selectedDates.length} itens, com uma data unica para cada item, sem repetir tema.`,
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
      const scriptRaw = (rawItem?.script || '').toString().trim()
      const captionRaw = (rawItem?.caption || '').toString().trim()
      const hashtagsRaw = (rawItem?.hashtags || '').toString().trim()
      const coverTextOptions = Array.isArray(rawItem?.cover_text_options)
        ? rawItem.cover_text_options.map((opt: unknown) => String(opt || '').trim()).filter(Boolean).slice(0, 3)
        : []
      const adCopy = {
        headline: (rawItem?.ad_copy?.headline || '').toString().trim() || null,
        body: (rawItem?.ad_copy?.body || '').toString().trim() || null,
        cta: (rawItem?.ad_copy?.cta || '').toString().trim() || null,
      }
      const recommendedTimeReason = (rawItem?.recommended_time_reason || '').toString().trim() || null
      payloads.push({
        user_id: user.id,
        date,
        status: 'generated',
        topic,
        script: formatScriptForReadability(scriptRaw) || null,
        caption: stripHashtags(captionRaw) || null,
        hashtags: normalizeHashtags(`${hashtagsRaw} ${captionRaw}`) || null,
        cover_prompt: coverTextOptions.length ? coverTextOptions.join('\n') : null,
        time: /^\d{1,2}:\d{2}$/.test(recommendedTime) ? `${recommendedTime}:00+00` : null,
        meta: {
          recommended_time: /^\d{1,2}:\d{2}$/.test(recommendedTime) ? recommendedTime : null,
          recommended_time_reason: recommendedTimeReason,
          primary_goal: primaryGoal || null,
          cta_focus: ctaInstruction,
          cover_text_options: coverTextOptions,
          ad_copy: adCopy,
          auto_generated: true,
          regenerate_count: 0,
        },
      })
    }

    if (payloads.length === 0) {
      return NextResponse.json(
        { items: [], message: 'A IA nao retornou itens validos para as datas selecionadas.' },
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

