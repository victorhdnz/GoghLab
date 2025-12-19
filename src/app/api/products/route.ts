import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Cache por 60 segundos (ISR - Incremental Static Regeneration)
export const revalidate = 60

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Buscar todos os produtos ativos (sem limite)
    // Query otimizada - selecionar apenas campos necessários
    // Incluindo local_price e national_price como fallback temporário até migração
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        short_description,
        description,
        category,
        price,
        local_price,
        national_price,
        ecommerce_url,
        images,
        is_featured,
        is_active,
        specifications,
        created_at,
        colors:product_colors(
          id,
          color_name,
          color_hex,
          images,
          stock,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Garantir que os campos images e specifications sejam sempre arrays válidos
    // E normalizar o campo price (usar fallback se necessário)
    const normalizedProducts = (products || []).map((product: any) => {
      // Normalizar price: usar price se existir, senão local_price, senão national_price, senão 0
      if (!product.price || product.price === 0) {
        product.price = product.local_price || product.national_price || 0
      }
      
      // Remover campos antigos do objeto retornado
      delete product.local_price
      delete product.national_price
      
      // Se images for string, parsear como JSON
      if (typeof product.images === 'string') {
        try {
          product.images = JSON.parse(product.images)
        } catch (e) {
          // Se falhar o parse, usar array vazio
          product.images = []
        }
      }
      // Garantir que seja sempre um array
      if (!Array.isArray(product.images)) {
        product.images = []
      }
      
      // Se specifications for string, parsear como JSON
      if (typeof product.specifications === 'string') {
        try {
          product.specifications = JSON.parse(product.specifications)
        } catch (e) {
          // Se falhar o parse, usar array vazio
          product.specifications = []
        }
      }
      // Garantir que seja sempre um array
      if (!Array.isArray(product.specifications)) {
        product.specifications = []
      }
      
      return product
    })

    return NextResponse.json({
      success: true,
      count: normalizedProducts?.length || 0,
      products: normalizedProducts || [],
      message: normalizedProducts?.length ? 'Produtos encontrados' : 'Nenhum produto ativo encontrado'
    }, {
      headers: {
        // Cache por 60 segundos no cliente e CDN
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    })
  } catch (error: any) {
    console.error('Erro na API de produtos:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}