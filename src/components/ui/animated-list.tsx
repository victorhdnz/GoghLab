'use client'

import React, {
  ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { AnimatePresence, motion, MotionProps } from 'framer-motion'

import { cn } from '@/lib/utils'

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations: MotionProps = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 40 },
  }

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  )
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
  delay?: number
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const childrenArray = useMemo(() => {
      try {
        const array = React.Children.toArray(children)
        return Array.isArray(array) ? array : []
      } catch (error) {
        console.error('Erro ao processar children do AnimatedList:', error)
        return []
      }
    }, [children])

    // Intersection Observer: só ativar a animação quando entrar na tela.
    // Não resetar ao dar scroll (só recarrega a página para reiniciar).
    const hasBeenVisibleRef = useRef(false)
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              hasBeenVisibleRef.current = true
              setIsVisible(true)
            }
            // Não fazer nada quando sair do viewport: não resetar index nem isVisible
          })
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
        }
      )

      const currentRef = containerRef.current
      if (currentRef) {
        observer.observe(currentRef)
      }

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef)
        }
        observer.disconnect()
      }
    }, [])

    // Só começar a animação quando estiver visível
    useEffect(() => {
      if (!isVisible) return

      if (index < childrenArray.length - 1) {
        const timeout = setTimeout(() => {
          setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length)
        }, delay)

        return () => clearTimeout(timeout)
      }
    }, [index, delay, childrenArray.length, isVisible])

    const itemsToShow = useMemo(() => {
      if (!Array.isArray(childrenArray) || childrenArray.length === 0) {
        return []
      }
      try {
        const safeIndex = Math.max(0, Math.min(index, childrenArray.length - 1))
        const result = childrenArray.slice(0, safeIndex + 1).reverse()
        return Array.isArray(result) ? result : []
      } catch (error) {
        console.error('Erro ao criar itemsToShow:', error)
        return []
      }
    }, [index, childrenArray])

    return (
      <div
        ref={containerRef}
        className={cn(`flex flex-col items-center gap-4`, className)}
        {...props}
      >
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as React.ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedList.displayName = 'AnimatedList'

