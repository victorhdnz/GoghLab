'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ExitPopupProps {
  endDate: Date
  title?: string
  message?: string
  buttonText?: string
  whatsappNumber?: string
  onClose?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const ExitPopup = ({
  endDate,
  title = '⚠️ Espere!',
  message = 'Ainda dá tempo de garantir seu Smartwatch Série 11 com 4 brindes grátis.',
  buttonText = '💬 FALAR AGORA NO WHATSAPP',
  whatsappNumber = '5534984136291',
  onClose,
}: ExitPopupProps) => {
  const [show, setShow] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Verificar se o pop-up já foi exibido nesta sessão
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('exit_popup_shown')
      if (alreadyShown === 'true') {
        setHasShown(true)
      }
    }
  }, [])

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

    // Detectar quando chegar ao final da página - apenas se ainda não foi exibido
    const handleScroll = () => {
      if (!show && !hasShown && typeof window !== 'undefined') {
        // Calcular se chegou ao final da página (com margem de 100px)
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        
        // Verificar se está próximo do final (dentro de 100px do final)
        if (scrollTop + windowHeight >= documentHeight - 100) {
          setShow(true)
          sessionStorage.setItem('exit_popup_shown', 'true')
          setHasShown(true)
        }
      }
    }

    // Detectar intenção de sair - apenas se ainda não foi exibido
    const handleMouseLeave = (e: MouseEvent) => {
      // Verificar se o mouse está saindo pela parte superior da tela
      // E se o pop-up ainda não foi exibido nesta sessão
      if (e.clientY <= 0 && !show && !hasShown) {
        setShow(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('exit_popup_shown', 'true')
          setHasShown(true)
        }
      }
    }

    // Detectar antes de fechar aba - apenas se ainda não foi exibido
    const handleBeforeUnload = () => {
      if (!show && !hasShown) {
        setShow(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('exit_popup_shown', 'true')
          setHasShown(true)
        }
      }
    }

    // Adicionar listener de scroll com throttle para melhor performance
    let scrollTimeout: NodeJS.Timeout | null = null
    const throttledHandleScroll = () => {
      if (scrollTimeout) return
      scrollTimeout = setTimeout(() => {
        handleScroll()
        scrollTimeout = null
      }, 100) // Verificar a cada 100ms
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Verificar imediatamente se já está no final da página (caso o usuário já esteja lá)
    handleScroll()

    return () => {
      clearInterval(timer)
      if (scrollTimeout) clearTimeout(scrollTimeout)
      window.removeEventListener('scroll', throttledHandleScroll)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [endDate, show, hasShown])

  const handleClose = () => {
    setShow(false)
    if (onClose) onClose()
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}`, '_blank')
    handleClose()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
              <p className="text-gray-700 mb-6">{message}</p>
              
              {/* Cronômetro */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  ⏰ Termina em:
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-black">
                      {String(timeLeft.days).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-600">d</div>
                  </div>
                  <div className="text-xl font-bold text-gray-400">:</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-black">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-600">h</div>
                  </div>
                  <div className="text-xl font-bold text-gray-400">:</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-black">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-600">m</div>
                  </div>
                  <div className="text-xl font-bold text-gray-400">:</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-black">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-600">s</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Clique abaixo e fale com nossa equipe 👇
              </p>
            </div>

            <button
              onClick={handleWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors shadow-lg"
            >
              {buttonText}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

