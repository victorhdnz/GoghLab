'use client'

import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImageIcon, Coins, Zap, ArrowLeft, Video, Sparkles, Bot, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useCredits } from '@/hooks/useCredits'
import { AI_Prompt } from '@/components/ui/animated-ai-input'
import toast from 'react-hot-toast'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { ChatWithActions, type ChatMessage } from '@/components/ui/ai-actions'
import { Button } from '@/components/ui/button'
import { GlassButton } from '@/components/ui/glass-button'
import AnimatedGenerateButton from '@/components/ui/animated-generate-button-shadcn-tailwind'
import type { CreationPromptItem, CreationTabId } from '@/types/creation-prompts'
import type { CreditActionId } from '@/lib/credits'

const TABS = [
  { id: 'foto', label: 'Criação de Foto' },
  { id: 'video', label: 'Criação de Vídeo' },
  { id: 'roteiro', label: 'Vídeo com Roteiro' },
  { id: 'vangogh', label: 'Criação de prompts' },
] as const

type TabId = (typeof TABS)[number]['id']

const PLACEHOLDERS: Record<TabId, string> = {
  foto: 'Descreva a imagem ou foto que deseja criar...',
  video: 'Descreva o vídeo ou cena que deseja gerar...',
  roteiro: 'Conte a história: ideias de takes, falas e estrutura de roteiro completa para produção de vídeo...',
  vangogh: 'Descreva o que deseja criar com o prompt...',
}

/** Fallback quando a API de modelos não retorna dados. */
const MODELS_BY_TAB_FALLBACK: Record<TabId, { id: string; label: string }[]> = {
  foto: [
    { id: 'default-image', label: 'Padrão (imagem)' },
    { id: 'dall-e', label: 'DALL·E' },
    { id: 'flux', label: 'Flux' },
  ],
  video: [
    { id: 'default-video', label: 'Padrão (vídeo)' },
    { id: 'runway', label: 'Runway' },
    { id: 'pika', label: 'Pika' },
  ],
  roteiro: [
    { id: 'default-video', label: 'Padrão (vídeo)' },
    { id: 'runway', label: 'Runway' },
    { id: 'pika', label: 'Pika' },
  ],
  vangogh: [
    { id: 'default-prompt', label: 'Padrão' },
    { id: 'dall-e', label: 'DALL·E' },
    { id: 'flux', label: 'Flux' },
  ],
}

const DALL_E_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 260" className="h-4 w-4" aria-hidden>
    <path fill="currentColor" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" />
  </svg>
)

const MODEL_ICONS: Record<string, ReactNode> = {
  'default-image': <ImageIcon className="h-4 w-4" />,
  'dall-e': DALL_E_ICON,
  'flux': <Sparkles className="h-4 w-4" />,
  'default-video': <Video className="h-4 w-4" />,
  'runway': <Video className="h-4 w-4" />,
  'pika': <Video className="h-4 w-4" />,
  'default-prompt': <Bot className="h-4 w-4" />,
}

interface CreationModelOption {
  id: string
  name: string
  logo_url: string | null
  can_image?: boolean
  can_video?: boolean
  can_prompt?: boolean
}

