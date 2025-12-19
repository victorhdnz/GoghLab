'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { ProductSupportPage, Product } from '@/types'
import { Plus, Edit, Trash2, Eye, FileText, ArrowLeft, Check, Link2, Settings, Layers, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface SupportVersion {
  id: string
  product_id: string
  model_slug: string
  title: string
  content: any
  is_active: boolean
  created_at: string
  updated_at: string
  product?: Product
}

function SupportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [versions, setVersions] = useState<SupportVersion[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [editingVersion, setEditingVersion] = useState<SupportVersion | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const supabase = createClient()

  const [versionFormData, setVersionFormData] = useState({
    product_id: '',
    model_slug: '',
    title: '',
  })

  // Layout fixo para suporte (Apple Guide)
  const SUPPORT_LAYOUT = {
    id: 'support-apple-guide',
    name: 'Manual Apple Guide',
    slug: 'suporte',
    description: 'Layout estilo manual da Apple com seções de feature-cards, steps e accordion',
  }

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    loadVersions()
    loadProducts()
  }, [isAuthenticated, isEditor, authLoading, router])

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'manual'
  }

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('product_support_pages')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar páginas de suporte:', error)
        setVersions([])
      } else {
        setVersions((data || []) as SupportVersion[])
      }
    } catch (error) {
      console.error('Erro ao carregar páginas de suporte:', error)
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleSaveVersion = async () => {
    if (!versionFormData.product_id || !versionFormData.model_slug || !versionFormData.title) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const pageData = {
        product_id: versionFormData.product_id,
        model_slug: versionFormData.model_slug.toLowerCase().replace(/\s+/g, '-'),
        title: versionFormData.title,
        content: editingVersion?.content || {
          sections: [
            {
              id: 'hero-1',
              type: 'hero',
              title: versionFormData.title || 'Bem-vindo',
              subtitle: `Tudo o que você precisa saber sobre o produto.`,
              content: '',
              image: '',
            },
            {
              id: 'feature-1',
              type: 'feature-card',
              title: 'Primeiros Passos',
              subtitle: 'Comece aqui',
              content: 'Configure seu dispositivo seguindo estes passos simples.',
              image: '',
              link: '',
              linkText: 'Saiba mais',
            },
            {
              id: 'steps-1',
              type: 'steps',
              title: 'Como Configurar',
              subtitle: 'Siga estes passos',
              items: [
                {
                  title: 'Passo 1: Ligar o dispositivo',
                  description: 'Pressione e segure o botão de energia por 3 segundos.',
                  image: '',
                },
                {
                  title: 'Passo 2: Conectar ao app',
                  description: 'Baixe o app e conecte via Bluetooth.',
                  image: '',
                },
              ],
            },
          ],
        },
        is_active: true,
      }

      if (editingVersion) {
        const { error } = await supabase
          .from('product_support_pages')
          .update(pageData)
          .eq('id', editingVersion.id)

        if (error) throw error
        toast.success('Página atualizada!')
      } else {
        const { error } = await supabase
          .from('product_support_pages')
          .insert(pageData)

        if (error) throw error
        toast.success('Página criada!')
      }

      setIsVersionModalOpen(false)
      setEditingVersion(null)
      resetVersionForm()
      loadVersions()
    } catch (error: any) {
      console.error('Erro ao salvar página:', error)
      toast.error(error.message || 'Erro ao salvar página')
    }
  }

  const handleDeleteVersion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta página?')) return

    try {
      const { error } = await supabase
        .from('product_support_pages')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Página excluída!')
      loadVersions()
    } catch (error: any) {
      console.error('Erro ao excluir página:', error)
      toast.error('Erro ao excluir página')
    }
  }

  const resetVersionForm = () => {
    setVersionFormData({
      product_id: '',
      model_slug: '',
      title: '',
    })
  }

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(linkId)
      toast.success('Link copiado!')
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const getVersionUrl = (version: SupportVersion) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/suporte/${version.model_slug}`
  }

  const getEditorUrl = (versionId: string) => {
    return `/dashboard/suporte/editar?version=${versionId}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manuais e Guias</h1>
              <p className="text-gray-600">Gerencie páginas de suporte e configuração pós-compra</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar - Info do Layout */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Layout</h2>
                <p className="text-xs text-gray-500 mt-1">Manual Apple Guide</p>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{SUPPORT_LAYOUT.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{SUPPORT_LAYOUT.description}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>📌 URL Base:</strong> /suporte
                  <br />
                  <span className="text-blue-600">As versões terão URLs: /suporte/slug-do-modelo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Versões */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Páginas Criadas</h2>
                  <p className="text-xs text-gray-500 mt-1">{versions.length} página{versions.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingVersion(null)
                    resetVersionForm()
                    setIsVersionModalOpen(true)
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  Nova Página
                </button>
              </div>

              {versions.length === 0 ? (
                <div className="p-12 text-center">
                  <Layers size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma página criada</h4>
                  <p className="text-gray-500 mb-6">Crie sua primeira página de suporte para começar a personalizar</p>
                  <button
                    onClick={() => {
                      setEditingVersion(null)
                      resetVersionForm()
                      setIsVersionModalOpen(true)
                    }}
                    className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Criar Página
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {versions.map((version) => {
                    const versionUrl = getVersionUrl(version)
                    const linkId = `support-${version.id}`

                    return (
                      <div key={version.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{version.title}</h3>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                version.is_active 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {version.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            {version.product && (
                              <p className="text-sm text-gray-600 mb-2">{version.product.name}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded">/suporte/{version.model_slug}</code></span>
                              <span>{((version.content as any)?.sections?.length || 0)} seções</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => copyToClipboard(versionUrl, linkId)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Copiar link"
                            >
                              {copiedLink === linkId ? (
                                <Check size={18} className="text-green-500" />
                              ) : (
                                <Link2 size={18} className="text-gray-500" />
                              )}
                            </button>
                            <Link
                              href={versionUrl}
                              target="_blank"
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Visualizar"
                            >
                              <Eye size={18} className="text-gray-500" />
                            </Link>
                            <Link
                              href={getEditorUrl(version.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar conteúdo"
                            >
                              <Settings size={18} className="text-gray-500" />
                            </Link>
                            <button
                              onClick={() => {
                                setEditingVersion(version)
                                setVersionFormData({
                                  product_id: version.product_id,
                                  model_slug: version.model_slug,
                                  title: version.title,
                                })
                                setIsVersionModalOpen(true)
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Renomear"
                            >
                              <Edit size={18} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteVersion(version.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Nova Versão */}
        {isVersionModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">
                  {editingVersion ? 'Renomear Página' : 'Nova Página de Suporte'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Layout: {SUPPORT_LAYOUT.name}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Produto *</label>
                  <select
                    value={versionFormData.product_id}
                    onChange={(e) => setVersionFormData({ ...versionFormData, product_id: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Slug do Modelo *</label>
                  <input
                    type="text"
                    value={versionFormData.model_slug}
                    onChange={(e) => setVersionFormData({ ...versionFormData, model_slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="smartwatch-serie-11"
                  />
                  {versionFormData.model_slug && (
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /suporte/{versionFormData.model_slug}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Título da Página *</label>
                  <input
                    type="text"
                    value={versionFormData.title}
                    onChange={(e) => setVersionFormData({ ...versionFormData, title: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="Como usar o Smartwatch Série 11"
                  />
                </div>

                {!editingVersion && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <strong>Dica:</strong> Após criar, clique no ícone de engrenagem para editar o conteúdo completo (seções, textos, imagens, etc.)
                  </div>
                )}
              </div>
              <div className="p-6 border-t flex justify-end gap-4">
                <button
                  onClick={() => {
                    setIsVersionModalOpen(false)
                    setEditingVersion(null)
                    resetVersionForm()
                  }}
                  className="px-6 py-2.5 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveVersion}
                  className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  {editingVersion ? 'Salvar' : 'Criar Página'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SupportPagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    }>
      <SupportContent />
    </Suspense>
  )
}
