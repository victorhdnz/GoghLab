'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { createClient } from '@/lib/supabase/client'
import { CompanyComparison, ComparisonTopic } from '@/types'
import { Save, Plus, Trash2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { BackButton } from '@/components/ui/BackButton'
import Link from 'next/link'

interface EditComparacaoPageProps {
  params: { id: string }
}

export default function EditComparacaoPage({ params }: EditComparacaoPageProps) {
  const router = useRouter()
  const { isEditor, emailIsAdmin } = useAuth()
  const [comparison, setComparison] = useState<CompanyComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Verificar se tem acesso - emailIsAdmin funciona mesmo sem profile carregado
  const hasAccess = emailIsAdmin || isEditor

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    is_active: true,
  })
  const [topics, setTopics] = useState<ComparisonTopic[]>([])

  useEffect(() => {
    if (hasAccess) {
      loadComparison()
    }
  }, [hasAccess])

  const loadComparison = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('company_comparisons')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setComparison(data as CompanyComparison)
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        logo: data.logo || '',
        description: data.description || '',
        is_active: data.is_active !== false,
      })
      
      // Carregar tópicos
      if (data.comparison_topics && Array.isArray(data.comparison_topics)) {
        setTopics(data.comparison_topics as ComparisonTopic[])
      } else {
        setTopics([])
      }
    } catch (error: any) {
      console.error('Erro ao carregar comparação:', error)
      toast.error('Erro ao carregar comparação')
      router.push('/dashboard/comparador')
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name })
    // Gerar slug automaticamente apenas se estiver vazio
    if (!formData.slug) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const addTopic = () => {
    const newTopic: ComparisonTopic = {
      id: Date.now().toString(),
      name: '',
      mv_company: true,
      competitor: false,
    }
    setTopics([...topics, newTopic])
  }

  const updateTopic = (id: string, field: keyof ComparisonTopic, value: any) => {
    setTopics(topics.map(topic =>
      topic.id === id ? { ...topic, [field]: value } : topic
    ))
  }

  const removeTopic = (id: string) => {
    setTopics(topics.filter(topic => topic.id !== id))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Preencha pelo menos o nome da empresa comparada')
      return
    }

    if (topics.length === 0) {
      toast.error('Adicione pelo menos um tópico de comparação')
      return
    }

    // Validar tópicos
    const invalidTopics = topics.filter(t => !t.name.trim())
    if (invalidTopics.length > 0) {
      toast.error('Preencha o nome de todos os tópicos')
      return
    }

    try {
      setSaving(true)

      const { error } = await (supabase as any)
        .from('company_comparisons')
        .update({
          ...formData,
          comparison_topics: topics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success('Comparação atualizada com sucesso!')
      router.push('/dashboard/comparador')
    } catch (error: any) {
      console.error('Erro ao atualizar comparação:', error)
      toast.error(error.message || 'Erro ao atualizar comparação')
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

  if (!comparison) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <BackButton href="/dashboard/comparador" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Comparação</h1>
            <p className="text-gray-600">{comparison.name}</p>
          </div>
          <Button onClick={handleSave} isLoading={saving} size="lg">
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </Button>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-6">Informações da Empresa Comparada</h2>
            
            <div className="space-y-4">
              <Input
                label="Nome da Empresa *"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Empresa Competidora XYZ"
              />

              <Input
                label="Slug (URL) *"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="empresa-competidora-xyz"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Logo da Empresa</label>
                <ImageUploader
                  value={formData.logo}
                  onChange={(url) => setFormData({ ...formData, logo: url })}
                  cropType="square"
                  recommendedDimensions="400x400px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição da empresa comparada..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* Tópicos de Comparação */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Tópicos de Comparação</h2>
              <Button onClick={addTopic} variant="outline">
                <Plus size={18} className="mr-2" />
                Adicionar Tópico
              </Button>
            </div>

            {topics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum tópico adicionado ainda.</p>
                <p className="text-sm mt-2">Clique em "Adicionar Tópico" para começar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic, index) => (
                  <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <Input
                          label={`Tópico ${index + 1}`}
                          value={topic.name}
                          onChange={(e) => updateTopic(topic.id, 'name', e.target.value)}
                          placeholder="Ex: Criação de Sites Responsivos"
                        />
                      </div>
                      <button
                        onClick={() => removeTopic(topic.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {/* Gogh Lab */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">Gogh Lab</span>
                          <button
                            onClick={() => updateTopic(topic.id, 'mv_company', !topic.mv_company)}
                            className={`p-2 rounded-lg transition-colors ${
                              topic.mv_company
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {topic.mv_company ? <Check size={20} /> : <X size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Competidor */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{formData.name || 'Competidor'}</span>
                          <button
                            onClick={() => updateTopic(topic.id, 'competitor', !topic.competitor)}
                            className={`p-2 rounded-lg transition-colors ${
                              topic.competitor
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {topic.competitor ? <Check size={20} /> : <X size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configurações */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Configurações</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Comparação ativa
                </label>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href={`/comparar/${formData.slug || comparison.slug}`}
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Ver comparação pública →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

