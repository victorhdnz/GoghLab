'use client'

import { ArrowRight, Bot, Check, ChevronDown, Paperclip, Zap } from 'lucide-react'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassButton } from '@/components/ui/glass-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return
      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }
      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      )
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) textarea.style.height = `${minHeight}px`
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

const OPENAI_ICON = (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 256 260"
      aria-label="OpenAI"
      className="h-4 w-4 dark:hidden block"
    >
      <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 256 260"
      aria-label="OpenAI"
      className="h-4 w-4 hidden dark:block"
    >
      <path
        fill="#fff"
        d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
      />
    </svg>
  </>
)

const AI_MODELS = [
  'o3-mini',
  'Gemini 2.5 Flash',
  'Claude 3.5 Sonnet',
  'GPT-4-1 Mini',
  'GPT-4-1',
]

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'o3-mini': OPENAI_ICON,
  'Gemini 2.5 Flash': (
    <svg height="1em" className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-fill" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
          <stop offset="0%" stopColor="#1C7DFF" />
          <stop offset="52.021%" stopColor="#1C69FF" />
          <stop offset="100%" stopColor="#F0DCD6" />
        </linearGradient>
      </defs>
      <path
        d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12"
        fill="url(#gemini-fill)"
        fillRule="nonzero"
      />
    </svg>
  ),
  'Claude 3.5 Sonnet': (
    <>
      <svg fill="#000" fillRule="evenodd" className="h-4 w-4 dark:hidden block" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
      </svg>
      <svg fill="#fff" fillRule="evenodd" className="h-4 w-4 hidden dark:block" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
      </svg>
    </>
  ),
  'GPT-4-1 Mini': OPENAI_ICON,
  'GPT-4-1': OPENAI_ICON,
}

export interface CreationAIModelOption {
  id: string
  name: string
  logo_url: string | null
}

export interface AI_PromptProps {
  placeholder?: string
  onSend?: (message: string, model: string) => void
  className?: string
  /** Valor inicial (ex.: prompt vindo da homepage "Testar e criar") */
  initialValue?: string
  /** Custo em créditos para exibir no botão Gerar (ex.: 5) */
  creditCost?: number | null
  /** Quando "gerar": área de texto + seletor de modelo (se models passado) + botão "Gerar · X créditos" abaixo */
  variant?: 'default' | 'gerar'
  /** Modelos do dashboard (filtrados por aba); quando passado, o dropdown usa esta lista e mostra logo */
  models?: CreationAIModelOption[]
  /** ID do modelo selecionado (controlado pelo pai quando models é passado) */
  selectedModelId?: string
  /** Callback quando o usuário troca o modelo (quando models é passado) */
  onModelChange?: (modelId: string) => void
}

