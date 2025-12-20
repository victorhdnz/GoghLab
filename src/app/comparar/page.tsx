import { createServerClient } from '@/lib/supabase/server'
import { CompanyComparison } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
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
      {/* Hero Section - Estilo Apple */}
      <section className="bg-black text-white py-24 md:py-32 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight">
            Compare a MV Company
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comparisons.map((comparison) => (
                  <Link
                    key={comparison.id}
                    href={`/comparar/${comparison.slug}`}
                    className="group bg-white rounded-3xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Logos lado a lado - Estilo Apple */}
                    <div className="flex items-center justify-center gap-5 mb-8">
                      {/* MV Company */}
                      <div className="w-16 h-16 rounded-3xl bg-black flex items-center justify-center">
                        <span className="text-2xl">🚀</span>
                      </div>
                      
                      {/* VS */}
                      <span className="text-sm font-medium text-gray-400">vs</span>
                      
                      {/* Competitor */}
                      <div className="w-16 h-16 rounded-3xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                        {comparison.logo ? (
                          <Image
                            src={comparison.logo}
                            alt={comparison.name}
                            width={64}
                            height={64}
                            className="object-contain p-3"
                          />
                        ) : (
                          <span className="text-2xl">🏢</span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-center mb-3 text-gray-900 tracking-tight">
                      MV Company vs {comparison.name}
                    </h3>
                    {comparison.description && (
                      <p className="text-gray-600 text-sm text-center mb-6 line-clamp-2 font-light">
                        {comparison.description}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-gray-900 font-medium text-sm">
                      Ver Comparação
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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

      {/* CTA Section - Estilo Apple */}
      <section className="py-20 md:py-24 px-4 bg-black text-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-12 font-light">
            Entre em contato e descubra como podemos ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://wa.me/5534999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-w-[200px] bg-[#25D366] text-white px-8 py-4 rounded-full font-medium hover:bg-[#20BA5A] transition-all duration-200 text-center"
            >
              WhatsApp
            </a>
            <a
              href="https://instagram.com/mvcompany"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-w-[200px] bg-[#E4405F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#D32E4A] transition-all duration-200 text-center"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
