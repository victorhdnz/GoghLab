'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@/lib/utils'

type ColorKey =
  | 'color1'
  | 'color2'
  | 'color3'
  | 'color4'
  | 'color5'
  | 'color6'
  | 'color7'
  | 'color8'
  | 'color9'
  | 'color10'
  | 'color11'
  | 'color12'
  | 'color13'
  | 'color14'
  | 'color15'
  | 'color16'
  | 'color17'

export type Colors = Record<ColorKey, string>

const COLORS: Colors = {
  color1: '#F7C948',
  color2: '#FFD966',
  color3: '#FFE08A',
  color4: '#FFF7D6',
  color5: '#FBE9A2',
  color6: '#F7C948',
  color7: '#E5A800',
  color8: '#C68A00',
  color9: '#FFD966',
  color10: '#F7C948',
  color11: '#B77700',
  color12: '#FFF0BF',
  color13: '#D99A00',
  color14: '#FFE8A3',
  color15: '#F6D77B',
  color16: '#CC9000',
  color17: '#E7B735',
}

const svgOrder = ['svg1', 'svg2', 'svg3', 'svg4', 'svg3', 'svg2', 'svg1'] as const
type SvgKey = (typeof svgOrder)[number]

type Stop = { offset: number; stopColor: string }
type SvgState = { gradientTransform: string; stops: Stop[] }
type SvgStates = Record<SvgKey, SvgState>

const createStopsArray = (svgStates: SvgStates, order: readonly SvgKey[], maxStops: number): Stop[][] => {
  const stopsArray: Stop[][] = []
  for (let i = 0; i < maxStops; i += 1) {
    stopsArray.push(
      order.map((svgKey) => {
        const svg = svgStates[svgKey]
        return svg.stops[i] || svg.stops[svg.stops.length - 1]
      })
    )
  }
  return stopsArray
}