export function AI_Prompt({
  placeholder = 'O que posso criar para você?',
  onSend,
  className,
  initialValue,
  creditCost,
  variant = 'default',
  models: propsModels,
  selectedModelId: propsSelectedModelId,
  onModelChange,
}: AI_PromptProps) {
  const [value, setValue] = useState(initialValue ?? '')
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 72, maxHeight: 300 })
  const [selectedModel, setSelectedModel] = useState('GPT-4-1 Mini')
  const useControlledModels = Array.isArray(propsModels) && propsModels.length > 0
  const selectedId = useControlledModels ? (propsSelectedModelId ?? propsModels[0]?.id ?? '') : selectedModel
  const displayModels = useControlledModels ? propsModels : AI_MODELS.map((name) => ({ id: name, name, logo_url: null as string | null }))
  const selectedOption = displayModels.find((m) => m.id === selectedId) ?? displayModels[0]
  const showModelBar = !useControlledModels ? !(variant === 'gerar') : true

  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue)
      adjustHeight()
    }
  }, [initialValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault()
      onSend?.(value.trim(), selectedId)
      setValue('')
      adjustHeight(true)
    }
  }

  const handleSend = () => {
    if (!value.trim()) return
    onSend?.(value.trim(), selectedId)
    setValue('')
    adjustHeight(true)
  }

  const isGerarVariant = variant === 'gerar'
  const selectModel = (idOrName: string) => {
    if (useControlledModels) {
      onModelChange?.(idOrName)
    } else {
      setSelectedModel(idOrName)
    }
  }

  return (
    <div className={cn('w-full max-w-2xl py-4', className)}>
      <div className={cn('rounded-2xl bg-black/5 p-1.5 dark:bg-white/5', isGerarVariant && 'rounded-b-2xl')}>
        <div className="relative flex flex-col">
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            <Textarea
              value={value}
              placeholder={placeholder}
              className={cn(
                'min-h-[72px] w-full resize-none border-none bg-black/5 px-4 py-3 placeholder:text-black/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70',
                showModelBar ? 'rounded-xl rounded-b-none' : 'rounded-xl'
              )}
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setValue(e.target.value)
                adjustHeight()
              }}
            />
          </div>
          {showModelBar && (
            <div className="flex h-14 items-center rounded-b-xl bg-black/5 dark:bg-white/5">
              <div className="flex w-[calc(100%-24px)] items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 gap-1 rounded-md pl-1 pr-2 text-xs focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 hover:bg-black/10 dark:hover:bg-white/10 dark:text-white"
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={selectedId}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            {selectedOption && 'logo_url' in selectedOption && selectedOption.logo_url ? (
                              <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded">
                                <Image src={selectedOption.logo_url} alt="" width={16} height={16} className="object-contain" />
                              </span>
                            ) : useControlledModels ? (
                              <Bot className="h-4 w-4 opacity-70" />
                            ) : (
                              MODEL_ICONS[selectedOption?.name ?? '']
                            )}
                            <span className="truncate max-w-[120px]">{selectedOption?.name ?? selectedId}</span>
                            <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        'min-w-[10rem] border-black/10 dark:border-white/10',
                        'bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800'
                      )}
                    >
                      {displayModels.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onSelect={() => selectModel(model.id)}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {'logo_url' in model && model.logo_url ? (
                              <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded">
                                <Image src={model.logo_url} alt="" width={16} height={16} className="object-contain" />
                              </span>
                            ) : (
                              <Bot className="h-4 w-4 opacity-50" />
                            )}
                            <span>{model.name}</span>
                          </div>
                          {selectedId === model.id && <Check className="h-4 w-4 text-blue-500" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/10" />
                  <label
                    className={cn(
                      'cursor-pointer rounded-lg bg-black/5 p-2 hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:bg-white/5 dark:hover:bg-white/10',
                      'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white'
                    )}
                    aria-label="Anexar arquivo"
                  >
                    <input type="file" className="hidden" />
                    <Paperclip className="h-4 w-4 transition-colors" />
                  </label>
                </div>
                {!isGerarVariant && (
                  creditCost != null ? (
                    <GlassButton
                      size="sm"
                      contentClassName="flex items-center gap-1.5"
                      aria-label={`Gerar (${creditCost} créditos)`}
                      disabled={!value.trim()}
                      onClick={handleSend}
                    >
                      <span>Gerar</span>
                      <Zap className="h-3.5 w-3.5" />
                      <span className="opacity-90">{creditCost} créditos</span>
                    </GlassButton>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0',
                        value.trim()
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground'
                          : 'bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40 cursor-not-allowed'
                      )}
                      aria-label="Enviar"
                      disabled={!value.trim()}
                      onClick={handleSend}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {isGerarVariant && (
        <div className="mt-3 flex justify-end">
          <GlassButton
            size="default"
            contentClassName="flex items-center gap-2"
            disabled={!value.trim()}
            onClick={handleSend}
          >
            <span>{creditCost != null ? `Gerar · ${creditCost} créditos` : 'Gerar'}</span>
            <Zap className="h-5 w-5" />
          </GlassButton>
        </div>
      )}
    </div>
  )
}
