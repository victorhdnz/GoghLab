import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/content/profile  → retorna o perfil de conteúdo do usuário logado (ou null).
 * POST /api/content/profile  → cria/atualiza o perfil de conteúdo do usuário logado.
 */

export async function GET() {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data, error } = await (supabase
      .from('content_profiles') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data ?? null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao carregar perfil de conteúdo' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const payload = {
      user_id: user.id,
      business_name: body.business_name ?? null,
      niche: body.niche ?? null,
      audience: body.audience ?? null,
      tone_of_voice: body.tone_of_voice ?? null,
      goals: body.goals ?? null,
      platforms: Array.isArray(body.platforms) ? body.platforms : null,
      frequency_per_week: typeof body.frequency_per_week === 'number' ? body.frequency_per_week : null,
      extra_preferences: body.extra_preferences ?? null,
    }

    // upsert por user_id (constraint unique na migration)
    const { data, error } = await (supabase
      .from('content_profiles') as any)
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao salvar perfil de conteúdo' }, { status: 500 })
  }
}

