'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CompanyComparison } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/supabase/site-settings-helper'
import {
  IconScissors,
  IconPalette,
  IconRobot,
  IconSchool,
  IconSpeakerphone,
  IconCheck,
  IconX,
  IconSparkles,
} from "@tabler/icons-react"

interface GlobalTopic {
  id: string
  name: string
  order: number
  icon?: string // Ícone opcional para o tópico
}

interface MVCompany {
  name: string
  logo?: string
  topic_values: Array<{ topic_id: string; has_feature: boolean }>
}

// Mapear nomes de tópicos para ícones automaticamente
const getTopicIcon = (topicName: string) => {
  const name = topicName.toLowerCase()
  if (name.includes('capcut')) return <IconScissors className="w-5 h-5" />
  if (name.includes('canva')) return <IconPalette className="w-5 h-5" />
  if (name.includes('ia') || name.includes('agente') || name.includes('inteligência')) return <IconRobot className="w-5 h-5" />
  if (name.includes('curso') || name.includes('edição') || name.includes('aula')) return <IconSchool className="w-5 h-5" />
  if (name.includes('anúncio') || name.includes('ads') || name.includes('tráfego')) return <IconSpeakerphone className="w-5 h-5" />
  return <IconSparkles className="w-5 h-5" />
}

export default function CompararPage() {
  const supabase = createClient()
  const [companies, setCompanies] = useState<CompanyComparison[]>([])
  const [globalTopics, setGlobalTopics] = useState<GlobalTopic[]>([])
  const [mvCompany, setMvCompany] = useState<MVCompany | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Iniciar loading como false para não bloquear navegação
    setLoading(false)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Não bloquear a renderização - carregar dados em paralelo
      Promise.all([loadCompanies(), loadGlobalData()]).finally(() => {
        setLoading(false)
      })
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('company_comparisons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(3) // Agora suporta 3 concorrentes

      if (error) {
        console.error('Erro ao buscar empresas:', error)
        return
      }

      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }

  const loadGlobalData = async () => {
    try {
      const { data, error } = await getSiteSettings()
      if (error) {
        console.error('Erro ao buscar configurações:', error)
        return
      }

      if (data?.comparison_topics) {
        const topics = data.comparison_topics as GlobalTopic[]
        setGlobalTopics(topics.sort((a, b) => a.order - b.order))
      }

      if (data?.mv_company) {
        setMvCompany(data.mv_company as MVCompany)
      } else {
        // Fallback para Gogh Lab padrão
        setMvCompany({
          name: 'Gogh Lab',
          logo: '',
          topic_values: [],
        })
      }
    } catch (error) {
      console.error('Erro ao buscar configurações globais:', error)
    }
  }

  // Função auxiliar para obter valor do tópico para Gogh Lab
  const getMVCompanyTopicValue = (topicId: string): boolean => {
    if (!mvCompany) return false
    const topicValue = mvCompany.topic_values.find(tv => tv.topic_id === topicId)
    return topicValue?.has_feature ?? false
  }

  // Função auxiliar para obter valor do tópico para empresa concorrente
  const getCompanyTopicValue = (company: CompanyComparison, topicId: string): boolean => {
    // Compatibilidade com estrutura antiga
    if (company.comparison_topics && Array.isArray(company.comparison_topics)) {
      const topic = company.comparison_topics.find((t: any) => t.id === topicId)
      return topic?.competitor || false
    }
    return false
  }

  return (
    <ComparisonTable 
      companies={companies} 
      globalTopics={globalTopics}
      mvCompany={mvCompany}
      loading={loading}
      getMVCompanyTopicValue={getMVCompanyTopicValue}
      getCompanyTopicValue={getCompanyTopicValue}
      getTopicIcon={getTopicIcon}
    />
  )
}

