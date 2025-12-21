'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { Switch } from '@/components/ui/Switch'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { SectionWrapper } from '@/components/editor/section-wrapper'
import { ServiceCardsManager, ServiceCard } from '@/components/ui/ServiceCardsManager'
import { NotificationsManager } from '@/components/ui/NotificationsManager'
import { TestimonialsManager } from '@/components/ui/TestimonialsManager'

interface HomepageSettings {
  hero_enabled?: boolean
  hero_logo?: string | null
  hero_title?: string
  hero_subtitle?: string
  hero_description?: string
  hero_background_image?: string

  services_enabled?: boolean
  services_title?: string
  services_description?: string
  services_cards?: ServiceCard[]

  comparison_cta_enabled?: boolean
  comparison_cta_title?: string
  comparison_cta_description?: string
  comparison_cta_link?: string

  contact_enabled?: boolean
  contact_title?: string
  contact_description?: string
  contact_whatsapp_enabled?: boolean
  contact_whatsapp_text?: string
  contact_whatsapp_number?: string
  contact_email_enabled?: boolean
  contact_email_text?: string
  contact_email_address?: string
  contact_instagram_enabled?: boolean
  contact_instagram_text?: string
  contact_instagram_url?: string
  
  // Botão flutuante do WhatsApp
  whatsapp_float_enabled?: boolean
  whatsapp_float_number?: string
  whatsapp_float_message?: string

  // Seção de Notificações (Prova Social)
  notifications_enabled?: boolean
  notifications_title?: string
  notifications_description?: string
  notifications_items?: Array<{
    id: string
    name: string
    description: string
    icon: 'whatsapp' | 'email' | 'instagram' | 'like' | 'user' | 'trending' | 'check' | 'sale'
    time: string
  }>
  notifications_delay?: number

  // Seção de Depoimentos (Marquee 3D)
  testimonials_enabled?: boolean
  testimonials_title?: string
  testimonials_description?: string
  testimonials_items?: Array<{
    id: string
    name: string
    username: string
    body: string
    img: string
  }>
  testimonials_duration?: number

  section_order?: string[]
  section_visibility?: Record<string, boolean>
}

// Mapeamento de seções
const sectionIcons: Record<string, string> = {
  hero: '🎯',
  services: '📦',
  comparison: '⚖️',
  notifications: '🔔',
  testimonials: '⭐',
  contact: '📞',
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero (Principal)',
  services: 'Nossos Serviços',
  comparison: 'Comparação (CTA)',
  notifications: 'Notificações (Prova Social)',
  testimonials: 'Depoimentos (Marquee 3D)',
  contact: 'Contato',
}

