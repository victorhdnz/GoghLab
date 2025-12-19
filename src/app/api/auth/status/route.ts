import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Verificar sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({
        authenticated: false,
        error: sessionError.message,
        session: null,
        profile: null
      })
    }

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        session: null,
        profile: null
      })
    }

    // Buscar profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata
        }
      },
      profile: profile || null,
      profileError: profileError?.message || null
    })

  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message,
      session: null,
      profile: null
    })
  }
}