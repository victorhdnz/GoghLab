'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImageIcon, Video, FileText, Palette, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCredits } from '@/hooks/useCredits'
import { cn } from '@/lib/utils'
import type { CreationPromptItem, CreationTabId } from '@/types/creation-prompts'

const TABS = [
  { id: 'foto', label: 'Foto', icon: ImageIcon },
  { id: 'video', label: 'Vídeo', icon: Video },
  { id: 'roteiro', label: 'Roteiro', icon: FileText },
  { id: 'vangogh', label: 'Criação de prompts', icon: Palette },
] as const

type TabId = (typeof TABS)[number]['id']

export default function CriarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, hasActiveSubscription, loading } = useAuth()
  const { balance } = useCredits()
  const [activeTab, setActiveTab] = useState<TabId>('foto')
  const [creationPrompts, setCreationPrompts] = useState<CreationPromptItem[]>([])

  const promptIdFromUrl = searchParams.get('promptId')
  const tabFromUrl = searchParams.get('tab') as TabId | null

  // Se vier da galeria com promptId/tab, redireciona para a página de geração
  useEffect(() => {
    if (promptIdFromUrl && tabFromUrl) {
      router.replace(`/criar/gerar?promptId=${encodeURIComponent(promptIdFromUrl)}&tab=${encodeURIComponent(tabFromUrl)}`)
      return
    }
  }, [promptIdFromUrl, tabFromUrl, router])

  useEffect(() => {
    fetch('/api/creation-prompts')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.creation_prompts)) setCreationPrompts(data.creation_prompts)
      })
      .catch(() => {})
  }, [])

  const promptsForTab = useMemo(
    () => creationPrompts.filter((p) => p.tabId === activeTab).sort((a, b) => a.order - b.order),
    [creationPrompts, activeTab]
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
      <h1 className="text-lg sm:text-xl font-bold mb-4">Crie com IA</h1>
      {/* Abas: tudo junto, filtrar por foto / vídeo / roteiro / criação de prompts */}
      <div className="mb-4 sm:mb-6 flex flex-wrap gap-1.5 rounded-xl border bg-background p-1.5 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Créditos (discreto) */}
      {isAuthenticated && hasActiveSubscription && balance != null && (
        <p className="mb-3 text-xs text-muted-foreground">
          Créditos deste mês: <strong>{balance}</strong>
        </p>
      )}

      {/* Grid só de cards: capa, título, subtítulo. Clique abre nova página para criar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/criar/gerar"
          className="rounded-xl border-2 border-border bg-card text-left overflow-hidden transition-all hover:shadow-md hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <div className="aspect-video bg-muted/50 flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="p-3">
            <p className="font-medium text-sm">Chat geral</p>
            <p className="text-xs text-muted-foreground">Descreva livremente e crie</p>
          </div>
        </Link>
        {promptsForTab.map((p) => (
          <Link
            key={p.id}
            href={`/criar/gerar?promptId=${encodeURIComponent(p.id)}&tab=${encodeURIComponent(p.tabId)}`}
            className="rounded-xl border-2 border-border bg-card text-left overflow-hidden transition-all hover:shadow-md hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <div className="aspect-video bg-muted/50 relative">
              {p.coverVideo ? (
                <video src={p.coverVideo} className="w-full h-full object-cover" muted playsInline />
              ) : p.coverImage ? (
                <Image src={p.coverImage} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 220px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-medium text-sm line-clamp-1">{p.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
