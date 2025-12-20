'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'
import { SectionWrapper } from '@/components/editor/section-wrapper'

interface ServiceDetailLayout {
  hero_enabled?: boolean
  hero_title_template?: string
  hero_subtitle_template?: string
  
  description_enabled?: boolean
  description_title?: string
  
  video_enabled?: boolean
  video_title?: string
  
  gallery_enabled?: boolean
  gallery_title?: string
  
  testimonials_enabled?: boolean
  testimonials_title?: string
  
  pricing_enabled?: boolean
  pricing_title?: string
  
  related_services_enabled?: boolean
  related_services_title?: string
  
  cta_enabled?: boolean
  cta_title?: string
  cta_description?: string
  
  section_order?: string[]
  section_visibility?: Record<string, boolean>
}

// Mapeamento de seções
const sectionIcons: Record<string, string> = {
  hero: '🎯',
  description: '📝',
  video: '🎥',
  gallery: '🖼️',
  testimonials: '💬',
  pricing: '💰',
  related_services: '🔗',
  cta: '🚀',
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero (Principal)',
  description: 'Descrição Detalhada',
  video: 'Vídeo Explicativo',
  gallery: 'Galeria de Projetos',
  testimonials: 'Depoimentos',
  pricing: 'Preços/Investimento',
  related_services: 'Serviços Relacionados',
  cta: 'Call to Action',
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
    'description',
    'video',
    'gallery',
    'testimonials',
    'pricing',
    'related_services',
    'cta',
  ])
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    description: true,
    video: true,
    gallery: true,
    testimonials: true,
    pricing: true,
    related_services: true,
    cta: true,
  })
  const [formData, setFormData] = useState<ServiceDetailLayout>({
    hero_enabled: true,
    hero_title_template: '{service_name}',
    hero_subtitle_template: '{service_description}',
    
    description_enabled: true,
    description_title: 'Sobre este serviço',
    
    video_enabled: true,
    video_title: 'Vídeo Explicativo',
    
    gallery_enabled: true,
    gallery_title: 'Galeria de Projetos',
    
    testimonials_enabled: true,
    testimonials_title: 'O que nossos clientes dizem',
    
    pricing_enabled: true,
    pricing_title: 'Investimento',
    
    related_services_enabled: true,
    related_services_title: 'Outros Serviços',
    
    cta_enabled: true,
    cta_title: 'Pronto para começar?',
    cta_description: 'Entre em contato e solicite um orçamento personalizado',
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
        const layout = data.service_detail_layout
        setFormData(prev => ({ ...prev, ...layout }))
        
        // Carregar ordem e visibilidade se existirem
        if (layout.section_order) {
          setSectionOrder(layout.section_order)
        }
        if (layout.section_visibility) {
          setSectionVisibility(layout.section_visibility)
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
    const enabledKey = `${section}_enabled` as keyof ServiceDetailLayout
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
          }
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
              label="Habilitar Seção Hero"
              checked={formData.hero_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, hero_enabled: checked })}
            />
            {formData.hero_enabled && (
              <>
                <Input
                  label="Template do Título (use {service_name} para nome do serviço)"
                  value={formData.hero_title_template || ''}
                  onChange={(e) => setFormData({ ...formData, hero_title_template: e.target.value })}
                  placeholder="Ex: {service_name}"
                />
                <Input
                  label="Template do Subtítulo (use {service_description} para descrição)"
                  value={formData.hero_subtitle_template || ''}
                  onChange={(e) => setFormData({ ...formData, hero_subtitle_template: e.target.value })}
                  placeholder="Ex: {service_description}"
                />
              </>
            )}
          </div>
        )

      case 'description':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Descrição"
              checked={formData.description_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, description_enabled: checked })}
            />
            {formData.description_enabled && (
              <Input
                label="Título da Seção"
                value={formData.description_title || ''}
                onChange={(e) => setFormData({ ...formData, description_title: e.target.value })}
                placeholder="Ex: Sobre este serviço"
              />
            )}
          </div>
        )

      case 'video':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Vídeo"
              checked={formData.video_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, video_enabled: checked })}
            />
            {formData.video_enabled && (
              <Input
                label="Título da Seção"
                value={formData.video_title || ''}
                onChange={(e) => setFormData({ ...formData, video_title: e.target.value })}
                placeholder="Ex: Vídeo Explicativo"
              />
            )}
          </div>
        )

      case 'gallery':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Galeria"
              checked={formData.gallery_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, gallery_enabled: checked })}
            />
            {formData.gallery_enabled && (
              <Input
                label="Título da Seção"
                value={formData.gallery_title || ''}
                onChange={(e) => setFormData({ ...formData, gallery_title: e.target.value })}
                placeholder="Ex: Galeria de Projetos"
              />
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
              <Input
                label="Título da Seção"
                value={formData.testimonials_title || ''}
                onChange={(e) => setFormData({ ...formData, testimonials_title: e.target.value })}
                placeholder="Ex: O que nossos clientes dizem"
              />
            )}
          </div>
        )

      case 'pricing':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Preços"
              checked={formData.pricing_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, pricing_enabled: checked })}
            />
            {formData.pricing_enabled && (
              <Input
                label="Título da Seção"
                value={formData.pricing_title || ''}
                onChange={(e) => setFormData({ ...formData, pricing_title: e.target.value })}
                placeholder="Ex: Investimento"
              />
            )}
          </div>
        )

      case 'related_services':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção Serviços Relacionados"
              checked={formData.related_services_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, related_services_enabled: checked })}
            />
            {formData.related_services_enabled && (
              <Input
                label="Título da Seção"
                value={formData.related_services_title || ''}
                onChange={(e) => setFormData({ ...formData, related_services_title: e.target.value })}
                placeholder="Ex: Outros Serviços"
              />
            )}
          </div>
        )

      case 'cta':
        return (
          <div className="space-y-4">
            <Switch
              label="Habilitar Seção CTA Final"
              checked={formData.cta_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, cta_enabled: checked })}
            />
            {formData.cta_enabled && (
              <>
                <Input
                  label="Título do CTA"
                  value={formData.cta_title || ''}
                  onChange={(e) => setFormData({ ...formData, cta_title: e.target.value })}
                  placeholder="Ex: Pronto para começar?"
                />
                <Input
                  label="Descrição do CTA"
                  value={formData.cta_description || ''}
                  onChange={(e) => setFormData({ ...formData, cta_description: e.target.value })}
                  placeholder="Ex: Entre em contato e solicite um orçamento"
                />
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
