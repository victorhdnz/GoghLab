import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 Testando consulta Supabase...')

    const { data: productsData, error } = await supabase
      .from('products')
      .select(`
        *,
        colors:product_colors(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro na consulta:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      })
    }

    console.log('✅ Produtos encontrados:', productsData?.length || 0)

    return NextResponse.json({
      success: true,
      count: productsData?.length || 0,
      products: productsData?.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        local_price: p.local_price,
        is_active: p.is_active
      })) || []
    })

  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}