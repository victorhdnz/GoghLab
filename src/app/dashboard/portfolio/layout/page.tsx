'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { BenefitsManager } from '@/components/ui/BenefitsManager'
import { AlternateContentManager } from '@/components/ui/AlternateContentManager'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { SectionWrapper } from '@/components/editor/section-wrapper'
import { ServiceDetailContent } from '@/types/service-detail'

// Mapeamento de seções
const sectionIcons: Record<string, string> = {
  hero: '🎥',
  benefits: '📋',
  alternate: '🔄',
  cta: '📞',
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero com Vídeo',
  benefits: 'O que você receberá',
  alternate: 'Conteúdo Alternado',
  cta: 'Contato',
}

export default function ServiceDetailLayoutPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('hero')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'benefits',
    'alternate',
    'cta',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    benefits: true,
    alternate: true,
    cta: true,
  })
  const [formData, setFormData] = useState<ServiceDetailContent>({
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
    cta_email_enabled: true,
    cta_email_address: '',
    cta_instagram_enabled: true,
    cta_instagram_url: '',
  })

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isEditor)) {
      router.push('/dashboard')
    } else if (!authLoading && isAuthenticated && isEditor) {
      loadLayoutSettings()
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  const loadLayoutSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await getSiteSettings()

      if (error) {
        console.error('Erro ao carregar configurações do layout:', error)
        toast.error('Erro ao carregar configurações do layout.')
        return
      }

      if (data?.service_detail_layout) {
        const layout = data.service_detail_layout as ServiceDetailContent
        setFormData(prev => ({ ...prev, ...layout }))
        
        // Carregar ordem e visibilidade se existirem, filtrando 'gifts', 'testimonials' e 'about'
        if (layout.section_order) {
          const filteredOrder = layout.section_order.filter(
            (sectionId) => sectionId !== 'gifts' && sectionId !== 'testimonials' && sectionId !== 'about'
          )
          setSectionOrder(filteredOrder.length > 0 ? filteredOrder : ['hero', 'benefits', 'alternate', 'cta'])
        }
        if (layout.section_visibility) {
          const filteredVisibility = { ...layout.section_visibility }
          delete filteredVisibility.gifts
          delete filteredVisibility.testimonials
          delete filteredVisibility.about
          setSectionVisibility(filteredVisibility)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do layout:', error)
      toast.error('Erro ao carregar configurações do layout.')
    } finally {
      setLoading(false)
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
    
    // Atualizar também o enabled do formData
    const enabledKey = `${section}_enabled` as keyof ServiceDetailContent
    setFormData(prev => ({
      ...prev,
      [enabledKey]: !sectionVisibility[section]
    }))
    
    toast.success(`Seção ${sectionVisibility[section] ? 'oculta' : 'visível'}!`)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: { 
          service_detail_layout: {
            ...formData,
            section_order: sectionOrder,
            section_visibility: sectionVisibility,
          } as ServiceDetailContent
        },
      })

      if (!success) {
        console.error('Erro ao salvar configurações do layout:', error)
        toast.error(error?.message || 'Erro ao salvar configurações do layout.')
        return
      }

      toast.success('Configurações do layout salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações do layout:', error)
      toast.error('Erro ao salvar configurações do layout.')
    } finally {
      setSaving(false)
    }
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

      case 'cta':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção de Contato"
              checked={formData.cta_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, cta_enabled: checked })}
            />
            {formData.cta_enabled && (
              <>
                <Input
                  label="Título"
                  value={formData.cta_title || ''}
                  onChange={(e) => setFormData({ ...formData, cta_title: e.target.value })}
                  placeholder="Ex: Fale Conosco"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.cta_description || ''}
                    onChange={(e) => setFormData({ ...formData, cta_description: e.target.value })}
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
                      checked={formData.cta_whatsapp_enabled ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, cta_whatsapp_enabled: checked })}
                    />
                  </div>
                  {formData.cta_whatsapp_enabled && (
                    <>
                      <Input
                        label="Número do WhatsApp (com DDD, ex: 5534984136291)"
                        value={formData.cta_whatsapp_number || ''}
                        onChange={(e) => setFormData({ ...formData, cta_whatsapp_number: e.target.value })}
                        placeholder="Ex: 5534984136291"
                      />
                      <Input
                        label="Texto do Botão WhatsApp"
                        value={formData.cta_whatsapp_text || ''}
                        onChange={(e) => setFormData({ ...formData, cta_whatsapp_text: e.target.value })}
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
                      checked={formData.cta_email_enabled ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, cta_email_enabled: checked })}
                    />
                  </div>
                  {formData.cta_email_enabled && (
                    <>
                      <Input
                        label="Endereço de E-mail"
                        value={formData.cta_email_address || ''}
                        onChange={(e) => setFormData({ ...formData, cta_email_address: e.target.value })}
                        placeholder="Ex: contato@mvcompany.com"
                        type="email"
                      />
                      <Input
                        label="Texto do Botão E-mail"
                        value={formData.cta_email_text || ''}
                        onChange={(e) => setFormData({ ...formData, cta_email_text: e.target.value })}
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
                      checked={formData.cta_instagram_enabled ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, cta_instagram_enabled: checked })}
                    />
                  </div>
                  {formData.cta_instagram_enabled && (
                    <>
                      <Input
                        label="URL do Instagram"
                        value={formData.cta_instagram_url || ''}
                        onChange={(e) => setFormData({ ...formData, cta_instagram_url: e.target.value })}
                        placeholder="Ex: https://instagram.com/mvcompany"
                      />
                      <Input
                        label="Texto do Botão Instagram"
                        value={formData.cta_instagram_text || ''}
                        onChange={(e) => setFormData({ ...formData, cta_instagram_text: e.target.value })}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardNavigation
          title="Layout de Página Detalhada"
          subtitle="Configure o layout e seções das páginas de detalhes dos serviços"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
          actions={
            <div className="flex gap-3">
              <Link href="/portfolio" target="_blank">
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

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Editor Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Seções da Página</h2>
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
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold mb-4">Ações</h3>
              <Button onClick={handleSave} isLoading={saving} className="w-full">
                <Save size={18} className="mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
