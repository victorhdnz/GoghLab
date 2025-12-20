'use client'

import { ReactNode } from 'react'

export const PageTransition = ({ children }: { children: ReactNode }) => {
  // Removido framer-motion para melhorar performance de navegação
  // As animações de entrada/saída estavam causando lentidão nas transições
  return (
    <div style={{ position: 'relative', zIndex: 5 }}>
      {children}
    </div>
  )
}

