'use client'

import { CompanyComparison, ComparisonTopic } from '@/types'
import { Check, X } from 'lucide-react'
import Image from 'next/image'

interface ComparisonTableProps {
  comparison: CompanyComparison
}

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  const topics = Array.isArray(comparison.comparison_topics)
    ? comparison.comparison_topics
    : []

  if (topics.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Nenhum tópico de comparação disponível.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="px-6 py-4 text-left font-semibold text-gray-900 bg-gray-50">
              Característica
            </th>
            <th className="px-6 py-4 text-center font-semibold text-gray-900 bg-gray-50">
              <div className="flex flex-col items-center gap-2">
                {comparison.logo ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <Image
                      src={comparison.logo}
                      alt="MV Company"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                )}
                <span>MV Company</span>
              </div>
            </th>
            <th className="px-6 py-4 text-center font-semibold text-gray-900 bg-gray-50">
              <div className="flex flex-col items-center gap-2">
                {comparison.logo ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <Image
                      src={comparison.logo}
                      alt={comparison.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                )}
                <span>{comparison.name}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic: ComparisonTopic, index: number) => (
            <tr
              key={topic.id || index}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 font-medium text-gray-900">
                {topic.name}
              </td>
              <td className="px-6 py-4 text-center">
                {topic.mv_company ? (
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700">
                    <Check size={24} />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700">
                    <X size={24} />
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {topic.competitor ? (
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700">
                    <Check size={24} />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700">
                    <X size={24} />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

