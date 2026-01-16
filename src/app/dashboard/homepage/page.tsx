'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
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
  // Configurações globais do site (afetam todas as páginas)
  site_name?: string
  site_title?: string  // Título da aba do navegador
  
  hero_enabled?: boolean
  hero_logo?: string | null
  hero_title?: string
  hero_subtitle?: string
  hero_description?: string
  hero_background_image?: string

  video_enabled?: boolean
  video_url?: string
  video_autoplay?: boolean
  video_title?: string
  video_subtitle?: string

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

  // Seção Spline (3D)
  spline_enabled?: boolean
  spline_title?: string
  spline_description?: string
  spline_scene_url?: string

  // Seção Features (O que oferecemos)
  features_enabled?: boolean
  features_title?: string
  features_description?: string
  features_items?: Array<{
    id: string
    title: string
    description: string
    icon: 'scissors' | 'palette' | 'robot' | 'video' | 'instagram' | 'megaphone' | 'school' | 'sparkles' | 'settings' | 'target'
  }>

  // Seção Trusted By (Plataformas que utilizamos)
  trusted_by_enabled?: boolean
  trusted_by_title?: string
  trusted_by_subtitle?: string
  trusted_by_platforms?: Array<{
    id: string
    name: string
    logoUrl: string
    enabled: boolean
  }>

  // Seção Award (Medalha de pioneiros)
  award_enabled?: boolean
  award_with_video_enabled?: boolean
  award_title?: string
  award_subtitle?: string
  award_recipient?: string
  award_date?: string
  award_level?: 'bronze' | 'silver' | 'gold' | 'platinum'
  award_standalone_title?: string
  award_standalone_description?: string

  section_order?: string[]
  section_visibility?: Record<string, boolean>
}

// Componente para cada plataforma com seu próprio estado de upload
interface PlatformLogoItemProps {
  platform: { id: string; name: string; logoUrl: string; enabled: boolean }
  index: number
  onUpdate: (platform: { id: string; name: string; logoUrl: string; enabled: boolean }) => void
  onRemove: () => void
  onUpload: (index: number, file: File, setUploading: (uploading: boolean) => void) => void
}

