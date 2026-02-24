import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planejamento de Vídeos | Gogh Lab',
  description: 'Área de planejamento de conteúdo e roteiros com IA para assinantes Gogh Lab.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PlanejamentoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
