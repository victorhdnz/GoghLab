'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type AnimatedGenerateButtonProps = {
  className?: string
  labelIdle?: string
  labelActive?: string
  generating?: boolean
  highlightHueDeg?: number
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  id?: string
  ariaLabel?: string
}

export default function AnimatedGenerateButton({
  className,
  labelIdle = 'Generate',
  labelActive = 'Generating',
  generating = false,
  highlightHueDeg = 45,
  onClick,
  type = 'button',
  disabled = false,
  id,
  ariaLabel,
}: AnimatedGenerateButtonProps) {
  return (
    <div className={cn('relative inline-block', className)} id={id}>
      <button
        type={type}
        aria-label={ariaLabel ?? (generating ? labelActive : labelIdle)}
        aria-pressed={generating}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'ui-anim-btn',
          'relative flex items-center justify-center cursor-pointer select-none',
          'rounded-[24px] px-4 py-2',
          'bg-[hsl(var(--background))] text-[hsl(var(--foreground))]',
          'border border-[hsl(var(--border))]/20',
          'shadow-[inset_0px_1px_1px_rgba(255,255,255,0.2),inset_0px_2px_2px_rgba(255,255,255,0.15),inset_0px_4px_4px_rgba(255,255,255,0.1),inset_0px_8px_8px_rgba(255,255,255,0.05),inset_0px_16px_16px_rgba(255,255,255,0.05),0_-1px_1px_rgba(0,0,0,0.02),0_-2px_2px_rgba(0,0,0,0.03),0_-4px_4px_rgba(0,0,0,0.05),0_-8px_8px_rgba(0,0,0,0.06),0_-16px_16px_rgba(0,0,0,0.08)]',
          'transition-[box-shadow,border,background-color] duration-400'
        )}
        style={
          {
            ['--highlight-hue' as string]: `${highlightHueDeg}`,
          } as React.CSSProperties
        }
      >
        <svg
          className={cn(
            'ui-anim-btn-svg mr-2 h-6 w-6 flex-shrink-0',
            'fill-[color:var(--ui-anim-svg-fill)]',
            'transition-[fill,filter,opacity] duration-400'
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
          />
        </svg>
        <div className="ui-anim-txt-wrapper relative flex min-w-[6.4em] items-center">
          <div
            className={cn(
              'ui-anim-txt-1 absolute',
              generating ? 'opacity-0' : 'animate-[ui-appear_1s_ease-in-out_forwards]'
            )}
          >
            {Array.from(labelIdle).map((ch, i) => (
              <span key={i} className="ui-anim-letter inline-block">
                {ch}
              </span>
            ))}
          </div>
          <div
            className={cn(
              'ui-anim-txt-2 absolute',
              generating ? 'opacity-100' : 'opacity-0'
            )}
          >
            {Array.from(labelActive).map((ch, i) => (
              <span key={i} className="ui-anim-letter inline-block">
                {ch}
              </span>
            ))}
          </div>
        </div>
      </button>
    </div>
  )
}
