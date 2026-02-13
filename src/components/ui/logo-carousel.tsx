"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SVGProps,
} from "react"
import { AnimatePresence, motion } from "framer-motion"

interface Logo {
  name: string
  id: number
  img: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

interface LogoColumnProps {
  logos: Logo[]
  index: number
  currentTime: number
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Distribui logos em colunas disjuntas: cada logo fica em só uma coluna, assim a linha visível (uma logo por coluna) nunca repete a mesma logo. */
const distributeLogos = (allLogos: Logo[], columnCount: number): Logo[][] => {
  if (allLogos.length === 0) return Array.from({ length: columnCount }, () => [])
  const shuffled = shuffleArray(allLogos)
  const columns: Logo[][] = Array.from({ length: columnCount }, () => [])

  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo)
  })

  const maxLength = Math.max(...columns.map((col) => col.length))
  columns.forEach((col) => {
    while (col.length < maxLength) {
      const lastId = col[col.length - 1]?.id
      const inThisColumn = col.filter((l) => l.id !== lastId)
      const pick = inThisColumn.length > 0
        ? inThisColumn[Math.floor(Math.random() * inThisColumn.length)]
        : col[0]
      col.push(pick)
    }
  })

  return columns
}

const LogoColumn: React.FC<LogoColumnProps> = React.memo(
  ({ logos, index, currentTime }) => {
    const cycleInterval = 2000
    const columnDelay = index * 200
    const adjustedTime = (currentTime + columnDelay) % (cycleInterval * logos.length)
    const currentIndex = Math.floor(adjustedTime / cycleInterval)
    const CurrentLogo = useMemo(() => logos[currentIndex].img, [logos, currentIndex])

    return (
      <motion.div
        className="relative h-12 w-20 overflow-hidden md:h-20 md:w-40"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.1,
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${logos[currentIndex].id}-${currentIndex}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ y: "10%", opacity: 0, filter: "blur(8px)" }}
            animate={{
              y: "0%",
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 1,
                bounce: 0.2,
                duration: 0.5,
              },
            }}
            exit={{
              y: "-20%",
              opacity: 0,
              filter: "blur(6px)",
              transition: {
                type: "tween",
                ease: "easeIn",
                duration: 0.3,
              },
            }}
          >
            <CurrentLogo className="h-14 w-14 max-h-[80%] max-w-[80%] object-contain md:h-24 md:w-24" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    )
  }
)

LogoColumn.displayName = "LogoColumn"

interface LogoCarouselProps {
  columnCount?: number
  logos: Logo[]
}

export function LogoCarousel({ columnCount = 2, logos }: LogoCarouselProps) {
  const [logoSets, setLogoSets] = useState<Logo[][]>([])
  const [currentTime, setCurrentTime] = useState(0)

  const updateTime = useCallback(() => {
    setCurrentTime((prevTime) => prevTime + 100)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(updateTime, 100)
    return () => clearInterval(intervalId)
  }, [updateTime])

  useEffect(() => {
    const distributedLogos = distributeLogos(logos, columnCount)
    setLogoSets(distributedLogos)
  }, [logos, columnCount])

  return (
    <div className="flex space-x-4">
      {logoSets.map((columnLogos, index) => (
        <LogoColumn
          key={index}
          logos={columnLogos}
          index={index}
          currentTime={currentTime}
        />
      ))}
    </div>
  )
}

export { LogoColumn }
export type { Logo, LogoCarouselProps }