export default function HomepageEditorPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('hero')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'services',
    'comparison',
    'notifications',
    'testimonials',
    'contact',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    services: true,
    comparison: true,
    notifications: true,
    testimonials: true,
    contact: true,
  })
  const [formData, setFormData] = useState<HomepageSettings>({
    hero_enabled: true,
    hero_logo: null,
    hero_title: 'MV Company',
    hero_subtitle: 'Transformamos sua presença digital com serviços de alta qualidade',
    hero_description: 'Criação de sites, tráfego pago, criação de conteúdo e gestão de redes sociais',
    hero_background_image: '',

    services_enabled: true,
    services_title: 'Nossos Serviços',
    services_description: 'Soluções completas para impulsionar seu negócio no mundo digital',
    services_cards: [],

    comparison_cta_enabled: true,
    comparison_cta_title: 'Compare a MV Company',
    comparison_cta_description: 'Veja por que somos a melhor escolha para transformar sua presença digital',
    comparison_cta_link: '/comparar',

    contact_enabled: true,
    contact_title: 'Fale Conosco',
    contact_description: 'Entre em contato e descubra como podemos ajudar você',
    contact_whatsapp_enabled: true,
    contact_whatsapp_text: 'WhatsApp',
    contact_email_enabled: false,
    contact_email_text: 'E-mail',
    contact_instagram_enabled: true,
    contact_instagram_text: 'Instagram',

    notifications_enabled: true,
    notifications_title: 'Nossos resultados em tempo real',
    notifications_description: 'Veja o sucesso da nossa consultoria através das notificações',
    notifications_items: [],
    notifications_delay: 1500,

    testimonials_enabled: true,
    testimonials_title: 'O que nossos clientes dizem',
    testimonials_description: 'Depoimentos reais de quem confia na MV Company',
    testimonials_items: [],
    testimonials_duration: 20,
  })

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isEditor)) {
      router.push('/dashboard')
    } else if (isAuthenticated && isEditor) {
      loadSettings()
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await getSiteSettings()

      if (error) {
        console.error('Erro ao carregar configurações:', error)
        toast.error('Erro ao carregar configurações da homepage.')
        return
      }

      if (data?.homepage_content) {
        const content = data.homepage_content
        // Fazer merge preservando arrays (especialmente services_cards)
        setFormData(prev => {
          // Sempre usar o array do banco se existir, mesmo que vazio
          // Isso garante que cards salvos sejam sempre carregados
          let servicesCards: ServiceCard[] = []
          
          if (Array.isArray(content.services_cards)) {
            // Se é um array válido do banco, usar ele (mesmo que vazio)
            servicesCards = content.services_cards
          } else if (Array.isArray(prev.services_cards) && prev.services_cards.length > 0) {
            // Se não existe no banco mas existe no estado anterior, manter
            servicesCards = prev.services_cards
          }
          
          // Garantir que notifications_items seja sempre um array
          let notificationsItems: any[] = []
          if (Array.isArray(content.notifications_items)) {
            notificationsItems = content.notifications_items
          } else if (Array.isArray(prev.notifications_items) && prev.notifications_items.length > 0) {
            notificationsItems = prev.notifications_items
          }
          
          // Garantir que testimonials_items seja sempre um array
          let testimonialsItems: any[] = []
          if (Array.isArray(content.testimonials_items)) {
            testimonialsItems = content.testimonials_items
          } else if (Array.isArray(prev.testimonials_items) && prev.testimonials_items.length > 0) {
            testimonialsItems = prev.testimonials_items
          }
          
          return {
            ...prev,
            ...content,
            services_cards: servicesCards,
            notifications_items: notificationsItems,
            testimonials_items: testimonialsItems,
          }
        })
        
        // Carregar ordem e visibilidade se existirem
        if (content.section_order && Array.isArray(content.section_order)) {
          // Garantir que 'notifications' e 'testimonials' estejam na ordem se não estiverem
          const order = [...content.section_order]
          if (!order.includes('notifications')) {
            // Adicionar 'notifications' antes de 'contact' se 'contact' existir, senão no final
            const contactIndex = order.indexOf('contact')
            if (contactIndex >= 0) {
              order.splice(contactIndex, 0, 'notifications')
            } else {
              order.push('notifications')
            }
          }
          if (!order.includes('testimonials')) {
            // Adicionar 'testimonials' antes de 'contact' se 'contact' existir, senão no final
            const contactIndex = order.indexOf('contact')
            if (contactIndex >= 0) {
              order.splice(contactIndex, 0, 'testimonials')
            } else {
              order.push('testimonials')
            }
          }
          setSectionOrder(order)
        }
        if (content.section_visibility) {
          // Garantir que 'notifications' e 'testimonials' tenham visibilidade definida
          const visibility = { ...content.section_visibility }
          if (visibility.notifications === undefined) {
            visibility.notifications = true
          }
          if (visibility.testimonials === undefined) {
            visibility.testimonials = true
          }
          setSectionVisibility(visibility)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações da homepage.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Garantir que services_cards seja sempre um array
      const contentToSave = {
        ...formData,
        services_cards: Array.isArray(formData.services_cards) ? formData.services_cards : [],
        notifications_items: Array.isArray(formData.notifications_items) ? formData.notifications_items : [],
        testimonials_items: Array.isArray(formData.testimonials_items) ? formData.testimonials_items : [],
        section_order: sectionOrder,
        section_visibility: sectionVisibility,
      }
      
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: {
          homepage_content: contentToSave
        },
      })

      if (!success) {
        console.error('Erro ao salvar configurações:', error)
        toast.error(error?.message || 'Erro ao salvar configurações da homepage.')
        return
      }

      toast.success('Configurações da homepage salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações da homepage.')
    } finally {
      setSaving(false)
    }
  }

  // Funções para reordenar e visibilidade
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
    toast.success(`Seção ${sectionVisibility[section] ? 'oculta' : 'visível'}!`)
  }

  // Renderizar conteúdo de cada seção
  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Hero"
              checked={formData.hero_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, hero_enabled: checked })}
            />
            {formData.hero_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Logo da Empresa (Opcional)</label>
                  <ImageUploader
                    value={formData.hero_logo || ''}
                    onChange={(url) => setFormData({ ...formData, hero_logo: url })}
                    placeholder="Upload da logo da empresa"
                    cropType="square"
                    aspectRatio={1}
                    recommendedDimensions="200x100px"
                  />
                  {formData.hero_logo && (
                    <button
                      onClick={() => setFormData({ ...formData, hero_logo: null })}
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Remover Logo
                    </button>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Se uma logo for enviada, ela substituirá o título principal.
                  </p>
                </div>
                {!formData.hero_logo && (
                  <Input
                    label="Título Principal"
                    value={formData.hero_title || ''}
                    onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                    placeholder="Ex: MV Company"
                  />
                )}
                <Input
                  label="Subtítulo"
                  value={formData.hero_subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                  placeholder="Ex: Transformamos sua presença digital..."
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.hero_description || ''}
                    onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                    placeholder="Descrição adicional..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Imagem de Fundo (Opcional)</label>
                  <ImageUploader
                    value={formData.hero_background_image || ''}
                    onChange={(url) => setFormData({ ...formData, hero_background_image: url })}
                    placeholder="Upload de imagem de fundo"
                    cropType="banner"
                    aspectRatio={16 / 9}
                  />
                </div>
              </>
            )}
          </div>
        )
      case 'services':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Serviços"
              checked={formData.services_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, services_enabled: checked })}
            />
            {formData.services_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.services_title || ''}
                  onChange={(e) => setFormData({ ...formData, services_title: e.target.value })}
                  placeholder="Ex: Nossos Serviços"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.services_description || ''}
                    onChange={(e) => setFormData({ ...formData, services_description: e.target.value })}
                    placeholder="Descrição da seção de serviços..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <ServiceCardsManager
                    value={formData.services_cards || []}
                    onChange={(cards) => {
                      setFormData({ ...formData, services_cards: cards })
                    }}
                    label="Cards de Serviços"
                  />
                </div>
              </>
            )}
          </div>
        )
      case 'comparison':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Comparação"
              checked={formData.comparison_cta_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, comparison_cta_enabled: checked })}
            />
            {formData.comparison_cta_enabled && (
              <>
                <Input
                  label="Título do CTA"
                  value={formData.comparison_cta_title || ''}
                  onChange={(e) => setFormData({ ...formData, comparison_cta_title: e.target.value })}
                  placeholder="Ex: Compare a MV Company..."
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.comparison_cta_description || ''}
                    onChange={(e) => setFormData({ ...formData, comparison_cta_description: e.target.value })}
                    placeholder="Descrição da comparação..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Input
                  label="Link do CTA"
                  value={formData.comparison_cta_link || ''}
                  onChange={(e) => setFormData({ ...formData, comparison_cta_link: e.target.value })}
                  placeholder="Ex: /comparar"
                />
              </>
            )}
          </div>
        )
      case 'notifications':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Notificações (Prova Social)"
              checked={formData.notifications_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
            />
            {formData.notifications_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.notifications_title || ''}
                  onChange={(e) => setFormData({ ...formData, notifications_title: e.target.value })}
                  placeholder="Ex: Nossos resultados em tempo real"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.notifications_description || ''}
                    onChange={(e) => setFormData({ ...formData, notifications_description: e.target.value })}
                    placeholder="Ex: Veja o sucesso da nossa consultoria através das notificações"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Delay entre notificações (ms)
                  </label>
                  <Input
                    type="number"
                    value={formData.notifications_delay || 1500}
                    onChange={(e) => setFormData({ ...formData, notifications_delay: parseInt(e.target.value) || 1500 })}
                    placeholder="1500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo em milissegundos entre cada notificação aparecer (padrão: 1500ms)
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <NotificationsManager
                    value={formData.notifications_items || []}
                    onChange={(items) => setFormData({ ...formData, notifications_items: items })}
                    label="Notificações"
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
              label="Habilitar Seção de Depoimentos (Marquee 3D)"
              checked={formData.testimonials_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, testimonials_enabled: checked })}
            />
            {formData.testimonials_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.testimonials_title || ''}
                  onChange={(e) => setFormData({ ...formData, testimonials_title: e.target.value })}
                  placeholder="Ex: O que nossos clientes dizem"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.testimonials_description || ''}
                    onChange={(e) => setFormData({ ...formData, testimonials_description: e.target.value })}
                    placeholder="Ex: Depoimentos reais de quem confia na MV Company"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duração da Animação (segundos)
                  </label>
                  <Input
                    type="number"
                    value={formData.testimonials_duration || 20}
                    onChange={(e) => setFormData({ ...formData, testimonials_duration: parseInt(e.target.value) || 20 })}
                    placeholder="20"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo em segundos para uma rotação completa (padrão: 20s)
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <TestimonialsManager
                    value={formData.testimonials_items || []}
                    onChange={(items) => setFormData({ ...formData, testimonials_items: items })}
                    label="Depoimentos"
                  />
                </div>
              </>
            )}
          </div>
        )
      case 'contact':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Contato"
              checked={formData.contact_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, contact_enabled: checked })}
            />
            {formData.contact_enabled && (
              <>
                <Input
                  label="Título"
                  value={formData.contact_title || ''}
                  onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                  placeholder="Ex: Fale Conosco"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.contact_description || ''}
                    onChange={(e) => setFormData({ ...formData, contact_description: e.target.value })}
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
                      checked={formData.contact_whatsapp_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, contact_whatsapp_enabled: checked })}
                    />
                  </div>
                  {formData.contact_whatsapp_enabled && (
                    <>
                      <Input
                        label="Número do WhatsApp (com DDD, ex: 5534984136291)"
                        value={formData.contact_whatsapp_number || ''}
                        onChange={(e) => setFormData({ ...formData, contact_whatsapp_number: e.target.value })}
                        placeholder="Ex: 5534984136291"
                      />
                      <Input
                        label="Texto do Botão WhatsApp"
                        value={formData.contact_whatsapp_text || ''}
                        onChange={(e) => setFormData({ ...formData, contact_whatsapp_text: e.target.value })}
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
                      checked={formData.contact_email_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, contact_email_enabled: checked })}
                    />
                  </div>
                  {formData.contact_email_enabled && (
                    <>
                      <Input
                        label="Endereço de E-mail"
                        value={formData.contact_email_address || ''}
                        onChange={(e) => setFormData({ ...formData, contact_email_address: e.target.value })}
                        placeholder="Ex: contato@mvcompany.com"
                        type="email"
                      />
                      <Input
                        label="Texto do Botão E-mail"
                        value={formData.contact_email_text || ''}
                        onChange={(e) => setFormData({ ...formData, contact_email_text: e.target.value })}
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
                      checked={formData.contact_instagram_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, contact_instagram_enabled: checked })}
                    />
                  </div>
                  {formData.contact_instagram_enabled && (
                    <>
                      <Input
                        label="URL do Instagram"
                        value={formData.contact_instagram_url || ''}
                        onChange={(e) => setFormData({ ...formData, contact_instagram_url: e.target.value })}
                        placeholder="Ex: https://instagram.com/mvcompany"
                      />
                      <Input
                        label="Texto do Botão Instagram"
                        value={formData.contact_instagram_text || ''}
                        onChange={(e) => setFormData({ ...formData, contact_instagram_text: e.target.value })}
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
        return null
    }
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
        <DashboardNavigation
          title="Editar Homepage"
          subtitle="Personalize o conteúdo da página inicial"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
          actions={
            <div className="flex gap-3">
              <Link href="/" target="_blank">
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
                <h2 className="text-xl font-bold">Seções da Homepage</h2>
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
                  checked={formData.whatsapp_float_enabled ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_float_enabled: checked })}
                />
                {formData.whatsapp_float_enabled && (
                  <>
                    <Input
                      label="Número do WhatsApp"
                      value={formData.whatsapp_float_number || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp_float_number: e.target.value })}
                      placeholder="Ex: 5534984136291"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Mensagem Inicial</label>
                      <textarea
                        value={formData.whatsapp_float_message || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp_float_message: e.target.value })}
                        placeholder="Ex: Olá! Gostaria de saber mais sobre os serviços."
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
                As alterações são salvas no banco de dados. Use o botão "Ver Preview" para visualizar a homepage completa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
