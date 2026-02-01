'use client'

import React, { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { FadeInElement } from '@/components/ui/FadeInElement'
import Image from 'next/image'

export interface AnimatedBeamItem {
  id: string
  icon_url: string
  label?: string
}

interface AnimatedBeamSectionProps {
  enabled?: boolean
  title?: string
  subtitle?: string
  items?: AnimatedBeamItem[]
  center_icon_url?: string | null
  site_logo?: string | null
}

const Circle = React.forwardRef<
  HTMLDivElement | null,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'border-border z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-1.5 shadow-[0_0_20px_-12px_rgba(0,0,0,0.25)] overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  )
})
Circle.displayName = 'Circle'

function UserIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0A0A0A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function AnimatedBeamSection({
  enabled = true,
  title,
  subtitle,
  items = [],
  center_icon_url,
  site_logo,
}: AnimatedBeamSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const centerIndex = items.length
  const userIndex = items.length + 1
  const refsCount = Math.max(centerIndex + 2, 3)
  const refsArray = useRef<React.RefObject<HTMLDivElement | null>[]>([])
  const [refsReady, setRefsReady] = useState(false)

  if (refsArray.current.length !== refsCount) {
    refsArray.current = Array.from({ length: refsCount }, () => React.createRef<HTMLDivElement | null>())
  }

  useEffect(() => {
    const t = setTimeout(() => setRefsReady(true), 150)
    return () => clearTimeout(t)
  }, [items.length])

  if (!enabled || items.length === 0) return null

  const centerIcon = center_icon_url || site_logo || (items[0]?.icon_url ?? '')

  return (
    <section className="py-16 md:py-24 px-4 bg-[#F5F1E8]">
      <div className="container mx-auto max-w-5xl">
        {(title || subtitle) && (
          <FadeInElement className="text-center mb-12">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </FadeInElement>
        )}
        <FadeInElement className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-xl p-4 md:p-10">
          <div ref={containerRef} className="relative w-full max-w-3xl min-h-[320px] flex items-center justify-center">
            <div
              className={cn(
                'relative flex h-full w-full flex-row items-center justify-between gap-8 md:gap-12',
                refsReady ? 'opacity-100' : 'opacity-0'
              )}
            >
            {/* Coluna esquerda: ícones de entrada */}
            <div className="flex flex-col justify-center gap-5">
              {items.map((item, index) => (
                <Circle key={item.id} ref={refsArray.current[index]}>
                  {item.icon_url ? (
                    <Image
                      src={item.icon_url}
                      alt={item.label || `Plataforma ${index + 1}`}
                      width={40}
                      height={40}
                      className="object-contain w-full h-full"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        if (target.nextElementSibling) (target.nextElementSibling as HTMLElement).style.display = 'flex'
                      }}
                    />
                  ) : null}
                  {!item.icon_url && (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                      ?
                    </div>
                  )}
                </Circle>
              ))}
            </div>
            {/* Centro: ícone principal */}
            <div className="flex flex-col justify-center flex-shrink-0">
              <Circle ref={refsArray.current[centerIndex]} className="size-14 md:size-16">
                {centerIcon ? (
                  <Image
                    src={centerIcon}
                    alt="Central"
                    width={56}
                    height={56}
                    className="object-contain w-full h-full"
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      if (target.nextElementSibling) (target.nextElementSibling as HTMLElement).style.display = 'flex'
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#F7C948]/30 flex items-center justify-center text-[#F7C948] font-bold text-lg">
                    +
                  </div>
                )}
              </Circle>
            </div>
            {/* Coluna direita: ícone de usuário/saída */}
            <div className="flex flex-col justify-center flex-shrink-0">
              <Circle ref={refsArray.current[userIndex]}>
                <UserIcon />
              </Circle>
            </div>
            </div>
          {/* Beams: cada ícone da esquerda para o centro (linhas curvas, cinza claro) */}
          {refsReady &&
            items.map((_, index) => (
              <AnimatedBeam
                key={`beam-left-${index}`}
                containerRef={containerRef}
                fromRef={refsArray.current[index]}
                toRef={refsArray.current[centerIndex]}
                curvature={40}
                pathColor="#d4d4d4"
                pathWidth={2}
                pathOpacity={0.5}
                gradientStartColor="#e5e5e5"
                gradientStopColor="#a3a3a3"
                duration={3}
                delay={index * 0.15}
              />
            ))}
          {/* Beam: centro para o ícone de usuário à direita */}
          {refsReady && (
            <AnimatedBeam
              key="beam-center-user"
              containerRef={containerRef}
              fromRef={refsArray.current[centerIndex]}
              toRef={refsArray.current[userIndex]}
              curvature={0}
              pathColor="#d4d4d4"
              pathWidth={2}
              pathOpacity={0.5}
              gradientStartColor="#e5e5e5"
              gradientStopColor="#a3a3a3"
              duration={3}
              delay={0.1}
            />
          )}
          </div>
        </FadeInElement>
      </div>
    </section>
  )
}
