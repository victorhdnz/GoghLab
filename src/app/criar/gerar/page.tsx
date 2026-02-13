'use client'

import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImageIcon, Coins, Zap, ArrowLeft, Video, Sparkles, Bot, ChevronDown, Check, Play, X } from 'lucide-react'
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
import { getYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from '@/lib/utils/youtube'
import { isCloudinaryVideoUrl, getCloudinaryContainerClasses } from '@/lib/utils/cloudinary'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { id: 'foto', label: 'Foto' },
  { id: 'video', label: 'Vídeo' },
  { id: 'roteiro', label: 'Roteiro de Vídeos' },
  { id: 'vangogh', label: 'Criação de Prompts' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Mensagem exibida quando a falha for do serviço (instabilidade), sem expor detalhes internos. */
const SERVICE_ERROR_MESSAGE =
  'Ocorreu uma instabilidade ao processar sua solicitação. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.'

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
    { id: 'default-prompt', label: 'Padrão (roteiro)' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
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
  /** Créditos por uso (dashboard); null = usar custo padrão da função */
  credit_cost?: number | null
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
  const [modalVideo, setModalVideo] = useState<{ type: 'youtube' | 'cloudinary'; url: string } | null>(null)
  const [publicCostByAction, setPublicCostByAction] = useState<Record<CreditActionId, number> | null>(null)
  const [creationModelsApi, setCreationModelsApi] = useState<CreationModelOption[]>([])
  const [siteLogo, setSiteLogo] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const promptClearInputRef = useRef<{ clear: () => void } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient() as any
        const { data } = await supabase.from('site_settings').select('site_logo').eq('key', 'general').maybeSingle()
        if (data?.site_logo) setSiteLogo(data.site_logo)
      } catch {
        // ignora
      }
    }
    load()
  }, [])

  const STORAGE_KEY_PREFIX = 'criar-gerar-msg-'
  const getStorageKey = (tab: TabId, promptId: string | null) =>
    `${STORAGE_KEY_PREFIX}${tab}-${promptId ?? 'geral'}`

  const contextRef = useRef<{ tab: TabId; promptId: string | null }>({ tab: 'foto', promptId: null })

  // Ao trocar de contexto: salvar mensagens atuais no contexto antigo e carregar as do novo; ao montar com mensagens vazias, carregar do storage
  useEffect(() => {
    const currentTab: TabId = selectedPrompt?.tabId ?? (tabFromUrl && ['foto', 'video', 'roteiro', 'vangogh'].includes(tabFromUrl) ? tabFromUrl : 'foto')
    const currentPromptId = selectedPrompt?.id ?? null
    const prev = contextRef.current
    const keyPrev = getStorageKey(prev.tab, prev.promptId)
    const keyCurrent = getStorageKey(currentTab, currentPromptId)

    const saveToStorage = (key: string, msgs: ChatMessage[]) => {
      try {
        const toSave = msgs.map((m) => ({
          ...m,
          imageDataUrl: undefined,
          videoDataUrl: undefined,
        }))
        localStorage.setItem(key, JSON.stringify(toSave))
      } catch {
        // quota ou outro erro
      }
    }

    const loadFromStorage = (key: string): ChatMessage[] => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    if (prev.tab !== currentTab || prev.promptId !== currentPromptId) {
      setMessages((current) => {
        saveToStorage(keyPrev, current)
        return loadFromStorage(keyCurrent)
      })
      setPromptViewFiles({})
      contextRef.current = { tab: currentTab, promptId: currentPromptId }
    } else if (typeof window !== 'undefined') {
      setMessages((current) => {
        if (current.length > 0) return current
        const loaded = loadFromStorage(keyCurrent)
        return loaded.length > 0 ? loaded : current
      })
    }
  }, [selectedPrompt?.id, selectedPrompt?.tabId, tabFromUrl])

  // Persistir mensagens ao alterar (para manter última criação ao sair e voltar)
  useEffect(() => {
    if (messages.length === 0) return
    const key = getStorageKey(
      selectedPrompt?.tabId ?? (tabFromUrl && ['foto', 'video', 'roteiro', 'vangogh'].includes(tabFromUrl) ? tabFromUrl : 'foto'),
      selectedPrompt?.id ?? null
    )
    try {
      const toSave = messages.map((m) => ({
        ...m,
        imageDataUrl: undefined,
        videoDataUrl: undefined,
      }))
      localStorage.setItem(key, JSON.stringify(toSave))
    } catch {
      // quota
    }
  }, [messages, selectedPrompt?.id, selectedPrompt?.tabId, tabFromUrl])

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
            data.models.map((m: CreationModelOption & { can_image?: boolean; can_video?: boolean; can_prompt?: boolean; credit_cost?: number | null }) => ({
              id: m.id,
              name: m.name,
              logo_url: m.logo_url ?? null,
              can_image: m.can_image,
              can_video: m.can_video,
              can_prompt: m.can_prompt,
              credit_cost: m.credit_cost ?? null,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const activeTab: TabId = selectedPrompt?.tabId ?? (tabFromUrl && ['foto', 'video', 'roteiro', 'vangogh'].includes(tabFromUrl) ? tabFromUrl : 'foto')

  /** Modelos filtrados pela função da aba: Foto → can_image, Vídeo → can_video, Roteiro de Vídeos / Criação de Prompts → can_prompt. Tanto no chat geral quanto em um prompt específico, o usuário vê só os modelos daquela função. */
  const availableModels = useMemo(() => {
    type Cap = 'can_image' | 'can_video' | 'can_prompt'
    const cap: Record<TabId, Cap> = {
      foto: 'can_image',
      video: 'can_video',
      roteiro: 'can_prompt',
      vangogh: 'can_prompt',
    }
    const key = cap[activeTab]
    if (!key || creationModelsApi.length === 0) {
      const fallback = MODELS_BY_TAB_FALLBACK[activeTab] ?? MODELS_BY_TAB_FALLBACK.foto
      return fallback.map((m) => ({ id: m.id, name: m.label, logo_url: null as string | null }))
    }
    const filtered = creationModelsApi
      .filter((m) => m[key] === true)
      .map((m) => ({ id: m.id, name: m.name, logo_url: m.logo_url, credit_cost: m.credit_cost ?? null }))
    if (filtered.length === 0) {
      const fallback = MODELS_BY_TAB_FALLBACK[activeTab] ?? MODELS_BY_TAB_FALLBACK.foto
      return fallback.map((m) => ({ id: m.id, name: m.label, logo_url: null as string | null }))
    }
    return filtered
  }, [activeTab, creationModelsApi])

  const [selectedModelId, setSelectedModelId] = useState<string>(availableModels[0]?.id ?? 'default-image')

  /** Custo em créditos para a criação atual: modelo selecionado (se definido no dashboard) ou custo padrão da função */
  const costForCurrentCreation = useMemo(() => {
    const model = availableModels.find((m) => m.id === selectedModelId)
    const modelCost = model?.credit_cost != null && model.credit_cost > 0 ? model.credit_cost : null
    return modelCost ?? costByAction?.[activeTab] ?? publicCostByAction?.[activeTab] ?? null
  }, [availableModels, selectedModelId, activeTab, costByAction, publicCostByAction])

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
      const result = await deduct(activeTab, costForCurrentCreation ?? undefined)
      if (!result.ok && result.code === 'insufficient_credits') {
        setShowCreditModal(true)
        toast.error('Créditos insuficientes. Compre mais na área de uso da sua conta.')
        return
      }
      if (!result.ok) return
      const userMsg: ChatMessage = { id: 'u-' + Date.now(), from: 'user', content: message }
      setMessages((prev) => [...prev, userMsg])
      promptClearInputRef.current?.clear()
      setGenerating(true)
      const assistantId = 'a-' + Date.now()
      try {
        const res = await fetch('/api/creation/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tab: activeTab,
            prompt: message,
            modelId: selectedModelId || undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 402 || data?.code === 'insufficient_credits') {
            setShowCreditModal(true)
            toast.error('Créditos insuficientes. Compre mais na área de uso da sua conta.')
          }
          const isCreditError = res.status === 402 || data?.code === 'insufficient_credits'
          const modelLogoUrl = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              from: 'assistant',
              content: isCreditError
                ? (data?.error ?? 'Créditos insuficientes.')
                : SERVICE_ERROR_MESSAGE,
              modelLogoUrl,
            },
          ])
          return
        }
        const modelLogoUrl = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
        if (data.type === 'image' && data.imageBase64) {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              from: 'assistant',
              content: '',
              imageDataUrl: `data:${data.contentType || 'image/png'};base64,${data.imageBase64}`,
              regeneratePrompt: message,
              modelLogoUrl,
            },
          ])
        } else if (data.type === 'video' && data.videoId) {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              from: 'assistant',
              content: 'Vídeo em geração… Aguarde (pode levar alguns minutos).',
              regeneratePrompt: message,
              modelLogoUrl,
            },
          ])
          const pollVideo = async () => {
            const st = await fetch(`/api/creation/generate/video-status?videoId=${encodeURIComponent(data.videoId)}`)
            const stData = await st.json().catch(() => ({}))
            if (!st.ok) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: SERVICE_ERROR_MESSAGE } : m))
              )
              return
            }
            if (stData.status === 'completed' && stData.videoBase64) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: '',
                        videoDataUrl: `data:${stData.contentType || 'video/mp4'};base64,${stData.videoBase64}`,
                      }
                    : m
                )
              )
              return
            }
            if (stData.status === 'failed') {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: stData.message || SERVICE_ERROR_MESSAGE } : m))
              )
              return
            }
            setTimeout(pollVideo, 8000)
          }
          setTimeout(pollVideo, 12000)
        } else if (data.type === 'text' && data.text) {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, from: 'assistant', content: data.text, regeneratePrompt: message, modelLogoUrl },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, from: 'assistant', content: data.message || 'Resultado recebido.', regeneratePrompt: message, modelLogoUrl },
          ])
        }
      } catch (err) {
        const modelLogoUrlErr = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
        setMessages((prev) => [
          ...prev,
          { id: assistantId, from: 'assistant', content: SERVICE_ERROR_MESSAGE, modelLogoUrl: modelLogoUrlErr },
        ])
      } finally {
        setGenerating(false)
      }
    },
    [isAuthenticated, hasActiveSubscription, router, activeTab, deduct, selectedModelId, availableModels, costForCurrentCreation]
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
      const result = await deduct(activeTab, promptItem.creditCost)
      if (!result.ok && result.code === 'insufficient_credits') {
        setShowCreditModal(true)
        toast.error('Créditos insuficientes. Compre mais na área de uso da sua conta.')
        return
      }
      if (!result.ok) return
      const userMsg: ChatMessage = { id: 'u-' + Date.now(), from: 'user', content: `[${promptItem.title}]` }
      setMessages((prev) => [...prev, userMsg])
      setGenerating(true)
      const assistantId = 'a-' + Date.now()
      const promptText = promptItem.title + (promptItem.subtitle ? '\n\n' + promptItem.subtitle : '') + (promptItem.prompt ? '\n\n' + promptItem.prompt : '')
      try {
        const res = await fetch('/api/creation/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tab: promptItem.tabId ?? activeTab,
            prompt: promptText,
            modelId: selectedModelId || undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 402 || data?.code === 'insufficient_credits') {
            setShowCreditModal(true)
            toast.error('Créditos insuficientes. Compre mais na área de uso da sua conta.')
          }
          const modelLogoUrlPrompt = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
          const isCreditError = res.status === 402 || data?.code === 'insufficient_credits'
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              from: 'assistant',
              content: isCreditError ? (data?.error ?? 'Créditos insuficientes.') : SERVICE_ERROR_MESSAGE,
              modelLogoUrl: modelLogoUrlPrompt,
            },
          ])
          setSelectedPrompt(null)
          setPromptViewFiles({})
          return
        }
        const modelLogoUrlPrompt = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
        if (data.type === 'image' && data.imageBase64) {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              from: 'assistant',
              content: '',
              imageDataUrl: `data:${data.contentType || 'image/png'};base64,${data.imageBase64}`,
              regeneratePrompt: promptText,
              regenerateCreditCost: promptItem.creditCost,
              modelLogoUrl: modelLogoUrlPrompt,
            },
          ])
        } else if (data.type === 'video' && data.videoId) {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              from: 'assistant',
              content: 'Vídeo em geração… Aguarde (pode levar alguns minutos).',
              regeneratePrompt: promptText,
              regenerateCreditCost: promptItem.creditCost,
              modelLogoUrl: modelLogoUrlPrompt,
            },
          ])
          const pollVideo = async () => {
            const st = await fetch(`/api/creation/generate/video-status?videoId=${encodeURIComponent(data.videoId)}`)
            const stData = await st.json().catch(() => ({}))
            if (!st.ok) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: SERVICE_ERROR_MESSAGE } : m))
              )
              return
            }
            if (stData.status === 'completed' && stData.videoBase64) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: '',
                        videoDataUrl: `data:${stData.contentType || 'video/mp4'};base64,${stData.videoBase64}`,
                      }
                    : m
                )
              )
              return
            }
            if (stData.status === 'failed') {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: stData.message || SERVICE_ERROR_MESSAGE } : m))
              )
              return
            }
            setTimeout(pollVideo, 8000)
          }
          setTimeout(pollVideo, 12000)
        } else if (data.type === 'text' && data.text) {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, from: 'assistant', content: data.text, regeneratePrompt: promptText, regenerateCreditCost: promptItem.creditCost, modelLogoUrl: modelLogoUrlPrompt },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, from: 'assistant', content: data.message || 'Pronto.', regeneratePrompt: promptText, regenerateCreditCost: promptItem.creditCost, modelLogoUrl: modelLogoUrlPrompt },
          ])
        }
        setSelectedPrompt(null)
        setPromptViewFiles({})
      } catch {
        const modelLogoUrlErr = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
        setMessages((prev) => [
          ...prev,
          { id: assistantId, from: 'assistant', content: SERVICE_ERROR_MESSAGE, modelLogoUrl: modelLogoUrlErr },
        ])
        setSelectedPrompt(null)
        setPromptViewFiles({})
      } finally {
        setGenerating(false)
      }
    },
    [isAuthenticated, hasActiveSubscription, router, activeTab, deduct, selectedModelId, availableModels]
  )

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId)
      if (!msg?.regeneratePrompt || msg.from !== 'assistant') return
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
      const cost = msg.regenerateCreditCost ?? costForCurrentCreation ?? costByAction?.[activeTab] ?? 1
      const result = await deduct(activeTab, cost)
      if (!result.ok && result.code === 'insufficient_credits') {
        setShowCreditModal(true)
        toast.error('Créditos insuficientes. Compre mais na área de uso da sua conta.')
        return
      }
      if (!result.ok) return
      setGenerating(true)
      try {
        const res = await fetch('/api/creation/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tab: activeTab,
            prompt: msg.regeneratePrompt,
            modelId: selectedModelId || undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 402 || data?.code === 'insufficient_credits') {
            setShowCreditModal(true)
            toast.error('Créditos insuficientes. Compre mais na área de uso da sua conta.')
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, content: data?.error ?? SERVICE_ERROR_MESSAGE } : m
            )
          )
          return
        }
        const regenModelLogo = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
        if (data.type === 'image' && data.imageBase64) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: '',
                    imageDataUrl: `data:${data.contentType || 'image/png'};base64,${data.imageBase64}`,
                    videoDataUrl: undefined,
                    modelLogoUrl: regenModelLogo ?? m.modelLogoUrl,
                  }
                : m
            )
          )
        } else if (data.type === 'video' && data.videoId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, content: 'Vídeo em geração… Aguarde (pode levar alguns minutos).', imageDataUrl: undefined, videoDataUrl: undefined, modelLogoUrl: regenModelLogo ?? m.modelLogoUrl }
                : m
            )
          )
          const pollVideo = async () => {
            const st = await fetch(`/api/creation/generate/video-status?videoId=${encodeURIComponent(data.videoId)}`)
            const stData = await st.json().catch(() => ({}))
            if (!st.ok) {
              setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, content: SERVICE_ERROR_MESSAGE } : m))
              )
              return
            }
            if (stData.status === 'completed' && stData.videoBase64) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === messageId
                    ? { ...m, content: '', videoDataUrl: `data:${stData.contentType || 'video/mp4'};base64,${stData.videoBase64}` }
                    : m
                )
              )
              return
            }
            if (stData.status === 'failed') {
              setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, content: stData.message || SERVICE_ERROR_MESSAGE } : m))
              )
              return
            }
            setTimeout(pollVideo, 8000)
          }
          setTimeout(pollVideo, 12000)
        } else if (data.type === 'text' && data.text) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, content: data.text, imageDataUrl: undefined, videoDataUrl: undefined, modelLogoUrl: regenModelLogo ?? m.modelLogoUrl } : m
            )
          )
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, content: data.message || 'Pronto.', modelLogoUrl: regenModelLogo ?? m.modelLogoUrl } : m))
          )
        }
      } catch {
        const regenModelLogoErr = availableModels.find((m) => m.id === selectedModelId)?.logo_url ?? undefined
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: SERVICE_ERROR_MESSAGE, modelLogoUrl: regenModelLogoErr ?? m.modelLogoUrl } : m))
        )
      } finally {
        setGenerating(false)
      }
    },
    [
      messages,
      isAuthenticated,
      hasActiveSubscription,
      availableModels,
      selectedModelId,
      costForCurrentCreation,
      router,
      activeTab,
      costByAction,
      deduct,
    ]
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

  const isChatGeral = selectedPrompt === null

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
            {costForCurrentCreation != null && <> · Esta criação: <strong>{costForCurrentCreation} créditos</strong></>}
          </span>
        )}
      </div>

      {/* No chat geral: seletor de função para ver só os modelos daquela função (Foto / Vídeo / Roteiro / Prompts) */}
      {isChatGeral && (
        <div className="mb-4 flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/criar/gerar?tab=${t.id}`}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}

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
            {(() => {
              const isYouTube = selectedPrompt.coverVideo && getYouTubeId(selectedPrompt.coverVideo)
              const hasVideo = !!selectedPrompt.coverVideo
              const thumbUrl = isYouTube ? (getYouTubeThumbnail(selectedPrompt.coverVideo!) || selectedPrompt.coverImage) : selectedPrompt.coverImage
              if (!thumbUrl && !hasVideo) return null
              return (
                <div className="relative w-full h-[100px] sm:h-[120px] rounded-md overflow-hidden bg-muted/50">
                  {thumbUrl && <Image src={thumbUrl} alt="" fill className="object-cover" sizes="400px" />}
                  {hasVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isYouTube) setModalVideo({ type: 'youtube', url: selectedPrompt.coverVideo! })
                        else if (isCloudinaryVideoUrl(selectedPrompt.coverVideo!)) setModalVideo({ type: 'cloudinary', url: selectedPrompt.coverVideo! })
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                      aria-label="Assistir vídeo"
                    >
                      <span className="rounded-full bg-white/90 p-2 text-black shadow-lg">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                    </button>
                  )}
                </div>
              )
            })()}
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
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const name = (file.name || '').toLowerCase()
                    const isVideo = (file.type && file.type.startsWith('video/')) || /\.(mp4|mov|m4v|webm|ogg|avi|mkv)$/i.test(name)
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
              <ChatWithActions
                messages={messages}
                onAction={handleAction}
                userAvatarUrl={siteLogo ?? undefined}
                defaultRegenerateCost={costForCurrentCreation ?? undefined}
                onRegenerate={handleRegenerate}
                regenerating={generating}
              />
            </div>
          )}
          <AI_Prompt
            variant="gerar"
            placeholder={PLACEHOLDERS[activeTab]}
            onSend={handleSend}
            initialValue={selectedPrompt?.inputStructure === 'text_only' ? selectedPrompt.prompt : promptFromUrl}
            creditCost={costForCurrentCreation ?? null}
            models={availableModels}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            clearInputRef={promptClearInputRef}
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

      {/* Modal de vídeo (YouTube ou Cloudinary) */}
      {modalVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Assistir vídeo"
        >
          <div
            className={modalVideo.type === 'cloudinary' ? getCloudinaryContainerClasses(modalVideo.url).wrapper + ' ' + getCloudinaryContainerClasses(modalVideo.url).aspectRatio + ' relative w-full bg-black rounded-lg overflow-hidden shadow-2xl' : 'relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl'}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalVideo(null)}
              className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            {modalVideo.type === 'cloudinary' ? (
              <video
                src={modalVideo.url}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={getYouTubeEmbedUrl(modalVideo.url, true) ?? undefined}
                title="Vídeo do YouTube"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
