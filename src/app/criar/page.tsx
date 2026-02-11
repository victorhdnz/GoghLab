'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImageIcon, Video, FileText, MessageSquare, Palette, Coins } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCredits } from '@/hooks/useCredits'
import { AI_Prompt } from '@/components/ui/animated-ai-input'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { ChatWithActions, type ChatMessage } from '@/components/ui/ai-actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'foto', label: 'Criação de Foto', icon: ImageIcon },
  { id: 'video', label: 'Criação de Vídeo', icon: Video },
  { id: 'roteiro', label: 'Vídeo com Roteiro', icon: FileText },
  { id: 'prompts', label: 'Prompts para IAs', icon: MessageSquare },
  { id: 'vangogh', label: 'Van Gogh', icon: Palette },
] as const

type TabId = (typeof TABS)[number]['id']

const PLACEHOLDERS: Record<TabId, string> = {
  foto: 'Descreva a imagem ou foto que deseja criar...',
  video: 'Descreva o vídeo ou cena que deseja gerar...',
  roteiro: 'Conte a história: ideias de takes, falas e estrutura de roteiro completa para produção de vídeo...',
  prompts: 'Descreva o que precisa: prompts para usar em todas as IAs...',
  vangogh: 'Descreva no estilo Van Gogh o que deseja criar...',
}

export default function CriarPage() {
  const router = useRouter()
  const { isAuthenticated, hasActiveSubscription, loading } = useAuth()
  const { balance, costByAction, loading: creditsLoading, deduct, refetch: refetchCredits } = useCredits()
  const [activeTab, setActiveTab] = useState<TabId>('foto')
  const [generating, setGenerating] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showCreditModal, setShowCreditModal] = useState(false)

  const handleSend = useCallback(
    async (message: string, model: string) => {
      if (!isAuthenticated) {
        router.push('/login?redirect=' + encodeURIComponent('/criar'))
        return
      }
      // Sem assinatura: redirecionar direto para a página de planos (sem modal)
      if (!hasActiveSubscription) {
        router.push('/precos')
        return
      }

      const result = await deduct(activeTab)
      if (!result.ok && result.code === 'insufficient_credits') {
        setShowCreditModal(true)
        return
      }
      if (!result.ok) {
        return
      }

      const userMsg: ChatMessage = {
        id: 'u-' + Date.now(),
        from: 'user',
        content: message,
      }
      setMessages((prev) => [...prev, userMsg])
      setGenerating(true)

      // TODO: chamar API por tipo (imagem, vídeo, etc.) e usar resposta real
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: 'a-' + Date.now(),
          from: 'assistant',
          content: `Em breve o resultado para "${message.slice(0, 40)}..." aparecerá aqui. (Simulação – integre sua API.)`,
        }
        setMessages((prev) => [...prev, assistantMsg])
        setGenerating(false)
      }, 2000)
    },
    [isAuthenticated, hasActiveSubscription, router, activeTab, deduct]
  )

  const handleAction = useCallback((messageId: string, action: string) => {
    if (action === 'Copiar') {
      const msg = messages.find((m) => m.id === messageId)
      if (msg?.content) {
        navigator.clipboard.writeText(msg.content)
      }
    }
    if (action === 'Repetir') {
      // TODO: reenviar última mensagem do usuário para regenerar
    }
  }, [messages])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Criar com IA</h1>
      <p className="text-muted-foreground mb-8">
        Escolha o tipo de criação e descreva o que deseja. Nossa IA gera imagens, vídeos, roteiros, prompts e criações no estilo Van Gogh.
        {!isAuthenticated && (
          <span className="block mt-2 text-sm">
            Você pode explorar a interface; ao enviar um pedido, será redirecionado para fazer login.
          </span>
        )}
        {isAuthenticated && !hasActiveSubscription && (
          <span className="block mt-2 text-sm">
            Você pode ver o chat e os modelos. Ao clicar para enviar/criar, será redirecionado diretamente à seção de planos — é necessário ter um plano para usar.
          </span>
        )}
        {isAuthenticated && hasActiveSubscription && balance !== null && (
          <span className="block mt-2 text-sm">
            Créditos deste mês: <strong>{balance}</strong>
            {costByAction && (
              <> · Esta criação usa <strong>{costByAction[activeTab]} créditos</strong></>
            )}
          </span>
        )}
      </p>

      {/* Modal: créditos do mês acabaram */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-background border rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold">Créditos do mês acabaram</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Seus créditos para este mês acabaram. Você pode comprar mais créditos na área de uso da sua conta ou aguardar a renovação mensal do seu plano.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCreditModal(false)}>
                Fechar
              </Button>
              <Link href="/conta#usage">
                <Button onClick={() => setShowCreditModal(false)}>
                  Ver uso e comprar créditos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-background p-1.5 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Chat com mensagens e AI Actions */}
      {messages.length > 0 && (
        <div className="mb-6 max-h-[420px] overflow-y-auto rounded-xl border bg-muted/20">
          <ChatWithActions messages={messages} onAction={handleAction} />
        </div>
      )}

      {/* Área do input de IA */}
      <AI_Prompt
        placeholder={PLACEHOLDERS[activeTab]}
        onSend={handleSend}
      />

      {/* Estado "Gerando..." */}
      {generating && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
          <TextShimmer duration={1} className="font-mono text-sm">
            Gerando...
          </TextShimmer>
        </div>
      )}

      {/* Área de resultado (placeholder quando não há mensagens) */}
      {messages.length === 0 && !generating && (
        <div className="mt-8 rounded-xl border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
          O resultado aparecerá aqui após a geração.
        </div>
      )}
    </div>
  )
}
