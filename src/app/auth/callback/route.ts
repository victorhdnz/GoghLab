import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

function normalizeLegacyMemberPath(path: string) {
  const legacyMap: Record<string, string> = {
    '/membro': '/conta',
    '/membro/conta': '/conta',
    '/membro/cursos': '/cursos',
    '/membro/ferramentas': '/ferramentas',
    '/membro/planejamento': '/planejamento',
    '/membro/agentes': '/criar',
    '/membro/prompts': '/criar',
    '/membro/perfil': '/conta',
    '/membro/servicos': '/servicos',
  }

  if (path.startsWith('/membro/agentes/chat/')) {
    return '/criar'
  }

  if (path.startsWith('/membro')) {
    return legacyMap[path] || '/conta'
  }

  return path
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') || '/conta'
  const next = normalizeLegacyMemberPath(rawNext)
  
  // Usar a origem da request para o redirect (mais confiável)
  const origin = requestUrl.origin
  
  if (!code) {
    // Se não tem código, redirecionar para login com o redirect original
    const loginUrl = new URL('/login', origin)
    if (next && next !== '/conta') {
      loginUrl.searchParams.set('redirect', next)
    }
    loginUrl.searchParams.set('error', 'no_code')
    return NextResponse.redirect(loginUrl)
  }

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
          try {
            cookieStore.set({ name, value, ...options })
          } catch (e) {
            // Ignorar erro de cookie em server component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (e) {
            // Ignorar erro de cookie em server component
          }
        },
      },
    }
  )
  
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('[Auth Callback] Error:', error.message)
    // Se der erro, redirecionar para login com o redirect original
    const loginUrl = new URL('/login', origin)
    if (next && next !== '/conta') {
      loginUrl.searchParams.set('redirect', next)
    }
    loginUrl.searchParams.set('error', 'auth_failed')
    return NextResponse.redirect(loginUrl)
  }

  // Redirect simples para o destino (respeitando o next que foi passado)
  return NextResponse.redirect(`${origin}${next}`)
}

