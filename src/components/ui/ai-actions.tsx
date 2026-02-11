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
  className?: string
}

export function ChatWithActions({
  messages,
  onAction,
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
              <MessageContent>{message.content}</MessageContent>
              {message.from === 'assistant' && (
                <Actions className="mt-2">
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
