'use client'

import { CompanyComparison } from '@/types'
import { ComparisonTable } from './ComparisonTable'
import Image from 'next/image'

interface CompanyComparisonProps {
  comparison: CompanyComparison
}

export function CompanyComparison({ comparison }: CompanyComparisonProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Comparação: MV Company vs {comparison.name}
          </h1>
          {comparison.description && (
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {comparison.description}
            </p>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <ComparisonTable comparison={comparison} />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para trabalhar com a MV Company?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Entre em contato e descubra como podemos transformar seu negócio
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
      </div>
    </div>
  )
}

