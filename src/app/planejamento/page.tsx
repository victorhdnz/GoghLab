'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LumaSpin } from '@/components/ui/luma-spin'
import { Button } from '@/components/ui/button'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { ShinyButton } from '@/components/ui/shiny-button'
import { HoverButton } from '@/components/ui/hover-button'
import { Calendar as CalendarIcon, FileText, Type, Clock, ImageIcon, Megaphone, RefreshCw, Sparkles, Plus, X, CheckCircle2, Circle } from 'lucide-react'
import { CalendarWithEventSlots } from '@/components/ui/calendar-with-event-slots'
import { Modal } from '@/components/ui/Modal'
import {
  DEFAULT_SCRIPT_STRATEGY_KEY,
  SCRIPT_STRATEGIES,
  getScriptStrategy,
  type ScriptStrategyKey,
} from '@/lib/content/script-strategies'
import toast from 'react-hot-toast'

const ERRO_GERACAO_MENSAGEM =
  'Ocorreu uma instabilidade. Tente novamente. Se o problema persistir, entre em contato com o suporte pelo WhatsApp.'

type ContentProfile = {
  id: string
  business_name: string | null
  niche: string | null
  audience: string | null
  tone_of_voice: string | null
  goals: string | null
  platforms: string[] | null
  frequency_per_week: number | null
  extra_preferences?: {
    availability_days?: number[]
    custom_goals?: string[]
    auto_plan_last_month?: string
    [key: string]: any
  } | null
}

type CalendarItem = {
  id: string
  date: string
  time: string | null
  platform: string | null
  topic: string | null
  cover_prompt?: string | null
  status: string
  script: string | null
  caption: string | null
  hashtags: string | null
  meta: any | null
}

type ProfileFormState = {
  business_name: string
  niche: string
  audience_min_age: string
  audience_max_age: string
  tone_of_voice: string
  goals: string[]
  platforms: string[]
  frequency_per_week: number
  availability_days: number[]
  script_strategy_key: ScriptStrategyKey
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function formatDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateKey(value: string | null | undefined) {
  if (!value) return null
  const raw = value.trim()
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match?.[1]) return match[1]
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return formatDate(parsed)
}

function buildProfileSignature(form: ProfileFormState, customGoals: string[]) {
  return JSON.stringify({
    business_name: form.business_name.trim(),
    niche: form.niche.trim(),
    audience_min_age: form.audience_min_age.trim(),
    audience_max_age: form.audience_max_age.trim(),
    tone_of_voice: form.tone_of_voice.trim(),
    goals: [...form.goals].map((goal) => goal.trim()).filter(Boolean).sort(),
    platforms: [...form.platforms].map((platform) => platform.trim()).filter(Boolean).sort(),
    availability_days: [...form.availability_days].sort((a, b) => a - b),
    script_strategy_key: getScriptStrategy(form.script_strategy_key).key,
    custom_goals: [...customGoals].map((goal) => goal.trim()).filter(Boolean).sort(),
  })
}

function splitSentencesForReadability(text: string) {
  const rawParts = text
    .replace(/\s+/g, ' ')
    .trim()
    // Só quebra quando a próxima sentença começa com letra/número.
    // Isso evita separar emoji sozinho como "parágrafo órfão".
    .split(/(?<=[.!?])\s+(?=[\p{L}\p{N}])/gu)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const mergedParts: string[] = []
  for (const part of rawParts) {
    const isEmojiOnly = /^[\p{Extended_Pictographic}\uFE0F\s]+$/u.test(part)
    if (isEmojiOnly && mergedParts.length > 0) {
      mergedParts[mergedParts.length - 1] = `${mergedParts[mergedParts.length - 1]} ${part}`.trim()
      continue
    }
    mergedParts.push(part)
  }

  return mergedParts.join('\n\n')
}

const SCRIPT_HEADING_ALIASES: Array<{ heading: string; aliases: string[] }> = [
  { heading: '🎣 Gancho:', aliases: ['gancho', 'hook', 'abertura'] },
  { heading: '😣 Problema/Dor:', aliases: ['problema', 'dor', 'problema dor'] },
  { heading: '💡 Insight/Virada de chave:', aliases: ['insight', 'virada', 'virada de chave'] },
  { heading: '🧠 Desenvolvimento:', aliases: ['desenvolvimento', 'explicacao', 'explicação'] },
  { heading: '🎬 Demonstração/Exemplo:', aliases: ['demonstracao', 'demonstração', 'exemplo', 'demonstracao exemplo', 'demonstração exemplo'] },
  { heading: '✅ Solução:', aliases: ['solucao', 'solução'] },
  { heading: '👀 Atenção:', aliases: ['atencao', 'atenção'] },
  { heading: '🤝 Interesse:', aliases: ['interesse'] },
  { heading: '🔥 Desejo:', aliases: ['desejo'] },
  { heading: '📣 CTA final:', aliases: ['cta', 'acao', 'ação', 'cta final', 'chamada para acao', 'chamada para ação'] },
  { heading: '🪜 Agitação:', aliases: ['agitacao', 'agitação'] },
  { heading: '📖 Contexto/História:', aliases: ['contexto', 'historia', 'história', 'contexto historia', 'contexto história'] },
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

function resolveCanonicalHeading(rawHeading: string) {
  const token = normalizeHeadingToken(rawHeading)
  if (!token) return null
  for (const def of SCRIPT_HEADING_ALIASES) {
    for (const alias of def.aliases) {
      const aliasToken = normalizeHeadingToken(alias)
      if (token === aliasToken || token.startsWith(`${aliasToken} `) || token.endsWith(` ${aliasToken}`)) {
        return def.heading
      }
    }
  }
  return null
}

function removeRepeatedHeadingPrefix(content: string, heading: string) {
  const headingToken = normalizeHeadingToken(heading.replace(':', ''))
  const plain = content.trim()
  const match = plain.match(/^\(?([^)]+)\)?\s*:?\s*(.*)$/u)
  if (!match) return plain
  const possibleHeading = normalizeHeadingToken(match[1] || '')
  if (possibleHeading && (possibleHeading === headingToken || headingToken.includes(possibleHeading) || possibleHeading.includes(headingToken))) {
    return (match[2] || '').trim()
  }
  return plain
}

