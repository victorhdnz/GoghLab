'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { StarRating } from '@/components/ui/StarRating'
import { createClient } from '@/lib/supabase/client'
import { ServiceTestimonial, Service } from '@/types'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { BackButton } from '@/components/ui/BackButton'

interface EditAvaliacaoPageProps {
  params: { id: string }
}

export default function EditAvaliacaoPage({ params }: EditAvaliacaoPageProps) {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [testimonial, setTestimonial] = useState<ServiceTestimonial | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const supabase = createClient()

  const [formData, setFormData] = useState({
    service_id: '',
    client_name: '',
    client_company: '',
    client_photo: '',
    rating: 5,
    testimonial_text: '',
    is_featured: false,
    is_active: true,
  })

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else {
        loadTestimonial()
        loadServices()
      }
    }
  }, [isAuthenticated, isEditor, authLoading, router, params.id])

  const loadTestimonial = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_testimonials')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      const testimonialData = data as ServiceTestimonial
      setTestimonial(testimonialData)
      setFormData({
        service_id: testimonialData.service_id || '',
        client_name: testimonialData.client_name || '',
        client_company: testimonialData.client_company || '',
        client_photo: testimonialData.client_photo || '',
        rating: testimonialData.rating || 5,
        testimonial_text: testimonialData.testimonial_text || '',
        is_featured: testimonialData.is_featured || false,
        is_active: testimonialData.is_active !== false,
      })
    } catch (error: any) {
      console.error('Erro ao carregar avaliação:', error)
      toast.error('Erro ao carregar avaliação')
      router.push('/dashboard/avaliacoes')
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServices(data as Service[] || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.client_name || !formData.testimonial_text) {
      toast.error('Preencha pelo menos o nome do cliente e o depoimento')
      return
    }

    try {
      setSaving(true)

      const { error } = await (supabase as any)
        .from('service_testimonials')
        .update({
          service_id: formData.service_id || null,
          client_name: formData.client_name,
          client_company: formData.client_company,
          client_photo: formData.client_photo,
          rating: formData.rating,
          testimonial_text: formData.testimonial_text,
          is_featured: formData.is_featured,
          is_active: formData.is_active,
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success('Avaliação atualizada com sucesso!')
      router.push('/dashboard/avaliacoes')
    } catch (error: any) {
      console.error('Erro ao atualizar avaliação:', error)
      toast.error(error.message || 'Erro ao atualizar avaliação')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!testimonial) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/dashboard/avaliacoes" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Avaliação</h1>
            <p className="text-gray-600">{testimonial.client_name}</p>
          </div>
          <Button onClick={handleSave} isLoading={saving} size="lg">
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Informações do Cliente */}
          <div>
            <h2 className="text-xl font-bold mb-4">Informações do Cliente</h2>
            
            <div className="space-y-4">
              <Input
                label="Nome do Cliente *"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Ex: João Silva"
              />

              <Input
                label="Empresa do Cliente"
                value={formData.client_company}
                onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                placeholder="Ex: Empresa XYZ"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Foto do Cliente</label>
                <ImageUploader
                  value={formData.client_photo}
                  onChange={(url) => setFormData({ ...formData, client_photo: url })}
                  cropType="square"
                  recommendedDimensions="400x400px"
                />
              </div>
            </div>
          </div>

          {/* Serviço */}
          <div>
            <h2 className="text-xl font-bold mb-4">Serviço</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Serviço Relacionado (Opcional)</label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Geral (não vinculado a serviço específico)</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Avaliação */}
          <div>
            <h2 className="text-xl font-bold mb-4">Avaliação</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nota (1-5 estrelas)</label>
                <StarRating
                  value={formData.rating}
                  onChange={(rating) => setFormData({ ...formData, rating })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Depoimento *</label>
                <textarea
                  value={formData.testimonial_text}
                  onChange={(e) => setFormData({ ...formData, testimonial_text: e.target.value })}
                  placeholder="Digite o depoimento do cliente..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div>
            <h2 className="text-xl font-bold mb-4">Configurações</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_featured" className="text-sm font-medium">
                  Destacar avaliação
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Avaliação ativa
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

