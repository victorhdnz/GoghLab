import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { CreationPromptItem } from '@/types/creation-prompts'

export const dynamic = 'force-dynamic'

/** GET: retorna prompts de criação e flag de espelhar galeria (público para /criar e homepage) */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient()
    const { data: row } = await (supabase as any)
      .from('site_settings')
      .select('homepage_content, value')
      .eq('key', 'general')
      .maybeSingle()

    const homepageContent = row?.homepage_content ?? row?.value?.homepage_content ?? {}
    const creationPrompts: CreationPromptItem[] = Array.isArray(homepageContent.creation_prompts)
      ? homepageContent.creation_prompts
      : []
    const galleryUseCreationPrompts = homepageContent.gallery_use_creation_prompts === true

    return NextResponse.json({
      creation_prompts: creationPrompts,
      gallery_use_creation_prompts: galleryUseCreationPrompts,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
