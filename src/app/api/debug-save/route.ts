import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. Buscar dados atuais
    const { data: currentData, error: fetchError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'general')
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({
        step: 'fetch',
        error: fetchError,
        message: 'Erro ao buscar dados atuais'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      currentData: {
        site_logo: currentData?.site_logo,
        site_name: currentData?.site_name,
        site_title: currentData?.site_title,
        hero_logo_in_content: currentData?.homepage_content?.hero_logo,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { site_logo, site_name, site_title } = body

    const supabase = createRouteHandlerClient({ cookies })

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        step: 'auth',
        error: authError || 'Usuário não autenticado',
        message: 'Erro de autenticação'
      }, { status: 401 })
    }

    console.log('Usuário autenticado:', user.email)

    // Tentar atualizar
    const { data: updateData, error: updateError } = await supabase
      .from('site_settings')
      .update({
        site_logo: site_logo || null,
        site_name: site_name || 'Gogh Lab',
        site_title: site_title || 'Gogh Lab - Criatividade guiada por tecnologia',
        updated_at: new Date().toISOString()
      })
      .eq('key', 'general')
      .select()

    if (updateError) {
      return NextResponse.json({
        step: 'update',
        error: updateError,
        message: 'Erro ao atualizar - pode ser problema de RLS'
      }, { status: 500 })
    }

    // Verificar se atualizou
    const { data: verifyData } = await supabase
      .from('site_settings')
      .select('site_logo, site_name, site_title')
      .eq('key', 'general')
      .maybeSingle()

    return NextResponse.json({
      success: true,
      message: 'Dados atualizados com sucesso',
      updatedData: updateData,
      verifiedData: verifyData
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}

