'use client'

import { createClient } from '@/lib/supabase/client'
import { ProductCatalog, Product } from '@/types'
import { notFound, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CatalogLayout } from '@/components/catalog/CatalogLayout'

export default function CatalogPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [catalog, setCatalog] = useState<ProductCatalog | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar catálogo
        const { data: catalogData, error: catalogError } = await supabase
          .from('product_catalogs')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (catalogError || !catalogData) {
          setCatalog(null)
          setLoading(false)
          return
        }

        setCatalog(catalogData as ProductCatalog)

        // Carregar todos os produtos para mapear
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)

        setProducts(productsData || [])
      } catch (error) {
        console.error('Erro ao carregar catálogo:', error)
        setCatalog(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [slug, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!catalog) {
    return notFound()
  }

  return <CatalogLayout catalog={catalog} products={products} />
}

