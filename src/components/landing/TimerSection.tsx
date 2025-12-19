'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface TimerSectionProps {
  title?: string
  endDate: Date
  backgroundColor?: string
  textColor?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const TimerSection = ({
  title = 'Oferta por Tempo Limitado!',
  endDate,
  backgroundColor = '#000000',
  textColor = '#ffffff',
}: TimerSectionProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  const timeUnits = [
    { label: 'Dias', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Minutos', value: timeLeft.minutes },
    { label: 'Segundos', value: timeLeft.seconds },
  ]

  return (
    <section
      style={{ backgroundColor, color: textColor }}
      className="py-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>
          <div className="w-24 h-1 bg-accent mx-auto" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {timeUnits.map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div
                className="bg-white/10 backdrop-blur-md rounded-lg p-6 md:p-8 shadow-xl"
                style={{ borderColor: textColor }}
              >
                <motion.div
                  key={unit.value}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-5xl md:text-6xl font-bold mb-2"
                >
                  {String(unit.value).padStart(2, '0')}
                </motion.div>
                <div className="text-sm md:text-base opacity-75 uppercase tracking-wider">
                  {unit.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

