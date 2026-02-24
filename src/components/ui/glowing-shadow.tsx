"use client"

import type { ReactNode } from "react"

interface GlowingShadowProps {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function GlowingShadow({ children, className = "", contentClassName = "" }: GlowingShadowProps) {
  return (
    <>
      <style jsx>{`
        @property --hue {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        .glow-container {
          --hue: 0;
          --radius: 14px;
          position: relative;
          border-radius: var(--radius);
        }
        .glow-container::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: conic-gradient(
            from 0deg,
            hsl(calc(var(--hue) * 1deg) 100% 68% / 0.38),
            hsl(calc((var(--hue) + 70) * 1deg) 95% 65% / 0.18),
            hsl(calc((var(--hue) + 140) * 1deg) 95% 62% / 0.38),
            hsl(calc((var(--hue) + 220) * 1deg) 95% 60% / 0.18),
            hsl(calc((var(--hue) + 360) * 1deg) 100% 68% / 0.38)
          );
          filter: blur(10px);
          opacity: 0.5;
          transition: opacity 0.2s ease;
          animation: hue-animation 6s linear infinite;
          pointer-events: none;
          z-index: 0;
        }
        .glow-container:hover::before {
          opacity: 0.85;
        }
        .glow-content {
          position: relative;
          border-radius: inherit;
          z-index: 1;
        }
        @keyframes hue-animation {
          from {
            --hue: 0;
          }
          to {
            --hue: 360;
          }
        }
      `}</style>

      <div className={`glow-container ${className}`}>
        <div className={`glow-content ${contentClassName}`}>{children}</div>
      </div>
    </>
  )
}

