'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3, Lock } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading, hasActiveSubscription, isPro } = useAuth()
  // Mesma lógica de cursos/ferramentas: acesso só com plano Pro
  const hasAccess = isAuthenticated && isPro

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige flex items-center justify-center p-4">
        <LumaSpin size="lg" className="text-gogh-grayDark" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* Header sempre visível (igual cursos/ferramentas) */}
        <div className="flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-gogh-yellow" />
          <div>
            <h1 className="text-2xl font-bold text-gogh-black">Gogh Analytics</h1>
            <p className="text-sm text-gogh-grayDark">
              Análise de anúncios e desempenho
            </p>
          </div>
        </div>

        {/* Banner âmbar (igual cursos/ferramentas): sem assinatura → Assinar; com assinatura sem Pro → Fazer upgrade */}
        {!hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
          >
            <p className="text-amber-800">
              {!hasActiveSubscription
                ? <>Você precisa assinar o plano Gogh Pro para acessar esta área. <Link href="/precos" className="font-medium underline">Assinar Gogh Pro</Link></>
                : <>O painel de análise está disponível apenas para o plano Pro. <Link href="/precos" className="font-medium underline">Faça upgrade agora</Link></>
              }
            </p>
          </motion.div>
        )}

        {/* Overlay de proteção (igual cursos/ferramentas): um único CTA para /precos */}
        <div className={!hasAccess ? 'relative' : ''}>
          {!hasAccess && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center min-h-[280px]">
              <div className="text-center p-4 sm:p-6 md:p-8">
                <Lock className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gogh-black mb-2">
                  {!hasActiveSubscription ? 'Assine o Gogh Pro para acessar' : 'Gogh Analytics é exclusivo do Plano Pro'}
                </h3>
                <p className="text-gogh-grayDark mb-6 max-w-md mx-auto">
                  {!hasActiveSubscription
                    ? 'Para acessar o painel de análise de anúncios e desempenho é necessário assinar o plano Gogh Pro.'
                    : 'Faça upgrade para o plano Pro e tenha acesso ao painel de métricas e desempenho.'}
                </p>
                <Link
                  href="/precos"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
                >
                  {!hasActiveSubscription ? 'Assinar Gogh Pro' : 'Fazer Upgrade'}
                </Link>
              </div>
            </div>
          )}

          <div className={!hasAccess ? 'pointer-events-none select-none blur-sm opacity-60' : ''}>
            <div className="bg-white rounded-2xl border border-gogh-grayLight p-6 sm:p-8 shadow-sm">
              {hasAccess ? (
                <p className="text-gogh-grayDark">
                  Aqui você terá acesso ao painel de análise de anúncios e métricas de desempenho. Em breve mais recursos.
                </p>
              ) : (
                <p className="text-gogh-grayDark">
                  Painel de análise de anúncios e métricas de desempenho (conteúdo disponível para assinantes Gogh Pro).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