export default function CriarGerarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const promptIdFromUrl = searchParams.get('promptId')
  const tabFromUrl = (searchParams.get('tab') as TabId) || 'foto'
  const promptFromUrl = useMemo(() => {
    const p = searchParams.get('prompt')
    return p ? decodeURIComponent(p) : ''
  }, [searchParams])

  const { isAuthenticated, hasActiveSubscription, loading } = useAuth()
  const { balance, costByAction, deduct } = useCredits()
  const [creationPrompts, setCreationPrompts] = useState<CreationPromptItem[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<CreationPromptItem | null>(null)
  const [promptViewFiles, setPromptViewFiles] = useState<{ image?: File; video?: File; motionVideo?: File; characterImage?: File }>({})
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [generating, setGenerating] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [publicCostByAction, setPublicCostByAction] = useState<Record<CreditActionId, number> | null>(null)
  const [creationModelsApi, setCreationModelsApi] = useState<CreationModelOption[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/credits/costs')
      .then((r) => r.json())
      .then((data) => {
        if (data.costByAction) setPublicCostByAction(data.costByAction)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/creation-ai-models')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.models)) {
          setCreationModelsApi(
            data.models.map((m: CreationModelOption & { can_image?: boolean; can_video?: boolean; can_prompt?: boolean }) => ({
              id: m.id,
              name: m.name,
              logo_url: m.logo_url ?? null,
              can_image: m.can_image,
              can_video: m.can_video,
              can_prompt: m.can_prompt,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const activeTab: TabId = selectedPrompt?.tabId ?? (tabFromUrl && ['foto', 'video', 'roteiro', 'vangogh'].includes(tabFromUrl) ? tabFromUrl : 'foto')

  const availableModels = useMemo(() => {
    type Cap = 'can_image' | 'can_video' | 'can_prompt'
    const cap: Record<TabId, Cap> = {
      foto: 'can_image',
      video: 'can_video',
      roteiro: 'can_video',
      vangogh: 'can_prompt',
    }
    const key = cap[activeTab]
    if (!key || creationModelsApi.length === 0) {
      const fallback = MODELS_BY_TAB_FALLBACK[activeTab] ?? MODELS_BY_TAB_FALLBACK.foto
      return fallback.map((m) => ({ id: m.id, name: m.label, logo_url: null as string | null }))
    }
    return creationModelsApi
      .filter((m) => m[key] === true)
      .map((m) => ({ id: m.id, name: m.name, logo_url: m.logo_url }))
  }, [activeTab, creationModelsApi])

  const [selectedModelId, setSelectedModelId] = useState<string>(availableModels[0]?.id ?? 'default-image')

  useEffect(() => {
    const firstId = availableModels[0]?.id
    setSelectedModelId((prev) => (firstId && availableModels.some((m) => m.id === prev)) ? prev : (firstId ?? prev))
  }, [activeTab, availableModels])

  useEffect(() => {
    fetch('/api/creation-prompts')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.creation_prompts)) {
          setCreationPrompts(data.creation_prompts)
          if (promptIdFromUrl && data.creation_prompts.length > 0) {
            const found = data.creation_prompts.find((p: CreationPromptItem) => p.id === promptIdFromUrl)
            if (found) setSelectedPrompt(found)
          }
        }
      })
      .catch(() => {})
  }, [promptIdFromUrl])

  const handleSend = useCallback(
    async (message: string, _model?: string) => {
      if (!isAuthenticated) {
        toast('Faça login para gerar.', { icon: '🔐' })
        router.push('/login?redirect=' + encodeURIComponent('/criar/gerar'))
        return
      }
      if (!hasActiveSubscription) {
        toast('Assine um plano para usar a criação com IA.', { icon: '📋' })
        router.push('/precos')
        return
      }
      const result = await deduct(activeTab)
      if (!result.ok && result.code === 'insufficient_credits') {
        toast('Créditos insuficientes. Redirecionando para comprar mais.')
        router.push('/conta#usage')
        return
      }
      if (!result.ok) return
      const userMsg: ChatMessage = { id: 'u-' + Date.now(), from: 'user', content: message }
      setMessages((prev) => [...prev, userMsg])
      setGenerating(true)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: 'a-' + Date.now(), from: 'assistant', content: `Em breve o resultado para "${message.slice(0, 40)}..." aparecerá aqui. (Integre sua API de geração.)` },
        ])
        setGenerating(false)
      }, 2000)
    },
    [isAuthenticated, hasActiveSubscription, router, activeTab, deduct]
  )

  const handleGenerateWithPrompt = useCallback(
    async (promptItem: CreationPromptItem) => {
      if (!isAuthenticated) {
        toast('Faça login para gerar.', { icon: '🔐' })
        router.push('/login?redirect=' + encodeURIComponent('/criar/gerar'))
        return
      }
      if (!hasActiveSubscription) {
        toast('Assine um plano para usar a criação com IA.', { icon: '📋' })
        router.push('/precos')
        return
      }
      const result = await deduct(activeTab)
      if (!result.ok && result.code === 'insufficient_credits') {
        toast('Créditos insuficientes. Redirecionando para comprar mais.')
        router.push('/conta#usage')
        return
      }
      if (!result.ok) return
      const userMsg: ChatMessage = { id: 'u-' + Date.now(), from: 'user', content: '[Geração com prompt configurado]' }
      setMessages((prev) => [...prev, userMsg])
      setGenerating(true)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: 'a-' + Date.now(), from: 'assistant', content: 'Em breve o resultado aparecerá aqui. (Integre a API de geração com o prompt e arquivos enviados.)' },
        ])
        setGenerating(false)
        setSelectedPrompt(null)
        setPromptViewFiles({})
      }, 2000)
    },
    [isAuthenticated, hasActiveSubscription, router, activeTab, deduct]
  )

  const handleAction = useCallback((messageId: string, action: string) => {
    if (action === 'Copiar') {
      const msg = messages.find((m) => m.id === messageId)
      if (msg?.content) navigator.clipboard.writeText(msg.content)
    }
  }, [messages])

  const showPromptView = selectedPrompt && selectedPrompt.inputStructure !== 'text_only'
  const showChat = !showPromptView

  const backHref = '/criar' + (activeTab ? `?tab=${activeTab}` : '')

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-3 sm:px-4 py-3 sm:py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar aos cards
        </Link>
        {isAuthenticated && hasActiveSubscription && balance !== null && (
          <span className="text-xs sm:text-sm text-muted-foreground">
            Créditos: <strong>{balance}</strong>
            {costByAction?.[activeTab] != null && <> · Esta criação: <strong>{costByAction[activeTab]} créditos</strong></>}
          </span>
        )}
      </div>

      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-background border rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2"><Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" /></div>
              <h3 className="text-lg font-semibold">Créditos do mês acabaram</h3>
            </div>
            <p className="text-muted-foreground mb-6">Seus créditos para este mês acabaram. Você pode comprar mais na área de uso da sua conta.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCreditModal(false)}>Fechar</Button>
              <Link href="/conta#usage"><Button onClick={() => setShowCreditModal(false)}>Ver uso e comprar créditos</Button></Link>
            </div>
          </div>
        </div>
      )}

      {showPromptView && selectedPrompt && (
        <div className="rounded-lg border bg-card overflow-hidden w-full max-w-[360px] sm:max-w-[400px]">
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <span className="font-medium text-xs sm:text-sm truncate">{selectedPrompt.title}</span>
          </div>
          <div className="p-3 space-y-3">
            {selectedPrompt.coverImage && (
              <div className="relative w-full h-[100px] sm:h-[120px] rounded-md overflow-hidden bg-muted/50">
                <Image src={selectedPrompt.coverImage} alt="" fill className="object-cover" sizes="400px" />
              </div>
            )}
            {selectedPrompt.coverVideo && !selectedPrompt.coverImage && (
              <div className="relative w-full h-[100px] sm:h-[120px] rounded-md overflow-hidden bg-muted/50">
                <video src={selectedPrompt.coverVideo} className="w-full h-full object-cover" controls muted playsInline />
              </div>
            )}
            {(selectedPrompt.inputStructure === 'image_only' || selectedPrompt.inputStructure === 'image_and_video' || selectedPrompt.inputStructure === 'motion_video_and_character_photo') && (
              <div>
                <label className="block text-xs font-medium mb-1">
                  {selectedPrompt.inputStructure === 'motion_video_and_character_photo' ? 'Foto do personagem' : 'Envie uma imagem'}
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPromptViewFiles((f) => ({ ...f, characterImage: e.target.files?.[0] ?? f.characterImage, image: e.target.files?.[0] ?? f.image }))}
                  className="sr-only"
                  aria-hidden
                />
                <AnimatedGenerateButton
                  labelIdle={selectedPrompt.inputStructure === 'motion_video_and_character_photo' ? 'Escolher foto' : 'Escolher imagem'}
                  labelActive="Abrindo…"
                  highlightHueDeg={48}
                  onClick={() => imageInputRef.current?.click()}
                />
              </div>
            )}
            {(selectedPrompt.inputStructure === 'video_only' || selectedPrompt.inputStructure === 'image_and_video' || selectedPrompt.inputStructure === 'motion_video_and_character_photo') && (
              <div>
                <label className="block text-xs font-medium mb-1">
                  {selectedPrompt.inputStructure === 'motion_video_and_character_photo' ? 'Vídeo de movimento (referência)' : 'Envie um vídeo'}
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept=""
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|ogg|avi|mkv)$/i.test(file.name)
                    if (!isVideo) {
                      toast.error('Selecione um vídeo (MP4, MOV, WebM, etc.).')
                      e.target.value = ''
                      return
                    }
                    setPromptViewFiles((f) => ({ ...f, motionVideo: file, video: file }))
                  }}
                  className="sr-only"
                  aria-hidden
                />
                <AnimatedGenerateButton
                  labelIdle={selectedPrompt.inputStructure === 'motion_video_and_character_photo' ? 'Escolher vídeo' : 'Escolher vídeo'}
                  labelActive="Abrindo…"
                  highlightHueDeg={48}
                  onClick={() => videoInputRef.current?.click()}
                />
              </div>
            )}
          </div>
          <div className="px-3 py-2.5 border-t space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Modelo de IA:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-md border-input pl-2 pr-2 text-xs font-normal"
                  >
                    {(() => {
                  const sel = availableModels.find((m) => m.id === selectedModelId)
                  return sel?.logo_url ? (
                    <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded"><Image src={sel.logo_url} alt="" width={16} height={16} className="object-contain" /></span>
                  ) : (MODEL_ICONS[selectedModelId] ?? <Bot className="h-4 w-4" />)
                })()}
                    <span>{availableModels.find((m) => m.id === selectedModelId)?.name ?? selectedModelId}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[12rem]">
                  {availableModels.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onSelect={() => setSelectedModelId(m.id)}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        {m.logo_url ? (
                          <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded"><Image src={m.logo_url} alt="" width={16} height={16} className="object-contain" /></span>
                        ) : (MODEL_ICONS[m.id] ?? <Bot className="h-4 w-4 opacity-70" />)}
                        <span>{m.name}</span>
                      </div>
                      {selectedModelId === m.id && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <GlassButton
                size="sm"
                contentClassName="flex items-center gap-1.5 flex-nowrap"
                onClick={() => handleGenerateWithPrompt(selectedPrompt)}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Gerar · {selectedPrompt.creditCost} créditos</span>
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <>
          {messages.length > 0 && (
            <div className="mb-4 max-h-[320px] sm:max-h-[400px] overflow-y-auto rounded-xl border bg-muted/20">
              <ChatWithActions messages={messages} onAction={handleAction} />
            </div>
          )}
          <AI_Prompt
            variant="gerar"
            placeholder={PLACEHOLDERS[activeTab]}
            onSend={handleSend}
            initialValue={selectedPrompt?.inputStructure === 'text_only' ? selectedPrompt.prompt : promptFromUrl}
            creditCost={costByAction?.[activeTab] ?? publicCostByAction?.[activeTab] ?? null}
            models={availableModels}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
          />
          {generating && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
              <TextShimmer duration={1} className="font-mono text-sm">Gerando...</TextShimmer>
            </div>
          )}
          {messages.length === 0 && !generating && (
            <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 sm:p-8 text-center text-muted-foreground text-sm">
              O resultado aparecerá aqui após a geração.
            </div>
          )}
        </>
      )}
    </div>
  )
}
