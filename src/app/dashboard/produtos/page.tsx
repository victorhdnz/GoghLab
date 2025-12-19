'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils/format'
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Search, Filter, MoreVertical, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'

export default function DashboardProductsPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else if (mounted) {
        loadProducts()
      }
    }

    return () => {
      mounted = false
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  // Recarregar produtos quando a página receber foco (útil após criar/editar produto)
  useEffect(() => {
    if (!isAuthenticated || !isEditor) return
    
    const handleFocus = () => {
      loadProducts()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isAuthenticated, isEditor]) // eslint-disable-line react-hooks/exhaustive-deps


  const loadProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          colors:product_colors(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar produtos:', error)
        throw error
      }
      
      console.log('✅ Produtos carregados no dashboard:', data?.length || 0)
      setProducts(data as Product[] || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error

      toast.success('Status atualizado')
      loadProducts()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }



  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('Produto excluído')
      loadProducts()
    } catch (error) {
      toast.error('Erro ao excluir produto')
    }
  }

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product =>
        statusFilter === 'active' ? product.is_active : !product.is_active
      )
    }

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [products, searchTerm, statusFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto')
      return
    }

    if (action === 'delete' && !confirm(`Tem certeza que deseja excluir ${selectedProducts.length} produto(s)?`)) {
      return
    }

    try {
      let updateData: any = {}
      
      switch (action) {
        case 'activate':
          updateData = { is_active: true }
          break
        case 'deactivate':
          updateData = { is_active: false }
          break
        case 'delete':
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .in('id', selectedProducts)
          
          if (deleteError) throw deleteError
          toast.success(`${selectedProducts.length} produto(s) excluído(s)`)
          setSelectedProducts([])
          loadProducts()
          return
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .in('id', selectedProducts)

      if (error) throw error

      toast.success(`${selectedProducts.length} produto(s) atualizado(s)`)
      setSelectedProducts([])
      loadProducts()
    } catch (error) {
      toast.error('Erro ao executar ação em lote')
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedProducts(prev =>
      prev.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id)
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackButton href="/dashboard" />
        </div>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold">Produtos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie seu catálogo de produtos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/produtos/brindes-combos">
              <Button variant="outline" size="lg">
                <Package size={20} className="mr-2" />
                Brindes & Combos
              </Button>
            </Link>
            <Link href="/dashboard/produtos/topicos-classificacao">
              <Button variant="outline" size="lg">
                <Star size={20} className="mr-2" />
                Tópicos de Classificação
              </Button>
            </Link>
            <Link href="/dashboard/produtos/novo">
              <Button size="lg">
                <Plus size={20} className="mr-2" />
                Novo Produto
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>

            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredProducts.length} de {products.length} produtos
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedProducts.length} produto(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                >
                  <Eye size={16} className="mr-1" />
                  Ativar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  <EyeOff size={16} className="mr-1" />
                  Desativar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              ⌚
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(product.price || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            toggleProductStatus(product.id, product.is_active)
                          }
                          className="text-gray-600 hover:text-gray-900"
                          title={
                            product.is_active ? 'Desativar' : 'Ativar'
                          }
                        >
                          {product.is_active ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                        {product.category === 'Combos' ? (
                          <Link
                            href="/dashboard/produtos/brindes-combos"
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar combo (redireciona para página de combos)"
                          >
                            <Edit size={18} />
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/produtos/${product.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={18} />
                          </Link>
                        )}
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all'
                  ? 'Nenhum produto encontrado'
                  : 'Nenhum produto cadastrado'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando seu primeiro produto'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/dashboard/produtos/novo">
                  <Button>
                    <Plus size={20} className="mr-2" />
                    Adicionar Produto
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} produtos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Mostrar primeira, última, e páginas próximas à atual
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 2 && page <= currentPage + 2)
                    })
                    .map((page, index, array) => {
                      // Adicionar "..." quando houver gaps
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1
                      
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={currentPage === page ? "bg-black text-white border-black" : ""}
                          >
                            {page}
                          </Button>
                        </div>
                      )
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}