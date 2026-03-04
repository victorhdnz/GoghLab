import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gogh Analytics Ads | Gogh Lab',
  description: 'Painel de análise de anúncios e desempenho para assinantes.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
