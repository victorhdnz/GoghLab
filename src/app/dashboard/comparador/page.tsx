'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { CompanyComparison } from '@/types'
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, GitCompare, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import Image from 'next/image'

export default function ComparadorDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [comparisons, setComparisons] = useState<CompanyComparison[]>([])
  const [filteredComparisons, setFilteredComparisons] = useState<CompanyComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else {
        loadComparisons()
      }
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  // Recarregar quando a página receber foco
  useEffect(() => {
    if (!isAuthenticated || !isEditor) return
    
    const handleFocus = () => {
      loadComparisons()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isAuthenticated, isEditor]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadComparisons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_comparisons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setComparisons(data as CompanyComparison[] || [])
    } catch (error) {
      console.error('Erro ao carregar comparações:', error)
      toast.error('Erro ao carregar comparações')
    } finally {
      setLoading(false)
    }
  }

  const toggleComparisonStatus = async (comparisonId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('company_comparisons')
        .update({ is_active: !currentStatus })
        .eq('id', comparisonId)

      if (error) throw error

      toast.success('Status atualizado')
      loadComparisons()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const deleteComparison = async (comparisonId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta comparação?')) return

    try {
      const { error } = await supabase
        .from('company_comparisons')
        .delete()
        .eq('id', comparisonId)

      if (error) throw error

      toast.success('Comparação excluída')
      loadComparisons()
    } catch (error) {
      toast.error('Erro ao excluir comparação')
    }
  }

  // Filter comparisons
  useEffect(() => {
    let filtered = comparisons

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(comparison =>
        comparison.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comparison.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(comparison =>
        statusFilter === 'active' ? comparison.is_active : !comparison.is_active
      )
    }

    setFilteredComparisons(filtered)
    setCurrentPage(1)
  }, [comparisons, searchTerm, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredComparisons.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedComparisons = filteredComparisons.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getTopicsCount = (comparison: CompanyComparison) => {
    if (Array.isArray(comparison.comparison_topics)) {
      return comparison.comparison_topics.length
    }
    return 0
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
            <p className="text-gray-600">Gerencie comparações entre MV Company e outras empresas</p>
          </div>
          <div className="flex gap-3">
            <Link href="/comparar" target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye size={18} />
                Ver Preview
              </Button>
            </Link>
            <Link href="/dashboard/comparador/novo">
              <Button className="flex items-center gap-2">
                <Plus size={20} />
                Nova Comparação
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar comparações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comparisons List */}
        {paginatedComparisons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Nenhuma comparação encontrada com os filtros aplicados'
                : 'Nenhuma comparação cadastrada ainda'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link href="/dashboard/comparador/novo">
                <Button className="mt-4">
                  <Plus size={20} className="mr-2" />
                  Criar Primeira Comparação
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedComparisons.map((comparison) => (
                <div
                  key={comparison.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {comparison.name}
                      </h3>
                      <p className="text-sm text-gray-500">/{comparison.slug}</p>
                    </div>
                    <button
                      onClick={() => toggleComparisonStatus(comparison.id, comparison.is_active)}
                      className={`p-1 rounded ${
                        comparison.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {comparison.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {comparison.logo && (
                    <div className="relative w-full h-20 mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={comparison.logo}
                        alt={comparison.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  {comparison.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {comparison.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      {getTopicsCount(comparison)} tópicos
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/comparador/${comparison.id}`}>
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <Edit size={16} />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteComparison(comparison.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredComparisons.length)} de {filteredComparisons.length} comparações
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-4 py-2 border rounded-lg ${
                        currentPage === page
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