function formatReadableBlock(text: string) {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const formatted: string[] = []
  let lastHeading: string | null = null
  for (const line of lines) {
    if (line.startsWith('#')) {
      formatted.push(line)
      lastHeading = null
      continue
    }
    const headingMatch = line.match(/^([\p{Extended_Pictographic}\uFE0F\s()/-]*[^:\n]{2,})\s*:\s*(.*)$/u)
    if (headingMatch) {
      const rawHeading = headingMatch[1].trim()
      let content = headingMatch[2].trim()
      const canonicalHeading = resolveCanonicalHeading(rawHeading) || `${rawHeading.replace(/\s+$/g, '')}:`
      if (lastHeading !== canonicalHeading) {
        formatted.push(canonicalHeading)
        lastHeading = canonicalHeading
      }
      if (content) {
        content = removeRepeatedHeadingPrefix(content, canonicalHeading)
      }
      if (content) {
        formatted.push(splitSentencesForReadability(content))
      }
      continue
    }
    const asHeadingOnly = resolveCanonicalHeading(line)
    if (asHeadingOnly) {
      if (lastHeading !== asHeadingOnly) {
        formatted.push(asHeadingOnly)
        lastHeading = asHeadingOnly
      }
      continue
    }
    lastHeading = null
    formatted.push(splitSentencesForReadability(line))
  }

  return formatted.join('\n\n')
}

function parseAgeRangeFromAudience(audience: string | null) {
  if (!audience) return { min: '', max: '' }
  const values = audience.match(/\d+/g)
  if (!values || values.length === 0) return { min: '', max: '' }
  const min = values[0] ?? ''
  const max = values[1] ?? values[0] ?? ''
  return { min, max }
}

