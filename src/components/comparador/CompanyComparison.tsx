'use client'

import type { CompanyComparison as CompanyComparisonType } from '@/types'
import { ComparisonTableNew } from './ComparisonTableNew'
import Image from 'next/image'

interface CompanyComparisonProps {
  comparison: CompanyComparisonType
}

export function CompanyComparison({ comparison }: CompanyComparisonProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Estilo Apple */}
      <div className="bg-black text-white py-20 md:py-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-10">
              {/* MV Company Logo */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white flex items-center justify-center">
                <span className="text-3xl md:text-4xl">🚀</span>
              </div>
              
              {/* VS */}
              <div className="text-xl md:text-2xl font-medium text-gray-400">vs</div>
              
              {/* Competitor Logo */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white flex items-center justify-center overflow-hidden">
                {comparison.logo ? (
                  <Image
                    src={comparison.logo}
                    alt={comparison.name}
                    width={96}
                    height={96}
                    className="object-contain p-3"
                  />
                ) : (
                  <span className="text-3xl md:text-4xl">🏢</span>
                )}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold mb-6 tracking-tight">
              MV Company vs {comparison.name}
            </h1>
            {comparison.description && (
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light">
                {comparison.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <ComparisonTableNew comparison={comparison} />
      </div>

      {/* CTA Section - Estilo Apple */}
      <div className="bg-black text-white py-20 md:py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">
            Pronto para trabalhar com a MV Company?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-12 font-light">
            Entre em contato e descubra como podemos transformar seu negócio
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
      </div>
    </div>
  )
}

