import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildScriptStructureInstruction } from '@/lib/content/script-strategies'

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
    auto_plan_last_month?: string
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

function stripDecorativeEmojis(value: string) {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s{2,}/g, ' ').trim()
}

const SCRIPT_SECTIONS: Array<{ heading: string; aliases: string[] }> = [
  { heading: '🎣 Gancho:', aliases: ['gancho', 'hook', 'abertura'] },
  { heading: '😣 Problema/Dor:', aliases: ['problema', 'dor', 'problema dor'] },
  { heading: '💡 Insight/Virada de chave:', aliases: ['insight', 'virada', 'virada de chave'] },
  { heading: '🧠 Desenvolvimento:', aliases: ['desenvolvimento', 'explicacao', 'explicação'] },
  { heading: '🎬 Demonstração/Exemplo:', aliases: ['demonstração', 'demonstracao', 'exemplo', 'demonstração exemplo', 'demonstracao exemplo'] },
  { heading: '✅ Solução:', aliases: ['solução', 'solucao'] },
  { heading: '👀 Atenção:', aliases: ['atenção', 'atencao'] },
  { heading: '🤝 Interesse:', aliases: ['interesse'] },
  { heading: '🔥 Desejo:', aliases: ['desejo'] },
  { heading: '📣 CTA final:', aliases: ['cta', 'cta final', 'acao', 'ação', 'chamada para acao', 'chamada para ação'] },
  { heading: '🪜 Agitação:', aliases: ['agitação', 'agitacao'] },
  { heading: '📖 Contexto/História:', aliases: ['contexto', 'história', 'historia', 'contexto história', 'contexto historia'] },
  { heading: '⚔️ Conflito:', aliases: ['conflito'] },
  { heading: '🎯 Oferta:', aliases: ['oferta'] },
]

function normalizeHeadingToken(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveHeading(raw: string) {
  const token = normalizeHeadingToken(raw)
  if (!token) return null
  for (const section of SCRIPT_SECTIONS) {
    for (const alias of section.aliases) {
      const aliasToken = normalizeHeadingToken(alias)
      if (token === aliasToken || token.startsWith(`${aliasToken} `) || token.endsWith(` ${aliasToken}`)) {
        return section.heading
      }
    }
  }
  return null
}

function stripLeadingRepeatedHeading(content: string, heading: string) {
  const normalizedHeading = normalizeHeadingToken(heading.replace(':', ''))
  const match = content.match(/^\(?([^)]+)\)?\s*:?\s*(.*)$/u)
  if (!match) return content.trim()
  const maybeHeading = normalizeHeadingToken(match[1] || '')
  if (maybeHeading && (maybeHeading === normalizedHeading || normalizedHeading.includes(maybeHeading) || maybeHeading.includes(normalizedHeading))) {
    return (match[2] || '').trim()
  }
  return content.trim()
}

function formatScriptForReadability(value: string) {
  const normalized = value.trim()
  if (!normalized) return ''

  const sourceLines = normalized
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const lines = sourceLines.length
    ? sourceLines
    : normalized
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter(Boolean)

  const formatted: string[] = []
  let lastHeading: string | null = null

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ').trim()
    const headingMatch = line.match(/^([\p{Extended_Pictographic}\uFE0F\s()/-]*[^:\n]{2,})\s*:\s*(.*)$/u)
    if (headingMatch) {
      const resolved = resolveHeading(stripDecorativeEmojis(headingMatch[1] || ''))
      const contentRaw = stripDecorativeEmojis(headingMatch[2] || '')
      if (resolved) {
        if (lastHeading !== resolved) {
          formatted.push(resolved)
          lastHeading = resolved
        }
        const content = stripLeadingRepeatedHeading(contentRaw, resolved)
        if (content && formatted[formatted.length - 1] !== content) {
          formatted.push(content)
        }
        continue
      }
      const fallback = stripDecorativeEmojis(line)
      if (fallback && formatted[formatted.length - 1] !== fallback) {
        formatted.push(fallback)
      }
      lastHeading = null
      continue
    }
    const headingOnly = resolveHeading(stripDecorativeEmojis(line))
    if (headingOnly) {
      if (lastHeading !== headingOnly) {
        formatted.push(headingOnly)
        lastHeading = headingOnly
      }
      continue
    }
    const plain = stripDecorativeEmojis(line)
    if (plain && formatted[formatted.length - 1] !== plain) {
      formatted.push(plain)
    }
    lastHeading = null
  }

  return formatted.filter(Boolean).join('\n\n')
}

