"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type RainbowButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function RainbowButton({ children, className, ...props }: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-10 cursor-pointer items-center justify-center rounded-full border-0 bg-[length:200%] px-4 py-2 text-sm font-medium text-white transition-colors",
        "[background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gogh-yellow/50",
        "disabled:pointer-events-none disabled:opacity-55",
        "animate-rainbow",
        "before:absolute before:bottom-[-22%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow",
        "before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
        "before:bg-[length:200%] before:[filter:blur(calc(0.65*1rem))]",
        "bg-[linear-gradient(#0A0A0A,#0A0A0A),linear-gradient(#0A0A0A_50%,rgba(10,10,10,0.75)_80%,rgba(10,10,10,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

