'use client'

import { useEffect } from 'react'

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Remover min-h-screen do main apenas para landing pages
    const main = document.querySelector('main')
    if (main) {
      main.classList.remove('min-h-screen')
    }

    return () => {
      // Restaurar ao sair (opcional, mas pode ser útil)
      if (main) {
        main.classList.add('min-h-screen')
      }
    }
  }, [])

  return <>{children}</>
}

