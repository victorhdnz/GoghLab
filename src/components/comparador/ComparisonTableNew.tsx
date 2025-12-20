'use client'

import type { CompanyComparison, ComparisonTopic } from '@/types'
import { Check, X } from 'lucide-react'
import Image from 'next/image'

interface ComparisonTableProps {
  comparison: CompanyComparison
}

export function ComparisonTableNew({ comparison }: ComparisonTableProps) {
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
    <div className="w-full">
      {/* Mobile: Cards lado a lado - Estilo Apple */}
      <div className="block md:hidden space-y-4">
        {topics.map((topic: ComparisonTopic, index: number) => (
          <div
            key={topic.id || index}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <h3 className="font-medium text-gray-900 mb-5 text-center text-base">
              {topic.name}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* MV Company */}
              <div className="text-center">
                <div className="mb-3">
                  {topic.mv_company ? (
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black text-white">
                      <Check size={20} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                      <X size={20} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-600">MV Company</p>
              </div>

              {/* Competitor */}
              <div className="text-center">
                <div className="mb-3">
                  {topic.competitor ? (
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black text-white">
                      <Check size={20} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                      <X size={20} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-600 truncate">{comparison.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Tabela - Estilo Apple */}
      <div className="hidden md:block">
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header com logos */}
          <div className="grid grid-cols-3 gap-6 bg-gray-50 p-8 border-b border-gray-200">
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 text-lg">Característica</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center">
                <span className="text-3xl">🚀</span>
              </div>
              <span className="font-semibold text-gray-900">MV Company</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              {comparison.logo ? (
                <div className="relative w-20 h-20 rounded-3xl bg-white border border-gray-200 overflow-hidden">
                  <Image
                    src={comparison.logo}
                    alt={comparison.name}
                    fill
                    className="object-contain p-3"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <span className="text-3xl">🏢</span>
                </div>
              )}
              <span className="font-semibold text-gray-900">{comparison.name}</span>
            </div>
          </div>

          {/* Tópicos */}
          <div className="divide-y divide-gray-100">
            {topics.map((topic: ComparisonTopic, index: number) => (
              <div
                key={topic.id || index}
                className="grid grid-cols-3 gap-6 items-center p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 text-base">
                  {topic.name}
                </div>
                <div className="flex justify-center">
                  {topic.mv_company ? (
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                      <Check size={20} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                      <X size={20} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {topic.competitor ? (
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                      <Check size={20} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                      <X size={20} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

