'use client'

import { useEffect } from 'react'

/**
 * Componente que garante que o scroll sempre funcione desde o início
 * Previne bloqueios de scroll causados por componentes que carregam lentamente
 */
export function ScrollEnabler() {
  useEffect(() => {
    // Garantir que o body e html sempre permitam scroll
    const enableScroll = () => {
      if (typeof document === 'undefined') return

      // Remover qualquer bloqueio de scroll que possa ter sido aplicado
      document.body.style.overflow = ''
      document.body.style.overflowY = 'auto'
      document.body.style.overflowX = 'hidden'
      document.documentElement.style.overflow = ''
      document.documentElement.style.overflowY = 'auto'
      document.documentElement.style.overflowX = 'hidden'

      // Garantir touch-action para permitir scroll no mobile
      document.body.style.touchAction = 'pan-y pinch-zoom'
      document.documentElement.style.touchAction = 'pan-y pinch-zoom'

      // Garantir que o height não esteja bloqueando
      document.body.style.height = 'auto'
      document.documentElement.style.height = 'auto'
    }

    // Executar imediatamente
    enableScroll()

    // Executar após delays para garantir que não seja sobrescrito
    const timeouts = [
      setTimeout(enableScroll, 50),
      setTimeout(enableScroll, 100),
      setTimeout(enableScroll, 300),
      setTimeout(enableScroll, 500),
    ]

    // Executar quando a página estiver totalmente carregada
    if (typeof window !== 'undefined') {
      const readyState = document.readyState
      if (readyState === 'complete') {
        enableScroll()
      } else {
        window.addEventListener('load', enableScroll)
        // Também executar quando DOM estiver pronto
        if (readyState === 'interactive') {
          enableScroll()
        } else {
          document.addEventListener('DOMContentLoaded', enableScroll)
        }
      }
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', enableScroll)
        document.removeEventListener('DOMContentLoaded', enableScroll)
      }
    }
  }, [])

  return null
}
