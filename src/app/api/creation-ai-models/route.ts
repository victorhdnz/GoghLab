import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export interface CreationAIModel {
  id: string
  name: string
  logo_url: string | null
  can_image: boolean
  can_video: boolean
  can_prompt: boolean
  is_active: boolean
  order_position: number
  model_key?: string | null
}

/** GET: lista modelos de IA para a página Criar (público). */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient()
    const { data, error } = await (supabase as any)
      .from('creation_ai_models')
      .select('id, name, logo_url, can_image, can_video, can_prompt, is_active, order_position, model_key')
      .eq('is_active', true)
      .order('order_position', { ascending: true })

    if (error) throw error
    return NextResponse.json({ models: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro', models: [] }, { status: 500 })
  }
}
