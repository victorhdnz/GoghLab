'use client'

import { TermsContent } from '@/components/ui/TermsContent'

interface TermPageProps {
  params: { key: string }
}

export default function TermPage({ params }: TermPageProps) {
  const { key } = params

  // Conteúdo padrão caso não encontre no banco
  const defaultContent = `# ${key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ')}\n\n## 1. Primeira Seção\n\nConteúdo da primeira seção aqui.`

  return (
    <TermsContent
      termKey={key}
      defaultTitle={key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ')}
      defaultContent={defaultContent}
    />
  )
}