const GradientSvg = ({
  className,
  isHovered,
  colors,
}: {
  className: string
  isHovered: boolean
  colors: Colors
}) => {
  const svgStates: SvgStates = {
    svg1: {
      gradientTransform: 'translate(287.5 280) rotate(-29.0546) scale(689.807 1000)',
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.18, stopColor: colors.color2 },
        { offset: 0.26, stopColor: colors.color3 },
        { offset: 0.33, stopColor: colors.color4 },
        { offset: 0.44, stopColor: colors.color6 },
        { offset: 0.53, stopColor: colors.color7 },
        { offset: 0.63, stopColor: colors.color1 },
        { offset: 0.72, stopColor: colors.color8 },
        { offset: 0.81, stopColor: colors.color9 },
        { offset: 0.9, stopColor: colors.color10 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg2: {
      gradientTransform: 'translate(126.5 418.5) rotate(-64.756) scale(533.444 773.324)',
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.1, stopColor: colors.color12 },
        { offset: 0.18, stopColor: colors.color13 },
        { offset: 0.28, stopColor: colors.color1 },
        { offset: 0.33, stopColor: colors.color4 },
        { offset: 0.45, stopColor: colors.color6 },
        { offset: 0.52, stopColor: colors.color7 },
        { offset: 0.63, stopColor: colors.color1 },
        { offset: 0.69, stopColor: colors.color8 },
        { offset: 0.75, stopColor: colors.color14 },
        { offset: 0.82, stopColor: colors.color9 },
        { offset: 1, stopColor: colors.color1 },
      ],
    },
    svg3: {
      gradientTransform: 'translate(264.5 339.5) rotate(-42.3022) scale(946.451 1372.05)',
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.18, stopColor: colors.color2 },
        { offset: 0.31, stopColor: colors.color1 },
        { offset: 0.33, stopColor: colors.color4 },
        { offset: 0.44, stopColor: colors.color15 },
        { offset: 0.54, stopColor: colors.color16 },
        { offset: 0.63, stopColor: colors.color1 },
        { offset: 0.73, stopColor: colors.color17 },
        { offset: 0.82, stopColor: colors.color9 },
        { offset: 0.9, stopColor: colors.color1 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg4: {
      gradientTransform: 'translate(860.5 420) rotate(-153.984) scale(957.528 1388.11)',
      stops: [
        { offset: 0.11, stopColor: colors.color11 },
        { offset: 0.17, stopColor: colors.color2 },
        { offset: 0.26, stopColor: colors.color13 },
        { offset: 0.33, stopColor: colors.color4 },
        { offset: 0.44, stopColor: colors.color6 },
        { offset: 0.52, stopColor: colors.color7 },
        { offset: 0.63, stopColor: colors.color1 },
        { offset: 0.69, stopColor: colors.color8 },
        { offset: 0.82, stopColor: colors.color9 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
  }

  const maxStops = Math.max(...Object.values(svgStates).map((svg) => svg.stops.length))
  const stopsAnimationArray = createStopsArray(svgStates, svgOrder, maxStops)
  const gradientTransforms = svgOrder.map((svgKey) => svgStates[svgKey].gradientTransform)

  const variants = {
    hovered: {
      gradientTransform: gradientTransforms,
      transition: { duration: 40, repeat: Infinity, ease: 'linear' as const },
    },
    notHovered: {
      gradientTransform: gradientTransforms,
      transition: { duration: 12, repeat: Infinity, ease: 'linear' as const },
    },
  }

  return (
    <svg className={className} width="1030" height="280" viewBox="0 0 1030 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1030" height="280" rx="140" fill="url(#paint0_radial_button1)" />
      <defs>
        <motion.radialGradient id="paint0_radial_button1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" animate={isHovered ? variants.hovered : variants.notHovered}>
          {stopsAnimationArray.map((stopConfigs, index) => (
            <AnimatePresence key={index}>
              <motion.stop
                initial={{ offset: stopConfigs[0].offset, stopColor: stopConfigs[0].stopColor }}
                animate={{ offset: stopConfigs.map((c) => c.offset), stopColor: stopConfigs.map((c) => c.stopColor) }}
                transition={{ duration: 0, ease: 'linear' as const, repeat: Infinity }}
              />
            </AnimatePresence>
          ))}
        </motion.radialGradient>
      </defs>
    </svg>
  )
}

export const Liquid = ({ isHovered, colors }: { isHovered: boolean; colors: Colors }) => {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            index < 3 ? 'w-[443px] h-[121px]' : 'w-[756px] h-[207px]',
            'absolute',
            index === 0
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mix-blend-difference'
              : index === 1
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[164.971deg] mix-blend-difference'
                : index === 2
                  ? 'top-1/2 left-1/2 -translate-x-[53%] -translate-y-[53%] rotate-[-11.61deg] mix-blend-difference'
                  : index === 3
                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-[57%] rotate-[-179.012deg] mix-blend-difference'
                    : index === 4
                      ? 'top-1/2 left-1/2 -translate-x-[57%] -translate-y-1/2 rotate-[-29.722deg] mix-blend-difference'
                      : index === 5
                        ? 'top-1/2 left-1/2 -translate-x-[62%] -translate-y-[24%] rotate-[160.227deg] mix-blend-difference'
                        : 'top-1/2 left-1/2 -translate-x-[67%] -translate-y-[29%] rotate-180 mix-blend-hard-light'
          )}
        >
          <GradientSvg className="w-full h-full" isHovered={isHovered} colors={colors} />
        </div>
      ))}
    </>
  )
}

type ButtonOneProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  containerClassName?: string
}

export function ButtonOne({ children, className, containerClassName, disabled, ...props }: ButtonOneProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  return (
    <div className={cn('flex justify-center', containerClassName)}>
      <div
        className={cn(
          'relative inline-block h-11 min-w-[10rem] mx-auto group rounded-full',
          'border border-black/70 bg-[#0A0A0A]',
          disabled && 'opacity-50'
        )}
      >
        <div className="absolute w-[112%] h-[128%] top-[8%] left-1/2 -translate-x-1/2 blur-[19px] opacity-65 pointer-events-none">
          <span className="absolute inset-0 rounded-full bg-[#F7C948]/70 blur-[6.5px]" />
          <div className="relative w-full h-full overflow-hidden rounded-full">
            <Liquid isHovered={isHovered} colors={COLORS} />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[92%] h-[112%] rounded-full bg-[#0A0A0A] blur-[8px] pointer-events-none" />
        <div className="relative w-full h-full overflow-hidden rounded-full">
          <span className="absolute inset-0 rounded-full bg-[#0A0A0A]" />
          <Liquid isHovered={isHovered} colors={COLORS} />
          <span className="absolute inset-0 rounded-full border border-white/20 mix-blend-overlay" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[70%] h-[45%] rounded-full blur-[15px] bg-[#B77700]/50" />
        </div>

        <button
          className={cn(
            'absolute inset-0 rounded-full bg-transparent cursor-pointer',
            'inline-flex items-center justify-center px-4 text-sm font-semibold tracking-wide text-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gogh-yellow/55',
            className
          )}
          type="button"
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={disabled}
          {...props}
        >
          <span className="whitespace-nowrap">{children}</span>
        </button>
      </div>
    </div>
  )
}

