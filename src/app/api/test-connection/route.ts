import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Rota de teste para verificar conexão com Supabase
 * Acesse: /api/test-connection
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    // Teste 1: Criar cliente
    const supabase = createServerClient()
    results.tests.clientCreated = true

    // Teste 2: Query simples com timeout
    const queryPromise = supabase
      .from('site_settings')
      .select('id')
      .limit(1)

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: null, error: { message: 'TIMEOUT' } })
      }, 5000)
    })

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

    if (error) {
      results.tests.query = {
        success: false,
        error: error.message,
        code: error.code,
        details: error
      }
    } else {
      results.tests.query = {
        success: true,
        dataReceived: !!data
      }
    }

    // Teste 3: Verificar variáveis de ambiente
    results.tests.env = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'NOT SET'
    }

    results.success = results.tests.query.success
    results.message = results.tests.query.success 
      ? 'Conexão com Supabase funcionando' 
      : 'Problema na conexão com Supabase'

    return NextResponse.json(results, { 
      status: results.success ? 200 : 500 
    })

  } catch (error: any) {
    results.success = false
    results.error = error.message
    results.stack = error.stack

    return NextResponse.json(results, { status: 500 })
  }
}

