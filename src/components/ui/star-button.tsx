"use client"

import * as React from "react"
import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface StarBackgroundProps {
  color?: string
}

function StarBackground({ color }: StarBackgroundProps) {
  return (
    <svg
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="100" height="40" fill={color || "#0A0A0A"} />
      <circle cx="6" cy="8" r="0.9" fill="rgba(247, 201, 72, 0.6)" />
      <circle cx="16" cy="30" r="1.1" fill="rgba(247, 201, 72, 0.5)" />
      <circle cx="28" cy="18" r="0.9" fill="rgba(255, 255, 255, 0.35)" />
      <circle cx="40" cy="7" r="1" fill="rgba(247, 201, 72, 0.6)" />
      <circle cx="54" cy="34" r="0.9" fill="rgba(255, 255, 255, 0.35)" />
      <circle cx="68" cy="13" r="1.1" fill="rgba(247, 201, 72, 0.55)" />
      <circle cx="79" cy="31" r="0.9" fill="rgba(255, 255, 255, 0.3)" />
      <circle cx="91" cy="10" r="1" fill="rgba(247, 201, 72, 0.55)" />
      <circle cx="95" cy="24" r="0.9" fill="rgba(255, 255, 255, 0.3)" />
      <circle cx="49" cy="24" r="0.85" fill="rgba(247, 201, 72, 0.5)" />
      <circle cx="33" cy="35" r="0.8" fill="rgba(255, 255, 255, 0.3)" />
      <circle cx="73" cy="5" r="0.8" fill="rgba(247, 201, 72, 0.5)" />
    </svg>
  )
}

interface StarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  lightWidth?: number
  duration?: number
  lightColor?: string
  backgroundColor?: string
  borderWidth?: number
}

export function StarButton({
  children,
  lightWidth = 110,
  duration = 3,
  lightColor = "#F7C948",
  backgroundColor = "#0A0A0A",
  borderWidth = 1.5,
  className,
  ...props
}: StarButtonProps) {
  const pathRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (pathRef.current) {
      const div = pathRef.current
      div.style.setProperty(
        "--path",
        `path('M 0 0 H ${div.offsetWidth} V ${div.offsetHeight} H 0 V 0')`
      )
    }
  }, [])

  return (
    <button
      style={
        {
          "--duration": duration,
          "--light-width": `${lightWidth}px`,
          "--light-color": lightColor,
          "--border-width": `${borderWidth}px`,
          isolation: "isolate",
        } as CSSProperties
      }
      ref={pathRef}
      className={cn(
        "relative z-[3] inline-flex h-10 min-w-[10rem] items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50 group/star-button",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gogh-yellow/55",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 aspect-square animate-star-btn bg-[radial-gradient(ellipse_at_center,var(--light-color),transparent,transparent)]"
        style={
          {
            offsetPath: "var(--path)",
            offsetDistance: "0%",
            width: "var(--light-width)",
          } as CSSProperties
        }
      />
      <div
        className="absolute inset-0 z-[4] overflow-hidden rounded-[inherit] border-black/10 text-white"
        style={{ borderWidth: "var(--border-width)" }}
      >
        <StarBackground color={backgroundColor} />
      </div>
      <span className="relative z-10 inline-block bg-gradient-to-t from-white to-neutral-300 bg-clip-text text-transparent">
        {children}
      </span>
    </button>
  )
}

