'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { ProductCatalog } from '@/types'
import { Plus, Edit, Trash2, Eye, BookOpen, ArrowLeft, Check, Link2, Settings, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface CatalogVersion {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image: string | null
  theme_colors: any
  content: any
  is_active: boolean
  created_at: string
  updated_at: string
}

function CatalogsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [versions, setVersions] = useState<CatalogVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [editingVersion, setEditingVersion] = useState<CatalogVersion | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const supabase = createClient()

  const [versionFormData, setVersionFormData] = useState({
    name: '',
    description: '',
  })

  // Layout fixo para catálogos
  const CATALOG_LAYOUT = {
    id: 'catalog-default',
    name: 'Catálogo de Produtos',
    slug: 'catalogo',
    description: 'Layout padrão para exibir produtos em catálogo',
  }

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    loadVersions()
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
      || 'catalogo'
  }

  const loadVersions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('product_catalogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar catálogos:', error)
        setVersions([])
      } else {
        setVersions((data || []) as CatalogVersion[])
      }
    } catch (error) {
      console.error('Erro ao carregar catálogos:', error)
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVersion = async () => {
    if (!versionFormData.name) {
      toast.error('Preencha o nome do catálogo')
      return
    }

    try {
      const generatedSlug = generateSlug(versionFormData.name)
      
      const catalogData = {
        slug: generatedSlug,
        title: versionFormData.name,
        description: versionFormData.description || null,
        cover_image: null,
        theme_colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#D4AF37',
          background: '#ffffff',
          text: '#000000',
        },
        content: {
          hero: {
            title: versionFormData.name || 'Smart Watch',
            subtitle: 'O mais poderoso de todos os tempos.',
            image: '',
            badge: 'Novo',
            cta_text: 'Comprar Agora',
            cta_link: '/comparar',
          },
          features: [
            { icon: '💡', title: 'Design Moderno', description: 'Estilo contemporâneo que combina com qualquer ocasião.' },
            { icon: '⚡', title: 'Alta Performance', description: 'Processador rápido e eficiente para todas as suas necessidades.' },
            { icon: '🔋', title: 'Bateria Duradoura', description: 'Bateria que dura o dia todo com uma única carga.' },
          ],
          features_title: 'Recursos Principais',
          features_subtitle: 'Descubra o que torna este produto especial',
          gallery: [],
          gallery_title: 'Galeria de Imagens',
          product_showcase: {
            title: 'Destaque do Produto',
            description: 'Conheça os principais recursos e benefícios deste produto incrível.',
            image: '',
            features: [
              'Recurso 1',
              'Recurso 2',
              'Recurso 3',
            ],
            cta_text: 'Comprar Agora',
            cta_link: '/comparar',
          },
          categories: [],
          featured_products: [],
          featured_subtitle: 'Produtos em Destaque',
          cta_title: 'Pronto para começar?',
          cta_description: 'Explore nossa coleção completa de produtos.',
          cta_text: 'Ver todos os produtos',
          cta_link: '/comparar',
          sections: [],
        },
        is_active: true,
      }

      if (editingVersion) {
        const { error } = await (supabase as any)
          .from('product_catalogs')
          .update(catalogData)
          .eq('id', editingVersion.id)

        if (error) throw error
        toast.success('Catálogo atualizado!')
      } else {
        const { error } = await (supabase as any)
          .from('product_catalogs')
          .insert(catalogData)

        if (error) throw error
        toast.success('Catálogo criado!')
      }

      setIsVersionModalOpen(false)
      setEditingVersion(null)
      resetVersionForm()
      loadVersions()
    } catch (error: any) {
      console.error('Erro ao salvar catálogo:', error)
      toast.error(error.message || 'Erro ao salvar catálogo')
    }
  }

  const handleDeleteVersion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este catálogo?')) return

    try {
      const { error } = await (supabase as any)
        .from('product_catalogs')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Catálogo excluído!')
      loadVersions()
    } catch (error: any) {
      console.error('Erro ao excluir catálogo:', error)
      toast.error('Erro ao excluir catálogo')
    }
  }

  const resetVersionForm = () => {
    setVersionFormData({
      name: '',
      description: '',
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

  const getVersionUrl = (version: CatalogVersion) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/catalogo/${version.slug}`
  }

  const getEditorUrl = (versionId: string) => {
    return `/dashboard/catalogos/editar?version=${versionId}`
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
              <h1 className="text-3xl font-bold text-gray-900">Catálogos de Produtos</h1>
              <p className="text-gray-600">Gerencie catálogos visuais para seus produtos</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar - Info do Layout */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Layout</h2>
                <p className="text-xs text-gray-500 mt-1">Catálogo de Produtos</p>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{CATALOG_LAYOUT.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{CATALOG_LAYOUT.description}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>📌 URL Base:</strong> /catalogo
                  <br />
                  <span className="text-blue-600">As versões terão URLs: /catalogo/nome-do-catalogo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Versões */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Catálogos Criados</h2>
                  <p className="text-xs text-gray-500 mt-1">{versions.length} catálogo{versions.length !== 1 ? 's' : ''}</p>
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
                  Novo Catálogo
                </button>
              </div>

              {versions.length === 0 ? (
                <div className="p-12 text-center">
                  <Layers size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum catálogo criado</h4>
                  <p className="text-gray-500 mb-6">Crie seu primeiro catálogo para começar a personalizar</p>
                  <button
                    onClick={() => {
                      setEditingVersion(null)
                      resetVersionForm()
                      setIsVersionModalOpen(true)
                    }}
                    className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Criar Catálogo
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {versions.map((version) => {
                    const versionUrl = getVersionUrl(version)
                    const linkId = `catalog-${version.id}`

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
                            {version.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{version.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded">/catalogo/{version.slug}</code></span>
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
                                  name: version.title,
                                  description: version.description || '',
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
                  {editingVersion ? 'Renomear Catálogo' : 'Novo Catálogo'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Layout: {CATALOG_LAYOUT.name}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Catálogo *</label>
                  <input
                    type="text"
                    value={versionFormData.name}
                    onChange={(e) => setVersionFormData({ ...versionFormData, name: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="Ex: Catálogo Black Friday"
                  />
                  {versionFormData.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /catalogo/{generateSlug(versionFormData.name)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                  <textarea
                    value={versionFormData.description}
                    onChange={(e) => setVersionFormData({ ...versionFormData, description: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5 resize-none"
                    rows={2}
                    placeholder="Breve descrição do catálogo..."
                  />
                </div>

                {!editingVersion && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <strong>Dica:</strong> Após criar, clique no ícone de engrenagem para editar o conteúdo completo (produtos, cores, imagens, etc.)
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
                  {editingVersion ? 'Salvar' : 'Criar Catálogo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CatalogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    }>
      <CatalogsContent />
    </Suspense>
  )
}
