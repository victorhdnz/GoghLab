'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function MainBackground() {
  const pathname = usePathname()

  useEffect(() => {
    const main = document.querySelector('main')
    const body = document.body
    const html = document.documentElement
    
    if (!main) return

    // Páginas que gerenciam seu próprio background (área de membros, login)
    const memberRoutes = ['/membro', '/login', '/auth']
    const isMemberRoute = memberRoutes.some(route => pathname.startsWith(route))
    
    if (isMemberRoute) {
      // Não aplicar estilos - deixar o componente gerenciar
      return
    }

    // Bege Gogh Lab (#F5F1E8) em todas as páginas para consistência (acima do nav e fundo geral)
    const beige = '#F5F1E8'
    main.style.backgroundColor = beige
    main.style.background = beige
    if (body) {
      body.style.backgroundColor = beige
      body.style.background = beige
    }
    if (html) {
      html.style.backgroundColor = beige
      html.style.background = beige
    }

    return () => {
      // Limpar estilo ao desmontar
      if (main) {
        main.style.backgroundColor = ''
      }
      if (body) {
        body.style.backgroundColor = ''
      }
      if (html) {
        html.style.backgroundColor = ''
      }
    }
  }, [pathname])

  return null
}

