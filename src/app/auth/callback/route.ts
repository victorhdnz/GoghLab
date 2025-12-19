import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types'
import { getSiteUrl } from '@/lib/utils/siteUrl'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Se já veio com erro do OAuth provider
  if (error) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=no_code`)
  }

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Trocar código por sessão
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Erro ao trocar código por sessão:', sessionError)
      return NextResponse.redirect(`${getSiteUrl()}/login?error=session_exchange_failed`)
    }

    if (!sessionData?.session?.user) {
      return NextResponse.redirect(`${getSiteUrl()}/login?error=no_user`)
    }

    const user = sessionData.session.user
    
    // Aguardar um pouco para dar tempo do trigger criar o profile
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verificar se o profile já existe
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // Se o profile não existe, criar manualmente
    if (!existingProfile && profileCheckError?.code === 'PGRST116') {
      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: null, // Deixar em branco para o usuário preencher depois
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: 'customer'
        })
    }

    // Redirecionar para home com parâmetro de sucesso
    // O returnUrl será recuperado no cliente via localStorage
    return NextResponse.redirect(`${getSiteUrl()}?auth=success`)
  } catch (error: any) {
    console.error('Erro no callback:', error)
    return NextResponse.redirect(`${getSiteUrl()}/login?error=unexpected_error`)
  }
}

