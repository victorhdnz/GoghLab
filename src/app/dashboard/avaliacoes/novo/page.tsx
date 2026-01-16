'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { StarRating } from '@/components/ui/StarRating'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { BackButton } from '@/components/ui/BackButton'

export default function NovaAvaliacao() {
  const router = useRouter()
  const { isEditor, emailIsAdmin } = useAuth()
  const supabase = createClient()

  // Verificar se tem acesso - emailIsAdmin funciona mesmo sem profile carregado
  const hasAccess = emailIsAdmin || isEditor

  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
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
    if (hasAccess) {
      loadServices()
    }
  }, [hasAccess])

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
      toast.error('Erro ao carregar serviços')
    }
  }

  const handleSave = async () => {
    if (!formData.client_name || !formData.testimonial_text) {
      toast.error('Preencha pelo menos o nome do cliente e o depoimento')
      return
    }

    try {
      setLoading(true)

      const { error } = await (supabase as any)
        .from('service_testimonials')
        .insert({
          service_id: formData.service_id || null,
          client_name: formData.client_name,
          client_company: formData.client_company,
          client_photo: formData.client_photo,
          rating: formData.rating,
          testimonial_text: formData.testimonial_text,
          is_featured: formData.is_featured,
          is_active: formData.is_active,
        })

      if (error) throw error

      toast.success('Avaliação criada com sucesso!')
      router.push('/dashboard/avaliacoes')
    } catch (error: any) {
      console.error('Erro ao criar avaliação:', error)
      toast.error(error.message || 'Erro ao criar avaliação')
    } finally {
      setLoading(false)
    }
  }

  // Verificar apenas permissão - autenticação é feita pelo middleware
  // Se emailIsAdmin é true, sempre permitir acesso mesmo sem profile
  if (!emailIsAdmin && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">Voltar ao Dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/dashboard/avaliacoes" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nova Avaliação</h1>
            <p className="text-gray-600">Adicione um depoimento de cliente</p>
          </div>
          <Button onClick={handleSave} isLoading={loading} size="lg">
            <Save size={18} className="mr-2" />
            Salvar Avaliação
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

