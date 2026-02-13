'use client'

import Image from 'next/image'
import { CopyIcon, RefreshCcwIcon } from 'lucide-react'
import { Action, Actions } from '@/components/ui/actions'

/** Exibe texto da IA com parágrafos e quebras de linha; emojis carregam normalmente (fonte com suporte). */
function FormattedMessageContent({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean)
  if (paragraphs.length <= 1 && !content.includes('\n')) {
    return (
      <span className="break-words" style={{ fontFamily: 'inherit, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"' }}>
        {content}
      </span>
    )
  }
  return (
    <div
      className="space-y-3 text-[15px] leading-relaxed break-words"
      style={{ fontFamily: 'inherit, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"' }}
    >
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-line first:mt-0 last:mb-0">
          {para.trim()}
        </p>
      ))}
    </div>
  )
}
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
  /** Logo do modelo usado na resposta (dashboard); exibido ao lado da mensagem do assistente */
  modelLogoUrl?: string
  /** Imagem gerada (data URL ou URL) para exibir na mensagem do assistente */
  imageDataUrl?: string
  /** Vídeo gerado (data URL ou URL) para exibir na mensagem do assistente */
  videoDataUrl?: string
  /** Prompt usado na geração; quando preenchido, exibe "Gerar novamente" com custo */
  regeneratePrompt?: string
  /** Custo em créditos para "Gerar novamente" (ex.: custo do prompt de card); se não definido, usa o custo da aba */
  regenerateCreditCost?: number
}

const DEFAULT_ACTIONS = [{ icon: CopyIcon, label: 'Copiar' }]

export type ChatWithActionsProps = {
  messages: ChatMessage[]
  onAction?: (messageId: string, action: string) => void
  /** Logo da empresa (ex.: site_logo); exibida ao lado das mensagens do usuário para todos */
  userAvatarUrl?: string
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
  userAvatarUrl,
  defaultRegenerateCost,
  onRegenerate,
  regenerating,
  className,
}: ChatWithActionsProps) {
  return (
    <div className={className}>
      <Conversation className="relative w-full">
        <ConversationContent>
          {messages.map((message) => {
            const userLogo = message.from === 'user' ? (message.avatar ?? userAvatarUrl) : undefined
            const assistantLogo = message.from === 'assistant' ? (message.modelLogoUrl ?? message.avatar) : undefined
            const showUserLogo = userLogo && message.from === 'user'
            const showAssistantLogo = assistantLogo && message.from === 'assistant'
            return (
            <Message
              className={`flex flex-col gap-2 ${message.from === 'assistant' ? 'items-start' : 'items-end'}`}
              from={message.from}
              key={message.id}
            >
              {showUserLogo ? (
                <Image
                  src={userLogo}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-full object-contain bg-muted"
                  unoptimized={userLogo.startsWith('http')}
                />
              ) : showAssistantLogo ? (
                <Image
                  src={assistantLogo}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-full object-contain bg-muted"
                  unoptimized={assistantLogo.startsWith('http')}
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
                {message.content ? (
                  <FormattedMessageContent content={message.content} />
                ) : null}
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
          )})}
        </ConversationContent>
      </Conversation>
    </div>
  )
}
