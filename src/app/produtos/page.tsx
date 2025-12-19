'use client'

import { useState, useEffect } from 'react'
import { FadeInSection } from '@/components/ui/FadeInSection'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductFilters } from '@/components/products/ProductFilters'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface FilterState {
  categories: string[]
  priceRange: [number, number]
  sortBy: string
  search: string
}

export default function ProductsPage() {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const loadProducts = async () => {
    try {
      setLoading(true)
      
      // Usar cache da API (60 segundos) - não forçar bypass
      const response = await fetch('/api/products', {
        next: { revalidate: 60 } // Revalidar a cada 60 segundos
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar produtos: ${response.status}`)
      }
      
      const result = await response.json()

      if (!result.success) {
        console.error('Erro na API:', result.error)
        return
      }

      const productsData = result.products || []
      
      setProducts(productsData)
      setFilteredProducts(productsData)

      // Extrair categorias únicas
      const uniqueCategories = [...new Set(productsData.map((p: any) => p.category).filter(Boolean))] as string[]
      setCategories(uniqueCategories)

      // Carregar favoritos do usuário se autenticado (em paralelo)
      if (isAuthenticated) {
        try {
          const supabase = createClient()
          const user = await supabase.auth.getUser()
          if (user.data.user) {
            const { data: favorites } = await supabase
              .from('favorites')
              .select('product_id')
              .eq('user_id', user.data.user.id)

            if (favorites) {
              setFavoriteIds(favorites.map((f: any) => f.product_id))
            }
          }
        } catch (error) {
          console.error('Erro ao carregar favoritos:', error)
        }
      }

    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...products]

    // Filtrar por categoria
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category || '')
      )
    }

    // Filtrar por faixa de preço
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    )

    // Filtrar por busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.short_description?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      )
    }

    // Ordenar
    switch (filters.sortBy) {
      case 'all':
        // Mostrar todos os produtos sem ordenação especial (ordem padrão do banco)
        break
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'favorites':
        if (!isAuthenticated || favoriteIds.length === 0) {
          filtered = []
          break
        }
        filtered = filtered.filter((p) => favoriteIds.includes(p.id))
        break
      case 'featured':
        filtered.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          return 0
        })
        break
      default:
        // Sem ordenação especial
        break
    }

    setFilteredProducts(filtered)
  }

  useEffect(() => {
    loadProducts()
  }, [isAuthenticated])

  // Recarregar produtos quando a página receber foco (útil após criar produto)
  // Usar debounce para evitar múltiplas requisições
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const handleFocus = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        loadProducts()
      }, 500) // Debounce de 500ms
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('focus', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <FadeInSection>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nossos Produtos</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra nossa coleção exclusiva de relógios premium
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtros na lateral esquerda */}
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters 
              onFilterChange={handleFilterChange}
              categories={categories}
            />
          </aside>

          {/* Produtos */}
          <main className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">Nenhum produto encontrado.</p>
                <p className="text-gray-500 mt-2">Tente ajustar os filtros ou buscar por outros termos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </FadeInSection>
  )
}