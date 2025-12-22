'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'
import { BenefitsManager } from '@/components/ui/BenefitsManager'
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
  scroll_animation: '📱',
  benefits: '📋',
  alternate: '🔄',
  pricing: '💰',
  cta: '📞',
}

const sectionLabels: Record<string, string> = {
  basic: 'Informações Básicas',
  hero: 'Hero com Vídeo',
  scroll_animation: 'Animação de Scroll',
  benefits: 'O que você receberá',
  alternate: 'Conteúdo Alternado',
  pricing: 'Planos de Assinatura',
  cta: 'Contato',
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
    'scroll_animation',
    'benefits',
    'alternate',
    'pricing',
    'cta',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    basic: true,
    hero: true,
    scroll_animation: true,
    benefits: true,
    alternate: true,
    pricing: false,
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
    hero_subtitle: '',

    benefits_enabled: true,
    benefits_title: 'O que você receberá dentro da MV Company',
    benefits_items: [],

    alternate_content_enabled: true,
    alternate_content_items: [],

    cta_enabled: true,
    cta_title: 'Fale Conosco',
    cta_description: 'Inicie seu planejamento hoje mesmo',
    cta_whatsapp_enabled: true,
    cta_whatsapp_number: '',
    cta_whatsapp_text: 'WhatsApp',
    cta_email_enabled: true,
    cta_email_address: '',
    cta_email_text: 'E-mail',
    cta_instagram_enabled: true,
    cta_instagram_url: '',
    cta_instagram_text: 'Instagram',
    whatsapp_float_enabled: true,
    whatsapp_float_number: '',
    whatsapp_float_message: '',
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
        
        // Filtrar seções removidas (gifts, testimonials, about)
        if (layout.section_order) {
          const filteredOrder = layout.section_order.filter(
            (sectionId) => sectionId !== 'gifts' && sectionId !== 'testimonials' && sectionId !== 'about'
          )
          // Garantir que 'pricing' esteja presente antes de 'cta' e 'scroll_animation' esteja presente
          let finalOrder = filteredOrder.length > 0 ? filteredOrder : ['basic', 'hero', 'scroll_animation', 'benefits', 'alternate', 'pricing', 'cta']
          if (!finalOrder.includes('scroll_animation') && finalOrder.includes('hero')) {
            const heroIndex = finalOrder.indexOf('hero')
            finalOrder.splice(heroIndex + 1, 0, 'scroll_animation')
          } else if (!finalOrder.includes('scroll_animation')) {
            finalOrder.splice(2, 0, 'scroll_animation')
          }
          if (!finalOrder.includes('pricing') && finalOrder.includes('cta')) {
            const ctaIndex = finalOrder.indexOf('cta')
            finalOrder.splice(ctaIndex, 0, 'pricing')
          } else if (!finalOrder.includes('pricing')) {
            finalOrder.push('pricing')
          }
          setSectionOrder(finalOrder)
        }
        if (layout.section_visibility) {
          const filteredVisibility = { ...layout.section_visibility }
          delete filteredVisibility.gifts
          delete filteredVisibility.testimonials
          delete filteredVisibility.about
          // Garantir que 'pricing' e 'scroll_animation' estejam presentes na visibilidade
          if (filteredVisibility.pricing === undefined) {
            filteredVisibility.pricing = false
          }
          if (filteredVisibility.scroll_animation === undefined) {
            filteredVisibility.scroll_animation = true
          }
          setSectionVisibility(filteredVisibility)
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
            <p className="text-sm text-gray-500">
              O slug (URL) é gerado automaticamente a partir do nome. Você pode editar o layout completo nas seções abaixo.
            </p>
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

      case 'scroll_animation':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Animação de Scroll"
              checked={layoutData.scroll_animation_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, scroll_animation_enabled: checked })}
            />
            {layoutData.scroll_animation_enabled && (
              <>
                <Input
                  label="Título Principal"
                  value={layoutData.scroll_animation_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, scroll_animation_title: e.target.value })}
                  placeholder="Ex: Descubra o poder do"
                />
                <Input
                  label="Subtítulo (Nome do Serviço)"
                  value={layoutData.scroll_animation_subtitle || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, scroll_animation_subtitle: e.target.value })}
                  placeholder="Ex: Tráfego Pago"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Imagem</label>
                  <ImageUploader
                    value={layoutData.scroll_animation_image || ''}
                    onChange={(url) => setLayoutData({ ...layoutData, scroll_animation_image: url })}
                    placeholder="Clique para fazer upload de uma imagem"
                    cropType="custom"
                    recommendedDimensions="Recomendado: 1400x720px ou proporção similar"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Se deixar vazio, será usada a imagem de capa do serviço ou a primeira imagem do array de imagens.
                  </p>
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

      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Informação:</strong> Os planos de assinatura são gerenciados exclusivamente na página{' '}
                <a href="/dashboard/pricing" className="text-blue-600 hover:underline font-semibold">
                  Gerenciar Planos de Assinatura
                </a>
                . A seção aparecerá automaticamente na homepage e nas páginas de serviços quando estiver habilitada na página de pricing.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Para configurar os planos, preços, features e mensagens do WhatsApp, acesse{' '}
              <a href="/dashboard/pricing" className="text-blue-600 hover:underline font-semibold">
                /dashboard/pricing
              </a>
            </p>
          </div>
        )

      case 'cta':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Contato"
              checked={layoutData.cta_enabled ?? true}
              onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_enabled: checked })}
            />
            {layoutData.cta_enabled && (
              <>
                <Input
                  label="Título"
                  value={layoutData.cta_title || ''}
                  onChange={(e) => setLayoutData({ ...layoutData, cta_title: e.target.value })}
                  placeholder="Ex: Fale Conosco"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={layoutData.cta_description || ''}
                    onChange={(e) => setLayoutData({ ...layoutData, cta_description: e.target.value })}
                    placeholder="Descrição do contato..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Botão WhatsApp</h3>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Habilitar WhatsApp</label>
                    <Switch
                      checked={layoutData.cta_whatsapp_enabled ?? true}
                      onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_whatsapp_enabled: checked })}
                    />
                  </div>
                  {layoutData.cta_whatsapp_enabled && (
                    <>
                      <Input
                        label="Número do WhatsApp (com DDD, ex: 5534984136291)"
                        value={layoutData.cta_whatsapp_number || ''}
                        onChange={(e) => setLayoutData({ ...layoutData, cta_whatsapp_number: e.target.value })}
                        placeholder="Ex: 5534984136291"
                      />
                      <Input
                        label="Texto do Botão WhatsApp"
                        value={layoutData.cta_whatsapp_text || ''}
                        onChange={(e) => setLayoutData({ ...layoutData, cta_whatsapp_text: e.target.value })}
                        placeholder="Ex: Falar no WhatsApp"
                      />
                    </>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Botão E-mail</h3>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Habilitar E-mail</label>
                    <Switch
                      checked={layoutData.cta_email_enabled ?? true}
                      onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_email_enabled: checked })}
                    />
                  </div>
                  {layoutData.cta_email_enabled && (
                    <>
                      <Input
                        label="Endereço de E-mail"
                        value={layoutData.cta_email_address || ''}
                        onChange={(e) => setLayoutData({ ...layoutData, cta_email_address: e.target.value })}
                        placeholder="Ex: contato@mvcompany.com"
                        type="email"
                      />
                      <Input
                        label="Texto do Botão E-mail"
                        value={layoutData.cta_email_text || ''}
                        onChange={(e) => setLayoutData({ ...layoutData, cta_email_text: e.target.value })}
                        placeholder="Ex: Enviar E-mail"
                      />
                    </>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Botão Instagram</h3>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Habilitar Instagram</label>
                    <Switch
                      checked={layoutData.cta_instagram_enabled ?? true}
                      onCheckedChange={(checked) => setLayoutData({ ...layoutData, cta_instagram_enabled: checked })}
                    />
                  </div>
                  {layoutData.cta_instagram_enabled && (
                    <>
                      <Input
                        label="URL do Instagram"
                        value={layoutData.cta_instagram_url || ''}
                        onChange={(e) => setLayoutData({ ...layoutData, cta_instagram_url: e.target.value })}
                        placeholder="Ex: https://instagram.com/mvcompany"
                      />
                      <Input
                        label="Texto do Botão Instagram"
                        value={layoutData.cta_instagram_text || ''}
                        onChange={(e) => setLayoutData({ ...layoutData, cta_instagram_text: e.target.value })}
                        placeholder="Ex: Instagram"
                      />
                    </>
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
            {/* Configuração do WhatsApp Flutuante */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>💬</span>
                WhatsApp Flutuante
              </h3>
              <div className="space-y-4">
                <Switch
                  label="Habilitar Botão Flutuante"
                  checked={layoutData.whatsapp_float_enabled ?? true}
                  onCheckedChange={(checked) => setLayoutData({ ...layoutData, whatsapp_float_enabled: checked })}
                />
                {layoutData.whatsapp_float_enabled && (
                  <>
                    <Input
                      label="Número do WhatsApp"
                      value={layoutData.whatsapp_float_number || ''}
                      onChange={(e) => setLayoutData({ ...layoutData, whatsapp_float_number: e.target.value })}
                      placeholder="Ex: 5534984136291"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Mensagem Inicial</label>
                      <textarea
                        value={layoutData.whatsapp_float_message || ''}
                        onChange={(e) => setLayoutData({ ...layoutData, whatsapp_float_message: e.target.value })}
                        placeholder="Ex: Olá! Gostaria de saber mais sobre este serviço."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Prévia Rápida */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Prévia Rápida</h2>
              <p className="text-gray-600 mb-4 text-sm">
                As alterações são salvas no banco de dados. Use o botão "Ver Preview" para visualizar o serviço completo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
