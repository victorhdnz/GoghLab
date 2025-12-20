'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CompanyComparison } from '@/types'
import Image from 'next/image'
import { GitCompare, X, Plus, Trash2 } from 'lucide-react'
import { useCompanyComparison } from '@/hooks/useCompanyComparison'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CompararPage() {
  const supabase = createClient()
  const { companies, addCompany, removeCompany, clearComparison, canAddMore } = useCompanyComparison()
  
  const [allCompanies, setAllCompanies] = useState<CompanyComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar empresas:', error)
        return
      }

      setAllCompanies(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCompany = (company: CompanyComparison) => {
    if (companies.find(c => c.id === company.id)) {
      toast('Empresa já está na comparação')
      return
    }
    if (!canAddMore()) {
      toast.error('Você pode comparar até 5 empresas. Limpe a comparação atual ou remova alguma empresa.')
      return
    }
    addCompany(company)
    toast.success('Empresa adicionada à comparação!')
  }

  // Se tem empresas selecionadas, mostrar tabela de comparação
  if (companies.length > 0) {
    return <ComparisonTable companies={companies} onRemove={removeCompany} onClear={clearComparison} />
  }

  // Página de seleção de empresas
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Estilo Apple */}
      <div className="bg-black text-white py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-semibold mb-4 tracking-tight">
            Comparar Empresas
          </h1>
          <p className="text-lg md:text-xl text-gray-400 font-light">
            Selecione empresas para comparar suas características lado a lado
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Selecione uma categoria</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300'
              }`}
            >
              Todas
            </button>
            {/* Adicionar categorias se necessário */}
          </div>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          </div>
        ) : allCompanies.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block bg-gray-100 rounded-full p-6 mb-4">
              <GitCompare size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Nenhuma empresa disponível</h2>
            <p className="text-gray-600">
              As empresas serão exibidas aqui quando forem criadas no dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCompanies.map((company) => {
              const isInComparison = companies.some(c => c.id === company.id)
              return (
                <div
                  key={company.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  {/* Logo */}
                  <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={200}
                        height={200}
                        className="object-contain p-4"
                      />
                    ) : (
                      <span className="text-5xl">🏢</span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{company.name}</h3>

                  {/* Category */}
                  {company.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{company.description}</p>
                  )}

                  {/* Add Button */}
                  <button
                    onClick={() => handleAddCompany(company)}
                    disabled={isInComparison || !canAddMore()}
                    className={`w-full py-3 px-4 rounded-full font-medium transition-all ${
                      isInComparison
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : canAddMore()
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isInComparison ? 'Já adicionada' : 'Adicionar'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de Tabela de Comparação
function ComparisonTable({ 
  companies, 
  onRemove, 
  onClear 
}: { 
  companies: CompanyComparison[]
  onRemove: (id: string) => void
  onClear: () => void
}) {
  // MV Company sempre será a primeira coluna
  const mvCompany = {
    id: 'mv-company',
    name: 'MV Company',
    logo: null,
    description: 'Soluções digitais inovadoras',
    comparison_topics: [] as any[],
  }

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Estilo Apple */}
      <div className="bg-black text-white py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Comparar Empresas
            </h1>
            <div className="flex gap-3">
              <Link href="/comparar">
                <button className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all">
                  <Plus size={18} className="inline mr-2" />
                  Adicionar Empresas
                </button>
              </Link>
              <button
                onClick={() => {
                  onClear()
                  toast.success('Comparação limpa!')
                }}
                className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-full font-medium hover:bg-white/20 transition-all"
              >
                <Trash2 size={18} className="inline mr-2" />
                Limpar Comparação
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-3xl border border-gray-200 overflow-x-auto">
          {/* Header Row */}
          <div 
            className="grid gap-4 p-6 bg-gray-50 border-b border-gray-200 min-w-max"
            style={{ gridTemplateColumns: `200px repeat(${companies.length + 1}, minmax(180px, 1fr))` }}
          >
            <div className="font-semibold text-gray-900">Característica</div>
            {/* MV Company Column */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center">
                <span className="text-3xl">🚀</span>
              </div>
              <span className="font-semibold text-gray-900 text-center">MV Company</span>
            </div>
            {/* Company Columns */}
            {companies.map((company) => (
              <div key={company.id} className="flex flex-col items-center gap-3 relative">
                <button
                  onClick={() => {
                    onRemove(company.id)
                    toast.success(`${company.name} removida da comparação`)
                  }}
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all z-10"
                >
                  <X size={14} className="text-gray-700" />
                </button>
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
            ))}
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
                  style={{ gridTemplateColumns: `200px repeat(${companies.length + 1}, minmax(180px, 1fr))` }}
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

                  {/* Company Values */}
                  {companies.map((company) => {
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

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {topics.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-gray-500">
              <p>Nenhuma característica disponível para comparação.</p>
              <p className="text-sm mt-2">Adicione características nas empresas no dashboard.</p>
            </div>
          ) : (
            topics.map((topic, index) => (
              <div key={index} className="bg-white rounded-3xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">{topic.name}</h3>
                <div className="space-y-4">
                  {/* MV Company */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                        <span className="text-xl">🚀</span>
                      </div>
                      <span className="font-medium text-gray-900">MV Company</span>
                    </div>
                    {topic.mv_company ? (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black text-white">
                        <span className="text-lg">✓</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                        <span className="text-lg">✗</span>
                      </div>
                    )}
                  </div>
                  {/* Companies */}
                  {companies.map((company) => {
                    const hasFeature = topic.companies.get(company.id) || false
                    return (
                      <div key={company.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                            {company.logo ? (
                              <Image
                                src={company.logo}
                                alt={company.name}
                                width={48}
                                height={48}
                                className="object-contain p-2"
                              />
                            ) : (
                              <span className="text-xl">🏢</span>
                            )}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{company.name}</span>
                        </div>
                        {hasFeature ? (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black text-white">
                            <span className="text-lg">✓</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                            <span className="text-lg">✗</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
