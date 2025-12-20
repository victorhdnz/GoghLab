'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'

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
}

export default function ServiceDetailLayoutPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        setFormData(prev => ({ ...prev, ...data.service_detail_layout }))
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do layout:', error)
      toast.error('Erro ao carregar configurações do layout.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: { service_detail_layout: formData },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção Hero</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção Hero</label>
                <input
                  type="checkbox"
                  checked={formData.hero_enabled}
                  onChange={(e) => setFormData({ ...formData, hero_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
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
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção Descrição</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção Descrição</label>
                <input
                  type="checkbox"
                  checked={formData.description_enabled}
                  onChange={(e) => setFormData({ ...formData, description_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              {formData.description_enabled && (
                <Input
                  label="Título da Seção"
                  value={formData.description_title || ''}
                  onChange={(e) => setFormData({ ...formData, description_title: e.target.value })}
                  placeholder="Ex: Sobre este serviço"
                />
              )}
            </div>
          </div>

          {/* Video Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção Vídeo</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção Vídeo</label>
                <input
                  type="checkbox"
                  checked={formData.video_enabled}
                  onChange={(e) => setFormData({ ...formData, video_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              {formData.video_enabled && (
                <Input
                  label="Título da Seção"
                  value={formData.video_title || ''}
                  onChange={(e) => setFormData({ ...formData, video_title: e.target.value })}
                  placeholder="Ex: Vídeo Explicativo"
                />
              )}
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção Galeria</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção Galeria</label>
                <input
                  type="checkbox"
                  checked={formData.gallery_enabled}
                  onChange={(e) => setFormData({ ...formData, gallery_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              {formData.gallery_enabled && (
                <Input
                  label="Título da Seção"
                  value={formData.gallery_title || ''}
                  onChange={(e) => setFormData({ ...formData, gallery_title: e.target.value })}
                  placeholder="Ex: Galeria de Projetos"
                />
              )}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção Depoimentos</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção Depoimentos</label>
                <input
                  type="checkbox"
                  checked={formData.testimonials_enabled}
                  onChange={(e) => setFormData({ ...formData, testimonials_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              {formData.testimonials_enabled && (
                <Input
                  label="Título da Seção"
                  value={formData.testimonials_title || ''}
                  onChange={(e) => setFormData({ ...formData, testimonials_title: e.target.value })}
                  placeholder="Ex: O que nossos clientes dizem"
                />
              )}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção Preços</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção Preços</label>
                <input
                  type="checkbox"
                  checked={formData.pricing_enabled}
                  onChange={(e) => setFormData({ ...formData, pricing_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              {formData.pricing_enabled && (
                <Input
                  label="Título da Seção"
                  value={formData.pricing_title || ''}
                  onChange={(e) => setFormData({ ...formData, pricing_title: e.target.value })}
                  placeholder="Ex: Investimento"
                />
              )}
            </div>
          </div>

          {/* Related Services Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção Serviços Relacionados</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção Serviços Relacionados</label>
                <input
                  type="checkbox"
                  checked={formData.related_services_enabled}
                  onChange={(e) => setFormData({ ...formData, related_services_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              {formData.related_services_enabled && (
                <Input
                  label="Título da Seção"
                  value={formData.related_services_title || ''}
                  onChange={(e) => setFormData({ ...formData, related_services_title: e.target.value })}
                  placeholder="Ex: Outros Serviços"
                />
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Seção CTA Final</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Habilitar Seção CTA</label>
                <input
                  type="checkbox"
                  checked={formData.cta_enabled}
                  onChange={(e) => setFormData({ ...formData, cta_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
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
          </div>
        </div>
      </div>
    </div>
  )
}

