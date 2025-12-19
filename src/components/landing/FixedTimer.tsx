'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface FixedTimerProps {
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

export const FixedTimer = ({
  endDate,
  backgroundColor = '#000000',
  textColor = '#FFFFFF',
}: FixedTimerProps) => {
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
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="fixed z-40 bottom-32 md:bottom-28 right-2 md:right-6 scale-100 md:scale-75"
    >
      <motion.div
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl md:rounded-2xl shadow-2xl p-2 md:p-3 border-2 border-gray-700/50 backdrop-blur-md overflow-hidden w-auto"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />
        
        <div className="relative z-10">
          <motion.div 
            className="text-[10px] md:text-xs font-bold mb-2 md:mb-2 text-center text-white drop-shadow-lg flex items-center justify-center gap-1 md:gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-xs md:text-sm"
            >
              ⏰
            </motion.span>
            <span className="whitespace-nowrap">Termina em:</span>
          </motion.div>
          <div className="flex items-center gap-0.5 md:gap-1.5 justify-center">
            {[
              { value: timeLeft.days, label: 'd' },
              { value: timeLeft.hours, label: 'h' },
              { value: timeLeft.minutes, label: 'm' },
              { value: timeLeft.seconds, label: 's' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-0.5 md:gap-1.5">
                {index > 0 && (
                  <motion.span
                    className="text-[10px] md:text-sm font-bold text-red-400 drop-shadow-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.1
                    }}
                  >
                    :
                  </motion.span>
                )}
                <motion.div
                  className="text-center bg-gradient-to-br from-black via-gray-900 to-black rounded-md md:rounded-lg px-1.5 md:px-2.5 py-1 md:py-1.5 border-2 border-white/20 min-w-[32px] md:min-w-[40px] max-w-[36px] md:max-w-none shadow-xl overflow-hidden backdrop-blur-sm"
                  whileHover={{ scale: 1.1, borderColor: "#ef4444" }}
                  animate={{
                    boxShadow: [
                      '0 4px 15px rgba(0,0,0,0.3)',
                      '0 4px 25px rgba(239,68,68,0.4)',
                      '0 4px 15px rgba(0,0,0,0.3)',
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2
                    },
                    scale: {
                      duration: 0.2
                    }
                  }}
                >
                  <motion.div
                    className="text-[10px] md:text-lg font-black text-white font-mono drop-shadow-lg leading-tight"
                    key={item.value}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </motion.div>
                  <div className="text-[7px] md:text-[9px] text-gray-300 uppercase tracking-wider font-bold mt-0.5 md:mt-0.5">
                    {item.label}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

