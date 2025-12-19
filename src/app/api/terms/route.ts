import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Cache por 300 segundos (5 minutos) - termos não mudam frequentemente
export const revalidate = 300

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Buscar todos os termos
    const { data: terms, error } = await supabase
      .from('site_terms')
      .select('id, key, title, icon, content')
      .order('title')

    if (error) {
      console.error('Erro ao buscar termos:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: terms?.length || 0,
      terms: terms || [],
    }, {
      headers: {
        // Cache por 5 minutos no cliente e CDN
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error: any) {
    console.error('Erro na API de termos:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

