'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { createClient } from '@/lib/supabase/client'
import { CompanyComparison, ComparisonTopic } from '@/types'
import { Eye, Save, ChevronDown, ChevronUp, Edit2, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import Image from 'next/image'
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/site-settings-helper'

interface CompetitorCompany {
  id: string
  name: string
  logo?: string
  description?: string
  comparison_topics: ComparisonTopic[]
  is_active: boolean
}

export default function ComparadorDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [footerExpanded, setFooterExpanded] = useState(false)
  const [savingFooter, setSavingFooter] = useState(false)
  const [editingCompany, setEditingCompany] = useState<number | null>(null)
  const [footerContent, setFooterContent] = useState({
    title: 'Pronto para trabalhar com a MV Company?',
    subtitle: 'Entre em contato e descubra como podemos transformar seu negócio',
    whatsapp_enabled: true,
    whatsapp_number: '',
    whatsapp_text: 'WhatsApp',
    email_enabled: true,
    email_address: '',
    email_text: 'E-mail',
    instagram_enabled: true,
    instagram_url: '',
    instagram_text: 'Instagram',
  })
  const [companies, setCompanies] = useState<CompetitorCompany[]>([
    {
      id: 'competitor-1',
      name: '',
      logo: '',
      description: '',
      comparison_topics: [],
      is_active: true,
    },
    {
      id: 'competitor-2',
      name: '',
      logo: '',
      description: '',
      comparison_topics: [],
      is_active: true,
    },
  ])

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else {
        loadData()
      }
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  const loadData = async () => {
    await Promise.all([loadCompanies(), loadFooterContent()])
  }

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_comparisons')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(2)

      if (error) throw error

      const loadedCompanies = (data as CompanyComparison[] || []).slice(0, 2)
      
      // Garantir que sempre temos 2 empresas
      const updatedCompanies = [...companies]
      loadedCompanies.forEach((company, index) => {
        if (index < 2) {
          updatedCompanies[index] = {
            id: company.id,
            name: company.name,
            logo: company.logo || '',
            description: company.description || '',
            comparison_topics: company.comparison_topics || [],
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

  const loadFooterContent = async () => {
    try {
      const { data, error } = await getSiteSettings()
      if (error) {
        console.error('Erro ao carregar rodapé:', error)
        return
      }
      if (data?.comparison_footer) {
        setFooterContent(prev => ({ ...prev, ...data.comparison_footer }))
      }
    } catch (error) {
      console.error('Erro ao carregar rodapé:', error)
    }
  }

  const handleSaveCompany = async (index: number) => {
    try {
      setSaving(true)
      const company = companies[index]

      if (!company.name.trim()) {
        toast.error('Nome da empresa é obrigatório')
        return
      }

      // Criar slug a partir do nome
      const slug = company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      // Verificar se já existe uma empresa com este ID
      const { data: existing } = await supabase
        .from('company_comparisons')
        .select('id')
        .eq('id', company.id)
        .maybeSingle()

      if (existing) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('company_comparisons')
          .update({
            name: company.name,
            slug: slug,
            logo: company.logo,
            description: company.description,
            comparison_topics: company.comparison_topics,
            is_active: company.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', company.id)

        if (error) throw error
        toast.success('Empresa atualizada com sucesso!')
      } else {
        // Criar nova empresa
        const { error } = await supabase
          .from('company_comparisons')
          .insert({
            id: company.id,
            name: company.name,
            slug: slug,
            logo: company.logo,
            description: company.description,
            comparison_topics: company.comparison_topics,
            is_active: company.is_active,
          })

        if (error) throw error
        toast.success('Empresa salva com sucesso!')
      }

      setEditingCompany(null)
      loadCompanies()
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error)
      toast.error(error?.message || 'Erro ao salvar empresa')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTopic = (companyIndex: number) => {
    const updatedCompanies = [...companies]
    const newTopic: ComparisonTopic = {
      id: `topic-${Date.now()}`,
      name: '',
      mv_company: true,
      competitor: false,
    }
    updatedCompanies[companyIndex].comparison_topics.push(newTopic)
    setCompanies(updatedCompanies)
  }

  const handleRemoveTopic = (companyIndex: number, topicIndex: number) => {
    const updatedCompanies = [...companies]
    updatedCompanies[companyIndex].comparison_topics.splice(topicIndex, 1)
    setCompanies(updatedCompanies)
  }

  const handleUpdateTopic = (companyIndex: number, topicIndex: number, field: keyof ComparisonTopic, value: any) => {
    const updatedCompanies = [...companies]
    updatedCompanies[companyIndex].comparison_topics[topicIndex] = {
      ...updatedCompanies[companyIndex].comparison_topics[topicIndex],
      [field]: value,
    }
    setCompanies(updatedCompanies)
  }

  const handleSaveFooter = async () => {
    setSavingFooter(true)
    try {
      const { success, error } = await saveSiteSettings({
        fieldsToUpdate: {
          comparison_footer: footerContent,
        },
      })

      if (!success) {
        toast.error(error?.message || 'Erro ao salvar rodapé')
        return
      }

      toast.success('Rodapé salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar rodapé:', error)
      toast.error('Erro ao salvar rodapé')
    } finally {
      setSavingFooter(false)
    }
  }

  if (authLoading || loading) {
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
            <p className="text-gray-600">Edite as empresas concorrentes e compare com MV Company</p>
          </div>
          <div className="flex gap-3">
            <Link href="/comparar?preview=true" target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye size={18} />
                Ver Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Editor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setFooterExpanded(!footerExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Rodapé do Comparador</h2>
              <span className="text-sm text-gray-500">(Editar textos e links de contato)</span>
            </div>
            {footerExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {footerExpanded && (
            <div className="p-6 border-t border-gray-200 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Título do Rodapé"
                  value={footerContent.title}
                  onChange={(e) => setFooterContent({ ...footerContent, title: e.target.value })}
                  placeholder="Ex: Pronto para trabalhar com a MV Company?"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <textarea
                    value={footerContent.subtitle}
                    onChange={(e) => setFooterContent({ ...footerContent, subtitle: e.target.value })}
                    placeholder="Ex: Entre em contato e descubra como podemos transformar seu negócio"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold mb-4">Contatos</h3>
                <div className="space-y-4">
                  {/* WhatsApp */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <Switch
                      label="Habilitar WhatsApp"
                      checked={footerContent.whatsapp_enabled}
                      onCheckedChange={(checked) => setFooterContent({ ...footerContent, whatsapp_enabled: checked })}
                    />
                    {footerContent.whatsapp_enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Número do WhatsApp (com DDD, ex: 5534984136291)"
                          value={footerContent.whatsapp_number}
                          onChange={(e) => setFooterContent({ ...footerContent, whatsapp_number: e.target.value })}
                          placeholder="Ex: 5534984136291"
                        />
                        <Input
                          label="Texto do Botão"
                          value={footerContent.whatsapp_text}
                          onChange={(e) => setFooterContent({ ...footerContent, whatsapp_text: e.target.value })}
                          placeholder="Ex: WhatsApp"
                        />
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <Switch
                      label="Habilitar E-mail"
                      checked={footerContent.email_enabled}
                      onCheckedChange={(checked) => setFooterContent({ ...footerContent, email_enabled: checked })}
                    />
                    {footerContent.email_enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Endereço de E-mail"
                          value={footerContent.email_address}
                          onChange={(e) => setFooterContent({ ...footerContent, email_address: e.target.value })}
                          placeholder="Ex: contato@mvcompany.com.br"
                        />
                        <Input
                          label="Texto do Botão"
                          value={footerContent.email_text}
                          onChange={(e) => setFooterContent({ ...footerContent, email_text: e.target.value })}
                          placeholder="Ex: E-mail"
                        />
                      </div>
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <Switch
                      label="Habilitar Instagram"
                      checked={footerContent.instagram_enabled}
                      onCheckedChange={(checked) => setFooterContent({ ...footerContent, instagram_enabled: checked })}
                    />
                    {footerContent.instagram_enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="URL do Instagram"
                          value={footerContent.instagram_url}
                          onChange={(e) => setFooterContent({ ...footerContent, instagram_url: e.target.value })}
                          placeholder="Ex: https://instagram.com/mvcompany"
                        />
                        <Input
                          label="Texto do Botão"
                          value={footerContent.instagram_text}
                          onChange={(e) => setFooterContent({ ...footerContent, instagram_text: e.target.value })}
                          placeholder="Ex: Instagram"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button onClick={handleSaveFooter} isLoading={savingFooter}>
                  <Save size={18} className="mr-2" />
                  Salvar Rodapé
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Companies Editor - Always 3: MV Company (fixed) + 2 Competitors (editable) */}
        <div className="space-y-6">
          {/* MV Company - Fixed */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center text-white">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">MV Company</h2>
                <p className="text-sm text-gray-500">Empresa principal (não editável)</p>
              </div>
            </div>
          </div>

          {/* Competitor Companies - Editable */}
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
                  <ImageUploader
                    label="Logo da Empresa"
                    value={company.logo || ''}
                    onChange={(url) => {
                      const updated = [...companies]
                      updated[index].logo = url
                      setCompanies(updated)
                    }}
                    cropType="square"
                    aspectRatio={1}
                    targetSize={{ width: 200, height: 200 }}
                  />
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

                  {/* Topics */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Características de Comparação</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTopic(index)}
                      >
                        <Plus size={16} className="mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {company.comparison_topics.map((topic, topicIndex) => (
                        <div key={topic.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Input
                            value={topic.name}
                            onChange={(e) => handleUpdateTopic(index, topicIndex, 'name', e.target.value)}
                            placeholder="Nome da característica"
                            className="flex-1"
                          />
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={topic.mv_company}
                                onChange={(e) => handleUpdateTopic(index, topicIndex, 'mv_company', e.target.checked)}
                                className="rounded"
                              />
                              MV Company
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={topic.competitor}
                                onChange={(e) => handleUpdateTopic(index, topicIndex, 'competitor', e.target.checked)}
                                className="rounded"
                              />
                              Concorrente
                            </label>
                            <button
                              onClick={() => handleRemoveTopic(index, topicIndex)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {company.comparison_topics.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhuma característica adicionada. Clique em "Adicionar" para criar uma.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setEditingCompany(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleSaveCompany(index)}
                      isLoading={saving}
                    >
                      <Save size={18} className="mr-2" />
                      Salvar Empresa
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.name ? (
                    <>
                      <p className="text-sm text-gray-600">
                        <strong>Tópicos:</strong> {company.comparison_topics.length}
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
      </div>
    </div>
  )
}
