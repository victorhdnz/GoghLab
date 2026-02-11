import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { getCreditsConfigKey, getCreditCost, type CreditActionId } from '@/lib/credits'
import type { CreditsConfig } from '@/lib/credits'

export const dynamic = 'force-dynamic'

/** GET: retorna custo por ação (público, para exibir no botão "Gerar" mesmo sem login). */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient()
    const { data: configRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', getCreditsConfigKey())
      .maybeSingle() as { data: { value: unknown } | null }
    const config = (configRow?.value as CreditsConfig) ?? null

    const costByAction: Record<CreditActionId, number> = {
      foto: getCreditCost('foto', config),
      video: getCreditCost('video', config),
      roteiro: getCreditCost('roteiro', config),
      vangogh: getCreditCost('vangogh', config),
    }

    return NextResponse.json({ costByAction })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
