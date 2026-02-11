'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImageIcon, Coins, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCredits } from '@/hooks/useCredits'
import { AI_Prompt } from '@/components/ui/animated-ai-input'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { ChatWithActions, type ChatMessage } from '@/components/ui/ai-actions'
import { Button } from '@/components/ui/button'
import type { CreationPromptItem, CreationTabId } from '@/types/creation-prompts'

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

  const activeTab: TabId = selectedPrompt?.tabId ?? (tabFromUrl && ['foto', 'video', 'roteiro', 'vangogh'].includes(tabFromUrl) ? tabFromUrl : 'foto')

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
        router.push('/login?redirect=' + encodeURIComponent('/criar/gerar'))
        return
      }
      if (!hasActiveSubscription) {
        router.push('/precos')
        return
      }
      const result = await deduct(activeTab)
      if (!result.ok && result.code === 'insufficient_credits') {
        setShowCreditModal(true)
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
        router.push('/login?redirect=' + encodeURIComponent('/criar/gerar'))
        return
      }
      if (!hasActiveSubscription) {
        router.push('/precos')
        return
      }
      const result = await deduct(activeTab)
      if (!result.ok && result.code === 'insufficient_credits') {
        setShowCreditModal(true)
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
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-3 border-b flex items-center gap-2">
            <span className="font-medium text-sm sm:text-base">{selectedPrompt.title}</span>
          </div>
          <div className="p-4 space-y-4">
            {selectedPrompt.coverImage && (
              <div className="relative aspect-video max-h-[200px] sm:max-h-[260px] md:max-h-[320px] rounded-lg overflow-hidden bg-muted/50">
                <Image src={selectedPrompt.coverImage} alt="" fill className="object-contain" sizes="(max-width: 768px) 100vw, 800px" />
              </div>
            )}
            {selectedPrompt.coverVideo && !selectedPrompt.coverImage && (
              <div className="relative aspect-video max-h-[200px] sm:max-h-[260px] md:max-h-[320px] rounded-lg overflow-hidden bg-muted/50">
                <video src={selectedPrompt.coverVideo} className="w-full h-full object-contain" controls muted playsInline />
              </div>
            )}
            {(selectedPrompt.inputStructure === 'image_only' || selectedPrompt.inputStructure === 'image_and_video' || selectedPrompt.inputStructure === 'motion_video_and_character_photo') && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedPrompt.inputStructure === 'motion_video_and_character_photo' ? 'Foto do personagem' : 'Envie uma imagem'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPromptViewFiles((f) => ({ ...f, characterImage: e.target.files?.[0] ?? f.characterImage, image: e.target.files?.[0] ?? f.image }))}
                  className="block w-full text-sm text-muted-foreground file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border file:border-input file:text-sm"
                />
              </div>
            )}
            {(selectedPrompt.inputStructure === 'video_only' || selectedPrompt.inputStructure === 'image_and_video' || selectedPrompt.inputStructure === 'motion_video_and_character_photo') && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedPrompt.inputStructure === 'motion_video_and_character_photo' ? 'Vídeo de movimento (referência)' : 'Envie um vídeo'}
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setPromptViewFiles((f) => ({ ...f, motionVideo: e.target.files?.[0] ?? f.motionVideo, video: e.target.files?.[0] ?? f.video }))}
                  className="block w-full text-sm text-muted-foreground file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border file:border-input file:text-sm"
                />
              </div>
            )}
          </div>
          <div className="p-4 border-t flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Custo: {selectedPrompt.creditCost} créditos</span>
            <Button onClick={() => handleGenerateWithPrompt(selectedPrompt)} className="gap-2">
              <Zap className="h-4 w-4" />
              Gerar · {selectedPrompt.creditCost} créditos
            </Button>
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
            placeholder={PLACEHOLDERS[activeTab]}
            onSend={handleSend}
            initialValue={selectedPrompt?.inputStructure === 'text_only' ? selectedPrompt.prompt : promptFromUrl}
            creditCost={costByAction?.[activeTab] ?? null}
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