// Componente de Tabela de Comparação
function ComparisonTable({ 
  companies,
  globalTopics,
  mvCompany,
  loading,
  getMVCompanyTopicValue,
  getCompanyTopicValue,
  getTopicIcon,
}: { 
  companies: CompanyComparison[]
  globalTopics: GlobalTopic[]
  mvCompany: MVCompany | null
  loading: boolean
  getMVCompanyTopicValue: (topicId: string) => boolean
  getCompanyTopicValue: (company: CompanyComparison, topicId: string) => boolean
  getTopicIcon: (topicName: string) => React.ReactNode
}) {
  const numCompetitors = 3 // Agora suporta 3 concorrentes

  if (loading) {
    return (
      <div className="min-h-screen bg-gogh-beige flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gogh-yellow"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gogh-beige">
      {/* Header */}
      <div className="bg-gogh-black text-white py-12 md:py-16 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                Compare e Escolha
              </h1>
              <p className="text-gogh-yellow mt-2 text-lg">Veja por que o Gogh Lab é a melhor escolha</p>
            </div>
            <Link 
              href="/"
              prefetch={true}
              className="group flex items-center gap-2 px-6 py-3 bg-gogh-yellow hover:bg-gogh-yellow-dark text-gogh-black rounded-full transition-all duration-300 font-semibold"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Voltar para Homepage</span>
              <span className="text-sm font-medium sm:hidden">Voltar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-3xl border border-gogh-yellow/30 overflow-x-auto shadow-lg">
          {/* Header Row - Gogh Lab + 3 concorrentes */}
          <div 
            className="grid gap-4 p-6 bg-gogh-beige-light border-b border-gogh-yellow/20 min-w-max"
            style={{ gridTemplateColumns: `250px repeat(${numCompetitors + 1}, minmax(160px, 1fr))` }}
          >
            <div className="font-bold text-gogh-black text-lg">Recurso</div>
            {/* Gogh Lab Column - Destaque */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-gogh-yellow/20 border-2 border-gogh-yellow flex items-center justify-center overflow-hidden shadow-md">
                {mvCompany?.logo ? (
                  <Image
                    src={mvCompany.logo}
                    alt={mvCompany.name}
                    width={80}
                    height={80}
                    className="object-contain p-2"
                  />
                ) : (
                  <span className="text-3xl">🎨</span>
                )}
              </div>
              <span className="font-bold text-gogh-black text-center">{mvCompany?.name || 'Gogh Lab'}</span>
            </div>
            {/* Company Columns - 3 concorrentes */}
            {Array.from({ length: numCompetitors }).map((_, index) => {
              const company = companies[index]
              if (!company) {
                return (
                  <div key={`empty-${index}`} className="flex flex-col items-center gap-3 opacity-50">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <span className="text-3xl">🏢</span>
                    </div>
                    <span className="font-semibold text-gray-400 text-center text-sm">Concorrente {index + 1}</span>
                  </div>
                )
              }
              return (
                <div key={company.id} className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={80}
                        height={80}
                        className="object-contain p-2"
                      />
                    ) : (
                      <span className="text-3xl">🏢</span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-700 text-center text-sm">{company.name}</span>
                </div>
              )
            })}
          </div>

          {/* Topics Rows */}
          <div className="divide-y divide-gogh-yellow/10">
            {globalTopics.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>Nenhuma característica disponível para comparação.</p>
                <p className="text-sm mt-2">Adicione tópicos no dashboard.</p>
              </div>
            ) : (
              globalTopics.map((topic, topicIndex) => {
                const mvHasFeature = getMVCompanyTopicValue(topic.id)
                return (
                  <div
                    key={topic.id}
                    className={`grid gap-4 p-5 hover:bg-gogh-yellow/5 transition-colors items-center min-w-max ${topicIndex % 2 === 0 ? 'bg-white' : 'bg-gogh-beige-light/50'}`}
                    style={{ gridTemplateColumns: `250px repeat(${numCompetitors + 1}, minmax(160px, 1fr))` }}
                  >
                    {/* Nome do tópico com ícone */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gogh-yellow/20 flex items-center justify-center text-gogh-yellow-dark">
                        {getTopicIcon(topic.name)}
                      </div>
                      <span className="font-semibold text-gogh-black">{topic.name}</span>
                    </div>
                    
                    {/* Gogh Lab Value - Destaque */}
                    <div className="flex justify-center">
                      {mvHasFeature ? (
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gogh-yellow text-gogh-black shadow-md">
                          <IconCheck className="w-6 h-6" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                          <IconX className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Company Values - 3 concorrentes */}
                    {Array.from({ length: numCompetitors }).map((_, index) => {
                      const company = companies[index]
                      if (!company) {
                        return (
                          <div key={`empty-${index}`} className="flex justify-center opacity-50">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                              <span className="text-lg">-</span>
                            </div>
                          </div>
                        )
                      }
                      const hasFeature = getCompanyTopicValue(company, topic.id)
                      return (
                        <div key={company.id} className="flex justify-center">
                          {hasFeature ? (
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 border border-green-200">
                              <IconCheck className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-400 border border-red-200">
                              <IconX className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Mobile Layout - Vertical */}
        <div className="md:hidden space-y-6">
          {/* Companies Header - Gogh Lab + 3 concorrentes */}
          <div className="bg-white rounded-2xl border border-gogh-yellow/30 p-4 shadow-lg">
            <div className="grid grid-cols-4 gap-3">
              {/* Gogh Lab */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-xl bg-gogh-yellow/20 border-2 border-gogh-yellow flex items-center justify-center overflow-hidden">
                  {mvCompany?.logo ? (
                    <Image
                      src={mvCompany.logo}
                      alt={mvCompany.name}
                      width={56}
                      height={56}
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="text-xl">🎨</span>
                  )}
                </div>
                <span className="font-bold text-gogh-black text-center text-xs">{mvCompany?.name || 'Gogh Lab'}</span>
              </div>
              
              {/* Other Companies - 3 concorrentes */}
              {Array.from({ length: numCompetitors }).map((_, index) => {
                const company = companies[index]
                if (!company) {
                  return (
                    <div key={`empty-${index}`} className="flex flex-col items-center gap-2 opacity-50">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-xl">🏢</span>
                      </div>
                      <span className="font-semibold text-gray-400 text-center text-xs">Conc. {index + 1}</span>
                    </div>
                  )
                }
                return (
                  <div key={company.id} className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                      {company.logo ? (
                        <Image
                          src={company.logo}
                          alt={company.name}
                          width={56}
                          height={56}
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="text-xl">🏢</span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-700 text-center text-xs line-clamp-1">{company.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Topics Comparison - Vertical */}
          {globalTopics.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gogh-yellow/30 p-8 text-center text-gray-500">
              <p>Nenhuma característica disponível para comparação.</p>
              <p className="text-sm mt-2">Adicione tópicos no dashboard.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {globalTopics.map((topic) => {
                const mvHasFeature = getMVCompanyTopicValue(topic.id)
                return (
                  <div key={topic.id} className="bg-white rounded-2xl border border-gogh-yellow/30 p-4 shadow-sm">
                    {/* Topic header com ícone */}
                    <div className="flex items-center gap-2 mb-4 justify-center">
                      <div className="w-8 h-8 rounded-lg bg-gogh-yellow/20 flex items-center justify-center text-gogh-yellow-dark">
                        {getTopicIcon(topic.name)}
                      </div>
                      <h3 className="font-semibold text-gogh-black text-sm">{topic.name}</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {/* Gogh Lab Value */}
                      <div className="flex justify-center">
                        {mvHasFeature ? (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gogh-yellow text-gogh-black shadow-md">
                            <IconCheck className="w-5 h-5" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                            <IconX className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      
                      {/* Company Values - 3 concorrentes */}
                      {Array.from({ length: numCompetitors }).map((_, index) => {
                        const company = companies[index]
                        if (!company) {
                          return (
                            <div key={`empty-${index}`} className="flex justify-center opacity-50">
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                                <span className="text-sm">-</span>
                              </div>
                            </div>
                          )
                        }
                        const hasFeature = getCompanyTopicValue(company, topic.id)
                        return (
                          <div key={company.id} className="flex justify-center">
                            {hasFeature ? (
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 border border-green-200">
                                <IconCheck className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-400 border border-red-200">
                                <IconX className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gogh-black rounded-2xl p-8 md:p-12 shadow-xl">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Pronto para começar com a <span className="text-gogh-yellow">Gogh Lab</span>?
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Acesse todas as ferramentas, agentes de IA e cursos em um só lugar. Transforme sua presença digital com autonomia total.
            </p>
            <Link 
              href="/precos"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gogh-yellow hover:bg-gogh-yellow-dark text-gogh-black rounded-full transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
            >
              Ver Planos
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
