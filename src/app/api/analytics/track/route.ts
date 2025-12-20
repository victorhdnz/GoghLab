import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Validar dados obrigatórios
    if (!body.page_type || !body.session_id || !body.event_type) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('page_analytics')
      .insert({
        page_type: body.page_type,
        page_id: body.page_id || null,
        page_slug: body.page_slug || null,
        session_id: body.session_id,
        event_type: body.event_type,
        event_data: body.event_data || {},
        user_agent: body.user_agent || null,
        referrer: body.referrer || null,
      })

    if (error) {
      console.error('Erro ao registrar analytics:', error)
      return NextResponse.json(
        { error: 'Erro ao registrar evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao processar analytics:', error)
    return NextResponse.json(
      { error: 'Erro ao processar evento' },
      { status: 500 }
    )
  }
}

// Permitir CORS para requests do cliente
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

