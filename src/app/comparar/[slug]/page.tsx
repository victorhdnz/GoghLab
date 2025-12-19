import { createServerClient } from '@/lib/supabase/server'
import { CompanyComparison } from '@/types'
import { notFound } from 'next/navigation'
import { CompanyComparison as CompanyComparisonComponent } from '@/components/comparador/CompanyComparison'

async function getComparison(slug: string): Promise<CompanyComparison | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('company_comparisons')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar comparação:', error)
    return null
  }
}

export default async function ComparisonPage({ params }: { params: { slug: string } }) {
  const comparison = await getComparison(params.slug)

  if (!comparison) {
    notFound()
  }

  return <CompanyComparisonComponent comparison={comparison} />
}

