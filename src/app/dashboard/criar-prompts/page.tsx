'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { CloudinaryVideoUploader } from '@/components/ui/CloudinaryVideoUploader'
import { Plus, Trash2, Save, MessageSquare, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { createClient } from '@/lib/supabase/client'
import { getCreditsConfigKey, type CreditActionId } from '@/lib/credits'
import type { CreditsConfig } from '@/lib/credits'
import type { CreationPromptItem, CreationTabId, InputStructureId } from '@/types/creation-prompts'
import { INPUT_STRUCTURES } from '@/types/creation-prompts'

const CREDIT_ACTION_LABELS: Record<CreditActionId, string> = {
  foto: 'Criação de Foto',
  video: 'Criação de Vídeo',
  roteiro: 'Vídeo com Roteiro',
  vangogh: 'Criação de prompts',
}
const DEFAULT_COST_BY_ACTION: Record<CreditActionId, number> = {
  foto: 5,
  video: 10,
  roteiro: 15,
  vangogh: 5,
}

const TAB_OPTIONS: { value: CreationTabId; label: string }[] = [
  { value: 'foto', label: 'Criação de Foto' },
  { value: 'video', label: 'Criação de Vídeo' },
  { value: 'roteiro', label: 'Vídeo com Roteiro' },
  { value: 'vangogh', label: 'Criação de prompts' },
]

type InternalTab = 'prompts' | 'chats_gerais'

export default function CriarPromptsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prompts, setPrompts] = useState<CreationPromptItem[]>([])
  const [galleryUseCreationPrompts, setGalleryUseCreationPrompts] = useState(false)
  const [internalTab, setInternalTab] = useState<InternalTab>('prompts')
  const [costByActionGeneral, setCostByActionGeneral] = useState<Record<CreditActionId, number>>({ ...DEFAULT_COST_BY_ACTION })
  const promptsRef = useRef<CreationPromptItem[]>([])
  promptsRef.current = prompts

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (internalTab !== 'chats_gerais') return
    const supabase = createClient() as any
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle()
      .then(({ data }: { data: { value: CreditsConfig } | null }) => {
        const config = data?.value
        if (config?.costByAction) {
          setCostByActionGeneral((prev) => ({ ...prev, ...config.costByAction }))
        }
      })
      .catch(() => {})
  }, [internalTab])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getSiteSettings()
      const content = data?.homepage_content ?? {}
      const raw = Array.isArray(content.creation_prompts) ? content.creation_prompts : []
      setPrompts(raw.map((p: any) => ({
        ...p,
        coverImage: p.coverImage ?? '',
        coverVideo: p.coverVideo && String(p.coverVideo).trim() ? p.coverVideo : undefined,
      })))
      setGalleryUseCreationPrompts(content.gallery_use_creation_prompts === true)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: current } = await getSiteSettings()
      const currentContent = current?.homepage_content ?? {}
      const updatedContent = {
        ...currentContent,
        creation_prompts: prompts,
        gallery_use_creation_prompts: galleryUseCreationPrompts,
      }
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: { homepage_content: updatedContent },
        forceUpdate: true,
      })
      if (!success) throw new Error(error?.message)
      toast.success('Prompts de criação salvos. A galeria da homepage espelhará estes cards quando a opção estiver ativa.')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  /** Salva uma cópia atualizada dos prompts no servidor (usado após upload/remoção de capa para persistir sem clicar em Salvar). */
  const savePromptsToServer = async (newPrompts: CreationPromptItem[]) => {
    setSaving(true)
    try {
      const { data: current } = await getSiteSettings()
      const currentContent = current?.homepage_content ?? {}
      const toSave = newPrompts.map((p) => ({
        ...p,
        coverVideo: p.coverVideo && String(p.coverVideo).trim() ? p.coverVideo : undefined,
      }))
      const updatedContent = {
        ...currentContent,
        creation_prompts: toSave,
        gallery_use_creation_prompts: galleryUseCreationPrompts,
      }
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: { homepage_content: updatedContent },
        forceUpdate: true,
      })
      if (!success) throw new Error(error?.message)
      toast.success('Capa atualizada e salva.')
      promptsRef.current = toSave
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const addPrompt = () => {
    setPrompts((prev) => [
      ...prev,
      {
        id: `prompt-${Date.now()}`,
        tabId: 'foto',
        title: 'Novo prompt',
        subtitle: '',
        coverImage: '',
        prompt: '',
        inputStructure: 'text_only',
        creditCost: 5,
        order: prev.length,
      },
    ])
  }

  const removePrompt = (index: number) => {
    setPrompts((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePrompt = (index: number, updates: Partial<CreationPromptItem>) => {
    setPrompts((prev) => {
      const u = [...prev]
      u[index] = { ...u[index], ...updates }
      return u
    })
  }

  const saveCreditsConfig = async () => {
    setSaving(true)
    try {
      const supabase = createClient() as any
      const { data: current } = await supabase.from('site_settings').select('value').eq('key', getCreditsConfigKey()).maybeSingle()
      const existing: CreditsConfig = (current?.value as CreditsConfig) ?? {}
      const value: CreditsConfig = {
        ...existing,
        costByAction: { ...costByActionGeneral },
      }
      const { error } = await supabase.from('site_settings').upsert(
        { key: getCreditsConfigKey(), value, description: 'Créditos IA: custo por tipo de criação (chats gerais)', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      if (error) throw error
      toast.success('Custos dos chats gerais salvos.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <DashboardNavigation
          title="Prompts de Criação (Criar com IA)"
          subtitle="Prompts por efeito e custos dos chats gerais"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
        />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInternalTab('prompts')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${internalTab === 'prompts' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <LayoutGrid className="h-4 w-4" />
                Prompts (por efeito)
              </button>
              <button
                type="button"
                onClick={() => setInternalTab('chats_gerais')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${internalTab === 'chats_gerais' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <MessageSquare className="h-4 w-4" />
                Chats gerais
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/homepage" className="text-sm text-gray-500 hover:text-gray-700 underline">
                Editar Homepage (ativar espelhamento na galeria)
              </Link>
              {internalTab === 'prompts' && (
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save size={18} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
              {internalTab === 'chats_gerais' && (
                <Button onClick={saveCreditsConfig} disabled={saving} className="gap-2">
                  <Save size={18} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
            </div>
          </div>

          {internalTab === 'chats_gerais' && (
            <div className="border-t pt-6 space-y-4">
              <p className="text-sm text-gray-600">
                Custo em créditos para cada tipo de <strong>chat geral</strong> na página Criar (quando o usuário não escolhe um prompt específico e digita livremente). Esses valores aparecem no botão &quot;Gerar&quot; e são descontados ao gerar. Os mesmos custos são usados em Planos de Assinatura para créditos mensais.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                {(['foto', 'video', 'roteiro', 'vangogh'] as CreditActionId[]).map((actionId) => (
                  <div key={actionId} className="flex items-center gap-3">
                    <label className="flex-1 text-sm font-medium text-gray-700">{CREDIT_ACTION_LABELS[actionId]}</label>
                    <Input
                      type="number"
                      min={1}
                      value={String(costByActionGeneral[actionId] ?? DEFAULT_COST_BY_ACTION[actionId])}
                      onChange={(e) => setCostByActionGeneral((prev) => ({ ...prev, [actionId]: parseInt(e.target.value, 10) || 1 }))}
                      className="w-20"
                    />
                    <span className="text-xs text-gray-500">créditos</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {internalTab === 'prompts' && (
            <>
          <div>
            <p className="text-sm text-gray-600">
              Cada prompt vira um card na página <strong>Criar com IA</strong> (por aba) e, se a galeria espelhar, também no carrossel da homepage. Título, subtítulo, imagem ou vídeo de referência e o prompt (oculto) são espelhados corretamente; ao clicar, o usuário é levado à geração com a ref e o prompt aplicados.
            </p>
          </div>

          <Switch
            label="Espelhar galeria da homepage nestes prompts"
            checked={galleryUseCreationPrompts}
            onCheckedChange={setGalleryUseCreationPrompts}
          />
          <p className="text-sm text-gray-500 -mt-2">
            Quando ativo, o carrossel da homepage exibe automaticamente os cards destes prompts (título, subtítulo, foto/vídeo de referência e link para a página Criar). Configure título e visibilidade da seção em Editar Homepage.
          </p>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Prompts de criação ({prompts.length})</h2>
              <Button type="button" onClick={addPrompt} variant="outline" className="gap-1.5">
                <Plus size={16} />
                Adicionar prompt
              </Button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {prompts.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePrompt(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Aba (Criar com IA)</label>
                      <select
                        value={item.tabId}
                        onChange={(e) => updatePrompt(index, { tabId: e.target.value as CreationTabId })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        {TAB_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Título"
                      value={item.title}
                      onChange={(e) => updatePrompt(index, { title: e.target.value })}
                      placeholder="Ex: Retrato em 4K"
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Subtítulo"
                        value={item.subtitle}
                        onChange={(e) => updatePrompt(index, { subtitle: e.target.value })}
                        placeholder="Breve descrição do card (espelhado no carrossel)"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Capa do card (imagem ou vídeo — espelhado na galeria e na página Criar)</label>
                      <p className="text-xs text-gray-500 mb-1.5">Pode enviar só a imagem, só o vídeo ou os dois. Se enviar só o vídeo, a capa será o próprio vídeo (primeiro frame). As alterações são salvas automaticamente.</p>
                      <ImageUploader
                        value={item.coverImage}
                        onChange={(url) => {
                          const current = promptsRef.current
                          const next = current.map((p, i) => i === index ? { ...p, coverImage: url } : p)
                          setPrompts(next)
                          savePromptsToServer(next)
                        }}
                        placeholder="Imagem de destaque (opcional se tiver vídeo)"
                        cropType="banner"
                        aspectRatio={16 / 9}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Vídeo de capa (opcional — se não tiver imagem, a capa será o vídeo)</label>
                      <CloudinaryVideoUploader
                        inputId={`video-cap-${item.id}`}
                        value={item.coverVideo || ''}
                        onChange={(url) => {
                          const current = promptsRef.current
                          const next = current.map((p, i) =>
                            i === index ? { ...p, coverVideo: url && url.trim() ? url : undefined } : p
                          )
                          setPrompts(next)
                          savePromptsToServer(next)
                        }}
                        placeholder="Vídeo para card (opcional)"
                        folder="gallery-videos"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Prompt (oculto do cliente — enviado à IA)</label>
                      <textarea
                        value={item.prompt}
                        onChange={(e) => updatePrompt(index, { prompt: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        placeholder="Instrução que a IA receberá para gerar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Estrutura de entrada</label>
                      <select
                        value={item.inputStructure}
                        onChange={(e) => updatePrompt(index, { inputStructure: e.target.value as InputStructureId })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        {INPUT_STRUCTURES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Créditos"
                      type="number"
                      min={1}
                      value={String(item.creditCost)}
                      onChange={(e) => updatePrompt(index, { creditCost: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
