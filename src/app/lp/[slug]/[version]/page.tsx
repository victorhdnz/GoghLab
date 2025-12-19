import { createServerClient } from '@/lib/supabase/server'
import { LandingLayout, LandingVersion } from '@/types'
import { notFound } from 'next/navigation'
import { LandingPageRenderer } from '@/components/landing/LandingPageRenderer'

export const dynamic = 'force-dynamic'
export const revalidate = 10

interface PageProps {
  params: {
    slug: string
    version: string
  }
}

async function getLayoutData(slug: string, versionSlug: string) {
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

    // Buscar versão específica
    const { data: version, error: versionError } = await supabase
      .from('landing_versions')
      .select('*')
      .eq('layout_id', layout.id)
      .eq('slug', versionSlug)
      .eq('is_active', true)
      .single()

    if (versionError || !version) {
      return null
    }

    return {
      layout: layout as LandingLayout,
      version: version as LandingVersion,
    }
  } catch (error) {
    console.error('Erro ao buscar layout:', error)
    return null
  }
}

export default async function LandingPageVersion({ params }: PageProps) {
  const data = await getLayoutData(params.slug, params.version)

  if (!data || !data.layout || !data.version) {
    notFound()
  }

  return (
    <LandingPageRenderer
      layout={data.layout}
      version={data.version}
    />
  )
}

