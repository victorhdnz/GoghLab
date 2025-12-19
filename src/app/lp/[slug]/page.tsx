import { createServerClient } from '@/lib/supabase/server'
import { LandingLayout, LandingVersion } from '@/types'
import { notFound } from 'next/navigation'
import { LandingPageRenderer } from '@/components/landing/LandingPageRenderer'

export const dynamic = 'force-dynamic'
export const revalidate = 10

interface PageProps {
  params: {
    slug: string
  }
}

async function getLayoutData(slug: string) {
  const supabase = createServerClient()

  try {
    // Buscar layout pelo slug ou custom_url
    const { data: layout, error: layoutError } = await supabase
      .from('landing_layouts')
      .select('*')
      .or(`slug.eq.${slug},custom_url.eq./lp/${slug}`)
      .eq('is_active', true)
      .single()

    if (layoutError || !layout) {
      return null
    }

    // Buscar versão padrão ou ativa
    const { data: version, error: versionError } = await supabase
      .from('landing_versions')
      .select('*')
      .eq('layout_id', layout.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      layout: layout as LandingLayout,
      version: version as LandingVersion | null,
    }
  } catch (error) {
    console.error('Erro ao buscar layout:', error)
    return null
  }
}

export default async function LandingPage({ params }: PageProps) {
  const data = await getLayoutData(params.slug)

  if (!data || !data.layout) {
    notFound()
  }

  return (
    <LandingPageRenderer
      layout={data.layout}
      version={data.version}
    />
  )
}

