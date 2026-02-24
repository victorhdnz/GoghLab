'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LumaSpin } from '@/components/ui/luma-spin'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, RefreshCw, Sparkles, FileText, Type, Clock } from 'lucide-react'
import { CalendarWithEventSlots } from '@/components/ui/calendar-with-event-slots'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

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
    [key: string]: any
  } | null
}

type CalendarItem = {
  id: string
  date: string
  time: string | null
  platform: string | null
  topic: string | null
  status: string
  script: string | null
  caption: string | null
  hashtags: string | null
  meta: any | null
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
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
    audience: '',
    tone_of_voice: '',
    goals: [] as string[],
    platforms: [] as string[],
    frequency_per_week: 3,
    availability_days: [1, 2, 3, 4, 5] as number[],
  })

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
  const [contentModal, setContentModal] = useState<{ type: 'script' | 'caption' | 'time'; item: CalendarItem } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent('/planejamento')}`)
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || hasActiveSubscription) return

    const redirectToPlans = (event?: Event) => {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }
      router.push('/precos')
    }

    const onWheel = (event: WheelEvent) => redirectToPlans(event)
    const onTouchStart = (event: TouchEvent) => redirectToPlans(event)
    const onKeyDown = (event: KeyboardEvent) => {
      const blockedKeys = [' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']
      if (blockedKeys.includes(event.key)) redirectToPlans(event)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isAuthenticated, hasActiveSubscription, router])

  useEffect(() => {
    if (!isAuthenticated) return
    const loadProfile = async () => {
      setProfileLoading(true)
      try {
        const res = await fetch('/api/content/profile', { credentials: 'include' })
        const data = await res.json()
        if (res.ok && data.profile) {
          setProfile(data.profile)
          setProfileForm({
            business_name: data.profile.business_name ?? '',
            niche: data.profile.niche ?? '',
            audience: data.profile.audience ?? '',
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
          })
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
    if (!isAuthenticated) return
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LumaSpin size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LumaSpin size="lg" />
      </div>
    )
  }

  const handleSaveProfile = async () => {
    if (!hasActiveSubscription) {
      router.push('/precos')
      return
    }
    setSavingProfile(true)
    try {
      const res = await fetch('/api/content/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profileForm,
          goals: profileForm.goals.join(' | '),
          frequency_per_week: Math.max(1, profileForm.availability_days.length),
          extra_preferences: {
            availability_days: profileForm.availability_days,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar perfil')
        return
      }
      setProfile(data.profile)
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
      setItems((prev) => [...prev, data.item])
      setCreateModalOpen(false)
      setCreateForm({ topic: '', platform: '', time: '' })
      toast.success('Vídeo criado para este dia.')
    } catch (e) {
      console.error('Erro ao criar item', e)
      toast.error('Erro ao criar item')
    }
  }

  const handleGenerate = async (itemId: string, regenerate = false) => {
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
        body: JSON.stringify({ calendarItemId: itemId, mode: regenerate ? 'regenerate' : 'generate' }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.code === 'insufficient_credits' && data?.redirectTo) {
          toast.error(data.error || 'Créditos insuficientes')
          window.location.href = data.redirectTo
          return
        }
        toast.error(data.error || 'Erro ao gerar conteúdo')
        return
      }
      const updated: CalendarItem = data.item
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      if (itemModal?.id === updated.id) setItemModal(updated)
      if (contentModal?.item?.id === updated.id) setContentModal({ ...contentModal, item: updated })
      toast.success(regenerate ? 'Novo conteúdo gerado com sucesso.' : 'Conteúdo gerado com sucesso.')
    } catch (e) {
      console.error('Erro ao gerar conteúdo', e)
      toast.error('Erro ao gerar conteúdo')
    } finally {
      setGeneratingId(null)
    }
  }

  const currentMonthNumber = currentMonth.getMonth()

  const getRecommendedTime = (item: CalendarItem) => {
    const rec = item.meta?.recommended_time
    if (rec) return rec
    if (item.time) return item.time.toString().slice(0, 5)
    return null
  }

  const selectedDateItems = useMemo(() => {
    const selectedDateString = formatDate(selectedDate)
    return items.filter((item) => item.date === selectedDateString)
  }, [items, selectedDate])

  const regenerateCount = (item: CalendarItem) => {
    const value = Number(item.meta?.regenerate_count ?? 0)
    return Number.isFinite(value) ? value : 0
  }

  const handleCopyScript = (item: CalendarItem) => {
    if (!item.script) {
      toast('Ainda não há roteiro para copiar.')
      return
    }
    navigator.clipboard.writeText(item.script)
    toast.success('Roteiro copiado.')
  }

  const handleCopyCaptionHashtags = (item: CalendarItem) => {
    const textParts = [item.caption, item.hashtags].filter(Boolean)
    if (!textParts.length) {
      toast('Ainda não há legenda/hashtags para copiar.')
      return
    }
    navigator.clipboard.writeText(textParts.join('\n\n'))
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

  const handleAutoPlanMonth = async () => {
    if (!hasActiveSubscription) {
      router.push('/precos')
      return
    }
    setAutoPlanning(true)
    try {
      const res = await fetch('/api/content/auto-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ month: formatDate(currentMonth) }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar agenda automática')
        return
      }
      const createdItems: CalendarItem[] = Array.isArray(data.items) ? data.items : []
      setItems((prev) => {
        const map = new Map(prev.map((it) => [it.id, it]))
        for (const item of createdItems) map.set(item.id, item)
        return Array.from(map.values())
      })
      toast.success(`Agenda automática criada com ${createdItems.length} vídeo(s).`)
    } catch (e) {
      console.error('Erro na agenda automática', e)
      toast.error('Erro ao gerar agenda automática')
    } finally {
      setAutoPlanning(false)
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

  const audienceOptions = [
    '13 - 17 anos',
    '18 - 24 anos',
    '25 - 34 anos',
    '35 - 44 anos',
    '45 - 54 anos',
    '55 - 64 anos',
    '65+ anos',
    '18 - 34 anos',
    '25 - 44 anos',
    '35 - 65+ anos',
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

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-24 lg:py-28 space-y-8 relative"
      onClickCapture={(e) => {
        if (!hasActiveSubscription) {
          e.preventDefault()
          e.stopPropagation()
          router.push('/precos')
        }
      }}
      onWheelCapture={(e) => {
        if (!hasActiveSubscription) {
          e.preventDefault()
          e.stopPropagation()
          router.push('/precos')
        }
      }}
    >
      {!hasActiveSubscription && (
        <div className="absolute inset-0 z-20 bg-white/35 backdrop-blur-[1px] rounded-2xl" />
      )}
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

      <section className="bg-white rounded-2xl border border-gogh-grayLight p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-gogh-black">
            Perfil de Conteúdo da sua Marca
          </h2>
          {profileLoading && <LumaSpin size="sm" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Nome da empresa / projeto
            </label>
            <input
              type="text"
              value={profileForm.business_name}
              onChange={(e) => setProfileForm((f) => ({ ...f, business_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Nicho principal
            </label>
            <input
              type="text"
              value={profileForm.niche}
              onChange={(e) => setProfileForm((f) => ({ ...f, niche: e.target.value }))}
              placeholder="Ex.: Psicologia, Marketing, Advocacia..."
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Público-alvo
            </label>
            <select
              value={profileForm.audience}
              onChange={(e) => setProfileForm((f) => ({ ...f, audience: e.target.value }))}
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            >
              <option value="">Selecione a faixa de idade</option>
              {audienceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Objetivos com os vídeos
            </label>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((goal) => {
                const selected = profileForm.goals.includes(goal)
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() =>
                      setProfileForm((f) => ({
                        ...f,
                        goals: selected ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
                      }))
                    }
                    className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                      selected
                        ? 'bg-gogh-yellow/20 border-gogh-yellow text-gogh-black'
                        : 'border-gogh-grayLight text-gogh-grayDark'
                    }`}
                  >
                    {goal}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Frequência desejada por semana
            </label>
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
            Essas informações serão usadas como base pela IA para sugerir temas, roteiros,
            legendas e horários recomendados.
          </p>
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="inline-flex items-center gap-2 bg-gogh-yellow text-gogh-black hover:bg-gogh-yellow/90"
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
          </Button>
        </div>
        <div className="pt-2 border-t border-gogh-grayLight/80 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gogh-grayDark">
            Automático: cria os vídeos do mês em uma requisição (tema + roteiro + legenda + hashtags + horário).
          </p>
          <Button
            size="sm"
            onClick={handleAutoPlanMonth}
            disabled={autoPlanning || !profile}
            className="inline-flex items-center gap-2 bg-gogh-black text-white hover:bg-gogh-black/90"
          >
            {autoPlanning ? (
              <>
                <LumaSpin size="sm" />
                Gerando agenda...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar agenda automática
              </>
            )}
          </Button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gogh-grayLight p-4 sm:p-6">
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
            itemsForSelectedDate={selectedDateItems}
            loading={itemsLoading}
            onOpenItem={(item) => setItemModal(item)}
          />
        </div>
      </section>

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
        isOpen={!!itemModal}
        onClose={() => setItemModal(null)}
        title={itemModal?.topic || 'Vídeo planejado'}
        size="md"
      >
        {itemModal && (
          <div className="space-y-3">
            <p className="text-sm text-gogh-grayDark">
              Selecione o que deseja visualizar ou gerar para este conteúdo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={() => handleGenerate(itemModal.id, false)}
                disabled={!!generatingId}
                className="justify-start bg-gogh-yellow text-gogh-black hover:bg-gogh-yellow/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generatingId === itemModal.id ? 'Gerando...' : 'Gerar estrutura'}
              </Button>
              <Button
                onClick={() => handleGenerate(itemModal.id, true)}
                disabled={!!generatingId || regenerateCount(itemModal) >= 3}
                className="justify-start"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar novo ({Math.max(0, 3 - regenerateCount(itemModal))}/3)
              </Button>
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
                onClick={() => setContentModal({ type: 'time', item: itemModal })}
                variant="outline"
                className="justify-start sm:col-span-2"
              >
                <Clock className="w-4 h-4 mr-2" />
                Horário recomendado
              </Button>
            </div>
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
              : 'Horário recomendado'
        }
        size="lg"
      >
        {contentModal && (
          <div className="space-y-4">
            <pre className="whitespace-pre-wrap text-sm bg-gogh-grayLight/30 rounded-lg p-3 max-h-[50vh] overflow-auto">
              {contentModal.type === 'script'
                ? contentModal.item.script || 'Ainda não há roteiro.'
                : contentModal.type === 'caption'
                  ? [contentModal.item.caption, contentModal.item.hashtags].filter(Boolean).join('\n\n') || 'Ainda não há legenda/hashtags.'
                  : getRecommendedTime(contentModal.item) || 'Ainda não há horário recomendado.'}
            </pre>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (contentModal.type === 'script') handleCopyScript(contentModal.item)
                  else if (contentModal.type === 'caption') handleCopyCaptionHashtags(contentModal.item)
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
