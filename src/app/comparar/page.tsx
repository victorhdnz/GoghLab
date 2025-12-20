'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CompanyComparison } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { GitCompare } from 'lucide-react'
import { ComparisonFooter } from '@/components/comparador/ComparisonFooter'
import { useSearchParams } from 'next/navigation'

export default function CompararPage() {
  const supabase = createClient()
  const [companies, setCompanies] = useState<CompanyComparison[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_comparisons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(2) // Sempre buscar apenas 2 concorrentes

      if (error) {
        console.error('Erro ao buscar empresas:', error)
        return
      }

      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sempre mostrar a tabela de comparação com MV Company + empresas do banco
  return (
    <>
      <ComparisonTable companies={companies} loading={loading} />
      {!isPreview && <ComparisonFooter />}
    </>
  )
}

// Componente de Tabela de Comparação
function ComparisonTable({ 
  companies,
  loading
}: { 
  companies: CompanyComparison[]
  loading: boolean
}) {
  // Combinar todas as características únicas de todas as empresas
  const allTopics = new Map<string, any>()
  
  companies.forEach(company => {
    if (Array.isArray(company.comparison_topics)) {
      company.comparison_topics.forEach((topic: any) => {
        if (!allTopics.has(topic.name)) {
          allTopics.set(topic.name, {
            name: topic.name,
            mv_company: topic.mv_company || false,
            companies: new Map(),
          })
        }
        allTopics.get(topic.name)!.companies.set(company.id, topic.competitor || false)
      })
    }
  })

  const topics = Array.from(allTopics.values())

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  // Sempre mostrar MV Company + concorrentes (mesmo se não houver concorrentes ainda)

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Estilo Apple */}
      <div className="bg-black text-white py-12 md:py-16 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Comparar Empresas
            </h1>
            <Link 
              href="/"
              className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
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
        <div className="hidden md:block bg-white rounded-3xl border border-gray-200 overflow-x-auto">
          {/* Header Row - Sempre 3 colunas: MV Company + 2 concorrentes */}
          <div 
            className="grid gap-4 p-6 bg-gray-50 border-b border-gray-200 min-w-max"
            style={{ gridTemplateColumns: `200px repeat(3, minmax(180px, 1fr))` }}
          >
            <div className="font-semibold text-gray-900">Característica</div>
            {/* MV Company Column */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center">
                <span className="text-3xl">🚀</span>
              </div>
              <span className="font-semibold text-gray-900 text-center">MV Company</span>
            </div>
            {/* Company Columns - Sempre 2 concorrentes */}
            {Array.from({ length: 2 }).map((_, index) => {
              const company = companies[index]
              if (!company) {
                return (
                  <div key={`empty-${index}`} className="flex flex-col items-center gap-3 opacity-50">
                    <div className="w-20 h-20 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <span className="text-3xl">🏢</span>
                    </div>
                    <span className="font-semibold text-gray-400 text-center text-sm">Concorrente {index + 1}</span>
                  </div>
                )
              }
              return (
                <div key={company.id} className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-3xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={80}
                        height={80}
                        className="object-contain p-3"
                      />
                    ) : (
                      <span className="text-3xl">🏢</span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-center text-sm">{company.name}</span>
                </div>
              )
            })}
          </div>

          {/* Topics Rows */}
          <div className="divide-y divide-gray-100">
            {topics.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>Nenhuma característica disponível para comparação.</p>
                <p className="text-sm mt-2">Adicione características nas empresas no dashboard.</p>
              </div>
            ) : (
              topics.map((topic, index) => (
                <div
                  key={index}
                  className="grid gap-4 p-6 hover:bg-gray-50 transition-colors items-center min-w-max"
                  style={{ gridTemplateColumns: `200px repeat(3, minmax(180px, 1fr))` }}
                >
                  <div className="font-medium text-gray-900">{topic.name}</div>
                  
                  {/* MV Company Value */}
                  <div className="flex justify-center">
                    {topic.mv_company ? (
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                        <span className="text-xl">✓</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                        <span className="text-xl">✗</span>
                      </div>
                    )}
                  </div>

                  {/* Company Values - Sempre 2 concorrentes */}
                  {Array.from({ length: 2 }).map((_, index) => {
                    const company = companies[index]
                    if (!company) {
                      return (
                        <div key={`empty-${index}`} className="flex justify-center opacity-50">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                            <span className="text-xl">-</span>
                          </div>
                        </div>
                      )
                    }
                    const hasFeature = topic.companies.get(company.id) || false
                    return (
                      <div key={company.id} className="flex justify-center">
                        {hasFeature ? (
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                            <span className="text-xl">✓</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                            <span className="text-xl">✗</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile Layout - Vertical */}
        <div className="md:hidden space-y-6">
          {/* Companies Header - Side by Side - Sempre 3: MV Company + 2 concorrentes */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-4">
              {/* MV Company */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <span className="font-semibold text-gray-900 text-center text-sm">MV Company</span>
              </div>
              
              {/* Other Companies - Sempre 2 */}
              {Array.from({ length: 2 }).map((_, index) => {
                const company = companies[index]
                if (!company) {
                  return (
                    <div key={`empty-${index}`} className="flex flex-col items-center gap-2 opacity-50">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <span className="font-semibold text-gray-400 text-center text-sm">Concorrente {index + 1}</span>
                    </div>
                  )
                }
                return (
                  <div key={company.id} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                      {company.logo ? (
                        <Image
                          src={company.logo}
                          alt={company.name}
                          width={64}
                          height={64}
                          className="object-contain p-2"
                        />
                      ) : (
                        <span className="text-2xl">🏢</span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 text-center text-sm">{company.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Topics Comparison - Vertical */}
          {topics.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-gray-500">
              <p>Nenhuma característica disponível para comparação.</p>
              <p className="text-sm mt-2">Adicione características nas empresas no dashboard.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <div key={index} className="bg-white rounded-3xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-center text-base">{topic.name}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* MV Company Value */}
                    <div className="flex justify-center">
                      {topic.mv_company ? (
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                          <span className="text-xl">✓</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                          <span className="text-xl">✗</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Company Values - Sempre 2 concorrentes */}
                    {Array.from({ length: 2 }).map((_, index) => {
                      const company = companies[index]
                      if (!company) {
                        return (
                          <div key={`empty-${index}`} className="flex justify-center opacity-50">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                              <span className="text-xl">-</span>
                            </div>
                          </div>
                        )
                      }
                      const hasFeature = topic.companies.get(company.id) || false
                      return (
                        <div key={company.id} className="flex justify-center">
                          {hasFeature ? (
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                              <span className="text-xl">✓</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                              <span className="text-xl">✗</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