export default function ContentPlanningPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, hasActiveSubscription } = useAuth()
  const [profile, setProfile] = useState<ContentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    niche: '',
    audience_min_age: '',
    audience_max_age: '',
    tone_of_voice: '',
    goals: [] as string[],
    platforms: [] as string[],
    frequency_per_week: 3,
    availability_days: [1, 2, 3, 4, 5] as number[],
    script_strategy_key: DEFAULT_SCRIPT_STRATEGY_KEY as ScriptStrategyKey,
  })
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const [newGoalInput, setNewGoalInput] = useState('')
  const [savedProfileSignature, setSavedProfileSignature] = useState('')

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [autoPlanning, setAutoPlanning] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    topic: '',
    platform: '',
    time: '',
  })
  const [itemModal, setItemModal] = useState<CalendarItem | null>(null)
  const [contentModal, setContentModal] = useState<{ type: 'script' | 'caption' | 'time' | 'cover' | 'ad'; item: CalendarItem } | null>(null)
  const [regenerateModalItem, setRegenerateModalItem] = useState<CalendarItem | null>(null)
  const [regenerateNotes, setRegenerateNotes] = useState('')
  const [confirmAutoPlanModalOpen, setConfirmAutoPlanModalOpen] = useState(false)
  const autoGeneratedOnOpenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileLoading(false)
      setProfile(null)
      return
    }
    const loadProfile = async () => {
      setProfileLoading(true)
      try {
        const res = await fetch('/api/content/profile', { credentials: 'include' })
        const data = await res.json()
        if (res.ok && data.profile) {
          const parsedAudience = parseAgeRangeFromAudience(data.profile.audience ?? '')
          const minAgeFromPrefs = data.profile.extra_preferences?.audience_min_age
          const maxAgeFromPrefs = data.profile.extra_preferences?.audience_max_age
          setProfile(data.profile)
          setProfileForm({
            business_name: data.profile.business_name ?? '',
            niche: data.profile.niche ?? '',
            audience_min_age:
              typeof minAgeFromPrefs === 'number' && Number.isFinite(minAgeFromPrefs)
                ? String(minAgeFromPrefs)
                : parsedAudience.min,
            audience_max_age:
              typeof maxAgeFromPrefs === 'number' && Number.isFinite(maxAgeFromPrefs)
                ? String(maxAgeFromPrefs)
                : parsedAudience.max,
            tone_of_voice: data.profile.tone_of_voice ?? '',
            goals: typeof data.profile.goals === 'string'
              ? data.profile.goals
                  .split('|')
                  .map((value: string) => value.trim())
                  .filter(Boolean)
              : [],
            platforms: Array.isArray(data.profile.platforms) ? data.profile.platforms : [],
            frequency_per_week: Array.isArray(data.profile.extra_preferences?.availability_days)
              ? Math.max(1, data.profile.extra_preferences.availability_days.length)
              : data.profile.frequency_per_week ?? 3,
            availability_days: Array.isArray(data.profile.extra_preferences?.availability_days)
              ? data.profile.extra_preferences.availability_days
              : [1, 2, 3, 4, 5],
            script_strategy_key: getScriptStrategy(
              typeof data.profile.extra_preferences?.script_strategy_key === 'string'
                ? data.profile.extra_preferences?.script_strategy_key
                : DEFAULT_SCRIPT_STRATEGY_KEY
            ).key,
          })
          setCustomGoals(
            Array.isArray(data.profile.extra_preferences?.custom_goals)
              ? data.profile.extra_preferences.custom_goals
                  .map((goal: unknown) => String(goal || '').trim())
                  .filter(Boolean)
              : []
          )
          const loadedCustomGoals = Array.isArray(data.profile.extra_preferences?.custom_goals)
            ? data.profile.extra_preferences.custom_goals
                .map((goal: unknown) => String(goal || '').trim())
                .filter(Boolean)
            : []
          setSavedProfileSignature(
            buildProfileSignature(
              {
                business_name: data.profile.business_name ?? '',
                niche: data.profile.niche ?? '',
                audience_min_age:
                  typeof minAgeFromPrefs === 'number' && Number.isFinite(minAgeFromPrefs)
                    ? String(minAgeFromPrefs)
                    : parsedAudience.min,
                audience_max_age:
                  typeof maxAgeFromPrefs === 'number' && Number.isFinite(maxAgeFromPrefs)
                    ? String(maxAgeFromPrefs)
                    : parsedAudience.max,
                tone_of_voice: data.profile.tone_of_voice ?? '',
                goals: typeof data.profile.goals === 'string'
                  ? data.profile.goals
                      .split('|')
                      .map((value: string) => value.trim())
                      .filter(Boolean)
                  : [],
                platforms: Array.isArray(data.profile.platforms) ? data.profile.platforms : [],
                frequency_per_week: Array.isArray(data.profile.extra_preferences?.availability_days)
                  ? Math.max(1, data.profile.extra_preferences.availability_days.length)
                  : data.profile.frequency_per_week ?? 3,
                availability_days: Array.isArray(data.profile.extra_preferences?.availability_days)
                  ? data.profile.extra_preferences.availability_days
                  : [1, 2, 3, 4, 5],
                script_strategy_key: getScriptStrategy(
                  typeof data.profile.extra_preferences?.script_strategy_key === 'string'
                    ? data.profile.extra_preferences?.script_strategy_key
                    : DEFAULT_SCRIPT_STRATEGY_KEY
                ).key,
              },
              loadedCustomGoals
            )
          )
        }
      } catch (e) {
        console.error('Erro ao carregar perfil de conteúdo', e)
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([])
      setItemsLoading(false)
      return
    }
    const loadItems = async () => {
      setItemsLoading(true)
      try {
        const start = formatDate(startOfMonth(currentMonth))
        const end = formatDate(endOfMonth(currentMonth))
        const res = await fetch(`/api/content/calendar?start=${start}&end=${end}`, {
          credentials: 'include',
        })
        const data = await res.json()
        if (res.ok) {
          setItems(data.items ?? [])
        } else {
          toast.error(data.error || 'Erro ao carregar calendário')
        }
      } catch (e) {
        console.error('Erro ao carregar calendário', e)
        toast.error('Erro ao carregar calendário')
      } finally {
        setItemsLoading(false)
      }
    }
    loadItems()
  }, [isAuthenticated, currentMonth])

  const handleSaveProfile = async () => {
    if (!hasActiveSubscription) {
      router.push('/precos')
      return
    }
    if (!isProfileComplete) {
      toast.error('Preencha todos os campos obrigatórios do perfil antes de salvar.')
      return
    }
    setSavingProfile(true)
    try {
      const minAge = Number(profileForm.audience_min_age)
      const maxAge = Number(profileForm.audience_max_age)
      const hasMinAge = Number.isFinite(minAge) && minAge > 0
      const hasMaxAge = Number.isFinite(maxAge) && maxAge > 0
      if (hasMinAge && hasMaxAge && minAge > maxAge) {
        toast.error('A idade mínima não pode ser maior que a idade máxima.')
        return
      }
      const audienceLabel =
        hasMinAge && hasMaxAge
          ? `${minAge} - ${maxAge} anos`
          : hasMinAge
            ? `${minAge}+ anos`
            : hasMaxAge
              ? `Até ${maxAge} anos`
              : null

      const res = await fetch('/api/content/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profileForm,
          audience: audienceLabel,
          goals: profileForm.goals.join(' | '),
          frequency_per_week: Math.max(1, profileForm.availability_days.length),
          extra_preferences: {
            ...(profile?.extra_preferences || {}),
            availability_days: profileForm.availability_days,
            audience_min_age: hasMinAge ? minAge : null,
            audience_max_age: hasMaxAge ? maxAge : null,
            custom_goals: customGoals,
            script_strategy_key: profileForm.script_strategy_key,
            script_strategy_name: getScriptStrategy(profileForm.script_strategy_key).label,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar perfil')
        return
      }
      setProfile(data.profile)
      setSavedProfileSignature(buildProfileSignature(profileForm, customGoals))
      toast.success('Perfil de conteúdo salvo com sucesso.')
    } catch (e) {
      console.error('Erro ao salvar perfil', e)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCreateItem = async (date: string) => {
    if (!hasActiveSubscription) {
      router.push('/precos')
      return
    }
    try {
      const res = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date,
          topic: createForm.topic?.trim() || null,
          platform: createForm.platform?.trim() || null,
          time: createForm.time?.trim() ? `${createForm.time}:00+00` : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao criar item')
        return
      }
      const createdItem: CalendarItem = data.item
      setItems((prev) => [...prev, createdItem])
      setCreateModalOpen(false)
      setCreateForm({ topic: '', platform: '', time: '' })
      toast.success('Vídeo criado. Gerando conteúdo automaticamente...')
      await handleGenerate(createdItem.id, false)
    } catch (e) {
      console.error('Erro ao criar item', e)
      toast.error('Erro ao criar item')
    }
  }

  const handleGenerate = async (itemId: string, regenerate = false, regenerateInstruction?: string) => {
    if (!hasActiveSubscription) {
      router.push('/precos')
      return
    }
    setGeneratingId(itemId)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          calendarItemId: itemId,
          mode: regenerate ? 'regenerate' : 'generate',
          regenerateInstruction: regenerate ? (regenerateInstruction || '').trim() : undefined,
          scriptStrategyKey: profileForm.script_strategy_key,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(ERRO_GERACAO_MENSAGEM)
        if (data?.code === 'insufficient_credits' && data?.redirectTo) {
          window.location.href = data.redirectTo
        }
        return
      }
      const updated: CalendarItem = data.item
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      if (itemModal?.id === updated.id) setItemModal(updated)
      if (contentModal?.item?.id === updated.id) setContentModal({ ...contentModal, item: updated })
      toast.success(regenerate ? 'Novo conteúdo gerado com sucesso.' : 'Conteúdo gerado com sucesso.')
    } catch (e) {
      console.error('Erro ao gerar conteúdo', e)
      toast.error(ERRO_GERACAO_MENSAGEM)
    } finally {
      setGeneratingId(null)
    }
  }

  useEffect(() => {
    if (!itemModal) return
    const hasContent = Boolean(itemModal.script || itemModal.caption || itemModal.hashtags)
    if (hasContent) return
    if (generatingId === itemModal.id) return
    if (autoGeneratedOnOpenRef.current.has(itemModal.id)) return
    autoGeneratedOnOpenRef.current.add(itemModal.id)
    handleGenerate(itemModal.id, false)
  }, [itemModal, generatingId])

  const currentMonthNumber = currentMonth.getMonth()
  const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
  const hasAutoPlanGeneratedItemInMonth = useMemo(
    () => items.some((item) => Boolean(item.meta?.auto_generated)),
    [items]
  )
  const hasAutoPlanUsedThisMonth =
    profile?.extra_preferences?.auto_plan_last_month === currentMonthKey || hasAutoPlanGeneratedItemInMonth

  const getRecommendedTime = (item: CalendarItem) => {
    const rec = item.meta?.recommended_time
    if (rec) return rec
    if (item.time) return item.time.toString().slice(0, 5)
    return null
  }

  const selectedDateItems = useMemo(() => {
    const selectedDateString = formatDate(selectedDate)
    return items.filter((item) => normalizeDateKey(item.date) === selectedDateString)
  }, [items, selectedDate])

  const currentProfileSignature = useMemo(
    () => buildProfileSignature(profileForm, customGoals),
    [profileForm, customGoals]
  )
  const isProfileDirty = savedProfileSignature.length === 0 || currentProfileSignature !== savedProfileSignature

  const formatCaptionWithHashtags = (item: CalendarItem) => {
    const captionRaw = (item.caption || '').toString().trim()
    const hashtagsFromCaption = captionRaw.match(/#[^\s#]+/g) ?? []
    const caption = captionRaw.replace(/#[^\s#]+/g, '').replace(/\s{2,}/g, ' ').trim()
    const hashtagsFromField = (item.hashtags || '')
      .toString()
      .replace(/\n+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.startsWith('#'))
    const uniqueHashtags = Array.from(new Set([...hashtagsFromCaption, ...hashtagsFromField]))
    const hashtagsLine = uniqueHashtags.join(' ')
    const captionParagraphs = caption
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
    const captionBlock = captionParagraphs
      .map((paragraph) => splitSentencesForReadability(paragraph))
      .filter(Boolean)
      .join('\n\n')
    if (captionBlock && hashtagsLine) return `${captionBlock}\n\n${hashtagsLine}`
    return `${captionBlock}${hashtagsLine}`.trim()
  }

  const formatCoverText = (item: CalendarItem) => {
    const options = Array.isArray(item.meta?.cover_text_options)
      ? item.meta.cover_text_options.map((opt: unknown) => String(opt || '').trim()).filter(Boolean)
      : []
    if (options.length > 0) {
      return options.map((opt: string, idx: number) => `${idx + 1}. ${opt}`).join('\n')
    }
    const fallback = (item.cover_prompt || '').toString().trim()
    return fallback || 'Ainda não há texto para capa.'
  }

  const formatAdCopy = (item: CalendarItem) => {
    const ad = item.meta?.ad_copy
    const headline = (ad?.headline || '').toString().trim()
    const body = (ad?.body || '').toString().trim()
    const cta = (ad?.cta || '').toString().trim()
    const lines = [
      headline ? `Headline: ${splitSentencesForReadability(headline)}` : '',
      body ? `Texto: ${splitSentencesForReadability(body)}` : '',
      cta ? `CTA: ${splitSentencesForReadability(cta)}` : '',
    ].filter(Boolean)
    return lines.join('\n\n') || 'Ainda não há texto para anúncio.'
  }

  const parsedMinAge = Number(profileForm.audience_min_age)
  const parsedMaxAge = Number(profileForm.audience_max_age)
  const hasValidAgeRange =
    Number.isFinite(parsedMinAge) &&
    Number.isFinite(parsedMaxAge) &&
    parsedMinAge > 0 &&
    parsedMaxAge > 0 &&
    parsedMinAge <= parsedMaxAge
  const isProfileComplete =
    profileForm.business_name.trim().length > 0 &&
    profileForm.niche.trim().length > 0 &&
    hasValidAgeRange &&
    profileForm.tone_of_voice.trim().length > 0 &&
    profileForm.goals.length > 0 &&
    profileForm.availability_days.length > 0

  const handleCopyScript = (item: CalendarItem) => {
    if (!item.script) {
      toast('Ainda não há roteiro para copiar.')
      return
    }
    navigator.clipboard.writeText(formatReadableBlock(item.script))
    toast.success('Roteiro copiado.')
  }

  const handleCopyCaptionHashtags = (item: CalendarItem) => {
    const merged = formatCaptionWithHashtags(item)
    if (!merged) {
      toast('Ainda não há legenda/hashtags para copiar.')
      return
    }
    navigator.clipboard.writeText(merged)
    toast.success('Legenda + hashtags copiadas.')
  }

  const handleCopyRecommendedTime = (item: CalendarItem) => {
    const recTime = getRecommendedTime(item)
    if (!recTime) {
      toast('Ainda não há horário recomendado.')
      return
    }
    navigator.clipboard.writeText(recTime)
    toast.success('Horário recomendado copiado.')
  }

  const handleCopyCoverText = (item: CalendarItem) => {
    const text = formatCoverText(item)
    if (!text || text === 'Ainda não há texto para capa.') {
      toast('Ainda não há texto para capa.')
      return
    }
    navigator.clipboard.writeText(text)
    toast.success('Texto para capa copiado.')
  }

  const handleCopyAdCopy = (item: CalendarItem) => {
    const text = formatAdCopy(item)
    if (!text || text === 'Ainda não há texto para anúncio.') {
      toast('Ainda não há texto para anúncio.')
      return
    }
    navigator.clipboard.writeText(text)
    toast.success('Texto para anúncio copiado.')
  }

  const handleAutoPlanMonth = async () => {
    if (!hasActiveSubscription) {
      router.push('/precos')
      return
    }
    setAutoPlanning(true)
    try {
      const selectedStrategy = getScriptStrategy(profileForm.script_strategy_key)
      const res = await fetch('/api/content/auto-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          month: formatDate(currentMonth),
          scriptStrategyKey: selectedStrategy.key,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.code === 'AUTO_PLAN_ALREADY_USED') {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  extra_preferences: {
                    ...(prev.extra_preferences || {}),
                    auto_plan_last_month: currentMonthKey,
                  },
                }
              : prev
          )
        }
        toast.error(data?.code === 'AUTO_PLAN_ALREADY_USED' ? (data.error || 'Erro ao gerar agenda automática') : ERRO_GERACAO_MENSAGEM)
        return
      }
      const createdItems: CalendarItem[] = Array.isArray(data.items) ? data.items : []
      setItems((prev) => {
        const map = new Map(prev.map((it) => [it.id, it]))
        for (const item of createdItems) map.set(item.id, item)
        return Array.from(map.values())
      })
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              extra_preferences: {
                ...(prev.extra_preferences || {}),
                auto_plan_last_month: currentMonthKey,
              },
            }
          : prev
      )
      toast.success(`Agenda automática criada com ${createdItems.length} vídeo(s).`)
    } catch (e) {
      console.error('Erro na agenda automática', e)
      toast.error(ERRO_GERACAO_MENSAGEM)
    } finally {
      setAutoPlanning(false)
    }
  }

  const handleOpenRegenerateModal = (item: CalendarItem) => {
    setRegenerateModalItem(item)
    setRegenerateNotes('')
  }

  const handleConfirmRegenerate = async () => {
    if (!regenerateModalItem) return
    await handleGenerate(regenerateModalItem.id, true, regenerateNotes)
    setRegenerateModalItem(null)
    setRegenerateNotes('')
  }

  const handleMarkDone = async (item: CalendarItem, marked: boolean) => {
    try {
      const res = await fetch('/api/content/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: item.id,
          meta: { ...(item.meta || {}), marked_done: marked },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao atualizar')
        return
      }
      const updated: CalendarItem = data.item
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      if (itemModal?.id === updated.id) setItemModal(updated)
      if (contentModal?.item?.id === updated.id) setContentModal({ ...contentModal, item: updated })
      toast.success(marked ? 'Conteúdo marcado como feito.' : 'Desmarcado.')
    } catch (e) {
      console.error('Erro ao marcar como feito', e)
      toast.error('Erro ao atualizar')
    }
  }

  const weekDayOptions = [
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
    { value: 0, label: 'Dom' },
  ]

  const toneOptions = [
    'Profissional e formal',
    'Profissional e amigável',
    'Descontraído e leve',
    'Educativo e didático',
    'Inspirador e motivacional',
    'Direto e objetivo',
    'Humor inteligente',
  ]

  const goalOptions = [
    'Converter vendas no meu site',
    'Ganhar seguidores',
    'Aumentar engajamento',
    'Gerar leads no WhatsApp',
    'Fortalecer autoridade no nicho',
    'Educar o público sobre o produto/serviço',
    'Atrair clientes locais',
    'Melhorar reconhecimento da marca',
    'Divulgar lançamentos/ofertas',
    'Aumentar retenção de clientes',
  ]
  const allGoalOptions = Array.from(new Set([...goalOptions, ...customGoals]))

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LumaSpin size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-16 sm:pb-10 lg:pt-28 lg:pb-12 space-y-5 sm:space-y-8 relative">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gogh-black flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-gogh-yellow" />
            Planejamento de Vídeos
          </h1>
          <p className="text-sm text-gogh-grayDark">
            Defina o perfil da sua marca, planeje seus vídeos e gere roteiros, legendas e hashtags com um clique.
          </p>
        </div>
      </div>

      {!hasActiveSubscription && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gogh-grayLight p-4 sm:p-6 md:p-8 max-w-md mx-auto text-center shadow-sm">
          <CalendarIcon className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-gogh-black mb-2">Gogh Agenda IA</h3>
          <p className="text-gogh-grayDark mb-6">
            Para acessar o Gogh Agenda IA é necessário assinar um plano.
          </p>
          <a
            href="/precos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
          >
            Assinar um plano
          </a>
        </div>
      )}

      <div className={!hasActiveSubscription ? 'relative pointer-events-none select-none blur-sm opacity-60 space-y-5 sm:space-y-8' : 'space-y-5 sm:space-y-8'}>
      <section id="perfil-marca" className="bg-white rounded-2xl border border-gogh-grayLight p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gogh-black">
              Configure o perfil da sua marca
            </h2>
            <p className="text-xs text-gogh-grayDark mt-0.5">
              Quanto mais você detalhar seu negócio e objetivos, mais o conteúdo ficará alinhado à sua realidade. A IA usa essas configurações para personalizar temas, roteiros, legendas e horários.
            </p>
          </div>
          {profileLoading && <LumaSpin size="sm" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Nome da empresa / projeto
            </label>
            <p className="text-[11px] text-gogh-grayDark mb-1.5">
              Nome ou marca que a IA usará no contexto dos conteúdos.
            </p>
            <input
              type="text"
              value={profileForm.business_name}
              onChange={(e) => setProfileForm((f) => ({ ...f, business_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
              placeholder="Ex.: Gogh Lab"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Nicho principal (detalhe bem para a IA)
            </label>
            <input
              type="text"
              value={profileForm.niche}
              onChange={(e) => setProfileForm((f) => ({ ...f, niche: e.target.value }))}
              placeholder="Ex.: Empresa de marketing digital com site de vendas; público empreendedores 25–45 anos. Quanto mais específico, melhor o conteúdo."
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Público-alvo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                max={120}
                value={profileForm.audience_min_age}
                onChange={(e) => setProfileForm((f) => ({ ...f, audience_min_age: e.target.value }))}
                placeholder="Idade mínima"
                className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
              />
              <input
                type="number"
                min={0}
                max={120}
                value={profileForm.audience_max_age}
                onChange={(e) => setProfileForm((f) => ({ ...f, audience_max_age: e.target.value }))}
                placeholder="Idade máxima"
                className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Tom de voz
            </label>
            <select
              value={profileForm.tone_of_voice}
              onChange={(e) => setProfileForm((f) => ({ ...f, tone_of_voice: e.target.value }))}
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            >
              <option value="">Selecione o tom de voz</option>
              {toneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Estratégia de roteiro
            </label>
            <select
              value={profileForm.script_strategy_key}
              onChange={(e) =>
                setProfileForm((f) => ({
                  ...f,
                  script_strategy_key: getScriptStrategy(e.target.value).key,
                }))
              }
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            >
              {SCRIPT_STRATEGIES.map((strategy) => (
                <option key={strategy.key} value={strategy.key}>
                  {strategy.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gogh-grayDark mt-1">
              {getScriptStrategy(profileForm.script_strategy_key).description}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Objetivos com os vídeos (detalhe o que mais importa)
            </label>
            <p className="text-[11px] text-gogh-grayDark mb-2">
              Selecione os que fazem sentido e adicione objetivos personalizados; quanto mais específico, mais a IA alinha temas, roteiros e CTAs ao seu negócio.
            </p>
            <div className="flex flex-wrap gap-2">
              {allGoalOptions.map((goal) => {
                const selected = profileForm.goals.includes(goal)
                const isCustomGoal = customGoals.includes(goal)
                return (
                  <div
                    key={goal}
                    className={`inline-flex items-center gap-1 rounded-md border ${
                      selected
                        ? 'bg-gogh-yellow/20 border-gogh-yellow text-gogh-black'
                        : 'border-gogh-grayLight text-gogh-grayDark'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setProfileForm((f) => ({
                          ...f,
                          goals: selected ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
                        }))
                      }
                      className="px-2.5 py-1.5 text-xs transition-colors"
                    >
                      {goal}
                    </button>
                    {isCustomGoal ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomGoals((prev) => prev.filter((g) => g !== goal))
                          setProfileForm((f) => ({ ...f, goals: f.goals.filter((g) => g !== goal) }))
                        }}
                        className="pr-1.5 text-gogh-grayDark hover:text-gogh-black"
                        aria-label={`Remover objetivo ${goal}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                placeholder="Ex.: Vendas pelo site, leads no WhatsApp, autoridade no nicho..."
                className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  const value = newGoalInput.trim()
                  if (!value) return
                  if (allGoalOptions.includes(value)) {
                    setNewGoalInput('')
                    return
                  }
                  setCustomGoals((prev) => [...prev, value])
                  setProfileForm((f) => ({ ...f, goals: [...f.goals, value] }))
                  setNewGoalInput('')
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Frequência desejada por semana
            </label>
            <p className="text-[11px] text-gogh-grayDark mb-2">
              Dias em que você costuma publicar; a IA usará para planejar e sugerir horários.
            </p>
            <div className="flex flex-wrap gap-2">
              {weekDayOptions.map((day) => {
                const checked = profileForm.availability_days.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      setProfileForm((f) => {
                        const exists = f.availability_days.includes(day.value)
                        if (exists && f.availability_days.length <= 1) {
                          return f
                        }
                        const nextDays = exists
                          ? f.availability_days.filter((d) => d !== day.value)
                          : [...f.availability_days, day.value]
                        const next = [...nextDays].sort((a, b) => a - b)
                        return { ...f, availability_days: next, frequency_per_week: Math.max(1, next.length) }
                      })
                    }
                    className={`px-2 py-1 rounded-md text-xs border ${
                      checked ? 'bg-gogh-yellow/20 border-gogh-yellow text-gogh-black' : 'border-gogh-grayLight text-gogh-grayDark'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <p className="text-xs text-gogh-grayDark">
            Quanto mais completo e específico o perfil, mais a IA alinha temas, roteiros, legendas e horários ao seu negócio.
          </p>
          <ShinyButton
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile || !isProfileComplete || !isProfileDirty}
            className="h-9 px-4"
          >
            {savingProfile ? (
              <>
                <LumaSpin size="sm" />
                Salvando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Salvar perfil
              </>
            )}
          </ShinyButton>
        </div>
        {!isProfileComplete && (
          <p className="text-xs text-red-600">
            Preencha todos os campos do perfil (incluindo idade mínima e máxima) para salvar.
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gogh-grayLight p-4 sm:p-6">
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-gogh-black">
            Calendário de conteúdo
          </h2>
          <p className="text-xs text-gogh-grayDark mt-0.5">
            Visualize os dias planejados, abra cada conteúdo e use a geração automática do mês.
          </p>
        </div>
        <div className="pb-4 mb-4 border-b border-gogh-grayLight/80 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gogh-grayDark">
            Automático: cria os vídeos do mês em uma única solicitação (tema + roteiro + legenda + hashtags + horário + texto para capa + texto para anúncio).
          </p>
          <RainbowButton
            type="button"
            onClick={() => {
              if (hasAutoPlanUsedThisMonth || !profile || autoPlanning) return
              setConfirmAutoPlanModalOpen(true)
            }}
            disabled={autoPlanning || !profile || hasAutoPlanUsedThisMonth}
            className="h-10 px-4"
          >
            {autoPlanning ? (
              <>
                <LumaSpin size="sm" />
                Gerando agenda...
              </>
            ) : hasAutoPlanUsedThisMonth ? (
              <>
                <Sparkles className="w-4 h-4" />
                Agenda já gerada neste mês
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar agenda automática
              </>
            )}
          </RainbowButton>
        </div>
        <div className="flex justify-center">
          <CalendarWithEventSlots
            month={currentMonth}
            selectedDate={selectedDate}
            onMonthChange={(month) => {
              setCurrentMonth(new Date(month.getFullYear(), month.getMonth(), 1))
            }}
            onSelectDate={(date) => {
              if (!date) return
              setSelectedDate(date)
              if (date.getMonth() !== currentMonthNumber || date.getFullYear() !== currentMonth.getFullYear()) {
                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
              }
            }}
            itemsForMonth={items}
            itemsForSelectedDate={selectedDateItems}
            loading={itemsLoading}
            canInteract={hasActiveSubscription}
            onOpenItem={(item) => setItemModal(item)}
            onRegenerateForItem={handleOpenRegenerateModal}
            regeneratingId={generatingId}
          />
        </div>
      </section>
      </div>

      <Modal
        isOpen={confirmAutoPlanModalOpen}
        onClose={() => setConfirmAutoPlanModalOpen(false)}
        title="Confirmar geração da agenda"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gogh-grayDark">
            Confira o resumo do perfil que a IA usará. Se precisar alterar algo, vá ao perfil antes de gerar.
          </p>
          <div className="rounded-lg border border-gogh-grayLight bg-gogh-grayLight/30 p-3 text-sm text-gogh-black space-y-2 max-h-[280px] overflow-y-auto">
            <p><span className="font-medium text-gogh-grayDark">Empresa:</span> {profileForm.business_name || '—'}</p>
            <p><span className="font-medium text-gogh-grayDark">Nicho:</span> {profileForm.niche ? (profileForm.niche.length > 120 ? profileForm.niche.slice(0, 120) + '…' : profileForm.niche) : '—'}</p>
            <p><span className="font-medium text-gogh-grayDark">Público-alvo:</span> {profileForm.audience_min_age || profileForm.audience_max_age ? `${profileForm.audience_min_age || '?'} a ${profileForm.audience_max_age || '?'} anos` : '—'}</p>
            <p><span className="font-medium text-gogh-grayDark">Objetivos:</span> {profileForm.goals.length ? profileForm.goals.join(', ') : '—'}</p>
            <p><span className="font-medium text-gogh-grayDark">Estratégia:</span> {getScriptStrategy(profileForm.script_strategy_key).label}</p>
            <p><span className="font-medium text-gogh-grayDark">Tom de voz:</span> {profileForm.tone_of_voice || '—'}</p>
            <p><span className="font-medium text-gogh-grayDark">Dias da semana:</span> {profileForm.availability_days.length ? profileForm.availability_days.map((d) => weekDayOptions.find((o) => o.value === d)?.label ?? d).join(', ') : '—'}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 rounded-full"
              onClick={() => {
                setConfirmAutoPlanModalOpen(false)
                document.getElementById('perfil-marca')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Ir para perfil
            </Button>
            <Button
              type="button"
              className="h-9 px-4 rounded-full bg-gogh-yellow text-gogh-black hover:bg-gogh-yellow/90"
              onClick={() => {
                setConfirmAutoPlanModalOpen(false)
                handleAutoPlanMonth()
              }}
            >
              Confirmar e gerar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={`Criar vídeo para ${selectedDate.toLocaleDateString('pt-BR')}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gogh-black">Tema/título (opcional)</label>
            <input
              type="text"
              value={createForm.topic}
              onChange={(e) => setCreateForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="Ex.: 3 erros que fazem perder engajamento"
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gogh-black">Plataforma</label>
              <input
                type="text"
                value={createForm.platform}
                onChange={(e) => setCreateForm((f) => ({ ...f, platform: e.target.value }))}
                placeholder="Instagram, TikTok..."
                className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gogh-black">Horário (opcional)</label>
              <input
                type="time"
                value={createForm.time}
                onChange={(e) => setCreateForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleCreateItem(formatDate(selectedDate))} className="bg-gogh-yellow text-gogh-black hover:bg-gogh-yellow/90">
              Criar vídeo
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!regenerateModalItem}
        onClose={() => {
          setRegenerateModalItem(null)
          setRegenerateNotes('')
        }}
        title="Gerar novamente com ajustes"
        size="md"
        showCloseButton={false}
      >
        {regenerateModalItem ? (
          <div className="space-y-4">
            <p className="text-sm text-gogh-grayDark">
              Descreva o que você deseja alterar neste conteúdo para a IA personalizar a nova geração.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1 text-gogh-black">
                O que você quer mudar?
              </label>
              <textarea
                value={regenerateNotes}
                onChange={(e) => setRegenerateNotes(e.target.value)}
                placeholder="Ex.: Quero um gancho mais forte e curto, desenvolvimento mais didático com exemplos reais do meu nicho, CTA para WhatsApp e legenda mais emocional com 2 parágrafos."
                rows={5}
                className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm resize-y"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setRegenerateModalItem(null)
                  setRegenerateNotes('')
                }}
                className="h-9 px-4 rounded-full bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </Button>
              <HoverButton
                onClick={handleConfirmRegenerate}
                disabled={generatingId === regenerateModalItem.id}
                className="h-9 px-4 text-sm rounded-full"
              >
                {generatingId === regenerateModalItem.id ? 'Gerando...' : 'Gerar novamente'}
              </HoverButton>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!itemModal}
        onClose={() => setItemModal(null)}
        title={itemModal?.topic || 'Vídeo planejado'}
        size="md"
        stackLevel={1}
      >
        {itemModal && (
          <div className="space-y-3">
            <p className="text-sm text-gogh-grayDark">
              Selecione o que deseja visualizar e copiar para este conteúdo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={() => setContentModal({ type: 'script', item: itemModal })}
                variant="outline"
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Roteiro
              </Button>
              <Button
                onClick={() => setContentModal({ type: 'caption', item: itemModal })}
                variant="outline"
                className="justify-start"
              >
                <Type className="w-4 h-4 mr-2" />
                Legenda + hashtags
              </Button>
              <Button
                onClick={() => setContentModal({ type: 'cover', item: itemModal })}
                variant="outline"
                className="justify-start"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Texto para capa
              </Button>
              <Button
                onClick={() => setContentModal({ type: 'ad', item: itemModal })}
                variant="outline"
                className="justify-start"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Texto para anúncio
              </Button>
              <Button
                onClick={() => setContentModal({ type: 'time', item: itemModal })}
                variant="outline"
                className="justify-start"
              >
                <Clock className="w-4 h-4 mr-2" />
                Horário recomendado
              </Button>
            </div>
            {(itemModal.script || itemModal.caption || itemModal.hashtags) && (
              <div className="pt-3 border-t border-gogh-grayLight">
                <Button
                  variant={itemModal.meta?.marked_done ? 'outline' : 'default'}
                  size="sm"
                  className={itemModal.meta?.marked_done ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                  onClick={() => handleMarkDone(itemModal, !itemModal.meta?.marked_done)}
                >
                  {itemModal.meta?.marked_done ? (
                    <>
                      <Circle className="w-4 h-4 mr-2" />
                      Desmarcar como feito
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marquei como feito
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!contentModal}
        onClose={() => setContentModal(null)}
        title={
          contentModal?.type === 'script'
            ? 'Roteiro'
            : contentModal?.type === 'caption'
              ? 'Legenda + hashtags'
              : contentModal?.type === 'cover'
                ? 'Texto para capa'
                : contentModal?.type === 'ad'
                  ? 'Texto para anúncio'
                  : 'Horário recomendado'
        }
        size="lg"
        stackLevel={2}
      >
        {contentModal && (
          <div className="space-y-4">
            <pre className="whitespace-pre-wrap text-sm bg-gogh-grayLight/30 rounded-lg p-3 max-h-[50vh] overflow-auto">
              {contentModal.type === 'script'
                ? (contentModal.item.script ? formatReadableBlock(contentModal.item.script) : 'Ainda não há roteiro.')
                : contentModal.type === 'caption'
                  ? formatCaptionWithHashtags(contentModal.item) || 'Ainda não há legenda/hashtags.'
                  : contentModal.type === 'cover'
                    ? formatCoverText(contentModal.item)
                    : contentModal.type === 'ad'
                      ? formatAdCopy(contentModal.item)
                  : getRecommendedTime(contentModal.item) || 'Ainda não há horário recomendado.'}
            </pre>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (contentModal.type === 'script') handleCopyScript(contentModal.item)
                  else if (contentModal.type === 'caption') handleCopyCaptionHashtags(contentModal.item)
                  else if (contentModal.type === 'cover') handleCopyCoverText(contentModal.item)
                  else if (contentModal.type === 'ad') handleCopyAdCopy(contentModal.item)
                  else handleCopyRecommendedTime(contentModal.item)
                }}
              >
                Copiar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
