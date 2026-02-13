'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { Plus, Trash2, Save, MessageSquare, LayoutGrid, Bot } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { createClient } from '@/lib/supabase/client'
import { getCreditsConfigKey, type CreditActionId } from '@/lib/credits'
import type { CreditsConfig } from '@/lib/credits'
import type { CreationPromptItem, CreationTabId, InputStructureId } from '@/types/creation-prompts'
import { INPUT_STRUCTURES } from '@/types/creation-prompts'

const CREDIT_ACTION_LABELS: Record<CreditActionId, string> = {
  foto: 'Foto',
  video: 'Vídeo',
  roteiro: 'Roteiro de Vídeos',
  prompts: 'Prompts',
}
const DEFAULT_COST_BY_ACTION: Record<CreditActionId, number> = {
  foto: 5,
  video: 10,
  roteiro: 15,
  prompts: 5,
}

const TAB_OPTIONS: { value: CreationTabId; label: string }[] = [
  { value: 'foto', label: 'Foto' },
  { value: 'video', label: 'Vídeo' },
  { value: 'roteiro', label: 'Roteiro de Vídeos' },
  { value: 'prompts', label: 'Prompts' },
]

type InternalTab = 'prompts' | 'chats_gerais' | 'modelos_ia'

export interface CreationAIModelRow {
  id: string
  name: string
  logo_url: string | null
  can_image: boolean
  can_video: boolean
  can_roteiro: boolean
  can_prompt: boolean
  is_active: boolean
  order_position: number
  model_key?: string | null
  /** Créditos por uso; null = usar custo padrão da função */
  credit_cost?: number | null
}

