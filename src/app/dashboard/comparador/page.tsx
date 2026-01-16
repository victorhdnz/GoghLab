'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { createClient } from '@/lib/supabase/client'
import { CompanyComparison } from '@/types'
import { Eye, Save, ChevronDown, ChevronUp, Edit2, X, Plus, Check, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import Image from 'next/image'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'

interface GlobalTopic {
  id: string
  name: string
  order: number
}

interface CompanyTopicValue {
  topic_id: string
  has_feature: boolean // true = check, false = X
}

interface CompetitorCompany {
  id: string
  name: string
  logo?: string
  description?: string
  topic_values: CompanyTopicValue[] // Mapeamento de tópico -> check/X
  is_active: boolean
}

interface MVCompany {
  name: string
  logo?: string
  topic_values: CompanyTopicValue[]
}

export default function ComparadorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [editingCompany, setEditingCompany] = useState<number | null>(null)
  const [editingMVCompany, setEditingMVCompany] = useState(false)
  const [topicsExpanded, setTopicsExpanded] = useState(true)
  
  // Gogh Lab state
  const [mvCompany, setMvCompany] = useState<MVCompany>({
    name: 'Gogh Lab',
    logo: '',
    topic_values: [],
  })

  // Global topics
  const [globalTopics, setGlobalTopics] = useState<GlobalTopic[]>([])

  // Função auxiliar para gerar UUID válido
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Função auxiliar para verificar se é UUID válido
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  const [companies, setCompanies] = useState<CompetitorCompany[]>([
    {
      id: generateUUID(),
      name: '',
      logo: '',
      description: '',
      topic_values: [],
      is_active: true,
    },
    {
      id: generateUUID(),
      name: '',
      logo: '',
      description: '',
      topic_values: [],
      is_active: true,
    },
    {
      id: generateUUID(),
      name: '',
      logo: '',
      description: '',
      topic_values: [],
      is_active: true,
    },
  ])

  const supabase = createClient()

  useEffect(() => {
    // Carregar dados - autenticação é verificada pelo middleware
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadGlobalTopics(), loadMVCompany(), loadCompanies()])
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do comparador')
    } finally {
      setLoading(false)
    }
  }

  const loadGlobalTopics = async () => {
    try {
      const { data, error } = await getSiteSettings()
      if (error) {
        console.error('Erro ao carregar tópicos:', error)
        return
      }
      
      if (data?.comparison_topics) {
        const topics = data.comparison_topics as GlobalTopic[]
        setGlobalTopics(topics.sort((a, b) => a.order - b.order))
      }
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error)
    }
  }

  const loadMVCompany = async () => {
    try {
      const { data, error } = await getSiteSettings()
      if (error) {
        console.error('Erro ao carregar Gogh Lab:', error)
        return
      }
      
      if (data?.mv_company) {
        setMvCompany(data.mv_company as MVCompany)
      }
    } catch (error) {
      console.error('Erro ao carregar Gogh Lab:', error)
    }
  }

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('company_comparisons')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(3)

      if (error) throw error

      const loadedCompanies = (data as CompanyComparison[] || []).slice(0, 3)
      
      const updatedCompanies = [...companies]
      loadedCompanies.forEach((company, index) => {
        if (index < 3) {
          // Converter comparison_topics antigo para topic_values
          const topicValues: CompanyTopicValue[] = []
          if (company.comparison_topics && Array.isArray(company.comparison_topics)) {
            company.comparison_topics.forEach((topic: any) => {
              if (topic.id) {
                topicValues.push({
                  topic_id: topic.id,
                  has_feature: topic.competitor || false,
                })
              }
            })
          }
          
          // Garantir que o ID seja um UUID válido
          let companyId = company.id
          if (!isValidUUID(companyId)) {
            companyId = generateUUID()
          }
          
          updatedCompanies[index] = {
            id: companyId,
            name: company.name,
            logo: company.logo || '',
            description: company.description || '',
            topic_values: topicValues,
            is_active: company.is_active,
          }
        }
      })

      setCompanies(updatedCompanies)
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }


  const handleAddTopic = () => {
    const newTopic: GlobalTopic = {
      id: `topic-${Date.now()}`,
      name: '',
      order: globalTopics.length,
    }
    setGlobalTopics([...globalTopics, newTopic])
  }

  const handleRemoveTopic = (topicId: string) => {
    setGlobalTopics(globalTopics.filter(t => t.id !== topicId))
    // Remover também dos topic_values de todas as empresas
    setMvCompany(prev => ({
      ...prev,
      topic_values: prev.topic_values.filter(tv => tv.topic_id !== topicId),
    }))
    setCompanies(prev => prev.map(company => ({
      ...company,
      topic_values: company.topic_values.filter(tv => tv.topic_id !== topicId),
    })))
  }

  const handleUpdateTopic = (topicId: string, field: 'name', value: string) => {
    setGlobalTopics(prev => prev.map(topic => 
      topic.id === topicId ? { ...topic, [field]: value } : topic
    ))
  }

  const handleMoveTopic = (topicId: string, direction: 'up' | 'down') => {
    const currentIndex = globalTopics.findIndex(t => t.id === topicId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= globalTopics.length) return

    const newTopics = [...globalTopics]
    const [removed] = newTopics.splice(currentIndex, 1)
    newTopics.splice(newIndex, 0, removed)
    
    // Atualizar ordem
    const updatedTopics = newTopics.map((topic, index) => ({
      ...topic,
      order: index,
    }))
    
    setGlobalTopics(updatedTopics)
  }

  const handleSaveTopics = async () => {
    try {
      setSaving(true)
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: {
          comparison_topics: globalTopics,
        },
      })

      if (!success) {
        toast.error(error?.message || 'Erro ao salvar tópicos')
        return
      }

      toast.success('Tópicos salvos com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar tópicos:', error)
      toast.error('Erro ao salvar tópicos')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMVCompany = async () => {
    try {
      setSaving(true)
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: {
          mv_company: mvCompany,
        },
      })

      if (!success) {
        toast.error(error?.message || 'Erro ao salvar Gogh Lab')
        return
      }

      toast.success('Gogh Lab salva com sucesso!')
      setEditingMVCompany(false)
    } catch (error) {
      console.error('Erro ao salvar Gogh Lab:', error)
      toast.error('Erro ao salvar Gogh Lab')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)

      // 1. Salvar tópicos globais
      if (globalTopics.length > 0) {
        const { success: topicsSuccess, error: topicsError } = await saveSiteSettings({
          fieldsToUpdate: {
            comparison_topics: globalTopics,
          },
        })

        if (!topicsSuccess) {
          toast.error(topicsError?.message || 'Erro ao salvar tópicos')
          return
        }
      }

      // 2. Salvar Gogh Lab
      const { success: mvSuccess, error: mvError } = await saveSiteSettings({
        fieldsToUpdate: {
          mv_company: mvCompany,
        },
      })

      if (!mvSuccess) {
        toast.error(mvError?.message || 'Erro ao salvar Gogh Lab')
        return
      }

      // 3. Salvar empresas concorrentes
      for (let index = 0; index < companies.length; index++) {
        let company = companies[index]
        
        // Se a empresa não tem nome, pular (não salvar empresas vazias)
        if (!company.name.trim()) {
          continue
        }

        const slug = company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

        // Verificar se o ID é um UUID válido, se não for, gerar um novo
        let companyId = company.id
        if (!isValidUUID(companyId)) {
          companyId = generateUUID()
          // Atualizar o ID no estado e na variável local
          company = { ...company, id: companyId }
          setCompanies(prev => {
            const updated = [...prev]
            updated[index] = company
            return updated
          })
        }

        // Verificar se já existe uma empresa com este ID
        const { data: existing } = await (supabase as any)
          .from('company_comparisons')
          .select('id')
          .eq('id', companyId)
          .maybeSingle()

        // Converter topic_values de volta para comparison_topics (compatibilidade)
        const comparison_topics = globalTopics.map(topic => {
          const topicValue = company.topic_values.find(tv => tv.topic_id === topic.id)
          return {
            id: topic.id,
            name: topic.name,
            mv_company: mvCompany.topic_values.find(tv => tv.topic_id === topic.id)?.has_feature || false,
            competitor: topicValue?.has_feature || false,
          }
        })

        if (existing) {
          // Atualizar empresa existente
          const { error } = await (supabase as any)
            .from('company_comparisons')
            .update({
              name: company.name,
              slug: slug,
              logo: company.logo,
              description: company.description,
              comparison_topics: comparison_topics,
              is_active: company.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq('id', companyId)

          if (error) throw error
        } else {
          // Criar nova empresa
          const { error } = await (supabase as any)
            .from('company_comparisons')
            .insert({
              id: companyId,
              name: company.name,
              slug: slug,
              logo: company.logo,
              description: company.description,
              comparison_topics: comparison_topics,
              is_active: company.is_active,
            })

          if (error) throw error
        }
      }


      toast.success('Todas as alterações foram salvas com sucesso!')
      setEditingMVCompany(false)
      setEditingCompany(null)
      loadCompanies()
    } catch (error: any) {
      console.error('Erro ao salvar tudo:', error)
      toast.error(error?.message || 'Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleTopicValue = (companyIndex: number | 'mv', topicId: string, value: boolean) => {
    if (companyIndex === 'mv') {
      setMvCompany(prev => {
        const existing = prev.topic_values.find(tv => tv.topic_id === topicId)
        if (existing) {
          return {
            ...prev,
            topic_values: prev.topic_values.map(tv =>
              tv.topic_id === topicId ? { ...tv, has_feature: value } : tv
            ),
          }
        } else {
          return {
            ...prev,
            topic_values: [...prev.topic_values, { topic_id: topicId, has_feature: value }],
          }
        }
      })
    } else {
      setCompanies(prev => prev.map((company, idx) => {
        if (idx !== companyIndex) return company
        
        const existing = company.topic_values.find(tv => tv.topic_id === topicId)
        if (existing) {
          return {
            ...company,
            topic_values: company.topic_values.map(tv =>
              tv.topic_id === topicId ? { ...tv, has_feature: value } : tv
            ),
          }
        } else {
          return {
            ...company,
            topic_values: [...company.topic_values, { topic_id: topicId, has_feature: value }],
          }
        }
      }))
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton href="/dashboard" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparador de Empresas</h1>
            <p className="text-gray-600">Configure empresas, tópicos e compare com Gogh Lab</p>
          </div>
          <div className="flex gap-3">
            <Link href="/comparar" target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye size={18} />
                Ver Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Topics Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setTopicsExpanded(!topicsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Tópicos de Comparação (Globais)</h2>
              <span className="text-sm text-gray-500">({globalTopics.length} tópicos)</span>
            </div>
            {topicsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {topicsExpanded && (
            <div className="p-6 border-t border-gray-200 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Crie os tópicos de comparação aqui. Depois, configure se cada empresa (incluindo Gogh Lab) tem check (✓) ou X (✗) em cada tópico.
                </p>
              </div>

              <div className="space-y-3">
                {globalTopics.map((topic, index) => (
                  <div key={topic.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveTopic(topic.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveTopic(topic.id, 'down')}
                        disabled={index === globalTopics.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                    <Input
                      value={topic.name}
                      onChange={(e) => handleUpdateTopic(topic.id, 'name', e.target.value)}
                      placeholder="Nome do tópico (ex: Suporte 24/7)"
                      className="flex-1"
                    />
                    <button
                      onClick={() => handleRemoveTopic(topic.id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                      title="Remover tópico"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                
                {globalTopics.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum tópico criado. Clique em "Adicionar Tópico" para criar o primeiro.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleAddTopic}
                >
                  <Plus size={18} className="mr-2" />
                  Adicionar Tópico
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Companies Editor - Gogh Lab + 3 Competitors */}
        <div className="space-y-6">
          {/* Gogh Lab - Now Editable */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center text-white">
                  {mvCompany.logo ? (
                    <Image src={mvCompany.logo} alt={mvCompany.name} width={48} height={48} className="rounded-lg object-contain" />
                  ) : (
                    <span className="text-2xl">🚀</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gogh Lab</h2>
                  <p className="text-sm text-gray-500">Empresa principal</p>
                </div>
              </div>
              {!editingMVCompany && (
                <Button onClick={() => setEditingMVCompany(true)}>
                  <Edit2 size={18} className="mr-2" />
                  Editar Gogh Lab
                </Button>
              )}
            </div>

            {editingMVCompany ? (
              <div className="space-y-4">
                <Input
                  label="Nome da Empresa"
                  value={mvCompany.name}
                  onChange={(e) => setMvCompany({ ...mvCompany, name: e.target.value })}
                  placeholder="Ex: Gogh Lab"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Logo da Empresa</label>
                  <ImageUploader
                    value={mvCompany.logo || ''}
                    onChange={(url) => setMvCompany({ ...mvCompany, logo: url })}
                    cropType="square"
                    aspectRatio={1}
                    targetSize={{ width: 200, height: 200 }}
                    placeholder="Clique para fazer upload do logo"
                  />
                </div>

                {/* Topic Values */}
                {globalTopics.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold mb-3">Configurar Tópicos</h3>
                    <div className="space-y-2">
                      {globalTopics.map((topic) => {
                        const topicValue = mvCompany.topic_values.find(tv => tv.topic_id === topic.id)
                        const hasFeature = topicValue?.has_feature ?? false
                        return (
                          <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">{topic.name || 'Tópico sem nome'}</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleTopicValue('mv', topic.id, true)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  hasFeature
                                    ? 'bg-green-100 text-green-800 border-2 border-green-500'
                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                }`}
                              >
                                <Check size={16} className="inline mr-1" />
                                Check
                              </button>
                              <button
                                onClick={() => handleToggleTopicValue('mv', topic.id, false)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  !hasFeature && topicValue
                                    ? 'bg-red-100 text-red-800 border-2 border-red-500'
                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                }`}
                              >
                                <X size={16} className="inline mr-1" />
                                X
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setEditingMVCompany(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <p><strong>Tópicos configurados:</strong> {mvCompany.topic_values.length} de {globalTopics.length}</p>
              </div>
            )}
          </div>

          {/* Competitor Companies */}
          {companies.map((company, index) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    {company.logo ? (
                      <Image src={company.logo} alt={company.name} width={48} height={48} className="rounded-lg object-contain" />
                    ) : (
                      <span className="text-2xl">🏢</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Concorrente {index + 1}
                    </h2>
                    {company.name && (
                      <p className="text-sm text-gray-500">{company.name}</p>
                    )}
                  </div>
                </div>
                <Switch
                  label="Ativo"
                  checked={company.is_active}
                  onCheckedChange={(checked) => {
                    const updated = [...companies]
                    updated[index].is_active = checked
                    setCompanies(updated)
                  }}
                />
              </div>

              {editingCompany === index ? (
                <div className="space-y-4">
                  <Input
                    label="Nome da Empresa"
                    value={company.name}
                    onChange={(e) => {
                      const updated = [...companies]
                      updated[index].name = e.target.value
                      setCompanies(updated)
                    }}
                    placeholder="Ex: Empresa Concorrente"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Logo da Empresa</label>
                    <ImageUploader
                      value={company.logo || ''}
                      onChange={(url) => {
                        const updated = [...companies]
                        updated[index].logo = url
                        setCompanies(updated)
                      }}
                      cropType="square"
                      aspectRatio={1}
                      targetSize={{ width: 200, height: 200 }}
                      placeholder="Clique para fazer upload do logo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <textarea
                      value={company.description || ''}
                      onChange={(e) => {
                        const updated = [...companies]
                        updated[index].description = e.target.value
                        setCompanies(updated)
                      }}
                      placeholder="Descrição da empresa..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Topic Values */}
                  {globalTopics.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold mb-3">Configurar Tópicos</h3>
                      <div className="space-y-2">
                        {globalTopics.map((topic) => {
                          const topicValue = company.topic_values.find(tv => tv.topic_id === topic.id)
                          const hasFeature = topicValue?.has_feature ?? false
                          return (
                            <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium">{topic.name || 'Tópico sem nome'}</span>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleTopicValue(index, topic.id, true)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    hasFeature
                                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                  }`}
                                >
                                  <Check size={16} className="inline mr-1" />
                                  Check
                                </button>
                                <button
                                  onClick={() => handleToggleTopicValue(index, topic.id, false)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    !hasFeature && topicValue
                                      ? 'bg-red-100 text-red-800 border-2 border-red-500'
                                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                  }`}
                                >
                                  <X size={16} className="inline mr-1" />
                                  X
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setEditingCompany(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.name ? (
                    <>
                      <p className="text-sm text-gray-600">
                        <strong>Tópicos configurados:</strong> {company.topic_values.length} de {globalTopics.length}
                      </p>
                      <Button
                        onClick={() => setEditingCompany(index)}
                        className="w-full"
                      >
                        <Edit2 size={18} className="mr-2" />
                        Editar Empresa
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setEditingCompany(index)}
                      className="w-full"
                    >
                      <Plus size={18} className="mr-2" />
                      Configurar Empresa
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão Salvar Tudo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Salvar Todas as Alterações</h3>
              <p className="text-sm text-gray-500">
                Salva tópicos globais, Gogh Lab, empresas concorrentes e rodapé de uma vez
              </p>
            </div>
            <Button
              onClick={handleSaveAll}
              isLoading={saving}
              className="min-w-[200px]"
            >
              <Save size={18} className="mr-2" />
              Salvar Tudo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
