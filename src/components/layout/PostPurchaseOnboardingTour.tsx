'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TourStep = {
  selector: string
  title: string
  description: string
}

interface PostPurchaseOnboardingTourProps {
  open: boolean
  steps: TourStep[]
  onClose: () => void
  onFinish: () => void
}

export function PostPurchaseOnboardingTour({
  open,
  steps,
  onClose,
  onFinish,
}: PostPurchaseOnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const availableSteps = useMemo(
    () => (open ? steps.filter((step) => !!document.querySelector(step.selector)) : []),
    [open, steps]
  )

  const step = availableSteps[currentStep]

  useEffect(() => {
    if (!open) {
      setCurrentStep(0)
      setTargetRect(null)
      return
    }

    if (availableSteps.length === 0) {
      onClose()
      return
    }

    setCurrentStep(0)
  }, [open, availableSteps.length, onClose])

  useEffect(() => {
    if (!open || !step) return

    const updateRect = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null
      if (!el) {
        setTargetRect(null)
        return
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
    }

    const raf = requestAnimationFrame(updateRect)
    const onWindowChange = () => requestAnimationFrame(updateRect)

    window.addEventListener('resize', onWindowChange)
    window.addEventListener('scroll', onWindowChange, true)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onWindowChange)
      window.removeEventListener('scroll', onWindowChange, true)
    }
  }, [open, step])

  if (!open || !step) return null

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const cardWidth = Math.min(360, vw - 24)
  const rect = targetRect

  const targetCenterX = rect ? rect.left + rect.width / 2 : vw / 2
  const targetCenterY = rect ? rect.top + rect.height / 2 : vh / 2
  const hasSpaceBelow = rect ? rect.bottom + 220 < vh : true
  const cardTop = rect
    ? hasSpaceBelow
      ? Math.min(vh - 180, rect.bottom + 14)
      : Math.max(12, rect.top - 170)
    : Math.max(12, vh / 2 - 80)
  const cardLeft = Math.max(12, Math.min(vw - cardWidth - 12, targetCenterX - cardWidth / 2))
  const arrowLeft = Math.max(20, Math.min(cardWidth - 20, targetCenterX - cardLeft))

  const isLast = currentStep === availableSteps.length - 1

  const handleNext = () => {
    if (isLast) {
      onFinish()
      return
    }
    setCurrentStep((prev) => prev + 1)
  }

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-black/65" />

      {rect && (
        <>
          <div
            className="fixed rounded-xl border-2 border-[#F7C948] shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
          />
          <div
            className="fixed rounded-xl border border-[#F7C948]/80 animate-pulse pointer-events-none"
            style={{
              top: rect.top - 12,
              left: rect.left - 12,
              width: rect.width + 24,
              height: rect.height + 24,
            }}
          />
        </>
      )}

      <div
        className="fixed rounded-xl bg-white border border-[#F7C948]/40 shadow-2xl p-4 sm:p-5"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
        }}
      >
        <div
          className={`absolute h-3 w-3 rotate-45 bg-white border-[#F7C948]/40 ${
            hasSpaceBelow ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-r border-b'
          }`}
          style={{ left: arrowLeft - 6 }}
        />

        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Passo {currentStep + 1} de {availableSteps.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Pular tour
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A]">{step.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{step.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <Button size="sm" onClick={handleNext} className="gap-1 bg-black text-white hover:bg-black/90">
            {isLast ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

