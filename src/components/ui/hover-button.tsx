"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className, children, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const [isListening, setIsListening] = React.useState(false)
    const [circles, setCircles] = React.useState<
      Array<{
        id: number
        x: number
        y: number
        color: string
        fadeState: "in" | "out" | null
      }>
    >([])
    const lastAddedRef = React.useRef(0)

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
      },
      [ref]
    )

    const createCircle = React.useCallback((x: number, y: number) => {
      const buttonWidth = buttonRef.current?.offsetWidth || 0
      const xPos = buttonWidth > 0 ? x / buttonWidth : 0.5
      const color = `linear-gradient(to right, var(--circle-start) ${xPos * 100}%, var(--circle-end) ${xPos * 100}%)`

      setCircles((prev) => [
        ...prev,
        { id: Date.now() + Math.round(Math.random() * 1000), x, y, color, fadeState: null },
      ])
    }, [])

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isListening || props.disabled) return
        const currentTime = Date.now()
        if (currentTime - lastAddedRef.current > 110) {
          lastAddedRef.current = currentTime
          const rect = event.currentTarget.getBoundingClientRect()
          createCircle(event.clientX - rect.left, event.clientY - rect.top)
        }
      },
      [createCircle, isListening, props.disabled]
    )

    React.useEffect(() => {
      circles.forEach((circle) => {
        if (!circle.fadeState) {
          setTimeout(() => {
            setCircles((prev) => prev.map((c) => (c.id === circle.id ? { ...c, fadeState: "in" } : c)))
          }, 0)
          setTimeout(() => {
            setCircles((prev) => prev.map((c) => (c.id === circle.id ? { ...c, fadeState: "out" } : c)))
          }, 650)
          setTimeout(() => {
            setCircles((prev) => prev.filter((c) => c.id !== circle.id))
          }, 1450)
        }
      })
    }, [circles])

    return (
      <button
        ref={setRefs}
        className={cn(
          "relative isolate inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium leading-6",
          "text-gogh-black border border-gogh-yellow/60 bg-gogh-yellow/15 backdrop-blur-md",
          "cursor-pointer overflow-hidden transition-all duration-300",
          "hover:bg-gogh-yellow/30 hover:border-gogh-yellow",
          "before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:pointer-events-none before:z-[1]",
          "before:shadow-[inset_0_0_0_1px_rgba(247,201,72,0.35),inset_0_0_10px_0_rgba(247,201,72,0.2),0_1px_3px_0_rgba(0,0,0,0.2)]",
          "active:before:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setIsListening(true)}
        onPointerLeave={() => setIsListening(false)}
        style={
          {
            "--circle-start": "rgba(247,201,72,0.95)",
            "--circle-end": "rgba(229,168,0,0.95)",
          } as React.CSSProperties
        }
        {...props}
      >
        {circles.map(({ id, x, y, color, fadeState }) => (
          <div
            key={id}
            className={cn(
              "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md pointer-events-none z-0 transition-opacity duration-300",
              fadeState === "in" && "opacity-70",
              fadeState === "out" && "opacity-0 duration-700",
              !fadeState && "opacity-0"
            )}
            style={{ left: x, top: y, background: color }}
          />
        ))}
        <span className="relative z-10">{children}</span>
      </button>
    )
  }
)

HoverButton.displayName = "HoverButton"

export { HoverButton }