export default function CriarPromptsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prompts, setPrompts] = useState<CreationPromptItem[]>([])
  const [galleryUseCreationPrompts, setGalleryUseCreationPrompts] = useState(false)
  const [internalTab, setInternalTab] = useState<InternalTab>('prompts')
  const [creationModels, setCreationModels] = useState<CreationAIModelRow[]>([])
  const [creationModelsLoading, setCreationModelsLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const loadCreationModels = async () => {
    setCreationModelsLoading(true)
    try {
      const supabase = createClient() as any
      const { data, error } = await supabase
        .from('creation_ai_models')
        .select('id, name, logo_url, can_image, can_video, can_roteiro, can_prompt, is_active, order_position, model_key, credit_cost')
        .order('order_position', { ascending: true })
      if (error) throw error
      setCreationModels(data ?? [])
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao carregar modelos de IA')
      setCreationModels([])
    } finally {
      setCreationModelsLoading(false)
    }
  }

  useEffect(() => {
    if (internalTab === 'modelos_ia' || internalTab === 'chats_gerais') loadCreationModels()
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

  const saveCreationModel = async (row: CreationAIModelRow) => {
    try {
      const supabase = createClient() as any
      const { error } = await supabase
        .from('creation_ai_models')
        .update({
          name: row.name,
          logo_url: row.logo_url || null,
          can_image: row.can_image,
          can_video: row.can_video,
          can_roteiro: row.can_roteiro ?? false,
          can_prompt: row.can_prompt,
          order_position: row.order_position,
          credit_cost: row.credit_cost != null ? row.credit_cost : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      if (error) throw error
      toast.success('Modelo atualizado.')
      setCreationModels((prev) => prev.map((m) => (m.id === row.id ? { ...row } : m)))
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar')
    }
  }

  const saveModelCreditCost = async (id: string, creditCost: number | null) => {
    try {
      const supabase = createClient() as any
      const { error } = await supabase
        .from('creation_ai_models')
        .update({ credit_cost: creditCost, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast.success('Custo salvo.')
      setCreationModels((prev) => prev.map((m) => (m.id === id ? { ...m, credit_cost: creditCost } : m)))
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar custo')
    }
  }

  const addCreationModel = async () => {
    try {
      const supabase = createClient() as any
      const maxOrder = Math.max(0, ...creationModels.map((m) => m.order_position))
      const { data, error } = await supabase
        .from('creation_ai_models')
        .insert({
          name: 'Novo modelo',
          can_image: false,
          can_video: false,
          can_roteiro: false,
          can_prompt: true,
          is_active: true,
          order_position: maxOrder + 1,
        })
        .select('id, name, logo_url, can_image, can_video, can_roteiro, can_prompt, is_active, order_position, credit_cost')
        .single()
      if (error) throw error
      toast.success('Modelo adicionado. Edite o nome, logo e funções.')
      setCreationModels((prev) => [...prev, data])
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao adicionar')
    }
  }

  const removeCreationModel = async (id: string) => {
    try {
      const supabase = createClient() as any
      const { error } = await supabase.from('creation_ai_models').delete().eq('id', id)
      if (error) throw error
      toast.success('Modelo removido.')
      setCreationModels((prev) => prev.filter((m) => m.id !== id))
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao remover')
    }
  }

  const updateCreationModel = (id: string, updates: Partial<CreationAIModelRow>) => {
    setCreationModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    )
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
          title="Criação (Prompts e IAs)"
          subtitle="Prompts por efeito, custos por modelo de IA e modelos de IA"
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
                Custos por modelo de IA
              </button>
              <button
                type="button"
                onClick={() => setInternalTab('modelos_ia')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${internalTab === 'modelos_ia' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Bot className="h-4 w-4" />
                Modelos de IA
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
                <span className="text-sm text-gray-500">Edite o custo e clique em Salvar ao lado de cada modelo.</span>
              )}
              {internalTab === 'modelos_ia' && (
                <Button onClick={addCreationModel} disabled={creationModelsLoading} variant="outline" className="gap-2">
                  <Plus size={18} />
                  Adicionar modelo
                </Button>
              )}
            </div>
          </div>

          {internalTab === 'modelos_ia' && (
            <div className="border-t pt-6 space-y-4">
              <p className="text-sm text-gray-600">
                Modelos de IA exibidos no seletor da página <strong>Criar</strong>. Cada modelo aparece apenas nas abas em que tiver a função ativa (ex.: um modelo só de imagem não aparece em Vídeo). Faça upload da logo para exibir no chat; sem logo, usa ícone padrão.
              </p>
              {creationModelsLoading ? (
                <p className="text-sm text-gray-500">Carregando modelos...</p>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {creationModels.map((row) => (
                    <div key={row.id} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-sm font-bold text-gray-500">Modelo</span>
                        <button
                          type="button"
                          onClick={() => removeCreationModel(row.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="Nome (ex.: Nano Banana, DALL·E)"
                          value={row.name}
                          onChange={(e) => updateCreationModel(row.id, { name: e.target.value })}
                          placeholder="Nome do modelo"
                        />
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium mb-1">Logo (opcional)</label>
                          <ImageUploader
                            value={row.logo_url ?? ''}
                            onChange={(url) => {
                              updateCreationModel(row.id, { logo_url: url || null })
                              saveCreationModel({ ...row, logo_url: url || null })
                            }}
                            placeholder="Upload da logo do modelo"
                            className="max-w-xs"
                          />
                        </div>
                        <div className="sm:col-span-2 flex flex-wrap gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={row.can_image}
                              onChange={(e) => updateCreationModel(row.id, { can_image: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Aparece na aba Criação de Foto (gera imagem)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={row.can_video}
                              onChange={(e) => updateCreationModel(row.id, { can_video: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Aparece na aba Vídeo (gera vídeo)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={row.can_roteiro ?? false}
                              onChange={(e) => updateCreationModel(row.id, { can_roteiro: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Aparece na aba Roteiro de Vídeos (gera texto/roteiro)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={row.can_prompt}
                              onChange={(e) => updateCreationModel(row.id, { can_prompt: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Aparece na aba Criação de prompts (gera texto/prompts)</span>
                          </label>
                        </div>
                        {row.model_key && (
                          <div className="sm:col-span-2">
                            <span className="text-xs text-gray-500">Chave do modelo (API): </span>
                            <code className="text-xs bg-gray-100 px-1 rounded">{row.model_key}</code>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button type="button" size="sm" onClick={() => saveCreationModel(creationModels.find((m) => m.id === row.id) ?? row)} className="gap-1.5">
                          <Save size={14} />
                          Salvar este modelo
                        </Button>
                      </div>
                    </div>
                  ))}
                  {creationModels.length === 0 && !creationModelsLoading && (
                    <p className="text-sm text-gray-500">Nenhum modelo. Clique em &quot;Adicionar modelo&quot; ou rode a migration que insere os padrões.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {internalTab === 'chats_gerais' && (
            <div className="border-t pt-6 space-y-4">
              <p className="text-sm text-gray-600">
                Custo em créditos por uso de cada <strong>modelo de IA</strong>. O valor aparece no botão &quot;Gerar&quot; e é descontado ao criar. Se deixar vazio, usa o custo padrão da função (Foto, Vídeo, Roteiro, Criação de Prompts). Defina aqui o custo de cada modelo para refletir o uso na página Criar.
              </p>
              {creationModelsLoading ? (
                <p className="text-sm text-gray-500">Carregando modelos...</p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {creationModels.map((row) => {
                    const functions: string[] = []
                    if (row.can_image) functions.push('Foto')
                    if (row.can_video) functions.push('Vídeo')
                    if (row.can_roteiro) functions.push('Roteiro de Vídeos')
                    if (row.can_prompt) functions.push('Criação de Prompts')
                    const functionLabel = functions.length > 0 ? functions.join(', ') : 'Nenhuma função'
                    return (
                      <div key={row.id} className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 min-w-0">
                          {row.logo_url ? (
                            <img src={row.logo_url} alt="" className="h-8 w-8 rounded object-contain bg-white" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">{row.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({functionLabel})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            placeholder="Padrão"
                            value={row.credit_cost != null && row.credit_cost > 0 ? String(row.credit_cost) : ''}
                            onChange={(e) => {
                              const v = e.target.value.trim()
                              updateCreationModel(row.id, { credit_cost: v === '' ? null : parseInt(v, 10) || null })
                            }}
                            className="w-24"
                          />
                          <span className="text-xs text-gray-500">créditos</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => saveModelCreditCost(row.id, creationModels.find((m) => m.id === row.id)?.credit_cost ?? null)}
                            className="gap-1"
                          >
                            <Save size={14} />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {creationModels.length === 0 && !creationModelsLoading && (
                    <p className="text-sm text-gray-500">Nenhum modelo. Adicione em &quot;Modelos de IA&quot; e defina o custo aqui.</p>
                  )}
                </div>
              )}
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
                      <label className="block text-xs font-medium mb-1">Capa do card (imagem — espelhada na galeria e na página Criar)</label>
                      <p className="text-xs text-gray-500 mb-1.5">Imagem de destaque do card. As alterações são salvas automaticamente.</p>
                      <ImageUploader
                        value={item.coverImage}
                        onChange={(url) => {
                          setPrompts((prev) => {
                            const next = prev.map((p, i) => i === index ? { ...p, coverImage: url } : p)
                            savePromptsToServer(next)
                            return next
                          })
                        }}
                        placeholder="Imagem de destaque"
                        cropType="banner"
                        aspectRatio={16 / 9}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Vídeo de capa (YouTube — opcional)</label>
                      <p className="text-xs text-gray-500 mb-1.5">Se preenchido, o card mostra a capa do YouTube e um botão de play que abre o vídeo em um modal. Caso não use vídeo, a capa do card será a imagem acima.</p>
                      <VideoUploader
                        value={item.coverVideo ?? ''}
                        onChange={(url) => {
                          setPrompts((prev) => {
                            const next = prev.map((p, i) => i === index ? { ...p, coverVideo: url || undefined } : p)
                            savePromptsToServer(next)
                            return next
                          })
                        }}
                        placeholder="Cole a URL do vídeo do YouTube"
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