function PlatformLogoItem({ platform, index, onUpdate, onRemove, onUpload }: PlatformLogoItemProps) {
  const [uploading, setUploading] = useState(false)

  return (
    <div className="bg-gray-50 p-3 rounded-lg border">
      <div className="flex items-start gap-3">
        {/* Preview da Logo */}
        <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center overflow-hidden flex-shrink-0">
          {uploading ? (
            <div className="animate-spin w-6 h-6 border-2 border-gogh-yellow border-t-transparent rounded-full" />
          ) : platform.logoUrl ? (
            <img 
              src={platform.logoUrl} 
              alt={platform.name} 
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <span className="text-2xl">🖼️</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {/* Checkbox + Nome */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={platform.enabled}
              onChange={(e) => onUpdate({ ...platform, enabled: e.target.checked })}
              className="w-4 h-4 text-gogh-yellow rounded border-gray-300 focus:ring-gogh-yellow"
            />
            <input
              type="text"
              value={platform.name}
              onChange={(e) => onUpdate({ ...platform, name: e.target.value })}
              placeholder="Nome da plataforma"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gogh-yellow"
            />
          </div>

          {/* Upload de Logo */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onUpload(index, file, setUploading)
                }
                // Limpar o input
                e.target.value = ''
              }}
              className="hidden"
              id={`platform-logo-${platform.id}`}
              disabled={uploading}
            />
            <label
              htmlFor={`platform-logo-${platform.id}`}
              className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                uploading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {uploading ? '⏳ Enviando...' : '📤 Upload Logo'}
            </label>
            {platform.logoUrl && !uploading && (
              <button
                type="button"
                onClick={() => onUpdate({ ...platform, logoUrl: '' })}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remover Logo
              </button>
            )}
          </div>
        </div>

        {/* Botão Remover */}
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 p-1"
          title="Remover plataforma"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

// Mapeamento de seções
const sectionIcons: Record<string, string> = {
  hero: '🎯',
  video: '🎥',
  features: '✨',
  trusted_by: '🤝',
  award: '🏆',
  services: '📦',
  comparison: '⚖️',
  notifications: '🔔',
  testimonials: '⭐',
  spline: '🤖',
  pricing: '💰',
  contact: '📞',
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero (Principal)',
  video: 'Vídeo (Sobre Nós)',
  features: 'O Que Oferecemos (Features)',
  trusted_by: 'Plataformas (Logo Carousel)',
  award: 'Medalha de Pioneiros',
  services: 'Nossos Serviços',
  comparison: 'Comparação (CTA)',
  notifications: 'Notificações (Prova Social)',
  testimonials: 'Depoimentos (Marquee 3D)',
  spline: 'Spline 3D (Futuro e Evolução)',
  pricing: 'Planos de Assinatura',
  contact: 'Contato',
}

export default function HomepageEditorPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading, emailIsAdmin, user } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('hero')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'video',
    'trusted_by',
    'features',
    'award',
    'services',
    'comparison',
    'notifications',
    'testimonials',
    'spline',
    'pricing',
    'contact',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    video: false,
    services: true,
    comparison: true,
    notifications: true,
    testimonials: true,
    spline: false, // Desabilitado por padrão para melhor performance
    pricing: false, // Desabilitado por padrão até ser configurado
    contact: true,
  })
  const [formData, setFormData] = useState<HomepageSettings>({
    // Configurações globais
    site_name: 'Gogh Lab',
    site_title: 'Gogh Lab - Criatividade guiada por tecnologia',
    
    hero_enabled: true,
    hero_logo: null,
    hero_title: 'Gogh Lab',
    hero_subtitle: 'Criatividade guiada por tecnologia',
    hero_description: 'Agentes de IA para criação de conteúdo, redes sociais e anúncios',
    hero_background_image: '',

    services_enabled: true,
    services_title: 'Nossos Serviços',
    services_description: 'Soluções completas para impulsionar seu negócio no mundo digital',
    services_cards: [],

    comparison_cta_enabled: true,
    comparison_cta_title: 'Compare o Gogh Lab',
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
    notifications_description: 'Veja o sucesso dos nossos clientes em tempo real',
    notifications_items: [],
    notifications_delay: 1500,

    testimonials_enabled: true,
    testimonials_title: 'O que nossos clientes dizem',
    testimonials_description: 'Depoimentos reais de quem confia no Gogh Lab',
    testimonials_items: [],
    testimonials_duration: 200,

    spline_enabled: false, // Desabilitado por padrão para melhor performance
    spline_title: 'O Futuro da Sua Empresa',
    spline_description: 'Estamos aqui para ajudar sua empresa a evoluir e crescer no mundo digital. Com tecnologia de ponta e soluções inovadoras, transformamos sua presença online e impulsionamos seus resultados.',
    spline_scene_url: 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode',

    // Features - O que oferecemos
    features_enabled: true,
    features_title: 'O que oferecemos',
    features_description: 'Ferramentas profissionais, agentes de IA e cursos completos para transformar sua presença digital',
    features_items: [
      { id: '1', title: 'Acesso ao CapCut Pro', description: 'Edite vídeos profissionais com todas as funcionalidades premium do CapCut incluídas na sua assinatura.', icon: 'scissors' },
      { id: '2', title: 'Acesso ao Canva Pro', description: 'Crie artes incríveis com acesso completo ao Canva Pro, templates exclusivos e recursos premium.', icon: 'palette' },
      { id: '3', title: 'Agente de IA para Vídeos', description: 'Crie roteiros, ganchos, ideias de takes e legendas para seus vídeos com inteligência artificial.', icon: 'video' },
      { id: '4', title: 'Agente de IA para Redes Sociais', description: 'Ideias de posts, legendas, hashtags e adaptação de linguagem para cada persona e público.', icon: 'instagram' },
      { id: '5', title: 'Agente de IA para Anúncios', description: 'Copies, criativos e direcionamento estratégico para Meta Ads, YouTube Ads, TikTok e Shopee.', icon: 'megaphone' },
      { id: '6', title: 'Cursos de Edição Completos', description: 'Aprenda edição de fotos e vídeos com cursos práticos e avançados de Canva e CapCut.', icon: 'school' },
      { id: '7', title: 'Agentes Treinados para Seu Nicho', description: 'Os agentes aprendem sobre seu negócio e criam conteúdo personalizado para sua audiência.', icon: 'settings' },
      { id: '8', title: 'Crie com Autonomia Total', description: 'Faça sozinho o que antes dependia de social media, editor ou gestor de tráfego.', icon: 'sparkles' },
    ],

    // Trusted By - Plataformas que utilizamos
    trusted_by_enabled: true,
    trusted_by_title: 'Utilizamos as melhores ferramentas',
    trusted_by_subtitle: 'Tecnologias de ponta para entregar resultados excepcionais',
    trusted_by_platforms: [
      { id: '1', name: 'Canva Pro', logoUrl: '', enabled: true },
      { id: '2', name: 'CapCut Pro', logoUrl: '', enabled: true },
      { id: '3', name: 'OpenAI', logoUrl: '', enabled: true },
      { id: '4', name: 'Stripe', logoUrl: '', enabled: true },
      { id: '5', name: 'Google', logoUrl: '', enabled: true },
      { id: '6', name: 'Automação', logoUrl: '', enabled: true },
      { id: '7', name: 'Meta', logoUrl: '', enabled: true },
    ],

    // Award - Medalha de pioneiros
    award_enabled: true,
    award_with_video_enabled: true,
    award_title: 'PIONEIROS',
    award_subtitle: 'Plataforma Completa de IA para Criadores',
    award_recipient: 'Gogh Lab',
    award_date: 'Brasil 2025',
    award_level: 'gold',
    award_standalone_title: 'Primeira plataforma do Brasil',
    award_standalone_description: 'A Gogh Lab é pioneira em oferecer uma solução completa com agentes de IA, cursos profissionais e acesso às melhores ferramentas de criação — tudo em uma única assinatura.',
  })

  // Verificar se tem acesso - emailIsAdmin funciona mesmo sem profile carregado
  const hasAccess = emailIsAdmin || isEditor
  
  useEffect(() => {
    // Só carregar settings se tiver acesso e não estiver carregando auth
    if (!authLoading && hasAccess) {
      loadSettings()
    }
  }, [hasAccess, authLoading])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Buscar dados diretamente do banco para garantir que temos site_logo
      const { data: rawData, error: rawError } = await (supabase as any)
        .from('site_settings')
        .select('*')
        .eq('key', 'general')
        .maybeSingle()
      
      console.log('🔍 Dados brutos do banco:', rawData)
      console.log('🔍 site_logo do banco:', rawData?.site_logo)
      console.log('🔍 hero_logo do homepage_content:', rawData?.homepage_content?.hero_logo)

      if (rawError) {
        console.error('Erro ao carregar configurações:', rawError)
        toast.error('Erro ao carregar configurações da homepage.')
        return
      }

      if (rawData?.homepage_content) {
        const content = rawData.homepage_content as any
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
          
          // Sincronizar hero_logo com site_logo (priorizar site_logo se existir)
          // Isso garante que a logo global do site seja usada no editor
          const heroLogo = rawData.site_logo || content.hero_logo || null
          console.log('🔍 Logo final a ser usada:', heroLogo)
          console.log('🔍 site_name do banco:', rawData.site_name)
          console.log('🔍 site_title do banco:', rawData.site_title)
          
          return {
            ...prev,
            ...content,
            hero_logo: heroLogo,
            site_name: rawData.site_name || content.site_name || 'Gogh Lab',
            site_title: rawData.site_title || content.site_title || 'Gogh Lab - Criatividade guiada por tecnologia',
            services_cards: servicesCards,
            notifications_items: notificationsItems,
            testimonials_items: testimonialsItems,
          }
        })
        
        // Carregar ordem e visibilidade se existirem
        if (content.section_order && Array.isArray(content.section_order)) {
          // Garantir que 'video', 'notifications', 'testimonials' e 'spline' estejam na ordem se não estiverem
          const order = [...content.section_order]
          if (!order.includes('video')) {
            // Adicionar 'video' após 'hero' se 'hero' existir, senão no início
            const heroIndex = order.indexOf('hero')
            if (heroIndex >= 0) {
              order.splice(heroIndex + 1, 0, 'video')
            } else {
              order.unshift('video')
            }
          }
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
          if (!order.includes('spline')) {
            // Adicionar 'spline' antes de 'contact' se 'contact' existir, senão no final
            const contactIndex = order.indexOf('contact')
            if (contactIndex >= 0) {
              order.splice(contactIndex, 0, 'spline')
            } else {
              order.push('spline')
            }
          }
          if (!order.includes('pricing')) {
            // Adicionar 'pricing' antes de 'contact' se 'contact' existir, senão no final
            const contactIndex = order.indexOf('contact')
            if (contactIndex >= 0) {
              order.splice(contactIndex, 0, 'pricing')
            } else {
              order.push('pricing')
            }
          }
          // Adicionar novas seções se não existirem
          if (!order.includes('features')) {
            // Adicionar 'features' após 'video' ou 'trusted_by'
            const videoIndex = order.indexOf('video')
            if (videoIndex >= 0) {
              order.splice(videoIndex + 1, 0, 'features')
            } else {
              const heroIndex = order.indexOf('hero')
              if (heroIndex >= 0) {
                order.splice(heroIndex + 1, 0, 'features')
              } else {
                order.unshift('features')
              }
            }
          }
          if (!order.includes('trusted_by')) {
            // Adicionar 'trusted_by' após 'video'
            const videoIndex = order.indexOf('video')
            if (videoIndex >= 0) {
              order.splice(videoIndex + 1, 0, 'trusted_by')
            } else {
              const heroIndex = order.indexOf('hero')
              if (heroIndex >= 0) {
                order.splice(heroIndex + 1, 0, 'trusted_by')
              } else {
                order.unshift('trusted_by')
              }
            }
          }
          if (!order.includes('award')) {
            // Adicionar 'award' após 'features'
            const featuresIndex = order.indexOf('features')
            if (featuresIndex >= 0) {
              order.splice(featuresIndex + 1, 0, 'award')
            } else {
              const servicesIndex = order.indexOf('services')
              if (servicesIndex >= 0) {
                order.splice(servicesIndex, 0, 'award')
              } else {
                order.push('award')
              }
            }
          }
          setSectionOrder(order)
        } else {
          // Se não houver ordem salva, usar a ordem padrão
          setSectionOrder([
            'hero',
            'video',
            'trusted_by',
            'features',
            'award',
            'services',
            'comparison',
            'notifications',
            'testimonials',
            'spline',
            'pricing',
            'contact',
          ])
        }
        if (content.section_visibility) {
          // Garantir que todas as seções tenham visibilidade definida
          const visibility = { ...content.section_visibility }
          if (visibility.video === undefined) {
            visibility.video = false // Desabilitado por padrão
          }
          if (visibility.notifications === undefined) {
            visibility.notifications = true
          }
          if (visibility.testimonials === undefined) {
            visibility.testimonials = true
          }
          if (visibility.spline === undefined) {
            visibility.spline = false // Desabilitado por padrão para performance
          }
          if (visibility.pricing === undefined) {
            visibility.pricing = false // Desabilitado por padrão até ser configurado
          }
          // Novas seções
          if (visibility.features === undefined) {
            visibility.features = true // Habilitado por padrão
          }
          if (visibility.trusted_by === undefined) {
            visibility.trusted_by = true // Habilitado por padrão
          }
          if (visibility.award === undefined) {
            visibility.award = true // Habilitado por padrão
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
      
      // Preparar campos para atualizar
      const fieldsToUpdate: Record<string, any> = {
        homepage_content: contentToSave,
        site_logo: formData.hero_logo || null, // Sempre sincronizar a logo global
        site_name: formData.site_name || 'Gogh Lab',
        site_title: formData.site_title || 'Gogh Lab - Criatividade guiada por tecnologia',
      }
      
      console.log('🔍 Salvando configurações:', {
        logo: formData.hero_logo,
        site_name: formData.site_name,
        site_title: formData.site_title
      })
      
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate,
        forceUpdate: true, // Forçar update para permitir limpar a logo (null)
      })

      if (!success) {
        console.error('Erro ao salvar configurações:', error)
        toast.error(error?.message || 'Erro ao salvar configurações da homepage.')
        return
      }
      
      // FALLBACK: Atualizar campos diretamente caso o helper não funcione
      const { error: directError } = await (supabase as any)
        .from('site_settings')
        .update({ 
          site_logo: formData.hero_logo || null,
          site_name: formData.site_name || 'Gogh Lab',
          site_title: formData.site_title || 'Gogh Lab - Criatividade guiada por tecnologia',
        })
        .eq('key', 'general')
      
      if (directError) {
        console.error('Erro ao salvar diretamente:', directError)
      } else {
        console.log('✅ Configurações salvas diretamente com sucesso')
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
            {/* Configurações Globais do Site */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-4">
              <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                🌐 Configurações Globais (afetam todas as páginas)
              </h4>
              <Input
                label="Nome do Site"
                value={formData.site_name || ''}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder="Ex: Gogh Lab"
              />
              <Input
                label="Título da Aba do Navegador (SEO)"
                value={formData.site_title || ''}
                onChange={(e) => setFormData({ ...formData, site_title: e.target.value })}
                placeholder="Ex: Gogh Lab - Criatividade guiada por tecnologia"
              />
              <p className="text-xs text-yellow-700">
                O título aparece na aba do navegador e é importante para SEO.
              </p>
            </div>

            <hr className="my-4" />
            
            <Switch
              label="Habilitar Seção Hero"
              checked={formData.hero_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, hero_enabled: checked })}
            />
            {formData.hero_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Logo da Empresa (Favicon e Logo Fixa)</label>
                  <ImageUploader
                    value={formData.hero_logo || ''}
                    onChange={(url) => setFormData({ ...formData, hero_logo: url })}
                    placeholder="Upload da logo da empresa"
                    cropType="square"
                    aspectRatio={1}
                    recommendedDimensions="200x200px (quadrada funciona melhor como favicon)"
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
                    Esta logo aparecerá fixa no topo de todas as páginas e como favicon (ícone da aba).
                  </p>
                </div>
                {!formData.hero_logo && (
                  <Input
                    label="Título Principal"
                    value={formData.hero_title || ''}
                    onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                    placeholder="Ex: Gogh Lab"
                  />
                )}
                <Input
                  label="Subtítulo"
                  value={formData.hero_subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                  placeholder="Ex: Criatividade guiada por tecnologia"
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

      case 'video':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Vídeo"
              checked={formData.video_enabled ?? false}
              onCheckedChange={(checked) => setFormData({ ...formData, video_enabled: checked })}
            />
            {formData.video_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">URL do Vídeo</label>
                  <VideoUploader
                    value={formData.video_url || ''}
                    onChange={(url) => setFormData({ ...formData, video_url: url })}
                    placeholder="URL do vídeo ou upload"
                  />
                </div>
                <Switch
                  label="Auto-play do vídeo (reproduzir automaticamente)"
                  checked={formData.video_autoplay ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, video_autoplay: checked })}
                />
                <Input
                  label="Título Principal"
                  value={formData.video_title || ''}
                  onChange={(e) => setFormData({ ...formData, video_title: e.target.value })}
                  placeholder="Ex: Conheça a Gogh Lab"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <textarea
                    value={formData.video_subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, video_subtitle: e.target.value })}
                    placeholder="Subtítulo descritivo sobre o vídeo..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Ex: Compare a Gogh Lab..."
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
                    placeholder="Ex: Depoimentos reais de quem confia na Gogh Lab"
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
                    value={formData.testimonials_duration || 200}
                    onChange={(e) => setFormData({ ...formData, testimonials_duration: parseInt(e.target.value) || 200 })}
                    placeholder="200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo em segundos para uma rotação completa (padrão: 200s - extremamente lento)
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
      case 'spline':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Spline 3D"
              checked={formData.spline_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, spline_enabled: checked })}
            />
            {formData.spline_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.spline_title || ''}
                  onChange={(e) => setFormData({ ...formData, spline_title: e.target.value })}
                  placeholder="Ex: O Futuro da Sua Empresa"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.spline_description || ''}
                    onChange={(e) => setFormData({ ...formData, spline_description: e.target.value })}
                    placeholder="Ex: Estamos aqui para ajudar sua empresa a evoluir e crescer no mundo digital..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL da Cena Spline (Opcional)</label>
                  <Input
                    value={formData.spline_scene_url || ''}
                    onChange={(e) => setFormData({ ...formData, spline_scene_url: e.target.value })}
                    placeholder="https://prod.spline.design/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe vazio para usar a cena padrão do robô. Você pode criar suas próprias cenas em{' '}
                    <a href="https://spline.design" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      spline.design
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>
        )
      case 'features':
        const featureIconOptions = [
          { value: 'scissors', label: '✂️ Tesoura (CapCut)' },
          { value: 'palette', label: '🎨 Paleta (Canva)' },
          { value: 'robot', label: '🤖 Robô (IA)' },
          { value: 'video', label: '🎬 Vídeo' },
          { value: 'instagram', label: '📷 Instagram' },
          { value: 'megaphone', label: '📢 Megafone (Anúncios)' },
          { value: 'school', label: '🎓 Escola (Cursos)' },
          { value: 'sparkles', label: '✨ Estrelas' },
          { value: 'settings', label: '⚙️ Configurações' },
          { value: 'target', label: '🎯 Alvo' },
        ]
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Features"
              checked={formData.features_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, features_enabled: checked })}
            />
            {formData.features_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.features_title || ''}
                  onChange={(e) => setFormData({ ...formData, features_title: e.target.value })}
                  placeholder="Ex: O que oferecemos"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.features_description || ''}
                    onChange={(e) => setFormData({ ...formData, features_description: e.target.value })}
                    placeholder="Ex: Ferramentas e recursos completos para criadores de conteúdo"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Lista de Features Editáveis */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Features ({formData.features_items?.length || 0})</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem = {
                          id: Date.now().toString(),
                          title: 'Nova Feature',
                          description: 'Descrição da feature',
                          icon: 'sparkles' as const,
                        }
                        setFormData({
                          ...formData,
                          features_items: [...(formData.features_items || []), newItem],
                        })
                      }}
                      className="text-sm bg-gogh-yellow text-gogh-black px-3 py-1 rounded-lg hover:bg-gogh-yellow-dark transition-colors"
                    >
                      + Adicionar Feature
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {formData.features_items?.map((item, index) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-start gap-2">
                          <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                          <div className="flex-1 space-y-2">
                            <Input
                              label="Título"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...(formData.features_items || [])]
                                updated[index] = { ...updated[index], title: e.target.value }
                                setFormData({ ...formData, features_items: updated })
                              }}
                              placeholder="Título da feature"
                            />
                            <div>
                              <label className="block text-xs font-medium mb-1">Descrição</label>
                              <textarea
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...(formData.features_items || [])]
                                  updated[index] = { ...updated[index], description: e.target.value }
                                  setFormData({ ...formData, features_items: updated })
                                }}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Ícone</label>
                              <select
                                value={item.icon}
                                onChange={(e) => {
                                  const updated = [...(formData.features_items || [])]
                                  updated[index] = { ...updated[index], icon: e.target.value as any }
                                  setFormData({ ...formData, features_items: updated })
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {featureIconOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.features_items?.filter((_, i) => i !== index) || []
                              setFormData({ ...formData, features_items: updated })
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remover feature"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      case 'trusted_by':
        const handlePlatformLogoUpload = async (index: number, file: File, setUploading: (uploading: boolean) => void) => {
          setUploading(true)
          try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            formDataUpload.append('folder', 'logos')
            formDataUpload.append('preserveTransparency', 'true')
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formDataUpload,
            })
            
            const data = await response.json()
            
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Erro no upload')
            }
            
            const updated = [...(formData.trusted_by_platforms || [])]
            updated[index] = { ...updated[index], logoUrl: data.url }
            setFormData({ ...formData, trusted_by_platforms: updated })
            toast.success('Logo enviado com sucesso!')
          } catch (error: any) {
            console.error('Erro ao fazer upload:', error)
            toast.error(error.message || 'Erro ao enviar logo. Tente novamente.')
          } finally {
            setUploading(false)
          }
        }

        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Plataformas"
              checked={formData.trusted_by_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, trusted_by_enabled: checked })}
            />
            {formData.trusted_by_enabled && (
              <>
                <Input
                  label="Título da Seção"
                  value={formData.trusted_by_title || ''}
                  onChange={(e) => setFormData({ ...formData, trusted_by_title: e.target.value })}
                  placeholder="Ex: Utilizamos as melhores ferramentas"
                />
                <Input
                  label="Subtítulo"
                  value={formData.trusted_by_subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, trusted_by_subtitle: e.target.value })}
                  placeholder="Ex: Tecnologias de ponta para entregar resultados excepcionais"
                />

                {/* Lista de Plataformas */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Plataformas ({formData.trusted_by_platforms?.length || 0})</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newPlatform = {
                          id: Date.now().toString(),
                          name: 'Nova Plataforma',
                          logoUrl: '',
                          enabled: true,
                        }
                        setFormData({
                          ...formData,
                          trusted_by_platforms: [...(formData.trusted_by_platforms || []), newPlatform],
                        })
                      }}
                      className="text-sm bg-gogh-yellow text-gogh-black px-3 py-1 rounded-lg hover:bg-gogh-yellow-dark transition-colors"
                    >
                      + Adicionar Plataforma
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {formData.trusted_by_platforms?.map((platform, index) => (
                      <PlatformLogoItem
                        key={platform.id}
                        platform={platform}
                        index={index}
                        onUpdate={(updatedPlatform) => {
                          const updated = [...(formData.trusted_by_platforms || [])]
                          updated[index] = updatedPlatform
                          setFormData({ ...formData, trusted_by_platforms: updated })
                        }}
                        onRemove={() => {
                          const updated = formData.trusted_by_platforms?.filter((_, i) => i !== index) || []
                          setFormData({ ...formData, trusted_by_platforms: updated })
                        }}
                        onUpload={handlePlatformLogoUpload}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>🤝 Dica:</strong> Faça upload das logos de cada plataforma (PNG ou SVG recomendado).
                    Plataformas sem logo personalizada usarão ícones padrão se disponíveis.
                  </p>
                </div>
              </>
            )}
          </div>
        )
      case 'award':
        const awardLevelOptions = [
          { value: 'bronze', label: '🥉 Bronze' },
          { value: 'silver', label: '🥈 Prata' },
          { value: 'gold', label: '🥇 Ouro' },
          { value: 'platinum', label: '💎 Platina' },
        ]
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Medalha de Pioneiros"
              checked={formData.award_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, award_enabled: checked })}
            />
            {formData.award_enabled && (
              <>
                <Switch
                  label="Mostrar medalha ao lado do vídeo"
                  checked={formData.award_with_video_enabled ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, award_with_video_enabled: checked })}
                />

                {/* Configurações da Medalha */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-sm mb-3">🏆 Configurações da Medalha</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Título da Medalha"
                      value={formData.award_title || ''}
                      onChange={(e) => setFormData({ ...formData, award_title: e.target.value })}
                      placeholder="Ex: PIONEIROS"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">Nível</label>
                      <select
                        value={formData.award_level || 'gold'}
                        onChange={(e) => setFormData({ ...formData, award_level: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {awardLevelOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Subtítulo"
                    value={formData.award_subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, award_subtitle: e.target.value })}
                    placeholder="Ex: Plataforma Completa de IA para Criadores"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Recipient (Nome)"
                      value={formData.award_recipient || ''}
                      onChange={(e) => setFormData({ ...formData, award_recipient: e.target.value })}
                      placeholder="Ex: Gogh Lab"
                    />
                    <Input
                      label="Data/Local"
                      value={formData.award_date || ''}
                      onChange={(e) => setFormData({ ...formData, award_date: e.target.value })}
                      placeholder="Ex: Brasil 2025"
                    />
                  </div>
                </div>

                {/* Seção Standalone */}
                {!formData.award_with_video_enabled && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-sm mb-3">📄 Seção Standalone (sem vídeo)</h4>
                    <Input
                      label="Título da Seção"
                      value={formData.award_standalone_title || ''}
                      onChange={(e) => setFormData({ ...formData, award_standalone_title: e.target.value })}
                      placeholder="Ex: Primeira plataforma do Brasil"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição</label>
                      <textarea
                        value={formData.award_standalone_description || ''}
                        onChange={(e) => setFormData({ ...formData, award_standalone_description: e.target.value })}
                        placeholder="Descrição que aparece ao lado da medalha..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Dica:</strong> {formData.award_with_video_enabled 
                      ? 'A medalha aparecerá ao lado direito da seção de vídeo (Sobre Nós).' 
                      : 'A medalha aparecerá como uma seção standalone com título e descrição.'}
                  </p>
                </div>
              </>
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
                        placeholder="Ex: contato.goghlab@gmail.com"
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

  // Loading - aguardar carregamento do auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  // Se não está autenticado E auth já carregou, mostrar mensagem (não redirecionar automaticamente)
  // O middleware ou a página principal do dashboard vai lidar com o redirecionamento
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">Voltar ao Dashboard</a>
        </div>
      </div>
    )
  }

  // Sem permissão - mostrar mensagem (só verificar após auth carregar e user estar disponível)
  // Se emailIsAdmin é true, sempre permitir acesso mesmo sem profile
  if (!emailIsAdmin && !hasAccess && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">Voltar ao Dashboard</a>
        </div>
      </div>
    )
  }

  // Carregando dados
  if (loading) {
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
