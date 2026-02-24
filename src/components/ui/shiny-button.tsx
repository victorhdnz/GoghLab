"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type ShinyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function ShinyButton({ children, className, ...props }: ShinyButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-full px-4 text-sm font-medium",
        "border border-gogh-yellow/50 bg-[#0A0A0A] text-white",
        "shadow-[inset_0_0_0_1px_rgba(247,201,72,0.18),0_8px_18px_-10px_rgba(10,10,10,0.55)]",
        "transition-all duration-300 hover:border-gogh-yellow hover:shadow-[inset_0_0_0_1px_rgba(247,201,72,0.45),0_10px_24px_-10px_rgba(10,10,10,0.65)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gogh-yellow/50",
        "disabled:pointer-events-none disabled:opacity-55",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-gogh-yellow/25 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

