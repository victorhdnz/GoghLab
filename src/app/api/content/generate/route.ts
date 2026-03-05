import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { getCreditCost, getCreditsConfigKey, getMonthBounds, getMonthlyCreditsForPlan, type CreditsConfig } from '@/lib/credits'
import { buildScriptStructureInstruction } from '@/lib/content/script-strategies'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

type GenerateBody = {
  calendarItemId: string
  /** Se o usuário quiser forçar um tema específico nesse slot */
  overrideTopic?: string | null
  mode?: 'generate' | 'regenerate'
  regenerateInstruction?: string | null
  scriptStrategyKey?: string | null
}

type ContentProfileRow = {
  business_name: string | null
  niche: string | null
  audience: string | null
  tone_of_voice: string | null
  goals: string | null
  platforms: string[] | null
  frequency_per_week: number | null
  extra_preferences?: {
    audience_min_age?: number | null
    audience_max_age?: number | null
    [key: string]: unknown
  } | null
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

function normalizeHashtags(value: string) {
  const tags = (value.match(/#[\p{L}\p{N}_]+/gu) || []).map((tag) => tag.toLowerCase())
  return Array.from(new Set(tags)).join(' ')
}

/** Extrai apenas as hashtags de um texto (ex.: bloco fixo de legenda) para usar como lista única. */
function extractHashtagsFromText(value: string) {
  return normalizeHashtags(value || '')
}

function stripHashtags(value: string) {
  return value.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim()
}

/** Garante que o roteiro termine com o bloco fixo de CTA; se não terminar, anexa. */
function applyFixedScript(script: string, fixedScript: string): string {
  const s = (script || '').trim()
  const f = (fixedScript || '').trim()
  if (!f) return s
  const sNorm = s.replace(/\s+/g, ' ').trim()
  const fNorm = f.replace(/\s+/g, ' ').trim()
  if (sNorm.endsWith(fNorm) || sNorm.includes(fNorm.slice(-40))) return s
  return s ? `${s}\n\n${f}` : f
}

/** Garante que a legenda termine com o bloco fixo (com quebras de linha preservadas) e que as hashtags sejam só as do bloco fixo. Evita duplicar se a IA já tiver colado o bloco. */
function applyFixedCaption(
  caption: string,
  hashtagsFromAi: string,
  fixedCaption: string
): { caption: string; hashtags: string } {
  let intro = stripHashtags((caption || '').trim())
  const fixed = (fixedCaption || '').trim()
  if (!fixed) return { caption: intro, hashtags: hashtagsFromAi }
  const fixedHashtags = extractHashtagsFromText(fixed)
  const fixedNorm = fixed.replace(/\s+/g, ' ').trim()
  const introNorm = intro.replace(/\s+/g, ' ').trim()
  if (fixedNorm && introNorm.endsWith(fixedNorm)) {
    intro = introNorm.slice(0, -fixedNorm.length).trim()
  }
  const finalCaption = intro ? `${intro}\n\n${fixed}` : fixed
  return { caption: finalCaption, hashtags: fixedHashtags || hashtagsFromAi }
}

/** Garante que o texto do anúncio (body ou cta) termine com o bloco fixo. */
function applyFixedAdCopy(
  body: string | null,
  cta: string | null,
  fixedAdCopy: string
): { body: string | null; cta: string | null } {
  const fixed = (fixedAdCopy || '').trim()
  if (!fixed) return { body, cta }
  const b = (body || '').trim()
  const c = (cta || '').trim()
  const fNorm = fixed.replace(/\s+/g, ' ')
  if (b && b.replace(/\s+/g, ' ').endsWith(fNorm)) return { body, cta }
  if (c && c.replace(/\s+/g, ' ').endsWith(fNorm)) return { body, cta }
  const newBody = b ? `${b}\n\n${fixed}` : fixed
  return { body: newBody, cta: c }
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

function mapGoalToCta(goal: string) {
  const normalized = goal.toLowerCase()
  if (normalized.includes('vendas') || normalized.includes('site')) {
    return 'Direcione para o link da bio com proposta clara de conversão.'
  }
  if (normalized.includes('seguidores')) {
    return 'Peça para seguir o perfil para receber mais conteúdos.'
  }
  if (normalized.includes('engajamento') || normalized.includes('coment')) {
    return 'Estimule comentário com pergunta estratégica no final.'
  }
  if (normalized.includes('whatsapp') || normalized.includes('lead')) {
    return 'Direcione para envio de mensagem no WhatsApp.'
  }
  if (normalized.includes('autoridade')) {
    return 'Peça para salvar o conteúdo como referência.'
  }
  if (normalized.includes('educar') || normalized.includes('educacao')) {
    return 'Incentive compartilhar com alguém que precisa ver isso.'
  }
  if (normalized.includes('lancamento') || normalized.includes('oferta') || normalized.includes('promo')) {
    return 'CTA direto para ação imediata da oferta/lançamento.'
  }
  if (normalized.includes('retencao') || normalized.includes('comunidade')) {
    return 'Convite para acompanhar a série e permanecer na comunidade.'
  }
  return 'Use CTA objetivo e específico para o resultado desejado.'
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

function buildAudienceSummary(profile: ContentProfileRow) {
  const min = Number(profile.extra_preferences?.audience_min_age)
  const max = Number(profile.extra_preferences?.audience_max_age)
  const hasMin = Number.isFinite(min) && min > 0
  const hasMax = Number.isFinite(max) && max > 0
  if (hasMin && hasMax) return `${min} a ${max} anos`
  if (hasMin) return `${min}+ anos`
  if (hasMax) return `até ${max} anos`
  return profile.audience || 'não informado'
}

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

    const { data: existingTopicsRows } = await (supabase.from('content_calendar_items') as any)
      .select('topic')
      .eq('user_id', user.id)
      .neq('id', calendarItemId)
      .not('topic', 'is', null)

    const existingTopics = ((existingTopicsRows || []) as Array<{ topic?: unknown }>)
      .map((row) => (row.topic || '').toString().trim())
      .filter((topic: string) => Boolean(topic))

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
    if (mode === 'regenerate' && regenerateCount >= 2) {
      return NextResponse.json(
        { error: 'Limite atingido: você pode gerar novamente até 2 vezes por vídeo.' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = process.env.OPENAI_ROTEIRO_MODEL_ID || 'gpt-4o-mini'

    // Montar descrição do perfil
    const goalsList = splitGoals(profile.goals)
    const primaryGoal = goalsList[0] || ''
    const audienceSummary = buildAudienceSummary(profile)
    const ctaInstruction = mapGoalToCta(primaryGoal)
    const strategyFromProfile =
      typeof profile.extra_preferences?.script_strategy_key === 'string'
        ? profile.extra_preferences.script_strategy_key
        : null
    const scriptStrategy = buildScriptStructureInstruction(
      (body.scriptStrategyKey || strategyFromProfile || null) as string | null
    )

    const prefs = profile.extra_preferences || {}
    const fixedScript = String(prefs.fixed_structure_script ?? (prefs as Record<string, unknown>).fixed_structure ?? '').trim()
    const fixedCaption = String(prefs.fixed_structure_caption ?? '').trim()
    const fixedAdCopy = String(prefs.fixed_structure_ad_copy ?? '').trim()
    const fixedCover = String(prefs.fixed_structure_cover ?? '').trim()
    const fixedParts: string[] = []
    if (fixedScript) fixedParts.push(`Roteiro (script) — colocar este bloco no final:\n${fixedScript}`)
    if (fixedCaption) fixedParts.push(`Legenda do vídeo — colocar este bloco no final (manter quebras de linha):\n${fixedCaption}`)
    if (fixedAdCopy) fixedParts.push(`Legenda do anúncio — colocar este bloco no final (manter quebras de linha):\n${fixedAdCopy}`)
    if (fixedCover) fixedParts.push(`Texto de capa:\n${fixedCover}`)
    const fixedStructuresBlock = fixedParts.length
      ? `ESTRUTURAS FIXAS (incluir exatamente como está abaixo):\n\n${fixedParts.join('\n\n')}\n\nNo roteiro, terminar com o bloco do script. Na legenda, após seu texto, o bloco da legenda (manter quebras de linha). No anúncio, terminar com o bloco do anúncio. Usar APENAS as hashtags do bloco da legenda.`
      : null
    const profileSummary = [
      profile.business_name && `Nome do projeto/empresa: ${profile.business_name}`,
      profile.niche && `Detalhamento sobre a marca: ${profile.niche}`,
      `Público-alvo: ${audienceSummary}`,
      profile.tone_of_voice && `Tom de voz: ${profile.tone_of_voice}`,
      goalsList.length ? `Objetivos selecionados: ${goalsList.join(' | ')}` : null,
      Array.isArray(profile.platforms) && profile.platforms.length
        ? `Plataformas: ${profile.platforms.join(', ')}`
        : null,
      typeof profile.frequency_per_week === 'number' && profile.frequency_per_week > 0
        ? `Frequência desejada: ${profile.frequency_per_week} vídeos por semana.`
        : null,
      fixedStructuresBlock,
    ]
      .filter(Boolean)
      .join('\n')

    const platformInfo = item.platform ? `Plataforma principal para este vídeo: ${item.platform}.` : ''
    const dateInfo = item.date ? `Data planejada: ${item.date}.` : ''

    const regenerateInstruction = (body.regenerateInstruction || '').toString().trim()
    const isPersonalizedTopic = Boolean(topic && mode !== 'regenerate')
    const userInstruction = mode === 'regenerate'
      ? `Gere uma NOVA estrutura completa para este vídeo, com tema diferente do tema atual "${topic || 'sem tema'}". Não repita ideias já usadas e mantenha aderência ao perfil do cliente.${regenerateInstruction ? `\n\nAjustes solicitados pelo cliente para esta regeneração: ${regenerateInstruction}` : ''}`
      : isPersonalizedTopic
        ? `Este vídeo é PERSONALIZADO: o tema, a vertente e o conteúdo devem ser EXATAMENTE o que o usuário pediu. Não invente outro tema nem genérico. Tema/título obrigatório a seguir em todo o roteiro, legenda e anúncio:\n\n"${topic}"`
        : 'Sugira um tema relevante para o nicho e gere o conteúdo completo com base nesse tema sugerido.'

    const messages = [
      {
        role: 'system' as const,
        content:
          'Você é um estrategista e roteirista sênior de conteúdo para redes sociais. Gere roteiros SÓLIDOS e completos: cada seção (Atenção, Interesse, Desejo, Gancho, etc.) deve ter desenvolvimento de verdade — no mínimo 3 a 5 frases por bloco (o CTA final pode ser mais curto). Nunca entregue blocos de uma ou duas frases; inclua argumentos, exemplos concretos, perguntas ou emoção que criem conexão e desejo. O roteiro deve ter a mesma densidade de um vídeo bem escrito. É vídeo, não aula: impacto e clareza sem enrolar. Conteúdo pronto para copiar e postar, com alto nível de clareza visual.',
      },
      {
        role: 'user' as const,
        content:
          `Perfil de conteúdo do cliente:\n${profileSummary || '(sem detalhes adicionais)'}\n\n` +
          `${platformInfo}\n${dateInfo}\n\n` +
          `${userInstruction}\n\n` +
          `TEMAS JÁ UTILIZADOS (prefira abordagens diferentes; pode reutilizar a mesma vertente se desenvolver de forma distinta): ${existingTopics.length ? existingTopics.join(' | ') : '(nenhum)'}\n\n` +
          `Objetivo principal detectado: ${primaryGoal || 'não informado'}.\n` +
          `Diretriz de CTA obrigatória: ${ctaInstruction}\n\n` +
          'REGRAS OBRIGATÓRIAS:\n' +
          (fixedScript || fixedCaption || fixedAdCopy
            ? '- Inclua os blocos fixos do perfil exatamente como escritos (roteiro no final do script; legenda no final da legenda; anúncio no final do texto do anúncio). Mantenha quebras de linha e formato.\n'
            : '') +
          '- O roteiro (script) DEVE ter estrutura visual: cada seção em linha separada, começando com emoji e nome da seção (ex.: 🎣 Gancho:, 📣 CTA final:). Não entregue um único parágrafo contínuo; use quebras de linha entre cada bloco.\n' +
          '- Prefira temas ou abordagens diferentes dos já utilizados; a mesma vertente pode ser reutilizada se desenvolvida de forma distinta (outro ângulo, exemplos ou roteiro). Evite só duplicar o mesmo tema com o mesmo enfoque.\n' +
          '- QUALIDADE DO ROTEIRO (obrigatório): Cada bloco (Atenção, Interesse, Desejo, Gancho, Problema, Solução, etc.) deve ter no MÍNIMO 3 a 5 frases desenvolvidas — o CTA final pode ser 1–2 frases. Blocos com uma ou duas frases são PROIBIDOS: deixam o vídeo raso. Inclua argumentos, exemplos concretos, perguntas ao espectador ou emoção que criem conexão e desejo. O roteiro deve ter densidade e completude iguais a um vídeo personalizado bem feito. Evite texto genérico; transmita com impacto sem enrolar. Não repita ideias.\n' +
          scriptStrategy.promptInstruction +
          '- Use emoji APENAS no início do título de cada bloco. Não use emoji no final de frases e nem no corpo do texto.\n' +
          '- A legenda deve vir sem hashtags no corpo, com 2 a 3 parágrafos curtos e espaçamento entre parágrafos.\n' +
          '- Na legenda, inclua pelo menos 1 emoji em ponto estratégico (ex.: destaque para CTA, benefício ou frase-chave), de acordo com o tema; pode usar mais um ou dois se fizer sentido, mas de forma estratégica, sem poluir.\n' +
          (fixedCaption ? '- Hashtags: use SOMENTE as hashtags do bloco fixo da legenda indicado no perfil; não invente nem adicione outras.\n' : '- Hashtags devem vir em uma única linha, entre 10 e 15, relevantes e sem duplicação.\n') +
          '- No texto para anúncio (body): pode incluir 1 emoji estratégico para destaque em ponto importante (benefício, diferencial ou CTA), de forma que some à frase.\n' +
          '- Para recommended_time: estude o nicho, o público-alvo (idade e objetivos) e o dia da semana da data planejada; recomende o melhor horário de postagem (HH:MM) para esse público naquele dia, com justificativa breve. Varie os horários entre os itens quando fizer sentido para o contexto.\n\n' +
          'Retorne SOMENTE um JSON válido, sem explicações extras, no formato:' +
          '\n{\n' +
          '  "topic": "título/tema do vídeo",\n' +
          `  "script": "roteiro COM ESTRUTURA: cada bloco em linha separada com emoji e nome (ex.: 🎣 Gancho:, depois o texto; 📣 CTA final:, depois o texto). Cada bloco com MÍNIMO 3 a 5 frases desenvolvidas (CTA pode ser mais curto). Sequência: ${scriptStrategy.steps.join(' -> ')}. Não entregue parágrafo único nem blocos curtos; use quebras de linha. Não inclua frases de instrução no texto.",\n` +
          '  "caption": "legenda pronta para postar, com pelo menos 1 emoji em ponto estratégico (destaque que faça sentido com o tema) e parágrafos separados por linha em branco (SEM hashtags no texto)",\n' +
          '  "hashtags": "#tag1 #tag2 #tag3 ... (entre 10 e 15 hashtags em UMA linha)",\n' +
          '  "recommended_time": "HH:MM",\n' +
          '  "recommended_time_reason": "justificativa curta considerando nicho, público e dia da semana",\n' +
          '  "cover_text_options": ["opcao 1", "opcao 2", "opcao 3"],\n' +
          '  "ad_copy": {\n' +
          '    "headline": "headline curta e impactante",\n' +
          '    "body": "texto persuasivo médio com foco no objetivo; pode incluir 1 emoji estratégico para destaque em ponto importante (ex.: benefício, diferencial)",\n' +
          '    "cta": "cta forte e específico"\n' +
          '  }\n' +
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
    let scriptRaw = (parsed.script ?? '').toString().trim()
    let captionRaw = (parsed.caption ?? '').toString().trim()
    let hashtagsRaw = (parsed.hashtags ?? '').toString().trim()
    let adBody = (parsed?.ad_copy?.body ?? '').toString().trim() || null
    let adCta = (parsed?.ad_copy?.cta ?? '').toString().trim() || null

    // Aplicar estruturas fixas em pós-processamento (garantir que estejam em todos os vídeos)
    if (fixedScript) scriptRaw = applyFixedScript(scriptRaw, fixedScript)
    if (fixedCaption) {
      const applied = applyFixedCaption(captionRaw, hashtagsRaw, fixedCaption)
      captionRaw = applied.caption
      hashtagsRaw = applied.hashtags
    }
    if (fixedAdCopy) {
      const applied = applyFixedAdCopy(adBody, adCta, fixedAdCopy)
      adBody = applied.body
      adCta = applied.cta
    }

    const script = formatScriptForReadability(scriptRaw)
    const caption = formatCaptionForReadability(captionRaw)
    const hashtags = normalizeHashtags(hashtagsRaw)
    const recommendedTime = (parsed.recommended_time ?? '').toString().trim()
    const recommendedTimeReason = (parsed.recommended_time_reason ?? '').toString().trim() || null
    const coverTextOptions = Array.isArray(parsed.cover_text_options)
      ? parsed.cover_text_options.map((opt: unknown) => String(opt || '').trim()).filter(Boolean).slice(0, 3)
      : []
    const adCopy = {
      headline: (parsed?.ad_copy?.headline ?? '').toString().trim() || null,
      body: adBody,
      cta: adCta,
    }

    // Atualizar item no calendário
    const updates: any = {
      status: 'generated',
      topic: generatedTopic || topic || item.topic,
      script,
      caption,
      hashtags,
      cover_prompt: coverTextOptions.length ? coverTextOptions.join('\n') : null,
      meta: {
        ...(item.meta || {}),
        recommended_time: recommendedTime || null,
        recommended_time_reason: recommendedTimeReason,
        primary_goal: primaryGoal || null,
        cta_focus: ctaInstruction,
        cover_text_options: coverTextOptions,
        ad_copy: adCopy,
        regenerate_count: mode === 'regenerate' ? regenerateCount + 1 : regenerateCount,
        script_strategy_key: scriptStrategy.key,
        script_strategy_label: scriptStrategy.label,
        script_strategy_steps: scriptStrategy.steps,
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
        recommended_time_reason: recommendedTimeReason,
        cover_text_options: coverTextOptions,
        ad_copy: adCopy,
      },
    })
  } catch (e: any) {
    console.error('[content/generate] erro inesperado', e)
    return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
  }
}

