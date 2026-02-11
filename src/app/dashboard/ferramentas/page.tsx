'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Plus, Edit, Trash2, Wrench, Video, Clock } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  product_type: string
  icon_url?: string | null
}

interface Tool {
  id: string
  product_id: string | null
  name: string
  slug: string
  description: string | null
  tutorial_video_url: string | null
  requires_8_days: boolean
  order_position: number
  is_active: boolean
  products?: Product | null
}

export default function DashboardFerramentasPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedProductForNew, setSelectedProductForNew] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    product_id: '' as string,
    tutorial_video_url: '',
    requires_8_days: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: productsData } = await (supabase as any)
        .from('products')
        .select('id, name, slug, product_type, icon_url')
        .eq('is_active', true)
        .order('order_position', { ascending: true })
      const { data: toolsData } = await (supabase as any)
        .from('tools')
        .select('*, products(id, name, slug, product_type, icon_url)')
        .order('order_position', { ascending: true })
      setProducts(productsData || [])
      setTools(toolsData || [])
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

  const productIdsWithTool = new Set(tools.map((t) => t.product_id).filter(Boolean))
  const productsWithoutTool = products.filter((p) => p.product_type === 'tool' && !productIdsWithTool.has(p.id))

  const createToolFromProduct = async (product: Product) => {
    try {
      const maxOrder = tools.length ? Math.max(...tools.map((t) => t.order_position), 0) : 0
      await (supabase as any)
        .from('tools')
        .insert({
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          description: null,
          tutorial_video_url: null,
          requires_8_days: true,
          order_position: maxOrder + 1,
          is_active: true,
        })
      toast.success(`Ferramenta "${product.name}" criada. Configure o vídeo e o prazo abaixo.`)
      setShowForm(false)
      setSelectedProductForNew(null)
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar ferramenta')
    }
  }

  const saveTool = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    const slug = form.slug.trim() || slugFromName(form.name)
    try {
      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description.trim() || null,
        product_id: form.product_id || null,
        tutorial_video_url: form.tutorial_video_url.trim() || null,
        requires_8_days: form.requires_8_days,
        is_active: true,
      }
      if (editingTool) {
        await (supabase as any).from('tools').update(payload).eq('id', editingTool.id)
        toast.success('Ferramenta atualizada')
      } else {
        const maxOrder = tools.length ? Math.max(...tools.map((t) => t.order_position), 0) : 0
        await (supabase as any).from('tools').insert({ ...payload, order_position: maxOrder + 1 })
        toast.success('Ferramenta criada')
      }
      setShowForm(false)
      setEditingTool(null)
      setForm({ name: '', slug: '', description: '', product_id: '', tutorial_video_url: '', requires_8_days: true })
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar')
    }
  }

  const deleteTool = async (id: string) => {
    if (!confirm('Excluir esta ferramenta?')) return
    try {
      await (supabase as any).from('tools').delete().eq('id', id)
      toast.success('Ferramenta excluída')
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LumaSpin size="default" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardNavigation
          title="Gerenciar Ferramentas"
          subtitle="Crie ferramentas, vincule a um produto, configure link do vídeo e prazo de 8 dias"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
        />

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Ferramentas
            </h2>
            <Button
              onClick={() => {
                setEditingTool(null)
                setSelectedProductForNew(null)
                setForm({ name: '', slug: '', description: '', product_id: '', tutorial_video_url: '', requires_8_days: true })
                setShowForm(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova ferramenta
            </Button>
          </div>

          {showForm && !editingTool && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <p className="text-sm font-medium text-gray-700">
                Selecione um produto (Ferramenta) criado em Planos que ainda não tem ferramenta. Nome e logo serão espelhados.
              </p>
              {productsWithoutTool.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">
                  Todos os produtos tipo Ferramenta já têm ferramenta criada. Crie um novo produto em{' '}
                  <Link href="/dashboard/pricing" className="text-blue-600 underline">Planos</Link> (tipo Ferramenta) e volte aqui.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {productsWithoutTool.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductForNew(selectedProductForNew?.id === p.id ? null : p)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedProductForNew?.id === p.id ? 'border-black bg-gray-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {p.icon_url ? (
                        <img src={p.icon_url} alt="" className="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-white border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 block truncate">{p.name}</span>
                        <span className="text-xs text-gray-500">({p.slug})</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedProductForNew && createToolFromProduct(selectedProductForNew)}
                  disabled={!selectedProductForNew}
                >
                  Criar ferramenta {selectedProductForNew ? `"${selectedProductForNew.name}"` : ''}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setSelectedProductForNew(null)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {showForm && editingTool && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <p className="text-sm text-gray-600">Edite descrição, vídeo e prazo. Nome e produto podem ser alterados se necessário.</p>
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugFromName(e.target.value) }))
                }}
                placeholder="Ex: Canva Pro"
              />
              <Input
                label="Slug (único)"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="Ex: canva"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produto vinculado</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Nenhum</option>
                  {products.filter((p) => p.product_type === 'tool').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Link do vídeo tutorial (YouTube)"
                value={form.tutorial_video_url}
                onChange={(e) => setForm((f) => ({ ...f, tutorial_video_url: e.target.value }))}
                placeholder="https://youtube.com/..."
              />
              <div className="flex items-center gap-2">
                <Switch
                  label="Exigir 8 dias para liberar solicitação"
                  checked={form.requires_8_days}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, requires_8_days: !!checked }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveTool}>Salvar</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTool(null)
                    setForm({ name: '', slug: '', description: '', product_id: '', tutorial_video_url: '', requires_8_days: true })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-4">
            As ferramentas aparecem na área do membro conforme os <Link href="/dashboard/pricing" className="text-blue-600 underline">produtos atribuídos a cada plano</Link>. Vincule cada ferramenta a um produto do tipo &quot;Ferramenta&quot;. Produtos do tipo Ferramenta criados em Planos são espelhados aqui automaticamente; configure o vídeo e o prazo de 8 dias.
          </p>

          <ul className="space-y-3">
            {tools.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  {(t.products as Product | null)?.icon_url ? (
                    <img src={(t.products as Product).icon_url!} alt="" className="w-10 h-10 rounded-lg object-contain flex-shrink-0 border border-gray-200 bg-white" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{t.name}</span>
                    <span className="text-gray-500 text-sm">({t.slug})</span>
                    {t.products && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {t.products.name}
                      </span>
                    )}
                  </div>
                  {t.description && <p className="text-sm text-gray-600 mt-1 truncate">{t.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {t.tutorial_video_url && (
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Vídeo configurado
                      </span>
                    )}
                    {t.requires_8_days ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        8 dias
                      </span>
                    ) : (
                      <span>Liberação imediata</span>
                    )}
                  </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTool(t)
                      setForm({
                        name: t.name,
                        slug: t.slug,
                        description: t.description || '',
                        product_id: t.product_id || '',
                        tutorial_video_url: t.tutorial_video_url || '',
                        requires_8_days: t.requires_8_days,
                      })
                      setShowForm(true)
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => deleteTool(t.id)} className="p-2 text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {tools.length === 0 && (
            <p className="text-gray-500 py-6 text-center">
              Nenhuma ferramenta. Clique em &quot;Nova ferramenta&quot; e selecione um produto (Ferramenta) criado em <Link href="/dashboard/pricing" className="text-blue-600 underline">Planos</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
