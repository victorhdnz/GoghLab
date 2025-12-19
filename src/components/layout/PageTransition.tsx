'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      style={{ position: 'relative', zIndex: 5 }}
    >
      {children}
    </motion.div>
  )
}

