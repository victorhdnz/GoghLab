import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone } = body

    // Validação básica (sem validação rigorosa conforme solicitado)
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Nome, e-mail e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Inserir registro
    const { data, error } = await supabase
      .from('whatsapp_vip_registrations')
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar registro no Supabase:', error)
      console.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      
      // Retornar mensagem mais específica do erro
      let errorMessage = 'Erro ao registrar. Tente novamente.'
      
      if (error.code === '42P01') {
        errorMessage = 'Tabela não encontrada. Verifique se a tabela whatsapp_vip_registrations foi criada no Supabase.'
      } else if (error.code === '42501') {
        errorMessage = 'Permissão negada. Verifique as políticas RLS da tabela.'
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      return NextResponse.json(
        { error: errorMessage, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Erro no endpoint de registro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar registro' },
      { status: 500 }
    )
  }
}

