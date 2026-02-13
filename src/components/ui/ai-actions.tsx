'use client'

import Image from 'next/image'
import {
  CopyIcon,
  RefreshCcwIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react'
import { Action, Actions } from '@/components/ui/actions'
import {
  Conversation,
  ConversationContent,
} from '@/components/ui/conversation'
import { Message, MessageContent } from '@/components/ui/message'

export type ChatMessage = {
  id: string
  from: 'user' | 'assistant'
  content: string
  avatar?: string
  name?: string
  /** Imagem gerada (data URL ou URL) para exibir na mensagem do assistente */
  imageDataUrl?: string
  /** Vídeo gerado (data URL ou URL) para exibir na mensagem do assistente */
  videoDataUrl?: string
  /** Prompt usado na geração; quando preenchido, exibe "Gerar novamente" com custo */
  regeneratePrompt?: string
  /** Custo em créditos para "Gerar novamente" (ex.: custo do prompt de card); se não definido, usa o custo da aba */
  regenerateCreditCost?: number
}

const DEFAULT_ACTIONS = [
  { icon: RefreshCcwIcon, label: 'Repetir' },
  { icon: ThumbsUpIcon, label: 'Curtir' },
  { icon: ThumbsDownIcon, label: 'Não curtir' },
  { icon: CopyIcon, label: 'Copiar' },
  { icon: ShareIcon, label: 'Compartilhar' },
]

export type ChatWithActionsProps = {
  messages: ChatMessage[]
  onAction?: (messageId: string, action: string) => void
  /** Custo padrão em créditos para "Gerar novamente" (custo da aba atual) */
  defaultRegenerateCost?: number
  /** Chamado ao clicar em "Gerar novamente"; descontar créditos e substituir o resultado */
  onRegenerate?: (messageId: string) => void
  /** true enquanto uma regeneração está em andamento (ex.: desabilitar botão) */
  regenerating?: boolean
  className?: string
}

export function ChatWithActions({
  messages,
  onAction,
  defaultRegenerateCost,
  onRegenerate,
  regenerating,
  className,
}: ChatWithActionsProps) {
  return (
    <div className={className}>
      <Conversation className="relative w-full">
        <ConversationContent>
          {messages.map((message) => (
            <Message
              className={`flex flex-col gap-2 ${message.from === 'assistant' ? 'items-start' : 'items-end'}`}
              from={message.from}
              key={message.id}
            >
              {message.avatar ? (
                <Image
                  src={message.avatar}
                  alt={message.name ?? ''}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                  unoptimized={message.avatar.startsWith('http')}
                />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  aria-hidden
                >
                  {message.from === 'user' ? (
                    <span className="text-xs font-medium">V</span>
                  ) : (
                    <span className="text-xs font-medium">IA</span>
                  )}
                </div>
              )}
              <MessageContent>
                {message.content ? <span>{message.content}</span> : null}
                {message.from === 'assistant' && message.imageDataUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.imageDataUrl}
                      alt="Imagem gerada"
                      className="max-h-[400px] w-auto object-contain"
                    />
                  </div>
                )}
                {message.from === 'assistant' && message.videoDataUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden max-w-full">
                    <video
                      src={message.videoDataUrl}
                      controls
                      className="max-h-[400px] w-auto"
                      playsInline
                    />
                  </div>
                )}
              </MessageContent>
              {message.from === 'assistant' && (
                <Actions className="mt-2 flex flex-wrap gap-2">
                  {message.regeneratePrompt != null && onRegenerate && (
                    <Action
                      label={`Gerar novamente · ${message.regenerateCreditCost ?? defaultRegenerateCost ?? 0} créditos`}
                      onClick={() => onRegenerate(message.id)}
                      disabled={regenerating}
                    >
                      <RefreshCcwIcon className="size-4" />
                    </Action>
                  )}
                  {DEFAULT_ACTIONS.map((action) => (
                    <Action
                      key={action.label}
                      label={action.label}
                      onClick={() => onAction?.(message.id, action.label)}
                    >
                      <action.icon className="size-4" />
                    </Action>
                  ))}
                </Actions>
              )}
            </Message>
          ))}
        </ConversationContent>
      </Conversation>
    </div>
  )
}
