'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'
import { BenefitsManager } from '@/components/ui/BenefitsManager'
import { GiftsManager } from '@/components/ui/GiftsManager'
import { AlternateContentManager } from '@/components/ui/AlternateContentManager'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types'
import { ServiceDetailContent } from '@/types/service-detail'
import { Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { BackButton } from '@/components/ui/BackButton'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { SectionWrapper } from '@/components/editor/section-wrapper'

interface EditServicePageProps {
  params: { id: string }
}

// Mapeamento de seções
const sectionIcons: Record<string, string> = {
  basic: '📝',
  hero: '🎥',
  benefits: '📋',
  gifts: '🎁',
  alternate: '🔄',
  about: '👥',
  testimonials: '💬',
  cta: '📞',
}

const sectionLabels: Record<string, string> = {
  basic: 'Informações Básicas',
  hero: 'Hero com Vídeo',
  benefits: 'O que você receberá',
  gifts: 'Ganhe esses presentes',
  alternate: 'Conteúdo Alternado',
  about: 'Quem somos nós',
  testimonials: 'Depoimentos',
  cta: 'CTA Final',
}

export default function EditServicePage({ params }: EditServicePageProps) {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingCategories, setExistingCategories] = useState<string[]>([])
  const [expandedSection, setExpandedSection] = useState<string | null>('basic')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'basic',
    'hero',
    'benefits',
    'gifts',
    'alternate',
    'about',
    'testimonials',
    'cta',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    basic: true,
    hero: true,
    benefits: true,
    gifts: true,
    alternate: true,
    about: true,
    testimonials: true,
    cta: true,
  })
  const supabase = createClient()

  // Dados básicos do serviço
  const [basicData, setBasicData] = useState({
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

  // Layout detalhado
  const [layoutData, setLayoutData] = useState<ServiceDetailContent>({
    hero_enabled: true,
    hero_video_url: '',
    hero_video_autoplay: false,
    hero_title: '',
    hero_title_highlight: '',
    hero_title_highlight_color: '#00D9FF',
    hero_subtitle: '',

    benefits_enabled: true,
    benefits_title: 'O que você receberá dentro da MV Company',
    benefits_items: [],

    gifts_enabled: true,
    gifts_title: 'Ganhe esses presentes entrando agora',
    gifts_items: [],

    alternate_content_enabled: true,
    alternate_content_items: [],

    about_enabled: true,
    about_title: 'Quem somos nós',
    about_image: '',
    about_text: '',

    testimonials_enabled: true,
    testimonials_title: 'Todos os dias recebemos esse tipo de depoimentos',
    testimonials_stats: 'Mais de 60 clientes satisfeitos',

    cta_enabled: true,
    cta_title: 'Entenda mais e entre em contato conosco',
    cta_description: 'Inicie seu planejamento hoje mesmo',
    cta_whatsapp_enabled: true,
    cta_whatsapp_number: '',
    cta_email_enabled: true,
    cta_email_address: '',
    cta_instagram_enabled: true,
    cta_instagram_url: '',
  })

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
      setBasicData({
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

      // Carregar layout se existir
      if (data.detail_layout) {
        const layout = data.detail_layout as ServiceDetailContent
        setLayoutData(prev => ({ ...prev, ...layout }))
        
        if (layout.section_order) {
          setSectionOrder(layout.section_order)
        }
        if (layout.section_visibility) {
          setSectionVisibility(layout.section_visibility)
        }
      }
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
    setBasicData({ ...basicData, name })
    // Gerar slug automaticamente apenas se estiver vazio
    if (!basicData.slug) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setBasicData(prev => ({ ...prev, slug }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !basicData.tags.includes(tagInput.trim())) {
      setBasicData({
        ...basicData,
        tags: [...basicData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setBasicData({
      ...basicData,
      tags: basicData.tags.filter(tag => tag !== tagToRemove),
    })
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sectionOrder.indexOf(sectionId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sectionOrder.length) return

    const newOrder = [...sectionOrder]
    const [removed] = newOrder.splice(currentIndex, 1)
    newOrder.splice(newIndex, 0, removed)
    
    setSectionOrder(newOrder)
    toast.success(`Seção movida ${direction === 'up' ? 'para cima' : 'para baixo'}!`)
  }

  const toggleSectionVisibility = (section: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
    
    // Atualizar enabled do layout se for seção de layout
    if (section !== 'basic') {
      const enabledKey = `${section}_enabled` as keyof ServiceDetailContent
      setLayoutData(prev => ({
        ...prev,
        [enabledKey]: !sectionVisibility[section]
      }))
    }
    
    toast.success(`Seção ${sectionVisibility[section] ? 'oculta' : 'visível'}!`)
  }

  const handleSave = async () => {
    if (!basicData.name || !basicData.slug) {
      toast.error('Preencha pelo menos o nome do serviço')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('services')
        .update({
          ...basicData,
          tags: basicData.tags.length > 0 ? basicData.tags : null,
          detail_layout: {
            ...layoutData,
            section_order: sectionOrder,
            section_visibility: sectionVisibility,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success('Serviço atualizado com sucesso!')
      // Não redirecionar - manter no editor
    } catch (error: any) {
      console.error('Erro ao atualizar serviço:', error)
      toast.error(error.message || 'Erro ao atualizar serviço')
    } finally {
      setSaving(false)
    }
  }

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'basic':
        return (
          <div className="space-y-4">
            <Input
              label="Nome do Serviço *"
              value={basicData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Criação de Sites Responsivos"
            />

            <Input
              label="Slug (URL) *"
              value={basicData.slug}
              onChange={(e) => setBasicData({ ...basicData, slug: e.target.value })}
              placeholder="criacao-de-sites-responsivos"
            />
            <p className="text-xs text-gray-500 -mt-2">
              URL amigável do serviço. Gerado automaticamente a partir do nome.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <div className="flex gap-2">
                <select
                  value={basicData.category}
                  onChange={(e) => setBasicData({ ...basicData, category: e.target.value })}
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
                  value={basicData.category}
                  onChange={(e) => setBasicData({ ...basicData, category: e.target.value })}
                  placeholder="Ou digite uma nova"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição Curta</label>
              <textarea
                value={basicData.short_description}
                onChange={(e) => setBasicData({ ...basicData, short_description: e.target.value })}
                placeholder="Breve descrição do serviço (2-3 linhas)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição Completa</label>
              <textarea
                value={basicData.full_description}
                onChange={(e) => setBasicData({ ...basicData, full_description: e.target.value })}
                placeholder="Descrição detalhada do serviço"
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

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
              {basicData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {basicData.tags.map((tag) => (
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

            <div>
              <label className="block text-sm font-medium mb-2">Imagem de Capa</label>
              <ImageUploader
                value={basicData.cover_image}
                onChange={(url) => setBasicData({ ...basicData, cover_image: url })}
                cropType="banner"
                recommendedDimensions="1920x1080px (16:9)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Galeria de Imagens</label>
              <ArrayImageManager
                value={basicData.images || []}
                onChange={(images) => setBasicData({ ...basicData, images })}
                cropType="square"
                aspectRatio={1}
                recommendedDimensions="800x800px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vídeo Explicativo (URL)</label>
              <VideoUploader
                value={basicData.video_url}
                onChange={(url) => setBasicData({ ...basicData, video_url: url })}
              />
              <p className="text-xs text-gray-500 mt-2">
                URL do vídeo (YouTube, Vimeo, etc.) ou faça upload
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Investimento</label>
                <Input
                  value={basicData.price_range}
                  onChange={(e) => setBasicData({ ...basicData, price_range: e.target.value })}
                  placeholder="Ex: A partir de R$ 1.500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tempo de Entrega</label>
                <Input
                  value={basicData.delivery_time}
                  onChange={(e) => setBasicData({ ...basicData, delivery_time: e.target.value })}
                  placeholder="Ex: 15-30 dias"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Meta Title (SEO)</label>
                <Input
                  value={basicData.meta_title}
                  onChange={(e) => setBasicData({ ...basicData, meta_title: e.target.value })}
                  placeholder="Título para SEO (máx. 60 caracteres)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Meta Description (SEO)</label>
                <textarea
                  value={basicData.meta_description}
                  onChange={(e) => setBasicData({ ...basicData, meta_description: e.target.value })}
                  placeholder="Descrição para SEO (máx. 160 caracteres)"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={basicData.is_active}
                  onChange={(e) => setBasicData({ ...basicData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Serviço ativo
                </label>
              </div>
            </div>
          </div>
        )

      case 'hero':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Hero com Vídeo"
              checked={layoutData.hero_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, hero_enabled: checked })}
            />
            {layoutData.hero_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">URL do Vídeo</label>
                  <VideoUploader
                    value={layoutData.hero_video_url || ''}
                    onChange={(url) => setLayoutData({ ...layoutData, hero_video_url: url })}
                    placeholder="URL do vídeo ou upload"
                  />
                </div>
                <Switch
                  label="Auto-play do vídeo (reproduzir automaticamente)"
                  checked={layoutData.hero_video_autoplay ?? false}
                  onCheckedChange={(checked) => setLayoutData({ ...layoutData, hero_video_autoplay: checked })}
                />
                <Input
                  label="Título Principal"
                  value={layoutData.hero_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, hero_title: e.target.value })}
                  placeholder="Ex: Aprenda esses 2 ajustes..."
                />
                <Input
                  label="Palavra para Destacar (dentro do título)"
                  value={layoutData.hero_title_highlight || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, hero_title_highlight: e.target.value })}
                  placeholder="Ex: preguiçosos"
                />
                <div className="flex items-center gap-4">
                  <Input
                    label="Cor da Palavra Destacada"
                    value={layoutData.hero_title_highlight_color || '#00D9FF'}
                    onChange={(e) => setLayoutData({ ...layoutData, hero_title_highlight_color: e.target.value })}
                    type="color"
                    className="w-24 h-12"
                  />
                  <div className="flex-1">
                    <Input
                      label=""
                      value={layoutData.hero_title_highlight_color || '#00D9FF'}
                      onChange={(e) => setLayoutData({ ...layoutData, hero_title_highlight_color: e.target.value })}
                      placeholder="#00D9FF"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <textarea
                    value={layoutData.hero_subtitle || ''}
                    onChange={(e) => setLayoutData({ ...layoutData, hero_subtitle: e.target.value })}
                    placeholder="Subtítulo descritivo..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )

      case 'benefits':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção 'O que você receberá'"
              checked={layoutData.benefits_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, benefits_enabled: checked })}
            />
            {layoutData.benefits_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={layoutData.benefits_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, benefits_title: e.target.value })}
                  placeholder="Ex: O que você receberá dentro da MV Company"
                />
                <BenefitsManager
                  value={layoutData.benefits_items || []}
                  onChange={(items) => setLayoutData({ ...layoutData, benefits_items: items })}
                />
              </>
            )}
          </div>
        )

      case 'gifts':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção 'Ganhe esses presentes'"
              checked={layoutData.gifts_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, gifts_enabled: checked })}
            />
            {layoutData.gifts_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={layoutData.gifts_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, gifts_title: e.target.value })}
                  placeholder="Ex: Ganhe esses presentes entrando agora"
                />
                <GiftsManager
                  value={layoutData.gifts_items || []}
                  onChange={(items) => setLayoutData({ ...layoutData, gifts_items: items })}
                />
              </>
            )}
          </div>
        )

      case 'alternate':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Conteúdo Alternado"
              checked={layoutData.alternate_content_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, alternate_content_enabled: checked })}
            />
            {layoutData.alternate_content_enabled && (
              <AlternateContentManager
                value={layoutData.alternate_content_items || []}
                onChange={(items) => setLayoutData({ ...layoutData, alternate_content_items: items })}
              />
            )}
          </div>
        )

      case 'about':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção 'Quem somos nós'"
              checked={layoutData.about_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, about_enabled: checked })}
            />
            {layoutData.about_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={layoutData.about_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, about_title: e.target.value })}
                  placeholder="Ex: Quem somos nós"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Foto dos Donos (PNG transparente recomendado)</label>
                  <ImageUploader
                    value={layoutData.about_image || ''}
                    onChange={(url) => setLayoutData({ ...layoutData, about_image: url })}
                    placeholder="Upload de foto"
                    cropType="square"
                    aspectRatio={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Texto sobre a empresa</label>
                  <textarea
                    value={layoutData.about_text || ''}
                    onChange={(e) => setLayoutData({ ...layoutData, about_text: e.target.value })}
                    placeholder="Texto sobre a empresa..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )

      case 'testimonials':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Depoimentos"
              checked={layoutData.testimonials_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, testimonials_enabled: checked })}
            />
            {layoutData.testimonials_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={layoutData.testimonials_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, testimonials_title: e.target.value })}
                  placeholder="Ex: Todos os dias recebemos esse tipo de depoimentos"
                />
                <Input
                  label="Estatística (ex: Mais de 60 clientes satisfeitos)"
                  value={layoutData.testimonials_stats || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, testimonials_stats: e.target.value })}
                  placeholder="Ex: Mais de 60 clientes satisfeitos"
                />
                <p className="text-sm text-gray-500">
                  Os depoimentos são gerenciados na seção "Avaliações" do dashboard.
                </p>
              </>
            )}
          </div>
        )

      case 'cta':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar CTA Final"
              checked={layoutData.cta_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_enabled: checked })}
            />
            {layoutData.cta_enabled && (
              <>
                <Input
                  label="Título do CTA"
                  value={layoutData.cta_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, cta_title: e.target.value })}
                  placeholder="Ex: Entenda mais e entre em contato conosco"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={layoutData.cta_description || ''}
                    onChange={(e) => setLayoutData({ ...layoutData, cta_description: e.target.value })}
                    placeholder="Ex: Inicie seu planejamento hoje mesmo"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                  <h3 className="font-semibold">Contatos</h3>
                  <Switch
                    label="Habilitar WhatsApp"
                    checked={layoutData.cta_whatsapp_enabled ?? true}
                    onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_whatsapp_enabled: checked })}
                  />
                  {layoutData.cta_whatsapp_enabled && (
                    <Input
                      label="Número do WhatsApp (com DDD, ex: 5534984136291)"
                      value={layoutData.cta_whatsapp_number || ''}
                      onChange={(e) => setLayoutData({ ...layoutData, cta_whatsapp_number: e.target.value })}
                      placeholder="Ex: 5534984136291"
                    />
                  )}
                  <Switch
                    label="Habilitar E-mail"
                    checked={layoutData.cta_email_enabled ?? true}
                    onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_email_enabled: checked })}
                  />
                  {layoutData.cta_email_enabled && (
                    <Input
                      label="Endereço de E-mail"
                      value={layoutData.cta_email_address || ''}
                      onChange={(e) => setLayoutData({ ...layoutData, cta_email_address: e.target.value })}
                      placeholder="Ex: contato@mvcompany.com.br"
                    />
                  )}
                  <Switch
                    label="Habilitar Instagram"
                    checked={layoutData.cta_instagram_enabled ?? true}
                    onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_instagram_enabled: checked })}
                  />
                  {layoutData.cta_instagram_enabled && (
                    <Input
                      label="URL do Instagram"
                      value={layoutData.cta_instagram_url || ''}
                      onChange={(e) => setLayoutData({ ...layoutData, cta_instagram_url: e.target.value })}
                      placeholder="Ex: https://instagram.com/mvcompany"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )

      default:
        return <div className="text-gray-500 text-center py-4">Conteúdo da seção {sectionId}</div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardNavigation
          title="Editar Serviço"
          subtitle={service.name}
          backUrl="/dashboard/portfolio"
          backLabel="Voltar para Lista"
          actions={
            <div className="flex gap-3">
              <Link href={`/portfolio/${basicData.slug || service.slug}`} target="_blank">
                <Button variant="outline" size="lg">
                  <Eye size={18} className="mr-2" />
                  Ver Preview
                </Button>
              </Link>
              <Button onClick={handleSave} isLoading={saving} size="lg">
                <Save size={18} className="mr-2" />
                Salvar Alterações
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Editor Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Seções do Serviço</h2>
              </div>

              {/* Dica */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Use as setas ↑↓ para reordenar. 
                  Clique no 👁️ para ocultar/mostrar. 
                  Clique na seção para expandir e editar.
                </p>
              </div>

              {/* Seções */}
              {sectionOrder.map((sectionId, index) => (
                <SectionWrapper
                  key={sectionId}
                  section={sectionId}
                  icon={sectionIcons[sectionId] || '📄'}
                  title={sectionLabels[sectionId] || sectionId}
                  expandedSection={expandedSection}
                  setExpandedSection={setExpandedSection}
                  index={index}
                  toggleSectionVisibility={toggleSectionVisibility}
                  isVisible={sectionVisibility[sectionId] ?? true}
                  moveSection={moveSection}
                  sectionOrder={sectionOrder}
                >
                  {renderSectionContent(sectionId)}
                </SectionWrapper>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sidebar removida - botão já está no header */}
          </div>
        </div>
      </div>
    </div>
  )
}
