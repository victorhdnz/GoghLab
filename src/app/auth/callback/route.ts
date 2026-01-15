import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSiteUrl } from '@/lib/utils/siteUrl'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  // Destino após login (padrão: homepage)
  const next = requestUrl.searchParams.get('next') || '/'
  
  const siteUrl = getSiteUrl()
  console.log('[Auth Callback] Site URL:', siteUrl, 'Next:', next)

  // Se já veio com erro do OAuth provider
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${siteUrl}/login?error=${error}`)
  }

  if (!code) {
    console.error('[Auth Callback] No code received')
    return NextResponse.redirect(`${siteUrl}/login?error=no_code`)
  }

  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    // Trocar código por sessão
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('[Auth Callback] Session exchange error:', sessionError)
      return NextResponse.redirect(`${siteUrl}/login?error=session_exchange_failed`)
    }

    if (!sessionData?.session?.user) {
      console.error('[Auth Callback] No user in session')
      return NextResponse.redirect(`${siteUrl}/login?error=no_user`)
    }

    const user = sessionData.session.user
    console.log('[Auth Callback] User authenticated:', user.email)
    
    // Aguardar um pouco para dar tempo do trigger criar o profile
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Verificar se o profile já existe
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // Se o profile não existe, criar manualmente
    if (!existingProfile && profileCheckError?.code === 'PGRST116') {
      console.log('[Auth Callback] Creating profile for:', user.email)
      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: 'customer'
        })
    }

    // Redirecionar para o destino especificado
    const redirectUrl = next.startsWith('/') ? `${siteUrl}${next}` : next
    console.log('[Auth Callback] Redirecting to:', redirectUrl)
    
    return NextResponse.redirect(redirectUrl)
  } catch (error: any) {
    console.error('[Auth Callback] Exception:', error)
    return NextResponse.redirect(`${siteUrl}/login?error=unexpected_error`)
  }
}