function formatCaptionForReadability(value: string) {
  const clean = stripHashtags(value)
  if (!clean) return ''

  const rawParagraphs = clean
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const paragraphs = rawParagraphs.length
    ? rawParagraphs
    : clean
        .split(/(?<=[.!?])\s+/)
        .reduce<string[]>((acc, sentence, index) => {
          if (!sentence) return acc
          const bucket = Math.floor(index / 2)
          acc[bucket] = `${acc[bucket] ? `${acc[bucket]} ` : ''}${sentence}`.trim()
          return acc
        }, [])

  return paragraphs.join('\n\n')
}

function splitGoals(goals: string | null) {
  return (goals || '')
    .split('|')
    .map((goal) => goal.trim())
    .filter(Boolean)
}

function normalizeTopicKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
  const normalized = value.trim()
  const ymd = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymd) {
    const year = Number(ymd[1])
    const month = Number(ymd[2]) - 1
    const day = Number(ymd[3])
    const date = new Date(year, month, day)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
    const scriptStrategy = buildScriptStructureInstruction(
      typeof body.scriptStrategyKey === 'string' ? body.scriptStrategyKey : null
    )
    const base = parsedMonth || new Date()
    const year = base.getFullYear()
    const monthIndex = base.getMonth()
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

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

    if (profile.extra_preferences?.auto_plan_last_month === monthKey) {
      return NextResponse.json(
        {
          error: 'A agenda automática deste mês já foi gerada. Aguarde o próximo mês para gerar novamente.',
          code: 'AUTO_PLAN_ALREADY_USED',
        },
        { status: 400 }
      )
    }

    const availabilityDays = Array.isArray(profile.extra_preferences?.availability_days)
      ? profile.extra_preferences?.availability_days ?? []
      : [1, 2, 3, 4, 5]
    const freqPerWeek = Math.max(1, Math.min(7, Number(profile.frequency_per_week || 3)))

    const { data: existingItemsInMonth } = await (supabase.from('content_calendar_items') as any)
      .select('date, topic')
      .eq('user_id', user.id)
      .gte('date', `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`)
      .lte(
        'date',
        `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth(year, monthIndex)).padStart(2, '0')}`
      )

    const { data: existingTopicsAll } = await (supabase.from('content_calendar_items') as any)
      .select('topic')
      .eq('user_id', user.id)
      .not('topic', 'is', null)

    // Só considera "já gerou agenda este mês" se existir item com auto_generated E auto_plan_month deste mês
    // (itens realocados de outro mês têm auto_generated mas não auto_plan_month === monthKey)
    const { data: existingAutoPlanItem } = await (supabase.from('content_calendar_items') as any)
      .select('id')
      .eq('user_id', user.id)
      .contains('meta', { auto_generated: true, auto_plan_month: monthKey })
      .gte('date', `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`)
      .lte(
        'date',
        `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth(year, monthIndex)).padStart(2, '0')}`
      )
      .limit(1)
      .maybeSingle()

    if (existingAutoPlanItem?.id) {
      const mergedPrefs = {
        ...(profile.extra_preferences || {}),
        auto_plan_last_month: monthKey,
      }
      await (supabase
        .from('content_profiles') as any)
        .update({ extra_preferences: mergedPrefs })
        .eq('user_id', user.id)

      return NextResponse.json(
        {
          error: 'A agenda automática deste mês já foi gerada. Aguarde o próximo mês para gerar novamente.',
          code: 'AUTO_PLAN_ALREADY_USED',
        },
        { status: 400 }
      )
    }

    const occupiedDates = new Set((existingItemsInMonth || []).map((it: any) => it.date))
    const existingTopics = ((existingTopicsAll || []) as Array<{ topic?: unknown }>)
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

    // Regra nova: gerar para TODAS as ocorrências dos dias marcados no mês,
    // respeitando datas já ocupadas.
    const selectedDates = candidateDates

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
            'Voce e estrategista senior de conteudo e roteirista. Gere planos completos, com alta legibilidade visual e sem repetir temas.',
        },
        {
          role: 'user',
          content:
            `Perfil:\n${profileSummary || '(sem detalhes)'}\n\n` +
            `Datas para gerar: ${selectedDates.join(', ')}\n` +
            `Temas ja existentes para evitar duplicacao: ${existingTopics.length ? existingTopics.join(' | ') : '(nenhum)'}\n\n` +
            `Objetivo principal detectado: ${primaryGoal || 'não informado'}\n` +
            `Diretriz de CTA obrigatória: ${ctaInstruction}\n\n` +
            'REGRAS OBRIGATORIAS:\n' +
            '- Cada roteiro precisa ter profundidade: suficiente para 1:20 a 1:30 de video (entre 230 e 320 palavras). Desenvolva cada bloco com conteudo de verdade, mas de forma equilibrada — evite blocos curtos demais e tambem blocos gigantes ou repetitivos.\n' +
            scriptStrategy.promptInstruction +
            '- Use emoji APENAS no inicio do titulo de cada bloco. Nao use emoji no final de frases e nem no corpo do texto.\n' +
            '- A legenda deve vir sem hashtags no corpo, com 2 a 3 paragrafos curtos e espaco entre paragrafos.\n' +
            '- Na legenda, inclua pelo menos 1 emoji em ponto estrategico (ex.: destaque para CTA, beneficio ou frase-chave), de acordo com o tema; pode usar mais um ou dois se fizer sentido, mas de forma estrategica, sem poluir.\n' +
            '- Hashtags em uma unica linha, entre 10 e 15, relevantes e sem duplicacao.\n' +
            '- No texto para anuncio (body): pode incluir 1 emoji estrategico para destaque em ponto importante (beneficio, diferencial ou CTA), de forma que some a frase.\n' +
            '- Para cada item: recommended_time e recommended_time_reason devem ser resultado de analise real: considere o nicho, o publico-alvo (idade e objetivos) e o dia da semana da data daquele item; recomende o melhor horario de postagem (HH:MM) para esse publico naquele dia, com justificativa breve, e varie os horarios entre os itens quando fizer sentido.\n\n' +
            'Retorne SOMENTE JSON valido no formato:\n' +
            '{ "items": [\n' +
            `  { "date": "YYYY-MM-DD", "topic": "...", "script": "roteiro desenvolvido (230–320 palavras) com blocos e quebras de linha na ordem: ${scriptStrategy.steps.join(' -> ')}; cada bloco com 2 a 4 frases de desenvolvimento, sem exagerar", "caption": "legenda com pelo menos 1 emoji em ponto estrategico (destaque que faca sentido com o tema) e paragrafos separados (sem hashtags no texto)", "hashtags": "...", "recommended_time": "HH:MM", "recommended_time_reason": "...", "cover_text_options": ["...", "...", "..."], "ad_copy": { "headline": "...", "body": "texto persuasivo; pode 1 emoji estrategico para destaque", "cta": "..." } }\n` +
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
    const usedTopics = new Set(existingTopics.map((topic) => normalizeTopicKey(topic)))
    const payloads: any[] = []

    for (const rawItem of aiItems) {
      const date = typeof rawItem?.date === 'string' ? rawItem.date : null
      if (!date || !selectedSet.has(date)) continue

      const topic = (rawItem?.topic || '').toString().trim()
      if (!topic) continue
      const key = normalizeTopicKey(topic)
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
        caption: formatCaptionForReadability(captionRaw) || null,
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
          auto_plan_month: monthKey,
          regenerate_count: 0,
          script_strategy_key: scriptStrategy.key,
          script_strategy_label: scriptStrategy.label,
          script_strategy_steps: scriptStrategy.steps,
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

    const mergedPrefs = {
      ...(profile.extra_preferences || {}),
      auto_plan_last_month: monthKey,
    }
    await (supabase
      .from('content_profiles') as any)
      .update({ extra_preferences: mergedPrefs })
      .eq('user_id', user.id)

    return NextResponse.json({ items: inserted || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || SERVICE_ERROR_MESSAGE }, { status: 500 })
  }
}

