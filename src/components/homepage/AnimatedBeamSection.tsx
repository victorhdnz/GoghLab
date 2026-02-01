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
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'border-border z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-1.5 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  )
})
Circle.displayName = 'Circle'

export function AnimatedBeamSection({
  enabled = true,
  title,
  subtitle,
  items = [],
  center_icon_url,
  site_logo,
}: AnimatedBeamSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const refsCount = Math.max(items.length + 1, 12)
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
    <section className="py-16 md:py-24 px-4 bg-black/80">
      <div className="container mx-auto max-w-5xl">
        {(title || subtitle) && (
          <FadeInElement className="text-center mb-12">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </FadeInElement>
        )}
        <FadeInElement className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl p-4 md:p-10">
          <div
            className={cn(
              'relative flex h-full w-full max-w-2xl flex-row items-stretch justify-between gap-6 md:gap-10',
              refsReady ? 'opacity-100' : 'opacity-0'
            )}
            ref={containerRef}
          >
            {/* Coluna esquerda: ícones de entrada */}
            <div className="flex flex-col justify-center gap-4">
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
            <div className="flex flex-col justify-center">
              <Circle ref={refsArray.current[items.length]} className="size-14 md:size-16">
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
          </div>
          {/* Beams: cada ícone da esquerda para o centro */}
          {refsReady &&
            items.map((_, index) => (
              <AnimatedBeam
                key={`beam-${index}`}
                containerRef={containerRef}
                fromRef={refsArray.current[index]}
                toRef={refsArray.current[items.length]}
                gradientStartColor="#F7C948"
                gradientStopColor="#9c40ff"
                duration={Math.random() * 2 + 3}
                delay={index * 0.2}
              />
            ))}
        </FadeInElement>
      </div>
    </section>
  )
}
