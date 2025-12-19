import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Buscar sessão do servidor
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar sessão', 
        details: sessionError.message 
      }, { status: 500 })
    }

    // Buscar perfil se houver sessão
    let profile = null
    if (session?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
      } else {
        profile = profileData
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        role: session.user?.role,
        expiresAt: session.expires_at || null,
        expiresIn: session.expires_at ? Math.floor((session.expires_at - Date.now() / 1000)) : null
      } : null,
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        avatarUrl: profile.avatar_url
      } : null,
      isAuthenticated: !!session?.user,
      hasValidSession: !!session && !!session.expires_at && session.expires_at > Date.now() / 1000
    })

  } catch (error) {
    console.error('Erro no debug auth:', error)
    return NextResponse.json({ 
      error: 'Erro interno', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}