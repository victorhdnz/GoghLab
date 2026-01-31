'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2, ArrowLeft, FolderOpen, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface PromptCategory {
  id: string
  name: string
  slug: string
  order_position: number
  is_active: boolean
}

interface Prompt {
  id: string
  category_id: string
  title: string
  content: string
  order_position: number
  is_active: boolean
  category?: PromptCategory
}

export default function DashboardPromptsPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<PromptCategory[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<PromptCategory | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showPromptForm, setShowPromptForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' })
  const [promptForm, setPromptForm] = useState({ title: '', content: '', category_id: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: catsData } = await (supabase as any)
        .from('prompt_categories')
        .select('*')
        .order('order_position', { ascending: true })
      const { data: promptsData } = await (supabase as any)
        .from('prompts')
        .select('*')
        .order('order_position', { ascending: true })
      setCategories(catsData || [])
      setPrompts(promptsData || [])
      if (catsData?.length && !selectedCategoryId) setSelectedCategoryId(catsData[0].id)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }
    const slug = categoryForm.slug.trim() || slugFromName(categoryForm.name)
    try {
      if (editingCategory) {
        await (supabase as any)
          .from('prompt_categories')
          .update({ name: categoryForm.name, slug, updated_at: new Date().toISOString() })
          .eq('id', editingCategory.id)
        toast.success('Categoria atualizada')
      } else {
        await (supabase as any)
          .from('prompt_categories')
          .insert({ name: categoryForm.name, slug, order_position: categories.length, is_active: true })
        toast.success('Categoria criada')
      }
      setShowCategoryForm(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', slug: '' })
      await loadData()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar categoria')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria? Os prompts dela também serão excluídos.')) return
    try {
      await (supabase as any).from('prompt_categories').delete().eq('id', id)
      toast.success('Categoria excluída')
      if (selectedCategoryId === id) setSelectedCategoryId(categories[0]?.id || null)
      await loadData()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir')
    }
  }

  const savePrompt = async () => {
    if (!promptForm.title.trim() || !promptForm.content.trim()) {
      toast.error('Título e conteúdo são obrigatórios')
      return
    }
    const categoryId = promptForm.category_id || selectedCategoryId
    if (!categoryId) {
      toast.error('Selecione uma categoria')
      return
    }
    try {
      if (editingPrompt) {
        await (supabase as any)
          .from('prompts')
          .update({
            title: promptForm.title,
            content: promptForm.content,
            category_id: categoryId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPrompt.id)
        toast.success('Prompt atualizado')
      } else {
        const countInCategory = prompts.filter((p) => p.category_id === categoryId).length
        await (supabase as any)
          .from('prompts')
          .insert({
            title: promptForm.title,
            content: promptForm.content,
            category_id: categoryId,
            order_position: countInCategory,
            is_active: true,
          })
        toast.success('Prompt criado')
      }
      setShowPromptForm(false)
      setEditingPrompt(null)
      setPromptForm({ title: '', content: '', category_id: '' })
      await loadData()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar prompt')
    }
  }

  const deletePrompt = async (id: string) => {
    if (!confirm('Excluir este prompt?')) return
    try {
      await (supabase as any).from('prompts').delete().eq('id', id)
      toast.success('Prompt excluído')
      await loadData()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir')
    }
  }

  const filteredPrompts = selectedCategoryId
    ? prompts.filter((p) => p.category_id === selectedCategoryId)
    : prompts

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardNavigation
          title="Gerenciar Prompts"
          subtitle="Crie categorias e prompts para a biblioteca na área de membros"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categorias */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Categorias
              </h2>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name: '', slug: '' })
                  setShowCategoryForm(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </div>
            {showCategoryForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <Input
                  label="Nome"
                  value={categoryForm.name}
                  onChange={(e) => {
                    setCategoryForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugFromName(e.target.value) }))
                  }}
                />
                <Input
                  label="Slug (opcional)"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveCategory}>
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCategoryForm(false)
                      setEditingCategory(null)
                      setCategoryForm({ name: '', slug: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between group">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg truncate ${
                      selectedCategoryId === cat.id ? 'bg-amber-100 text-amber-900' : 'hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat)
                        setCategoryForm({ name: cat.name, slug: cat.slug })
                        setShowCategoryForm(true)
                      }}
                      className="p-1.5 text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteCategory(cat.id)} className="p-1.5 text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Prompts da categoria */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Prompts
                {selectedCategoryId && (
                  <span className="text-sm font-normal text-gray-500">
                    ({categories.find((c) => c.id === selectedCategoryId)?.name})
                  </span>
                )}
              </h2>
              <Button
                size="sm"
                disabled={!selectedCategoryId}
                onClick={() => {
                  setEditingPrompt(null)
                  setPromptForm({ title: '', content: '', category_id: selectedCategoryId || '' })
                  setShowPromptForm(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo prompt
              </Button>
            </div>
            {showPromptForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                <Input
                  label="Título"
                  value={promptForm.title}
                  onChange={(e) => setPromptForm((f) => ({ ...f, title: e.target.value }))}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                  <textarea
                    value={promptForm.content}
                    onChange={(e) => setPromptForm((f) => ({ ...f, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={savePrompt}>
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowPromptForm(false)
                      setEditingPrompt(null)
                      setPromptForm({ title: '', content: '', category_id: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            {!selectedCategoryId ? (
              <p className="text-gray-500">Selecione uma categoria para ver e criar prompts.</p>
            ) : (
              <ul className="space-y-3">
                {filteredPrompts.map((p) => (
                  <li key={p.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900">{p.title}</h3>
                        <pre className="mt-1 text-sm text-gray-600 whitespace-pre-wrap font-sans truncate max-h-20">
                          {p.content}
                        </pre>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPrompt(p)
                            setPromptForm({ title: p.title, content: p.content, category_id: p.category_id })
                            setShowPromptForm(true)
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => deletePrompt(p.id)} className="p-2 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {filteredPrompts.length === 0 && (
                  <p className="text-gray-500 py-4">Nenhum prompt nesta categoria. Clique em &quot;Novo prompt&quot; para criar.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
