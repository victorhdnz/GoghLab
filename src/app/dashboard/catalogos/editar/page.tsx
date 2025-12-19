'use client'

import { useEffect, useState, Suspense, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { ProductCatalog, Product } from '@/types'
import { Save, ArrowLeft, Home, Eye, Package, Palette, ChevronDown, ChevronUp, Trash2, Plus, Play, GripVertical } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'

interface CatalogSettings {
  title: string
  description: string
  cover_image: string
  hero: {
    title: string
    subtitle: string
    badge: string
    image: string
    cta_text?: string
    cta_link?: string
  }
  video?: {
    url: string
    title?: string
    description?: string
    orientation?: 'horizontal' | 'vertical'
  }
  features?: Array<{
    icon?: string
    title: string
    description: string
  }>
  features_title?: string
  features_subtitle?: string
  gallery?: string[]
  gallery_title?: string
  product_showcase?: {
    title: string
    description: string
    image: string
    features?: string[]
    cta_text?: string
    cta_link?: string
  }
  featured_subtitle?: string
  cta_title?: string
  cta_description?: string
  cta_text?: string
  cta_link?: string
  theme_colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  featured_products: string[]
  featured_products_links?: Record<string, string> // Mapeia product_id -> link customizado
  categories?: Array<{
    id: string
    name: string
    products: string[]
  }>
}

function EditCatalogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const versionId = searchParams.get('version')
  const [catalog, setCatalog] = useState<ProductCatalog | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('hero')

  const [settings, setSettings] = useState<CatalogSettings>({
    title: '',
    description: '',
    cover_image: '',
    hero: {
      title: '',
      subtitle: '',
      badge: '',
      image: '',
    },
    theme_colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#D4AF37',
      background: '#ffffff',
      text: '#000000',
    },
    featured_products: [],
    featured_products_links: {},
  })

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    if (!versionId) {
      toast.error('Versão não especificada')
      router.push('/dashboard/catalogos')
      return
    }

    loadCatalog()
    loadProducts()
  }, [versionId, isAuthenticated, isEditor, authLoading, router])

  const loadCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('product_catalogs')
        .select('*')
        .eq('id', versionId)
        .single()

      if (error) throw error
      if (!data) {
        toast.error('Catálogo não encontrado')
        router.push('/dashboard/catalogos')
        return
      }

      setCatalog(data as ProductCatalog)
      const content = (data.content as any) || {}
      
      // Se não houver conteúdo, criar estrutura pré-definida e salvar automaticamente
      const hasContent = content.hero?.title || content.features?.length > 0 || content.gallery?.length > 0
      
      if (!hasContent) {
        const defaultContent = {
          hero: {
            title: data.title || 'Smart Watch',
            subtitle: 'O mais poderoso de todos os tempos.',
            badge: 'Novo',
            image: '',
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
        }
        
        // Salvar automaticamente a estrutura pré-definida
        await supabase
          .from('product_catalogs')
          .update({ content: defaultContent })
          .eq('id', versionId)
        
        // Usar o conteúdo padrão
        content.hero = defaultContent.hero
        content.features = defaultContent.features
        content.features_title = defaultContent.features_title
        content.features_subtitle = defaultContent.features_subtitle
        content.gallery = defaultContent.gallery
        content.gallery_title = defaultContent.gallery_title
        content.product_showcase = defaultContent.product_showcase
        content.featured_subtitle = defaultContent.featured_subtitle
        content.cta_title = defaultContent.cta_title
        content.cta_description = defaultContent.cta_description
        content.cta_text = defaultContent.cta_text
        content.cta_link = defaultContent.cta_link
      }
      
      setSettings({
        title: data.title || '',
        description: data.description || '',
        cover_image: data.cover_image || '',
        hero: content.hero || { title: '', subtitle: '', badge: '', image: '', cta_text: '', cta_link: '' },
        video: content.video || undefined,
        features: content.features || [],
        features_title: content.features_title || '',
        features_subtitle: content.features_subtitle || '',
        gallery: content.gallery || [],
        gallery_title: content.gallery_title || '',
        product_showcase: content.product_showcase || {
          title: 'Destaque do Produto',
          description: 'Conheça os principais recursos e benefícios deste produto incrível.',
          image: '',
          features: ['Recurso 1', 'Recurso 2', 'Recurso 3'],
          cta_text: 'Comprar Agora',
          cta_link: '/comparar',
        } as any,
        featured_subtitle: content.featured_subtitle || '',
        cta_title: content.cta_title || '',
        cta_description: content.cta_description || '',
        cta_text: content.cta_text || '',
        cta_link: content.cta_link || '',
        theme_colors: (data.theme_colors as any) || {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#D4AF37',
          background: '#ffffff',
          text: '#000000',
        },
        featured_products: content.featured_products || [],
        featured_products_links: content.featured_products_links || {},
      })
    } catch (error: any) {
      console.error('Erro ao carregar catálogo:', error)
      toast.error('Erro ao carregar catálogo')
      router.push('/dashboard/catalogos')
    } finally {
      setLoading(false)
    }
  }

  // Função helper para prevenir scroll durante atualizações
  const updateSettingsWithScrollProtection = useCallback((updater: (prev: CatalogSettings) => CatalogSettings) => {
    const activeElement = document.activeElement as HTMLElement
    const scrollPosition = window.scrollY
    
    setSettings(updater)
    
    requestAnimationFrame(() => {
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.focus()
        window.scrollTo({ top: scrollPosition, behavior: 'instant' })
      }
    })
  }, [])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const content = {
        hero: settings.hero,
        video: settings.video,
        features: settings.features,
        features_title: settings.features_title,
        features_subtitle: settings.features_subtitle,
        gallery: settings.gallery,
        gallery_title: settings.gallery_title,
        product_showcase: settings.product_showcase,
        featured_products: settings.featured_products,
        featured_products_links: settings.featured_products_links || {},
        featured_subtitle: settings.featured_subtitle,
        cta_title: settings.cta_title,
        cta_description: settings.cta_description,
        cta_text: settings.cta_text,
        cta_link: settings.cta_link,
        sections: [],
      }

      const { error } = await supabase
        .from('product_catalogs')
        .update({
          title: settings.title,
          description: settings.description,
          cover_image: settings.cover_image,
          theme_colors: settings.theme_colors,
          content: content,
        })
        .eq('id', versionId)

      if (error) throw error
      toast.success('Catálogo salvo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar catálogo:', error)
      toast.error('Erro ao salvar catálogo')
    } finally {
      setSaving(false)
    }
  }

  const toggleFeaturedProduct = (productId: string) => {
    setSettings(prev => {
      const featured = prev.featured_products || []
      if (featured.includes(productId)) {
        return {
          ...prev,
          featured_products: featured.filter(id => id !== productId)
        }
      } else {
        return {
          ...prev,
          featured_products: [...featured, productId]
        }
      }
    })
  }

  const toggleProductInCategory = useCallback((productId: string, categoryId: string) => {
    setSettings(prev => {
      const categories = [...(prev.categories || [])]
      const categoryIndex = categories.findIndex(cat => cat.id === categoryId)
      if (categoryIndex === -1) return prev
      
      const products = categories[categoryIndex].products || []
      
      if (products.includes(productId)) {
        categories[categoryIndex].products = products.filter((id: string) => id !== productId)
      } else {
        categories[categoryIndex].products = [...products, productId]
      }
      
      return { ...prev, categories }
    })
  }, [])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!catalog) {
    return null
  }

  // Mapeamento de seções com ícones emoji
  const sectionIcons: Record<string, string> = {
    hero: '🎯',
    video: '🎬',
    features: '✨',
    gallery: '🖼️',
    showcase: '⭐',
    featured: '🔥',
    cta: '🚀',
    featured_subtitle: '📝',
  }

  const sectionOrder = ['hero', 'video', 'features', 'gallery', 'showcase', 'featured_subtitle', 'featured', 'cta']
  const sectionIndexMap = new Map(sectionOrder.map((s, i) => [s, i]))

  const SectionWrapper = memo(({ section, icon, title, children, index, isExpanded, onToggleExpand }: any) => {
    const sectionIndex = sectionIndexMap.get(section) ?? index ?? 0
    const emojiIcon = sectionIcons[section] || '📄'
    
    const handleToggleExpand = useCallback(() => {
      onToggleExpand(isExpanded ? null : section)
    }, [isExpanded, section, onToggleExpand])
    
    return (
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden mb-4"
      >
        {/* Header da Seção - Estilo Apple */}
        <div
          className="p-4 flex items-center justify-between bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handleToggleExpand}
        >
          <div className="flex items-center gap-3">
            <GripVertical size={18} className="text-gray-400" />
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
              {sectionIndex + 1}
            </span>
            <span className="text-xl">{emojiIcon}</span>
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {/* Conteúdo colapsável */}
        {isExpanded && (
          <div
            className="p-6 border-t"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        )}
      </div>
    )
  }, (prevProps, nextProps) => {
    // Comparação customizada: só re-renderiza se realmente necessário
    if (prevProps.isExpanded !== nextProps.isExpanded) return false
    if (prevProps.index !== nextProps.index) return false
    if (prevProps.section !== nextProps.section) return false
    // Se está expandida, comparar children (conteúdo)
    if (prevProps.isExpanded && nextProps.isExpanded) {
      return prevProps.children === nextProps.children
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/catalogos"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Editar: {catalog.title}</h1>
                <p className="text-sm text-gray-500">Catálogo de Produtos /catalogo/{catalog.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Home size={18} />
                Dashboard
              </Link>
              <Link
                href={`/catalogo/${catalog.slug}`}
                target="_blank"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye size={18} />
                Ver Prévia
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-6">Conteúdo do Catálogo</h2>
              
              {/* Dica */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Clique em cada seção para expandir e editar. Todas as seções já estão pré-configuradas e prontas para uso.
                </p>
              </div>

              {/* Hero */}
              <SectionWrapper section="hero" icon={<Package size={18} />} title="Seção Hero (Topo)" index={0} isExpanded={expandedSection === "hero"} onToggleExpand={setExpandedSection}>
                <div className="space-y-4">
                  <Input
                    label="Título do Hero"
                    value={settings.hero.title}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        hero: { ...prev.hero, title: newValue }
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Smart Watch"
                  />
                  <Input
                    label="Subtítulo"
                    value={settings.hero.subtitle}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        hero: { ...prev.hero, subtitle: newValue }
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="O mais poderoso de todos os tempos."
                  />
                  <Input
                    label="Badge (ex: Novo)"
                    value={settings.hero.badge}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        hero: { ...prev.hero, badge: newValue }
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Novo"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Imagem do Hero</label>
                    {/* Preview da Imagem do Hero */}
                    {settings.hero.image && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview da Imagem do Hero:</p>
                        <div className="relative aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={settings.hero.image} 
                            alt="Hero preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Esta imagem aparecerá no topo do catálogo</p>
                      </div>
                    )}
                    <ImageUploader
                      value={settings.hero.image}
                      onChange={(url) => setSettings(prev => ({
                        ...prev,
                        hero: { ...prev.hero, image: url }
                      }))}
                      placeholder="Clique para fazer upload da imagem do hero"
                      recommendedDimensions="1920 x 1080px (Banner horizontal)"
                      cropType="banner"
                    />
                  </div>
                  <Input
                    label="Texto do Botão CTA"
                    value={settings.hero.cta_text || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        hero: { ...prev.hero, cta_text: newValue }
                      }))
                    }}
                    placeholder="Comprar Agora"
                  />
                  <Input
                    label="Link do Botão CTA"
                    value={settings.hero.cta_link || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        hero: { ...prev.hero, cta_link: newValue }
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="/comparar"
                  />
                </div>
              </SectionWrapper>

              {/* Vídeo */}
              <SectionWrapper section="video" icon={<Package size={18} />} title="Seção de Vídeo" index={2} isExpanded={expandedSection === "video"} onToggleExpand={setExpandedSection}>
                <div className="space-y-4">
                  {/* Preview do Vídeo - Sempre mostra */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview do Vídeo:</p>
                    <div className={`relative bg-black rounded-lg overflow-hidden ${
                      settings.video?.orientation === 'vertical' 
                        ? 'aspect-[9/16] max-w-sm mx-auto' 
                        : 'aspect-video'
                    }`}>
                      {!settings.video?.url ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Play size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm opacity-50">Sem vídeo</p>
                          </div>
                        </div>
                      ) : (() => {
                        // Verificar se é YouTube
                        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
                        const match = settings.video.url.match(youtubeRegex)
                        const youtubeId = match ? match[1] : null

                        if (youtubeId) {
                          // Preview do YouTube
                          return (
                            <iframe
                              src={`https://www.youtube.com/embed/${youtubeId}`}
                              title="Video preview"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          )
                        } else {
                          // Preview de vídeo direto (upload)
                          return (
                            <video
                              src={settings.video.url}
                              controls
                              className="w-full h-full object-cover"
                              style={{ backgroundColor: '#000000' }}
                            >
                              Seu navegador não suporta vídeo.
                            </video>
                          )
                        }
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Este vídeo aparecerá na seção de vídeo do catálogo</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">URL do Vídeo (YouTube) ou Upload</label>
                    <div className="space-y-2">
                      <Input
                        value={settings.video?.url || ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          updateSettingsWithScrollProtection(prev => ({
                            ...prev,
                            video: { ...prev.video, url: newValue } as any
                          }))
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="https://www.youtube.com/watch?v=... ou faça upload abaixo"
                      />
                      <VideoUploader
                        value={settings.video?.url || ''}
                        orientation={settings.video?.orientation || 'horizontal'}
                        onOrientationChange={(orientation) => updateSettingsWithScrollProtection(prev => ({
                          ...prev,
                          video: { ...prev.video, orientation, url: prev.video?.url || '' } as any
                        }))}
                        onChange={(url) => updateSettingsWithScrollProtection(prev => ({
                          ...prev,
                          video: { ...prev.video, url: url, orientation: prev.video?.orientation || 'horizontal' } as any
                        }))}
                        placeholder="Ou faça upload de um vídeo"
                      />
                    </div>
                  </div>
                  <Input
                    label="Título"
                    value={settings.video?.title || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        video: { ...prev.video, title: newValue } as any
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <textarea
                      value={settings.video?.description || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        updateSettingsWithScrollProtection(prev => ({
                          ...prev,
                          video: { ...prev.video, description: newValue } as any
                        }))
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full border rounded-lg px-4 py-2.5"
                      rows={3}
                    />
                  </div>
                </div>
              </SectionWrapper>

              {/* Features */}
              <SectionWrapper section="features" icon={<Package size={18} />} title={`Features (${settings.features?.length || 0})`} index={3} isExpanded={expandedSection === "features"} onToggleExpand={setExpandedSection}>
                <div className="space-y-4">
                  <Input
                    label="Título da Seção"
                    value={settings.features_title || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({ ...prev, features_title: newValue }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <Input
                    label="Subtítulo"
                    value={settings.features_subtitle || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({ ...prev, features_subtitle: newValue }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div className="space-y-3">
                    {(settings.features || []).map((feature, index) => (
                      <div key={`feature-${index}-${feature.title || ''}`} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">Feature {index + 1}</h4>
                          <button
                            onClick={() => {
                              setSettings(prev => {
                                const features = [...(prev.features || [])]
                                features.splice(index, 1)
                                return { ...prev, features }
                              })
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <Input
                            label="Ícone (emoji ou texto)"
                            value={feature.icon || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              updateSettingsWithScrollProtection(prev => {
                                const features = [...(prev.features || [])]
                                features[index] = { ...features[index], icon: newValue }
                                return { ...prev, features }
                              })
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder="💡"
                          />
                          <Input
                            label="Título"
                            value={feature.title}
                            onChange={(e) => {
                              const newValue = e.target.value
                              updateSettingsWithScrollProtection(prev => {
                                const features = [...(prev.features || [])]
                                features[index] = { ...features[index], title: newValue }
                                return { ...prev, features }
                              })
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                          <div>
                            <label className="block text-sm font-medium mb-2">Descrição</label>
                            <textarea
                              value={feature.description}
                              onChange={(e) => {
                                const newValue = e.target.value
                                updateSettingsWithScrollProtection(prev => {
                                  const features = [...(prev.features || [])]
                                  features[index] = { ...features[index], description: newValue }
                                  return { ...prev, features }
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="w-full border rounded-lg px-4 py-2.5"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          features: [...(prev.features || []), { title: '', description: '', icon: '' }]
                        }))
                      }}
                      className="w-full py-2 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Adicionar Feature
                    </button>
                  </div>
                </div>
              </SectionWrapper>

              {/* Gallery */}
              <SectionWrapper section="gallery" icon={<Package size={18} />} title={`Galeria (${settings.gallery?.length || 0})`} index={4} isExpanded={expandedSection === "gallery"} onToggleExpand={setExpandedSection}>
                <div className="space-y-4">
                  <Input
                    label="Título da Galeria"
                    value={settings.gallery_title || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({ ...prev, gallery_title: newValue }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Imagens da Galeria</label>
                    <ArrayImageManager
                      value={settings.gallery || []}
                      onChange={(images) => updateSettingsWithScrollProtection(prev => ({ ...prev, gallery: images }))}
                      maxImages={10}
                      label=""
                    />
                  </div>
                </div>
              </SectionWrapper>

              {/* Product Showcase */}
              <SectionWrapper section="showcase" icon={<Package size={18} />} title="Destaque de Produto" index={5} isExpanded={expandedSection === "showcase"} onToggleExpand={setExpandedSection}>
                <div className="space-y-4">
                  <Input
                    label="Título"
                    value={settings.product_showcase?.title || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        product_showcase: { ...prev.product_showcase, title: newValue } as any
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <textarea
                      value={settings.product_showcase?.description || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        updateSettingsWithScrollProtection(prev => ({
                          ...prev,
                          product_showcase: { ...prev.product_showcase, description: newValue } as any
                        }))
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full border rounded-lg px-4 py-2.5"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Imagem</label>
                    <ImageUploader
                      value={settings.product_showcase?.image || ''}
                      onChange={(url) => updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        product_showcase: { ...prev.product_showcase, image: url } as any
                      }))}
                      placeholder="Clique para fazer upload da imagem"
                      recommendedDimensions="1920 x 1080px"
                      cropType="banner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Features (uma por linha)</label>
                    <textarea
                      value={(settings.product_showcase?.features || []).join('\n')}
                      onChange={(e) => {
                        const newValue = e.target.value
                        updateSettingsWithScrollProtection(prev => ({
                          ...prev,
                          product_showcase: { 
                            ...prev.product_showcase, 
                            features: newValue.split('\n').filter(Boolean) 
                          } as any
                        }))
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full border rounded-lg px-4 py-2.5"
                      rows={4}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>
                  <Input
                    label="Texto do Botão CTA"
                    value={settings.product_showcase?.cta_text || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({
                        ...prev,
                        product_showcase: { ...prev.product_showcase, cta_text: newValue } as any
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Comprar Agora"
                  />
                  <Input
                    label="Link do Botão CTA"
                    value={settings.product_showcase?.cta_link || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setSettings(prev => ({
                        ...prev,
                        product_showcase: { ...prev.product_showcase, cta_link: newValue } as any
                      }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="/comparar"
                  />
                </div>
              </SectionWrapper>

              {/* Produtos em Destaque - Subtítulo */}
              <SectionWrapper section="featured_subtitle" icon={<Package size={18} />} title="Subtítulo dos Produtos em Destaque" index={6} isExpanded={expandedSection === "featured_subtitle"} onToggleExpand={setExpandedSection}>
                <Input
                  label="Subtítulo"
                  value={settings.featured_subtitle || ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                    updateSettingsWithScrollProtection(prev => ({ ...prev, featured_subtitle: newValue }))
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Veja nossa coleção completa"
                />
              </SectionWrapper>

              {/* Produtos em Destaque */}
              <SectionWrapper section="featured" icon={<Package size={18} />} title={`Produtos em Destaque (${settings.featured_products.length})`} index={7} isExpanded={expandedSection === "featured"} onToggleExpand={setExpandedSection}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-4">
                    {products.map(product => (
                      <label 
                        key={product.id}
                        className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 text-sm ${
                          settings.featured_products.includes(product.id) ? 'border-purple-500 bg-purple-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={settings.featured_products.includes(product.id)}
                          onChange={() => toggleFeaturedProduct(product.id)}
                          className="rounded"
                        />
                        <span className="truncate">{product.name}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Links customizados para produtos destacados */}
                  {settings.featured_products.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Links customizados (opcional - deixe vazio para usar link padrão do produto):</p>
                      <div className="space-y-3">
                        {settings.featured_products.map(productId => {
                          const product = products.find(p => p.id === productId)
                          if (!product) return null
                          return (
                            <div key={productId} className="border rounded-lg p-3">
                              <label className="block text-sm font-medium mb-1">{product.name}</label>
                              <Input
                                type="url"
                                value={settings.featured_products_links?.[productId] || ''}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  updateSettingsWithScrollProtection(prev => ({
                                    ...prev,
                                    featured_products_links: {
                                      ...prev.featured_products_links,
                                      [productId]: newValue
                                    }
                                  }))
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                placeholder={product.ecommerce_url || `/produto/${product.slug}`}
                              />
                              <p className="text-xs text-gray-500 mt-1">Deixe vazio para usar: {product.ecommerce_url || `/produto/${product.slug}`}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </SectionWrapper>

              {/* CTA Final */}
              <SectionWrapper section="cta" icon={<Package size={18} />} title="CTA Final" index={7} isExpanded={expandedSection === "cta"} onToggleExpand={setExpandedSection}>
                <div className="space-y-4">
                  <Input
                    label="Título"
                    value={settings.cta_title || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({ ...prev, cta_title: newValue }))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <textarea
                      value={settings.cta_description || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        updateSettingsWithScrollProtection(prev => ({ ...prev, cta_description: newValue }))
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full border rounded-lg px-4 py-2.5"
                      rows={2}
                    />
                  </div>
                  <Input
                    label="Texto do Botão"
                    value={settings.cta_text || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({ ...prev, cta_text: newValue }))
                    }}
                    placeholder="Ver todos os produtos"
                  />
                  <Input
                    label="Link do Botão"
                    value={settings.cta_link || ''}
                    onChange={(e) => {
                      const newValue = e.target.value
                      updateSettingsWithScrollProtection(prev => ({ ...prev, cta_link: newValue }))
                    }}
                    placeholder="/comparar"
                  />
                </div>
              </SectionWrapper>
            </div>
          </div>

          {/* Sidebar - Cores */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Palette size={20} />
                Cores do Tema
              </h2>
              <div className="space-y-4">
                {Object.entries(settings.theme_colors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2 capitalize">{key}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateSettingsWithScrollProtection(prev => ({
                          ...prev,
                          theme_colors: { ...prev.theme_colors, [key]: e.target.value }
                        }))}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateSettingsWithScrollProtection(prev => ({
                          ...prev,
                          theme_colors: { ...prev.theme_colors, [key]: e.target.value }
                        }))}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditCatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    }>
      <EditCatalogContent />
    </Suspense>
  )
}

