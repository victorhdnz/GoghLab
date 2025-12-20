'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { Switch } from '@/components/ui/Switch'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye, Trash2, Plus, Edit, Copy, Check, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { SectionWrapper } from '@/components/editor/section-wrapper'
import { Service } from '@/types'
import Image from 'next/image'

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

  section_order?: string[]
  section_visibility?: Record<string, boolean>
}

// Mapeamento de seções
const sectionIcons: Record<string, string> = {
  hero: '🎯',
  services: '📦',
  comparison: '⚖️',
  contact: '📞',
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero (Principal)',
  services: 'Nossos Serviços',
  comparison: 'Comparação (CTA)',
  contact: 'Contato',
}

export default function PaginasDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Estados para Homepage
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('hero')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'services',
    'comparison',
    'contact',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    services: true,
    comparison: true,
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
  })

  // Estados para Serviços
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isEditor)) {
      router.push('/dashboard')
    } else if (isAuthenticated && isEditor) {
      loadSettings()
      loadServices()
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
        setFormData(prev => ({ ...prev, ...content }))
        if (content.section_order) {
          setSectionOrder(content.section_order)
        }
        if (content.section_visibility) {
          setSectionVisibility(content.section_visibility)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações da homepage.')
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      setLoadingServices(true)
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
      setLoadingServices(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: {
          homepage_content: {
            ...formData,
            section_order: sectionOrder,
            section_visibility: sectionVisibility,
          }
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

    const enabledKey = `${section}_enabled` as keyof HomepageSettings
    setFormData(prev => ({
      ...prev,
      [enabledKey]: !sectionVisibility[section]
    }))

    toast.success(`Seção ${sectionVisibility[section] ? 'oculta' : 'visível'}!`)
  }

  const copyServiceLink = async (slug: string, serviceId: string) => {
    const url = `${window.location.origin}/portfolio/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLinkId(serviceId)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopiedLinkId(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
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

  // Renderizar conteúdo de cada seção (mesmo código do homepage/page.tsx)
  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Hero"
              checked={formData.hero_enabled ?? true}
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
              checked={formData.services_enabled ?? true}
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
                <p className="text-sm text-gray-500">
                  Os serviços são gerenciados na coluna ao lado.
                </p>
              </>
            )}
          </div>
        )
      case 'comparison':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Comparação"
              checked={formData.comparison_cta_enabled ?? true}
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
      case 'contact':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Contato"
              checked={formData.contact_enabled ?? true}
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
                  <Switch
                    label="Habilitar WhatsApp"
                    checked={formData.contact_whatsapp_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, contact_whatsapp_enabled: checked })}
                  />
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
                  <Switch
                    label="Habilitar E-mail"
                    checked={formData.contact_email_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, contact_email_enabled: checked })}
                  />
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
                  <Switch
                    label="Habilitar Instagram"
                    checked={formData.contact_instagram_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, contact_instagram_enabled: checked })}
                  />
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
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Botão Flutuante do WhatsApp</h3>
                  <Switch
                    label="Habilitar Botão Flutuante"
                    checked={formData.whatsapp_float_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_float_enabled: checked })}
                  />
                  {formData.whatsapp_float_enabled && (
                    <>
                      <Input
                        label="Número do WhatsApp (com DDD, ex: 5534984136291)"
                        value={formData.whatsapp_float_number || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp_float_number: e.target.value })}
                        placeholder="Ex: 5534984136291"
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2">Mensagem Inicial</label>
                        <textarea
                          value={formData.whatsapp_float_message || ''}
                          onChange={(e) => setFormData({ ...formData, whatsapp_float_message: e.target.value })}
                          placeholder="Ex: Olá! Gostaria de saber mais sobre os serviços."
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
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
          title="Páginas e Serviços"
          subtitle="Edite a homepage e gerencie seus serviços"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Coluna Esquerda: Editor da Homepage */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Editor da Homepage</h2>
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

          {/* Coluna Direita: Gerenciar Serviços */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Gerenciar Serviços</h2>
                <Link href="/dashboard/portfolio/novo">
                  <Button size="sm">
                    <Plus size={18} className="mr-2" />
                    Novo Serviço
                  </Button>
                </Link>
              </div>

              {loadingServices ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Nenhum serviço cadastrado ainda.</p>
                  <Link href="/dashboard/portfolio/novo">
                    <Button>
                      <Plus size={18} className="mr-2" />
                      Criar Primeiro Serviço
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {service.images && service.images.length > 0 && (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={service.images[0]}
                                  alt={service.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                              <p className="text-sm text-gray-500 truncate">{service.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => toggleServiceStatus(service.id, service.is_active)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                service.is_active
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {service.is_active ? (
                                <>
                                  <Eye size={14} className="inline mr-1" />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <EyeOff size={14} className="inline mr-1" />
                                  Inativo
                                </>
                              )}
                            </button>
                            <Link href={`/dashboard/portfolio/${service.id}`}>
                              <button className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                <Edit size={14} className="inline mr-1" />
                                Editar
                              </button>
                            </Link>
                            <button
                              onClick={() => copyServiceLink(service.slug, service.id)}
                              className="px-3 py-1 rounded text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                            >
                              {copiedLinkId === service.id ? (
                                <>
                                  <Check size={14} className="inline mr-1" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy size={14} className="inline mr-1" />
                                  Copiar Link
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

