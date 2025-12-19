'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { BackButton } from '@/components/ui/BackButton'

interface EditServicePageProps {
  params: { id: string }
}

export default function EditServicePage({ params }: EditServicePageProps) {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingCategories, setExistingCategories] = useState<string[]>([])
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    short_description: '',
    full_description: '',
    category: '',
    tags: [] as string[],
    cover_image: '',
    images: [] as string[],
    video_url: '',
    price_range: '',
    delivery_time: '',
    is_featured: false,
    is_active: true,
    meta_title: '',
    meta_description: '',
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else {
        loadService()
        loadCategories()
      }
    }
  }, [isAuthenticated, isEditor, authLoading, router, params.id])

  const loadService = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setService(data as Service)
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        short_description: data.short_description || '',
        full_description: data.full_description || '',
        category: data.category || '',
        tags: data.tags || [],
        cover_image: data.cover_image || '',
        images: data.images || [],
        video_url: data.video_url || '',
        price_range: data.price_range || '',
        delivery_time: data.delivery_time || '',
        is_featured: data.is_featured || false,
        is_active: data.is_active !== false,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
      })
    } catch (error: any) {
      console.error('Erro ao carregar serviço:', error)
      toast.error('Erro ao carregar serviço')
      router.push('/dashboard/portfolio')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('category')
        .not('category', 'is', null)
        .neq('id', params.id)

      if (error) throw error

      const categories = [...new Set(data.map(item => item.category).filter(Boolean))] as string[]
      setExistingCategories(categories)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name })
    // Gerar slug automaticamente apenas se estiver vazio
    if (!formData.slug) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Preencha pelo menos o nome do serviço')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('services')
        .update({
          ...formData,
          tags: formData.tags.length > 0 ? formData.tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success('Serviço atualizado com sucesso!')
      router.push('/dashboard/portfolio')
    } catch (error: any) {
      console.error('Erro ao atualizar serviço:', error)
      toast.error(error.message || 'Erro ao atualizar serviço')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!service) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton href="/dashboard/portfolio" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Serviço</h1>
            <p className="text-gray-600">{service.name}</p>
          </div>
          <Button onClick={handleSave} isLoading={saving} size="lg">
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">Informações Básicas</h2>
              
              <div className="space-y-4">
                <Input
                  label="Nome do Serviço *"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Criação de Sites Responsivos"
                />

                <Input
                  label="Slug (URL) *"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="criacao-de-sites-responsivos"
                />
                <p className="text-xs text-gray-500 -mt-2">
                  URL amigável do serviço. Gerado automaticamente a partir do nome.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Selecione uma categoria</option>
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ou digite uma nova"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição Curta</label>
                  <textarea
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Breve descrição do serviço (2-3 linhas)"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição Completa</label>
                  <textarea
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    placeholder="Descrição detalhada do serviço"
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Digite uma tag e pressione Enter"
                    />
                    <Button onClick={addTag} type="button">Adicionar</Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mídia */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">Mídia</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Imagem de Capa</label>
                  <ImageUploader
                    value={formData.cover_image}
                    onChange={(url) => setFormData({ ...formData, cover_image: url })}
                    cropType="banner"
                    recommendedDimensions="1920x1080px (16:9)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Galeria de Imagens</label>
                  <ArrayImageManager
                    images={formData.images}
                    onChange={(images) => setFormData({ ...formData, images })}
                    folder="services"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vídeo Explicativo (URL)</label>
                  <VideoUploader
                    value={formData.video_url}
                    onChange={(url) => setFormData({ ...formData, video_url: url })}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    URL do vídeo (YouTube, Vimeo, etc.) ou faça upload
                  </p>
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">SEO</h2>
              
              <div className="space-y-4">
                <Input
                  label="Meta Title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Título para SEO (máx. 60 caracteres)"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Meta Description</label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Descrição para SEO (máx. 160 caracteres)"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Configurações */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Configurações</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Investimento</label>
                  <Input
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                    placeholder="Ex: A partir de R$ 1.500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tempo de Entrega</label>
                  <Input
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    placeholder="Ex: 15-30 dias"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium">
                    Destacar serviço
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Serviço ativo
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Preview</h2>
              <Link
                href={`/portfolio/${formData.slug || service.slug}`}
                target="_blank"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Ver página do serviço →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

