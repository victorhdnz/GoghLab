'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { CloudinaryVideoUploader } from '@/components/ui/CloudinaryVideoUploader'
import { Plus, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import type { CreationPromptItem, CreationTabId, InputStructureId } from '@/types/creation-prompts'
import { INPUT_STRUCTURES } from '@/types/creation-prompts'

const TAB_OPTIONS: { value: CreationTabId; label: string }[] = [
  { value: 'foto', label: 'Criação de Foto' },
  { value: 'video', label: 'Criação de Vídeo' },
  { value: 'roteiro', label: 'Vídeo com Roteiro' },
  { value: 'vangogh', label: 'Criação de prompts' },
]

export default function CriarPromptsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prompts, setPrompts] = useState<CreationPromptItem[]>([])
  const [galleryUseCreationPrompts, setGalleryUseCreationPrompts] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getSiteSettings()
      const content = data?.homepage_content ?? {}
      setPrompts(Array.isArray(content.creation_prompts) ? content.creation_prompts : [])
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
          subtitle="Crie os prompts que aparecem na página Criar e, opcionalmente, no carrossel da homepage"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
        />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">
                Cada prompt vira um card na página <strong>Criar com IA</strong> (por aba) e, se a galeria espelhar, também no carrossel da homepage. Título, subtítulo, imagem ou vídeo de referência e o prompt (oculto) são espelhados corretamente; ao clicar, o usuário é levado à geração com a ref e o prompt aplicados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/homepage" className="text-sm text-gray-500 hover:text-gray-700 underline">
                Editar Homepage (ativar espelhamento na galeria)
              </Link>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
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
                      <label className="block text-xs font-medium mb-1">Capa / imagem do card (espelhado na galeria e na página Criar)</label>
                      <ImageUploader
                        value={item.coverImage}
                        onChange={(url) => updatePrompt(index, { coverImage: url })}
                        placeholder="Imagem de destaque"
                        cropType="banner"
                        aspectRatio={16 / 9}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Vídeo de capa (opcional)</label>
                      <CloudinaryVideoUploader
                        value={item.coverVideo || ''}
                        onChange={(url) => updatePrompt(index, { coverVideo: url || undefined })}
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
        </div>
      </div>
    </div>
  )
}
