'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { BenefitsManager } from '@/components/ui/BenefitsManager'
import { GiftsManager } from '@/components/ui/GiftsManager'
import { AlternateContentManager } from '@/components/ui/AlternateContentManager'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types'
import { ServiceDetailContent } from '@/types/service-detail'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, Star, Copy, Check, Save, Layers, Package, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import Image from 'next/image'
import { SectionWrapper } from '@/components/editor/section-wrapper'

// Mapeamento de seções
const sectionIcons: Record<string, string> = {
  hero: '🎥',
  benefits: '📋',
  gifts: '🎁',
  alternate: '🔄',
  about: '👥',
  testimonials: '💬',
  cta: '📞',
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero com Vídeo',
  benefits: 'O que você receberá',
  gifts: 'Ganhe esses presentes',
  alternate: 'Conteúdo Alternado',
  about: 'Quem somos nós',
  testimonials: 'Depoimentos',
  cta: 'CTA Final',
}

type ViewMode = 'list' | 'layout'

export default function DashboardPortfolioPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  // Layout editor state
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('hero')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'benefits',
    'gifts',
    'alternate',
    'about',
    'testimonials',
    'cta',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    benefits: true,
    gifts: true,
    alternate: true,
    about: true,
    testimonials: true,
    cta: true,
  })
  const [formData, setFormData] = useState<ServiceDetailContent>({
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

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else if (mounted) {
        loadServices()
      }
    }

    return () => {
      mounted = false
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  // Carregar layout quando um serviço é selecionado
  useEffect(() => {
    if (selectedServiceId) {
      loadServiceLayout(selectedServiceId)
    }
  }, [selectedServiceId])

  const loadServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar serviços:', error)
        throw error
      }
      
      setServices(data as Service[] || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const loadServiceLayout = async (serviceId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('detail_layout')
        .eq('id', serviceId)
        .maybeSingle()

      if (error) throw error

      if (data?.detail_layout) {
        const layout = data.detail_layout as ServiceDetailContent
        setFormData(prev => ({ ...prev, ...layout }))
        
        if (layout.section_order) {
          setSectionOrder(layout.section_order)
        }
        if (layout.section_visibility) {
          setSectionVisibility(layout.section_visibility)
        }
      } else {
        // Reset para valores padrão se não houver layout salvo
        setFormData({
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
      }
    } catch (error) {
      console.error('Erro ao carregar layout do serviço:', error)
      toast.error('Erro ao carregar layout do serviço')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLayout = async () => {
    if (!selectedServiceId) {
      toast.error('Selecione um serviço primeiro')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('services')
        .update({
          detail_layout: {
            ...formData,
            section_order: sectionOrder,
            section_visibility: sectionVisibility,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedServiceId)

      if (error) throw error

      toast.success('Layout salvo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar layout:', error)
      toast.error(error?.message || 'Erro ao salvar layout')
    } finally {
      setSaving(false)
    }
  }

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId)

      if (error) throw error

      toast.success('Status atualizado')
      loadServices()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error

      toast.success('Serviço excluído')
      if (selectedServiceId === serviceId) {
        setSelectedServiceId(null)
        setViewMode('list')
      }
      loadServices()
    } catch (error) {
      toast.error('Erro ao excluir serviço')
    }
  }

  const copyServiceLink = async (service: Service) => {
    const link = `${window.location.origin}/portfolio/${service.slug}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLinkId(service.id)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopiedLinkId(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setViewMode('layout')
  }

  // Filter services
  useEffect(() => {
    let filtered = services

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(service =>
        statusFilter === 'active' ? service.is_active : !service.is_active
      )
    }

    setFilteredServices(filtered)
    setCurrentPage(1)
  }, [services, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedServices = filteredServices.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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
    
    const enabledKey = `${section}_enabled` as keyof ServiceDetailContent
    setFormData(prev => ({
      ...prev,
      [enabledKey]: !sectionVisibility[section]
    }))
    
    toast.success(`Seção ${sectionVisibility[section] ? 'oculta' : 'visível'}!`)
  }

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Hero com Vídeo"
              checked={formData.hero_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, hero_enabled: checked })}
            />
            {formData.hero_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">URL do Vídeo</label>
                  <VideoUploader
                    value={formData.hero_video_url || ''}
                    onChange={(url) => setFormData({ ...formData, hero_video_url: url })}
                    placeholder="URL do vídeo ou upload"
                  />
                </div>
                <Switch
                  label="Auto-play do vídeo (reproduzir automaticamente)"
                  checked={formData.hero_video_autoplay ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, hero_video_autoplay: checked })}
                />
                <Input
                  label="Título Principal"
                  value={formData.hero_title || ''}
                  onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                  placeholder="Ex: Aprenda esses 2 ajustes..."
                />
                <Input
                  label="Palavra para Destacar (dentro do título)"
                  value={formData.hero_title_highlight || ''}
                  onChange={(e) => setFormData({ ...formData, hero_title_highlight: e.target.value })}
                  placeholder="Ex: preguiçosos"
                />
                <div className="flex items-center gap-4">
                  <Input
                    label="Cor da Palavra Destacada"
                    value={formData.hero_title_highlight_color || '#00D9FF'}
                    onChange={(e) => setFormData({ ...formData, hero_title_highlight_color: e.target.value })}
                    type="color"
                    className="w-24 h-12"
                  />
                  <div className="flex-1">
                    <Input
                      label=""
                      value={formData.hero_title_highlight_color || '#00D9FF'}
                      onChange={(e) => setFormData({ ...formData, hero_title_highlight_color: e.target.value })}
                      placeholder="#00D9FF"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <textarea
                    value={formData.hero_subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
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
              checked={formData.benefits_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, benefits_enabled: checked })}
            />
            {formData.benefits_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.benefits_title || ''}
                  onChange={(e) => setFormData({ ...formData, benefits_title: e.target.value })}
                  placeholder="Ex: O que você receberá dentro da MV Company"
                />
                <BenefitsManager
                  value={formData.benefits_items || []}
                  onChange={(items) => setFormData({ ...formData, benefits_items: items })}
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
              checked={formData.gifts_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, gifts_enabled: checked })}
            />
            {formData.gifts_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.gifts_title || ''}
                  onChange={(e) => setFormData({ ...formData, gifts_title: e.target.value })}
                  placeholder="Ex: Ganhe esses presentes entrando agora"
                />
                <GiftsManager
                  value={formData.gifts_items || []}
                  onChange={(items) => setFormData({ ...formData, gifts_items: items })}
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
              checked={formData.alternate_content_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, alternate_content_enabled: checked })}
            />
            {formData.alternate_content_enabled && (
              <AlternateContentManager
                value={formData.alternate_content_items || []}
                onChange={(items) => setFormData({ ...formData, alternate_content_items: items })}
              />
            )}
          </div>
        )

      case 'about':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção 'Quem somos nós'"
              checked={formData.about_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, about_enabled: checked })}
            />
            {formData.about_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.about_title || ''}
                  onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
                  placeholder="Ex: Quem somos nós"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Foto dos Donos (PNG transparente recomendado)</label>
                  <ImageUploader
                    value={formData.about_image || ''}
                    onChange={(url) => setFormData({ ...formData, about_image: url })}
                    placeholder="Upload de foto"
                    cropType="square"
                    aspectRatio={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Texto sobre a empresa</label>
                  <textarea
                    value={formData.about_text || ''}
                    onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
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
              checked={formData.testimonials_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, testimonials_enabled: checked })}
            />
            {formData.testimonials_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.testimonials_title || ''}
                  onChange={(e) => setFormData({ ...formData, testimonials_title: e.target.value })}
                  placeholder="Ex: Todos os dias recebemos esse tipo de depoimentos"
                />
                <Input
                  label="Estatística (ex: Mais de 60 clientes satisfeitos)"
                  value={formData.testimonials_stats || ''}
                  onChange={(e) => setFormData({ ...formData, testimonials_stats: e.target.value })}
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
              checked={formData.cta_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, cta_enabled: checked })}
            />
            {formData.cta_enabled && (
              <>
                <Input
                  label="Título do CTA"
                  value={formData.cta_title || ''}
                  onChange={(e) => setFormData({ ...formData, cta_title: e.target.value })}
                  placeholder="Ex: Entenda mais e entre em contato conosco"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.cta_description || ''}
                    onChange={(e) => setFormData({ ...formData, cta_description: e.target.value })}
                    placeholder="Ex: Inicie seu planejamento hoje mesmo"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                  <h3 className="font-semibold">Contatos</h3>
                  <Switch
                    label="Habilitar WhatsApp"
                    checked={formData.cta_whatsapp_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, cta_whatsapp_enabled: checked })}
                  />
                  {formData.cta_whatsapp_enabled && (
                    <Input
                      label="Número do WhatsApp (com DDD, ex: 5534984136291)"
                      value={formData.cta_whatsapp_number || ''}
                      onChange={(e) => setFormData({ ...formData, cta_whatsapp_number: e.target.value })}
                      placeholder="Ex: 5534984136291"
                    />
                  )}
                  <Switch
                    label="Habilitar E-mail"
                    checked={formData.cta_email_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, cta_email_enabled: checked })}
                  />
                  {formData.cta_email_enabled && (
                    <Input
                      label="Endereço de E-mail"
                      value={formData.cta_email_address || ''}
                      onChange={(e) => setFormData({ ...formData, cta_email_address: e.target.value })}
                      placeholder="Ex: contato@mvcompany.com.br"
                    />
                  )}
                  <Switch
                    label="Habilitar Instagram"
                    checked={formData.cta_instagram_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, cta_instagram_enabled: checked })}
                  />
                  {formData.cta_instagram_enabled && (
                    <Input
                      label="URL do Instagram"
                      value={formData.cta_instagram_url || ''}
                      onChange={(e) => setFormData({ ...formData, cta_instagram_url: e.target.value })}
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

  const selectedService = services.find(s => s.id === selectedServiceId)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  // Renderizar lista de serviços
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <BackButton href="/dashboard" />
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Serviços</h1>
              <p className="text-gray-600">Crie, edite e configure o layout das páginas de serviços</p>
            </div>
            <Link href="/dashboard/portfolio/novo">
              <Button className="flex items-center gap-2">
                <Plus size={20} />
                Novo Serviço
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Services List */}
          {paginatedServices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum serviço encontrado com os filtros aplicados'
                  : 'Nenhum serviço cadastrado ainda'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/dashboard/portfolio/novo">
                  <Button className="mt-4">
                    <Plus size={20} className="mr-2" />
                    Criar Primeiro Serviço
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Serviço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Destaque
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedServices.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {service.cover_image ? (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={service.cover_image}
                                    alt={service.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">🚀</span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                <div className="text-sm text-gray-500">/{service.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{service.category || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleServiceStatus(service.id, service.is_active)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                service.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {service.is_active ? (
                                <>
                                  <Eye size={14} />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <EyeOff size={14} />
                                  Inativo
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {service.is_featured && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star size={14} className="fill-yellow-400" />
                                Destaque
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => copyServiceLink(service)}
                                className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded"
                                title="Copiar link do serviço"
                              >
                                {copiedLinkId === service.id ? (
                                  <Check size={18} className="text-green-600" />
                                ) : (
                                  <Copy size={18} />
                                )}
                              </button>
                              <Link href={`/dashboard/portfolio/${service.id}`}>
                                <button className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded" title="Editar serviço">
                                  <Edit size={18} />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleSelectService(service.id)}
                                className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded"
                                title="Editar layout"
                              >
                                <Layers size={18} />
                              </button>
                              <button
                                onClick={() => deleteService(service.id)}
                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                                title="Excluir serviço"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredServices.length)} de {filteredServices.length} serviços
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-4 py-2 border rounded-lg ${
                          currentPage === page
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Renderizar editor de layout
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => {
                setViewMode('list')
                setSelectedServiceId(null)
              }}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
            >
              <X size={18} />
              Voltar para Lista
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Layout de Página Detalhada
            </h1>
            <p className="text-gray-600">
              {selectedService ? `Editando: ${selectedService.name}` : 'Selecione um serviço'}
            </p>
          </div>
          <div className="flex gap-3">
            {selectedService && (
              <Link href={`/portfolio/${selectedService.slug}`} target="_blank">
                <Button variant="outline" size="lg">
                  <Eye size={18} className="mr-2" />
                  Ver Preview
                </Button>
              </Link>
            )}
            <Button onClick={handleSaveLayout} isLoading={saving} size="lg">
              <Save size={18} className="mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Seletor de Serviço */}
        {!selectedService && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <label className="block text-sm font-medium mb-2">Selecione um serviço para editar o layout</label>
            <select
              value={selectedServiceId || ''}
              onChange={(e) => handleSelectService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">-- Selecione um serviço --</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedService && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Editor Principal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Seções da Página</h2>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Dica:</strong> Use as setas ↑↓ para reordenar. 
                    Clique no 👁️ para ocultar/mostrar. 
                    Clique na seção para expandir e editar.
                  </p>
                </div>

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
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold mb-4">Ações</h3>
                <Button onClick={handleSaveLayout} isLoading={saving} className="w-full">
                  <Save size={18} className="mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
