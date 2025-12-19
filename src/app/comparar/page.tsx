import { createServerClient } from '@/lib/supabase/server'
import { CompanyComparison } from '@/types'
import Link from 'next/link'
import { GitCompare, ArrowRight } from 'lucide-react'

async function getComparisons(): Promise<CompanyComparison[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('company_comparisons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar comparações:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar comparações:', error)
    return []
  }
}

export default async function CompararPage() {
  const comparisons = await getComparisons()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Compare a MV Company
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Veja por que somos a melhor escolha para transformar sua presença digital
          </p>
        </div>
      </section>

      {/* Comparisons List */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {comparisons.length > 0 ? (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Nossas Comparações
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Veja como a MV Company se compara com outras empresas do mercado
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {comparisons.map((comparison) => (
                  <Link
                    key={comparison.id}
                    href={`/comparar/${comparison.slug}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-center mb-4">
                      {comparison.logo ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                          <Image
                            src={comparison.logo}
                            alt={comparison.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-4xl">🏢</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">
                      MV Company vs {comparison.name}
                    </h3>
                    {comparison.description && (
                      <p className="text-gray-600 text-sm text-center mb-4 line-clamp-2">
                        {comparison.description}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                      Ver Comparação
                      <ArrowRight size={18} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block bg-gray-100 rounded-full p-6 mb-4">
                <GitCompare size={48} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Nenhuma comparação disponível</h2>
              <p className="text-gray-600">
                As comparações serão exibidas aqui quando forem criadas.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Entre em contato e descubra como podemos ajudar você
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://wa.me/5534999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href="https://instagram.com/mvcompany"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
