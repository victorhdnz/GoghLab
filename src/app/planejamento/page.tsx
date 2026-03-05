'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LumaSpin } from '@/components/ui/luma-spin'
import { Button } from '@/components/ui/button'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { ShinyButton } from '@/components/ui/shiny-button'
import { HoverButton } from '@/components/ui/hover-button'
import { Calendar as CalendarIcon, FileText, Type, Clock, ImageIcon, Megaphone, RefreshCw, Sparkles, Plus, X, CheckCircle2, Circle, ChevronDown, ChevronRight, Trash2, Lock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
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

const PROFILE_ACCORDION_IDS = [
  'identificacao',
  'publico-alvo',
  'tom-de-voz',
  'estrategia-roteiro',
  'plataforma-videos',
  'objetivos-videos',
  'frequencia',
  'estrutura-fixa',
  'videos-personalizados',
] as const
type ProfileAccordionId = (typeof PROFILE_ACCORDION_IDS)[number]

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

type FixedStructures = {
  script: string
  caption: string
  ad_copy: string
  cover: string
}

const EMPTY_FIXED_STRUCTURES: FixedStructures = {
  script: '',
  caption: '',
  ad_copy: '',
  cover: '',
}

export type PersonalizedVideoEntry = {
  date: string
  instruction: string
}

function buildProfileSignature(form: ProfileFormState, customGoals: string[], fixedStructures: FixedStructures) {
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
    fixed_structure_script: (fixedStructures.script || '').trim(),
    fixed_structure_caption: (fixedStructures.caption || '').trim(),
    fixed_structure_ad_copy: (fixedStructures.ad_copy || '').trim(),
    fixed_structure_cover: (fixedStructures.cover || '').trim(),
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
  const [fixedStructures, setFixedStructures] = useState<FixedStructures>({ ...EMPTY_FIXED_STRUCTURES })
  const [savedProfileSignature, setSavedProfileSignature] = useState('')
  const [personalizedVideoEntries, setPersonalizedVideoEntries] = useState<PersonalizedVideoEntry[]>([])

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
  const [rescheduleModalItem, setRescheduleModalItem] = useState<CalendarItem | null>(null)
  const [rescheduleTargetDate, setRescheduleTargetDate] = useState<Date | null>(null)
  const [rescheduleCalendarMonth, setRescheduleCalendarMonth] = useState<Date>(() => new Date())
  const [confirmAutoPlanModalOpen, setConfirmAutoPlanModalOpen] = useState(false)
  const [profileAccordionOpen, setProfileAccordionOpen] = useState<ProfileAccordionId | null>(null)
  const [modifiedSections, setModifiedSections] = useState<Set<ProfileAccordionId>>(new Set())
  const autoGeneratedOnOpenRef = useRef<Set<string>>(new Set())
  const searchParams = useSearchParams()

  const markSectionModified = (sectionId: ProfileAccordionId) => {
    setModifiedSections((prev) => new Set(prev).add(sectionId))
  }

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
            platforms: Array.isArray(data.profile.platforms)
              ? data.profile.platforms.filter((p: string) => ['Reels', 'Shorts', 'TikTok'].includes(String(p).trim()))
              : [],
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
          setFixedStructures({
            script: typeof data.profile.extra_preferences?.fixed_structure_script === 'string' ? data.profile.extra_preferences.fixed_structure_script : (typeof data.profile.extra_preferences?.fixed_structure === 'string' ? data.profile.extra_preferences.fixed_structure : ''),
            caption: typeof data.profile.extra_preferences?.fixed_structure_caption === 'string' ? data.profile.extra_preferences.fixed_structure_caption : '',
            ad_copy: typeof data.profile.extra_preferences?.fixed_structure_ad_copy === 'string' ? data.profile.extra_preferences.fixed_structure_ad_copy : '',
            cover: typeof data.profile.extra_preferences?.fixed_structure_cover === 'string' ? data.profile.extra_preferences.fixed_structure_cover : '',
          })
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
                platforms: Array.isArray(data.profile.platforms)
              ? data.profile.platforms.filter((p: string) => ['Reels', 'Shorts', 'TikTok'].includes(String(p).trim()))
              : [],
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
              loadedCustomGoals,
              {
                script: typeof data.profile.extra_preferences?.fixed_structure_script === 'string' ? data.profile.extra_preferences.fixed_structure_script : '',
                caption: typeof data.profile.extra_preferences?.fixed_structure_caption === 'string' ? data.profile.extra_preferences.fixed_structure_caption : '',
                ad_copy: typeof data.profile.extra_preferences?.fixed_structure_ad_copy === 'string' ? data.profile.extra_preferences.fixed_structure_ad_copy : '',
                cover: typeof data.profile.extra_preferences?.fixed_structure_cover === 'string' ? data.profile.extra_preferences.fixed_structure_cover : '',
              }
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

  useEffect(() => {
    const open = searchParams.get('open')
    if (open && PROFILE_ACCORDION_IDS.includes(open as ProfileAccordionId)) {
      setProfileAccordionOpen(open as ProfileAccordionId)
      setTimeout(() => document.getElementById(`perfil-${open}`)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [searchParams])

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
            fixed_structure_script: fixedStructures.script.trim() || undefined,
            fixed_structure_caption: fixedStructures.caption.trim() || undefined,
            fixed_structure_ad_copy: fixedStructures.ad_copy.trim() || undefined,
            fixed_structure_cover: fixedStructures.cover.trim() || undefined,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar perfil')
        return
      }
      setProfile(data.profile)
      setSavedProfileSignature(buildProfileSignature(profileForm, customGoals, fixedStructures))
      setModifiedSections(new Set())
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
  const realCurrentMonthKey = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])
  useEffect(() => {
    setPersonalizedVideoEntries((prev) => {
      const needUpdate = prev.some((e) => !e.date.startsWith(realCurrentMonthKey))
      if (!needUpdate) return prev
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth()
      const lastDay = new Date(y, m + 1, 0).getDate()
      const minDate = `${y}-${String(m + 1).padStart(2, '0')}-01`
      const todayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const defaultDate = todayStr >= minDate && todayStr <= `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` ? todayStr : minDate
      return prev.map((e) => (e.date.startsWith(realCurrentMonthKey) ? e : { ...e, date: defaultDate }))
    })
  }, [realCurrentMonthKey])
  const isViewedMonthCurrent = currentMonthKey === realCurrentMonthKey
  const hasAutoPlanGeneratedItemInMonth = useMemo(
    () =>
      items.some(
        (item) =>
          Boolean(item.meta?.auto_generated) && item.meta?.auto_plan_month === currentMonthKey
      ),
    [items, currentMonthKey]
  )
  const hasAutoPlanUsedThisMonth =
    profile?.extra_preferences?.auto_plan_last_month === currentMonthKey || hasAutoPlanGeneratedItemInMonth
  const canPressGenerateAgenda = isViewedMonthCurrent && !hasAutoPlanUsedThisMonth

  const getRecommendedTime = (item: CalendarItem) => {
    const rec = item.meta?.recommended_time
    if (rec) return rec
    if (item.time) return item.time.toString().slice(0, 5)
    return null
  }

  const selectedDateItems = useMemo(() => {
    const selectedDateString = formatDate(selectedDate)
    return items.filter(
      (item) => item?.id && normalizeDateKey(item.date) === selectedDateString
    )
  }, [items, selectedDate])

  const currentProfileSignature = useMemo(
    () => buildProfileSignature(profileForm, customGoals, fixedStructures),
    [profileForm, customGoals, fixedStructures]
  )
  const isProfileDirty = savedProfileSignature.length === 0 || currentProfileSignature !== savedProfileSignature

  const formatCaptionWithHashtags = (item: CalendarItem) => {
    const captionRaw = (item.caption || '').toString().trim()
    const hashtagsFromCaption = captionRaw.match(/#[^\s#]+/g) ?? []
    const hashtagsFromField = (item.hashtags || '')
      .toString()
      .replace(/\n+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.startsWith('#'))
    const uniqueHashtags = Array.from(new Set([...hashtagsFromCaption, ...hashtagsFromField]))
    const hashtagsLine = uniqueHashtags.join(' ')
    const captionWithoutHashtags = captionRaw.replace(/#[^\s#]+/g, '').replace(/\r/g, '')
    const captionLines = captionWithoutHashtags
      .split('\n')
      .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    const captionBlock = captionLines.join('\n').trim()
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
    const parts: string[] = []
    if (headline) {
      parts.push('📢 Headline:\n\n' + headline)
    }
    if (body) {
      parts.push('📝 Texto:\n\n' + body)
    }
    if (cta) {
      parts.push('📣 CTA:\n\n' + cta)
    }
    return parts.length ? parts.join('\n\n') : 'Ainda não há texto para anúncio.'
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

  const isSectionComplete = (sectionId: ProfileAccordionId): boolean => {
    switch (sectionId) {
      case 'identificacao':
        return profileForm.business_name.trim().length > 0 && profileForm.niche.trim().length > 0
      case 'publico-alvo':
        return hasValidAgeRange
      case 'tom-de-voz':
        return profileForm.tone_of_voice.trim().length > 0
      case 'estrategia-roteiro':
        return !!profileForm.script_strategy_key
      case 'plataforma-videos':
        return profileForm.platforms.length > 0
      case 'objetivos-videos':
        return profileForm.goals.length > 0
      case 'frequencia':
        return profileForm.availability_days.length > 0
      case 'estrutura-fixa':
        return true
      case 'videos-personalizados':
        return true
      default:
        return false
    }
  }

  const getAccordionCardClass = (sectionId: ProfileAccordionId) => {
    if (profileLoading) return 'bg-white border-gogh-grayLight'
    if (sectionId === 'videos-personalizados') return 'bg-white border-gogh-grayLight'
    if (!isProfileDirty) return 'bg-white border-gogh-grayLight'
    if (!modifiedSections.has(sectionId)) return 'bg-white border-gogh-grayLight'
    return isSectionComplete(sectionId)
      ? 'bg-emerald-50/80 border-emerald-300'
      : 'bg-red-50/80 border-red-300'
  }

  const getFieldBorderClass = (sectionId: ProfileAccordionId) => {
    if (profileLoading || !isProfileDirty) return 'border-gogh-grayLight'
    if (!modifiedSections.has(sectionId)) return 'border-gogh-grayLight'
    return !isSectionComplete(sectionId) ? 'border-red-300 focus:ring-red-200' : 'border-gogh-grayLight'
  }

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
      const personalizedForMonth = personalizedVideoEntries.filter(
        (e) => e.instruction.trim().length > 0 && e.date.startsWith(currentMonthKey)
      )
      const res = await fetch('/api/content/auto-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          month: formatDate(currentMonth),
          scriptStrategyKey: selectedStrategy.key,
          personalizedVideos: personalizedForMonth,
          fixed_structure_script: (fixedStructures.script || '').trim() || undefined,
          fixed_structure_caption: (fixedStructures.caption || '').trim() || undefined,
          fixed_structure_ad_copy: (fixedStructures.ad_copy || '').trim() || undefined,
          fixed_structure_cover: (fixedStructures.cover || '').trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setConfirmAutoPlanModalOpen(false)
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
        const msg =
          data?.code === 'AUTO_PLAN_ALREADY_USED'
            ? (data.error || 'Erro ao gerar agenda automática')
            : data?.code === 'AUTO_PLAN_ONLY_CURRENT_MONTH'
              ? (data.error || 'Só é permitido gerar agenda para o mês atual.')
              : ERRO_GERACAO_MENSAGEM
        toast.error(msg)
        return
      }
      setConfirmAutoPlanModalOpen(false)
      const createdItems: CalendarItem[] = (Array.isArray(data.items) ? data.items : []).filter(
        (it: any) => it?.id
      ) as CalendarItem[]
      let currentItems: CalendarItem[] = [...createdItems]
      const hasPersonalized = personalizedForMonth.length > 0
      if (!hasPersonalized) {
        setItems(currentItems)
      }
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
      let totalCreated = createdItems.length
      for (const pv of personalizedForMonth) {
        try {
          const createRes = await fetch('/api/content/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ date: pv.date, topic: pv.instruction.trim() }),
          })
          const createData = await createRes.json()
          if (!createRes.ok) {
            toast.error(createData?.error || 'Erro ao criar vídeo personalizado')
            continue
          }
          const newItem = createData?.item as CalendarItem | undefined
          if (!newItem?.id) {
            toast.error('Resposta inválida ao criar vídeo personalizado. Tente novamente.')
            continue
          }
          const genRes = await fetch('/api/content/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              calendarItemId: newItem.id,
              overrideTopic: pv.instruction.trim(),
              scriptStrategyKey: profileForm.script_strategy_key,
            }),
          })
          const genData = await genRes.json()
          const itemToAdd = genRes.ok && genData?.item ? genData.item : newItem
          currentItems = [...currentItems, itemToAdd]
          if (!genRes.ok && genData?.error) {
            toast.error(genData.error || 'Erro ao gerar conteúdo do vídeo personalizado.')
          }
          totalCreated += 1
        } catch (e) {
          console.error('Erro ao processar vídeo personalizado', e)
          toast.error('Erro ao processar um vídeo personalizado.')
        }
      }
      if (hasPersonalized) {
        setItems(currentItems)
      }
      setPersonalizedVideoEntries([])
      toast.success(`Agenda criada com ${totalCreated} vídeo(s).`)
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

  const handleOpenReschedule = (item: CalendarItem) => {
    setRescheduleModalItem(item)
    const current = item.date ? new Date(item.date + 'T12:00:00') : new Date()
    setRescheduleTargetDate(current)
    setRescheduleCalendarMonth(new Date(current.getFullYear(), current.getMonth(), 1))
  }

  const handleConfirmReschedule = async () => {
    if (!rescheduleModalItem || !rescheduleTargetDate) return
    const newDate = formatDate(rescheduleTargetDate)
    if (normalizeDateKey(rescheduleModalItem.date) === newDate) {
      setRescheduleModalItem(null)
      setRescheduleTargetDate(null)
      toast('O conteúdo já está nesta data.')
      return
    }
    try {
      const res = await fetch('/api/content/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: rescheduleModalItem.id, date: newDate }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao realocar')
        return
      }
      const updated: CalendarItem = data.item
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      if (itemModal?.id === updated.id) setItemModal(updated)
      setRescheduleModalItem(null)
      setRescheduleTargetDate(null)
      setSelectedDate(rescheduleTargetDate)
      setCurrentMonth(new Date(rescheduleTargetDate.getFullYear(), rescheduleTargetDate.getMonth(), 1))
      toast.success('Conteúdo realocado para o novo dia.')
    } catch (e) {
      console.error('Erro ao realocar', e)
      toast.error('Erro ao realocar')
    }
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

  const contentPlatformOptions = [
    { value: 'Reels', label: 'Reels (Instagram)' },
    { value: 'Shorts', label: 'Shorts (YouTube)' },
    { value: 'TikTok', label: 'TikTok' },
  ]

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
    <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige pb-12 px-4 pt-2 sm:pt-4 md:pt-12">
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8 relative">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gogh-black flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-gogh-yellow" />
            Gogh Agenda IA
          </h1>
          <p className="text-sm text-gogh-grayDark mt-0.5">
            Planejamento e agenda de conteúdo com IA. Defina o perfil da sua marca, planeje seus vídeos e gere roteiros, legendas e hashtags com um clique.
          </p>
        </div>
      </div>

      {!hasActiveSubscription && (
        <div className="flex items-center justify-center min-h-[280px]">
          <div className="w-full max-w-md mx-auto bg-white rounded-xl border border-gogh-grayLight shadow-sm p-4 sm:p-6 md:p-8 text-center">
            <Lock className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-gogh-black mb-2">Assine para acessar</h3>
            <p className="text-gogh-grayDark mb-6">
              Para acessar o planejamento e agenda de conteúdo com IA é necessário ter uma assinatura ativa.
            </p>
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
            >
              Ver planos
            </Link>
          </div>
        </div>
      )}

      <div className={!hasActiveSubscription ? 'relative pointer-events-none select-none blur-sm opacity-60 space-y-5 sm:space-y-8' : 'space-y-5 sm:space-y-8'}>
      <section id="perfil-marca" className="p-4 sm:p-6 pb-8 border-b border-gogh-grayLight/25">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gogh-black">
              Configure o perfil da sua marca
            </h2>
            <p className="text-xs text-gogh-grayDark mt-0.5">
              Quanto mais você detalhar seu negócio e objetivos, mais o conteúdo ficará alinhado à sua realidade. Clique em cada tópico para abrir e configurar.
            </p>
          </div>
          {profileLoading && <LumaSpin size="sm" />}
        </div>

        <div className="space-y-2">
          {/* Identificação */}
          <div id="perfil-identificacao" className={`rounded-lg border transition-colors ${getAccordionCardClass('identificacao')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'identificacao' ? null : 'identificacao')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Identificação</span>
              {profileAccordionOpen === 'identificacao' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'identificacao' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gogh-grayDark mb-1">Nome da empresa / projeto</label>
                    <p className="text-xs text-gogh-grayDark mb-1.5">Nome ou marca que a IA usará no contexto dos conteúdos.</p>
                    <input
                      type="text"
                      value={profileForm.business_name}
                      onChange={(e) => { markSectionModified('identificacao'); setProfileForm((f) => ({ ...f, business_name: e.target.value })) }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${getFieldBorderClass('identificacao')}`}
                      placeholder="Ex.: Gogh Lab"
                    />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label className="block text-sm font-medium text-gogh-grayDark mb-1">Detalhamento sobre a marca</label>
                    <p className="text-xs text-gogh-grayDark mb-1.5">Detalhe bem tudo sobre a empresa: área de atuação, contexto do negócio, diferenciais, serviços. Quanto mais completo, mais a IA gera temas, roteiros e legendas alinhados à sua marca.</p>
                    <textarea
                      value={profileForm.niche}
                      onChange={(e) => { markSectionModified('identificacao'); setProfileForm((f) => ({ ...f, niche: e.target.value })) }}
                      placeholder="Ex.: Empresa de marketing digital; site de vendas; público empreendedores 25–45 anos; oferecemos cursos e ferramentas."
                      rows={5}
                      className={`w-full px-3 py-2 border rounded-lg text-sm resize-none min-h-[100px] max-h-[280px] overflow-y-auto ${getFieldBorderClass('identificacao')}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Público-alvo */}
          <div id="perfil-publico-alvo" className={`rounded-lg border transition-colors ${getAccordionCardClass('publico-alvo')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'publico-alvo' ? null : 'publico-alvo')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Público-alvo</span>
              {profileAccordionOpen === 'publico-alvo' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'publico-alvo' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 pt-2">
                <label className="block text-sm font-medium text-gogh-grayDark mb-1">Idade do público</label>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={profileForm.audience_min_age}
                    onChange={(e) => { markSectionModified('publico-alvo'); setProfileForm((f) => ({ ...f, audience_min_age: e.target.value })) }}
                    placeholder="Idade mínima"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${getFieldBorderClass('publico-alvo')}`}
                  />
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={profileForm.audience_max_age}
                    onChange={(e) => { markSectionModified('publico-alvo'); setProfileForm((f) => ({ ...f, audience_max_age: e.target.value })) }}
                    placeholder="Idade máxima"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${getFieldBorderClass('publico-alvo')}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tom de voz */}
          <div id="perfil-tom-de-voz" className={`rounded-lg border transition-colors ${getAccordionCardClass('tom-de-voz')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'tom-de-voz' ? null : 'tom-de-voz')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Tom de voz</span>
              {profileAccordionOpen === 'tom-de-voz' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'tom-de-voz' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 pt-2">
                <label className="block text-sm font-medium text-gogh-grayDark mb-1">Tom de voz</label>
                <select
                  value={profileForm.tone_of_voice}
                  onChange={(e) => { markSectionModified('tom-de-voz'); setProfileForm((f) => ({ ...f, tone_of_voice: e.target.value })) }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm max-w-md ${getFieldBorderClass('tom-de-voz')}`}
                >
                  <option value="">Selecione o tom de voz</option>
                  {toneOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Estratégia de roteiro */}
          <div id="perfil-estrategia-roteiro" className={`rounded-lg border transition-colors ${getAccordionCardClass('estrategia-roteiro')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'estrategia-roteiro' ? null : 'estrategia-roteiro')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Estratégia de roteiro</span>
              {profileAccordionOpen === 'estrategia-roteiro' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'estrategia-roteiro' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 pt-2">
                <label className="block text-sm font-medium text-gogh-grayDark mb-1">Estratégia de roteiro</label>
                <select
                  value={profileForm.script_strategy_key}
                  onChange={(e) => { markSectionModified('estrategia-roteiro'); setProfileForm((f) => ({ ...f, script_strategy_key: getScriptStrategy(e.target.value).key })) }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm max-w-md ${getFieldBorderClass('estrategia-roteiro')}`}
                >
                  {SCRIPT_STRATEGIES.map((strategy) => (
                    <option key={strategy.key} value={strategy.key}>
                      {strategy.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gogh-grayDark mt-1">{getScriptStrategy(profileForm.script_strategy_key).description}</p>
              </div>
            )}
          </div>

          {/* Plataforma dos vídeos */}
          <div id="perfil-plataforma-videos" className={`rounded-lg border transition-colors ${getAccordionCardClass('plataforma-videos')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'plataforma-videos' ? null : 'plataforma-videos')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Plataforma dos vídeos</span>
              {profileAccordionOpen === 'plataforma-videos' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'plataforma-videos' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 pt-2">
                <p className="text-xs text-gogh-grayDark mb-2">Selecione em quais formatos de vídeo curto você publica; a criação segue a mesma estrutura (vídeos curtos).</p>
                <div className="flex flex-wrap gap-2">
                  {contentPlatformOptions.map((opt) => {
                    const selected = profileForm.platforms.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          markSectionModified('plataforma-videos')
                          setProfileForm((f) => {
                            const next = selected ? f.platforms.filter((p) => p !== opt.value) : [...f.platforms, opt.value]
                            return { ...f, platforms: next }
                          })
                        }}
                        className={`px-2.5 py-1.5 rounded-md text-xs border ${selected ? 'bg-gogh-yellow/20 border-gogh-yellow text-gogh-black' : 'border-gogh-grayLight text-gogh-grayDark'}`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Objetivos com os vídeos */}
          <div id="perfil-objetivos-videos" className={`rounded-lg border transition-colors ${getAccordionCardClass('objetivos-videos')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'objetivos-videos' ? null : 'objetivos-videos')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Objetivos com os vídeos</span>
              {profileAccordionOpen === 'objetivos-videos' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'objetivos-videos' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 pt-2">
                <p className="text-xs text-gogh-grayDark mb-2">
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
                      onClick={() => {
                        markSectionModified('objetivos-videos')
                        setProfileForm((f) => ({
                          ...f,
                          goals: selected ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
                        }))
                      }}
                      className="px-2.5 py-1.5 text-xs transition-colors"
                    >
                      {goal}
                    </button>
                    {isCustomGoal ? (
                      <button
                        type="button"
                        onClick={() => {
                          markSectionModified('objetivos-videos')
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
                className={`w-full px-3 py-2 border rounded-lg text-sm ${getFieldBorderClass('objetivos-videos')}`}
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
                  markSectionModified('objetivos-videos')
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
            )}
          </div>

          {/* Frequência desejada por semana */}
          <div id="perfil-frequencia" className={`rounded-lg border transition-colors ${getAccordionCardClass('frequencia')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'frequencia' ? null : 'frequencia')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Frequência desejada por semana</span>
              {profileAccordionOpen === 'frequencia' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'frequencia' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 pt-2">
                <p className="text-xs text-gogh-grayDark mb-2">Dias em que você costuma publicar; a IA usará para planejar e sugerir horários.</p>
                <div className="flex flex-wrap gap-2">
                  {weekDayOptions.map((day) => {
                    const checked = profileForm.availability_days.includes(day.value)
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          markSectionModified('frequencia')
                          setProfileForm((f) => {
                            const exists = f.availability_days.includes(day.value)
                            if (exists && f.availability_days.length <= 1) return f
                            const nextDays = exists ? f.availability_days.filter((d) => d !== day.value) : [...f.availability_days, day.value]
                            const next = [...nextDays].sort((a, b) => a - b)
                            return { ...f, availability_days: next, frequency_per_week: Math.max(1, next.length) }
                          })
                        }}
                        className={`px-2 py-1 rounded-md text-xs border ${checked ? 'bg-gogh-yellow/20 border-gogh-yellow text-gogh-black' : 'border-gogh-grayLight text-gogh-grayDark'}`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Estrutura fixa (opcional) — um campo por tipo de conteúdo */}
          <div id="perfil-estrutura-fixa" className={`rounded-lg border transition-colors ${getAccordionCardClass('estrutura-fixa')}`}>
            <button
              type="button"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'estrutura-fixa' ? null : 'estrutura-fixa')}
              className="w-full flex items-center justify-between py-2.5 px-3 text-left hover:opacity-90 transition-opacity"
            >
              <span className="text-base font-semibold text-gogh-black">Estrutura fixa nos vídeos (opcional)</span>
              {profileAccordionOpen === 'estrutura-fixa' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'estrutura-fixa' && (
              <div className="px-3 pb-3 pt-0 border-t border-gogh-grayLight/50 pt-2 space-y-4">
                <p className="text-xs text-gogh-grayDark">
                  Cole aqui <strong>somente o texto que deve aparecer</strong> em cada tipo de conteúdo. Tudo que você escrever será copiado literalmente — não use instruções, só o texto fixo. Cada campo é opcional.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gogh-grayDark mb-1">Roteiro (script)</label>
                  <p className="text-[11px] text-gogh-grayDark mb-1">Texto exato que aparecerá no final de todo roteiro (copiado literalmente; sem instruções).</p>
                  <textarea
                    value={fixedStructures.script}
                    onChange={(e) => { markSectionModified('estrutura-fixa'); setFixedStructures((s) => ({ ...s, script: e.target.value })) }}
                    placeholder="Ex.: Clique abaixo e saiba mais."
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg text-sm resize-none min-h-[80px] max-h-[180px] overflow-y-auto ${getFieldBorderClass('estrutura-fixa')}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gogh-grayDark mb-1">Legenda do vídeo</label>
                  <p className="text-[11px] text-gogh-grayDark mb-1">Texto exato no final da legenda (copiado literalmente; uma linha por item se quiser lista). Se você incluir hashtags aqui, serão as únicas usadas — a IA não criará outras por tema.</p>
                  <textarea
                    value={fixedStructures.caption}
                    onChange={(e) => { markSectionModified('estrutura-fixa'); setFixedStructures((s) => ({ ...s, caption: e.target.value })) }}
                    placeholder="Ex.: Seu texto. Uma linha por item.\n#tag1 #tag2"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg text-sm resize-none min-h-[80px] max-h-[180px] overflow-y-auto ${getFieldBorderClass('estrutura-fixa')}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gogh-grayDark mb-1">Texto do anúncio (ad copy)</label>
                  <p className="text-[11px] text-gogh-grayDark mb-1">Texto exato no final do anúncio (copiado literalmente; uma linha por item se quiser).</p>
                  <textarea
                    value={fixedStructures.ad_copy}
                    onChange={(e) => { markSectionModified('estrutura-fixa'); setFixedStructures((s) => ({ ...s, ad_copy: e.target.value })) }}
                    placeholder="Ex.: Seu texto fixo. Uma linha por item."
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg text-sm resize-none min-h-[60px] max-h-[140px] overflow-y-auto ${getFieldBorderClass('estrutura-fixa')}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gogh-grayDark mb-1">Texto de capa do vídeo</label>
                  <p className="text-[11px] text-gogh-grayDark mb-1">Texto exato para capa/thumbnail (copiado literalmente). Opcional.</p>
                  <textarea
                    value={fixedStructures.cover}
                    onChange={(e) => { markSectionModified('estrutura-fixa'); setFixedStructures((s) => ({ ...s, cover: e.target.value })) }}
                    placeholder="Ex.: Sua frase para capa"
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg text-sm resize-none min-h-[60px] max-h-[140px] overflow-y-auto ${getFieldBorderClass('estrutura-fixa')}`}
                  />
                </div>
              </div>
            )}
          </div>

          <div id="perfil-videos-personalizados" className={`rounded-lg border transition-colors ${getAccordionCardClass('videos-personalizados')}`}>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 p-3 text-left"
              onClick={() => setProfileAccordionOpen(profileAccordionOpen === 'videos-personalizados' ? null : 'videos-personalizados')}
            >
              <span className="text-base font-semibold text-gogh-black">Vídeos personalizados (opcional)</span>
              {profileAccordionOpen === 'videos-personalizados' ? <ChevronDown className="w-4 h-4 text-gogh-grayDark shrink-0" /> : <ChevronRight className="w-4 h-4 text-gogh-grayDark shrink-0" />}
            </button>
            {profileAccordionOpen === 'videos-personalizados' && (
              <div className="px-3 pb-4 pt-0 space-y-4">
                <p className="text-xs text-gogh-grayDark">
                  Para dias em que você já sabe o que quer: descreva o vídeo (tema, estilo, roteiro para voz IA, motion design, etc.). Na geração da agenda, a IA não criará conteúdo automático nesses dias — usará sua descrição.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-2 py-1.5 text-[11px] text-amber-900 leading-snug">
                  <p className="font-medium mb-0.5">Válido apenas para o mês da geração</p>
                  <p className="text-amber-800">
                    As adições aqui valem somente para o mês em que você gerar a agenda (mês atual). Após gerar ou ao mudar de mês, os campos voltam a ficar em branco — a cada mês você pode definir novos vídeos personalizados para esse mês.
                  </p>
                </div>
                {(() => {
                  const now = new Date()
                  const y = now.getFullYear()
                  const m = now.getMonth()
                  const lastDay = new Date(y, m + 1, 0).getDate()
                  const minDate = `${y}-${String(m + 1).padStart(2, '0')}-01`
                  const maxDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
                  const todayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                  const defaultDateForNew =
                    todayStr >= minDate && todayStr <= maxDate ? todayStr : minDate
                  const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                  const isDateInCurrentMonth = (dateStr: string) => dateStr.startsWith(realCurrentMonthKey)
                  return (
                    <>
                      <p className="text-[11px] text-gogh-grayDark">
                        Apenas dias do mês atual (<strong>{currentMonthName}</strong>). Um vídeo personalizado por dia — cada dia só pode ser escolhido uma vez.
                      </p>
                      {hasAutoPlanUsedThisMonth ? (
                        <div className="rounded-lg border border-gogh-grayLight bg-gogh-grayLight/30 px-3 py-2.5 text-sm text-gogh-grayDark">
                          <p className="font-medium text-gogh-black">Agenda deste mês já gerada</p>
                          <p className="text-xs mt-0.5">
                            Você poderá adicionar vídeos personalizados novamente no próximo mês, ao gerar a nova agenda.
                          </p>
                        </div>
                      ) : (
                        <HoverButton
                          type="button"
                          onClick={() => setPersonalizedVideoEntries((prev) => {
                            const used = new Set(prev.map((e) => e.date))
                            let firstFree = minDate
                            for (let d = 1; d <= lastDay; d++) {
                              const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                              if (!used.has(dateStr)) {
                                firstFree = dateStr
                                break
                              }
                            }
                            return [...prev, { date: firstFree, instruction: '' }]
                          })}
                          className="h-9 px-3 text-sm border border-gogh-grayLight rounded-lg"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar vídeo personalizado
                        </HoverButton>
                      )}
                      {personalizedVideoEntries.length > 0 && (
                        <div className="space-y-3">
                          {personalizedVideoEntries.map((entry, idx) => (
                            <div key={idx} className="p-3 border border-gogh-grayLight rounded-lg space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <label className="text-xs font-medium text-gogh-grayDark">Dia</label>
                                <input
                                  type="date"
                                  min={minDate}
                                  max={maxDate}
                                  value={isDateInCurrentMonth(entry.date) ? entry.date : defaultDateForNew}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (!val.startsWith(realCurrentMonthKey)) {
                                      toast.error(`Só é possível escolher dias do mês atual (${currentMonthName}).`)
                                      setPersonalizedVideoEntries((prev) => {
                                        const next = [...prev]
                                        next[idx] = { ...next[idx], date: defaultDateForNew }
                                        return next
                                      })
                                      return
                                    }
                                    const alreadyUsedByOther = personalizedVideoEntries.some(
                                      (e, i) => i !== idx && e.date === val
                                    )
                                    if (alreadyUsedByOther) {
                                      toast.error('Este dia já tem um vídeo personalizado. Escolha outro dia — apenas um vídeo por dia.')
                                      return
                                    }
                                    setPersonalizedVideoEntries((prev) => {
                                      const next = [...prev]
                                      next[idx] = { ...next[idx], date: val }
                                      return next
                                    })
                                  }}
                                  className="px-2 py-1.5 border border-gogh-grayLight rounded text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPersonalizedVideoEntries((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                  aria-label="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <textarea
                                placeholder="Ex.: Vídeo com voz IA (Google), motion design, tema X; roteiro curto e direto para narração."
                                value={entry.instruction}
                                onChange={(e) => setPersonalizedVideoEntries((prev) => {
                                  const next = [...prev]
                                  next[idx] = { ...next[idx], instruction: e.target.value }
                                  return next
                                })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm resize-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-gogh-grayLight">
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

      <section className="p-4 sm:p-6">
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
            disabled={autoPlanning || !profile || !canPressGenerateAgenda}
            className="h-10 px-4"
          >
            {autoPlanning ? (
              <>
                <LumaSpin size="sm" />
                Gerando agenda...
              </>
            ) : !isViewedMonthCurrent ? (
              <>
                <Sparkles className="w-4 h-4" />
                Disponível apenas para o mês atual
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
            onRescheduleForItem={handleOpenReschedule}
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
        <div className="space-y-5">
          <p className="text-sm text-gogh-grayDark">
            Confira o resumo do perfil que a IA usará. Se precisar alterar algo, use &quot;Ver configuração&quot; ou &quot;Alterar&quot; em cada tópico.
          </p>
          <div className="rounded-lg border border-gogh-grayLight bg-gogh-grayLight/20 p-4 space-y-5 max-h-[320px] overflow-y-auto">
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Identificação</p>
              <p className="text-sm text-gogh-grayDark">Empresa: {profileForm.business_name || '—'} · Detalhamento: {profileForm.niche ? (profileForm.niche.length > 80 ? profileForm.niche.slice(0, 80) + '…' : profileForm.niche) : '—'}</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=identificacao') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Público-alvo</p>
              <p className="text-sm text-gogh-grayDark">{profileForm.audience_min_age || profileForm.audience_max_age ? `${profileForm.audience_min_age || '?'} a ${profileForm.audience_max_age || '?'} anos` : '—'}</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=publico-alvo') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Tom de voz</p>
              <p className="text-sm text-gogh-grayDark">{profileForm.tone_of_voice || '—'}</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=tom-de-voz') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Estratégia de roteiro</p>
              <p className="text-sm text-gogh-grayDark">{getScriptStrategy(profileForm.script_strategy_key).label}</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=estrategia-roteiro') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Plataforma dos vídeos</p>
              <p className="text-sm text-gogh-grayDark">{profileForm.platforms.length ? profileForm.platforms.join(', ') : '—'}</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=plataforma-videos') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Objetivos com os vídeos</p>
              <p className="text-sm text-gogh-grayDark">{profileForm.goals.length ? profileForm.goals.join(', ') : '—'}</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=objetivos-videos') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Frequência desejada</p>
              <p className="text-sm text-gogh-grayDark">{profileForm.availability_days.length ? profileForm.availability_days.map((d) => weekDayOptions.find((o) => o.value === d)?.label ?? d).join(', ') : '—'}</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=frequencia') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Estrutura fixa nos vídeos</p>
              <p className="text-sm text-gogh-grayDark">
                {[fixedStructures.script, fixedStructures.caption, fixedStructures.ad_copy, fixedStructures.cover].some((s) => (s ?? '').trim().length > 0)
                  ? [
                      fixedStructures.script?.trim() && 'Roteiro',
                      fixedStructures.caption?.trim() && 'Legenda de vídeo',
                      fixedStructures.ad_copy?.trim() && 'Legenda de anúncio',
                      fixedStructures.cover?.trim() && 'Texto de capa',
                    ].filter(Boolean).join(', ') + ' configurado(s). Será aplicado em todos os vídeos (incl. personalizados).'
                  : 'Nenhuma estrutura fixa configurada.'}
              </p>
              <p className="text-xs text-gogh-grayDark">Salva no perfil e usada em toda geração.</p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=estrutura-fixa') }}>Alterar</Button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-gogh-black">Vídeos personalizados (este mês)</p>
              <p className="text-sm text-gogh-grayDark">
                {personalizedVideoEntries.filter((e) => e.instruction.trim().length > 0 && e.date.startsWith(currentMonthKey)).length > 0
                  ? personalizedVideoEntries
                      .filter((e) => e.instruction.trim().length > 0 && e.date.startsWith(currentMonthKey))
                      .map((e) => `${e.date}: ${e.instruction.trim().length > 40 ? e.instruction.trim().slice(0, 40) + '…' : e.instruction.trim()}`)
                      .join(' · ')
                  : 'Nenhum vídeo personalizado para este mês.'}
              </p>
              <p className="text-xs text-gogh-grayDark">
                {personalizedVideoEntries.filter((e) => e.instruction.trim().length > 0 && e.date.startsWith(currentMonthKey)).length > 0
                  ? 'Esses dias receberão o conteúdo que você definiu; o restante será gerado pela IA. Não fica salvo no perfil (só para esta geração).'
                  : 'O que você preencher aqui será enviado nesta geração e não fica salvo no perfil.'}
              </p>
              <Button type="button" variant="outline" size="sm" className="w-fit mt-1 h-8 text-xs rounded-full" onClick={() => { setConfirmAutoPlanModalOpen(false); router.push('/planejamento?open=videos-personalizados') }}>Alterar</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 rounded-full"
              onClick={() => {
                setConfirmAutoPlanModalOpen(false)
                document.getElementById('perfil-marca')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Ver configuração
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
        isOpen={!!rescheduleModalItem}
        onClose={() => {
          setRescheduleModalItem(null)
          setRescheduleTargetDate(null)
        }}
        title="Realocar conteúdo"
        size="md"
        showCloseButton={false}
      >
        {rescheduleModalItem && (
          <div className="space-y-4">
            <p className="text-sm text-gogh-grayDark">
              Escolha o novo dia para &quot;{rescheduleModalItem.topic || 'este vídeo'}&quot;. O conteúdo será movido para a data selecionada.
            </p>
            <Calendar
              mode="single"
              month={rescheduleCalendarMonth}
              onMonthChange={(m) => setRescheduleCalendarMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
              selected={rescheduleTargetDate ?? undefined}
              onSelect={(d) => setRescheduleTargetDate(d ?? null)}
              className="mx-auto"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleModalItem(null)
                  setRescheduleTargetDate(null)
                }}
                className="h-9 px-4 rounded-full bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </Button>
              <HoverButton
                onClick={handleConfirmReschedule}
                disabled={!rescheduleTargetDate}
                className="h-9 px-4 text-sm rounded-full"
              >
                Realocar
              </HoverButton>
            </div>
          </div>
        )}
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
            <p className="text-xs font-medium text-gogh-grayDark">
              Regenerações restantes: {Math.max(0, 2 - (Number(regenerateModalItem.meta?.regenerate_count ?? 0) || 0))} de 2
            </p>
            <p className="text-sm text-gogh-grayDark">
              Descreva o que você deseja alterar neste conteúdo para a IA personalizar a nova geração (ex.: mudar tema, gancho mais forte, CTA para WhatsApp).
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
                disabled={generatingId === regenerateModalItem.id || (Number(regenerateModalItem.meta?.regenerate_count ?? 0) || 0) >= 2}
                className="h-9 px-4 text-sm rounded-full"
              >
                {generatingId === regenerateModalItem.id
                  ? 'Gerando...'
                  : (Number(regenerateModalItem.meta?.regenerate_count ?? 0) || 0) >= 2
                    ? 'Limite de regenerações atingido'
                    : 'Gerar novamente'}
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
                      Marcar como feito
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
    </div>
  )
}
