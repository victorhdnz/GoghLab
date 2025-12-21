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
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    )

    // Intersection Observer para detectar quando o componente está visível
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true)
            }
          })
        },
        {
          threshold: 0.1, // Começar quando 10% do componente estiver visível
          rootMargin: '50px', // Começar 50px antes de entrar no viewport
        }
      )

      if (containerRef.current) {
        observer.observe(containerRef.current)
      }

      return () => {
        if (containerRef.current) {
          observer.unobserve(containerRef.current)
        }
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
      const result = childrenArray.slice(0, index + 1).reverse()
      return result
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

