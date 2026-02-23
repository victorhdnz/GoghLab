'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LumaSpin } from '@/components/ui/luma-spin'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Plus, FileText, Type, Clock, RefreshCw, Sparkles } from 'lucide-react'
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
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ContentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    niche: '',
    audience: '',
    tone_of_voice: '',
    goals: '',
    platforms: [] as string[],
    frequency_per_week: 3,
  })

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [items, setItems] = useState<CalendarItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }, [currentMonth])

  // Carregar perfil de conteúdo
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
            goals: data.profile.goals ?? '',
            platforms: Array.isArray(data.profile.platforms) ? data.profile.platforms : [],
            frequency_per_week: data.profile.frequency_per_week ?? 3,
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

  // Carregar itens do mês atual
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
        <p className="text-gogh-grayDark">Faça login para acessar o planejamento de conteúdo.</p>
      </div>
    )
  }

  const days: Date[] = []
  const start = startOfMonth(currentMonth)
  const end = endOfMonth(currentMonth)
  const startWeekday = start.getDay() || 7 // 1..7 (segunda=1)
  for (let i = 1; i < startWeekday; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() - (startWeekday - i)))
  }
  for (let d = 0; d <= end.getDate() - 1; d++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), 1 + d))
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))
  }

  const dayItemsMap = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    for (const item of items) {
      map[item.date] = map[item.date] || []
      map[item.date].push(item)
    }
    return map
  }, [items])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/content/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileForm),
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
    try {
      const res = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao criar item')
        return
      }
      setItems((prev) => [...prev, data.item])
    } catch (e) {
      console.error('Erro ao criar item', e)
      toast.error('Erro ao criar item')
    }
  }

  const handleGenerate = async (itemId: string) => {
    setGeneratingId(itemId)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ calendarItemId: itemId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar conteúdo')
        return
      }
      const updated: CalendarItem = data.item
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      toast.success('Conteúdo gerado com sucesso.')
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
          >
            ← Mês anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
          >
            Próximo mês →
          </Button>
        </div>
      </div>

      {/* Perfil de conteúdo */}
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
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, business_name: e.target.value }))
              }
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
            <input
              type="text"
              value={profileForm.audience}
              onChange={(e) => setProfileForm((f) => ({ ...f, audience: e.target.value }))}
              placeholder="Ex.: mulheres 25-40 anos que empreendem..."
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Tom de voz
            </label>
            <input
              type="text"
              value={profileForm.tone_of_voice}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, tone_of_voice: e.target.value }))
              }
              placeholder="Ex.: leve e descontraído, porém profissional"
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gogh-grayDark mb-1">
              Objetivos com os vídeos
            </label>
            <textarea
              value={profileForm.goals}
              onChange={(e) => setProfileForm((f) => ({ ...f, goals: e.target.value }))}
              placeholder="Ex.: atrair novos pacientes, gerar autoridade, educar o público..."
              rows={2}
              className="w-full px-3 py-2 border border-gogh-grayLight rounded-lg text-sm"
            />
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
      </section>

      {/* Calendário */}
      <section className="bg-white rounded-2xl border border-gogh-grayLight p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-semibold text-gogh-black flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gogh-yellow" />
            Calendário de vídeos — {monthLabel}
          </h2>
          {itemsLoading && <LumaSpin size="sm" />}
        </div>
        <div className="grid grid-cols-7 gap-2 text-xs sm:text-sm text-center text-gogh-grayDark font-medium">
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>
        <div className="grid grid-cols-7 gap-2 text-xs">
          {days.map((d, index) => {
            const dateStr = formatDate(d)
            const isCurrentMonth = d.getMonth() === currentMonthNumber
            const dayItems = dayItemsMap[dateStr] || []
            return (
              <div
                key={index}
                className={`min-h-[90px] rounded-lg border p-1.5 flex flex-col ${
                  isCurrentMonth ? 'bg-white border-gogh-grayLight' : 'bg-gogh-grayLight/40 border-gogh-grayLight/80 text-gogh-grayDark/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold">{d.getDate()}</span>
                  {isCurrentMonth && (
                    <button
                      type="button"
                      onClick={() => handleCreateItem(dateStr)}
                      className="p-0.5 rounded-full hover:bg-gogh-grayLight"
                      title="Adicionar vídeo neste dia"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayItems.map((item) => {
                    const hasGenerated = !!item.script || !!item.caption || !!item.hashtags
                    const recTime = getRecommendedTime(item)
                    return (
                      <div
                        key={item.id}
                        className="rounded-md border border-gogh-grayLight bg-gogh-beige-light/60 px-1.5 py-1 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-semibold truncate">
                            {item.topic || 'Vídeo sem tema ainda'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGenerate(item.id)}
                            disabled={!!generatingId || !profile}
                            className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gogh-yellow text-gogh-black disabled:opacity-60"
                          >
                            {generatingId === item.id ? (
                              <>
                                <LumaSpin size="sm" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                {hasGenerated ? 'Regenerar' : 'Gerar'}
                              </>
                            )}
                          </button>
                        </div>
                        {hasGenerated && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.script) {
                                  navigator.clipboard.writeText(item.script)
                                  toast.success('Roteiro copiado.')
                                } else {
                                  toast('Ainda não há roteiro para copiar.')
                                }
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gogh-grayLight text-[10px]"
                            >
                              <FileText className="w-3 h-3" />
                              Roteiro
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const textParts = [item.caption, item.hashtags].filter(Boolean)
                                if (textParts.length) {
                                  navigator.clipboard.writeText(textParts.join('\n\n'))
                                  toast.success('Legenda + hashtags copiadas.')
                                } else {
                                  toast('Ainda não há legenda/hashtags para copiar.')
                                }
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gogh-grayLight text-[10px]"
                            >
                              <Type className="w-3 h-3" />
                              Legenda + hashtags
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (recTime) {
                                  navigator.clipboard.writeText(recTime)
                                  toast.success('Horário recomendado copiado.')
                                } else {
                                  toast('Ainda não há horário recomendado.')
                                }
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gogh-grayLight text-[10px]"
                            >
                              <Clock className="w-3 h-3" />
                              {recTime ? recTime : 'Horário'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {!dayItems.length && isCurrentMonth && (
                    <button
                      type="button"
                      onClick={() => handleCreateItem(dateStr)}
                      className="w-full h-7 rounded-md border border-dashed border-gogh-grayLight text-[10px] text-gogh-grayDark hover:bg-gogh-grayLight/50"
                    >
                      + Planejar vídeo
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

