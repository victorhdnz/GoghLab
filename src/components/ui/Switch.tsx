'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, checked = false, onCheckedChange, id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
    }

    return (
      <div className="flex items-center justify-between gap-3">
        {label && (
          <label 
            htmlFor={switchId} 
            className="text-sm font-medium leading-none cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        <label 
          htmlFor={switchId}
          className={cn(
            "relative inline-flex items-center cursor-pointer",
            className
          )}
        >
          <input
            type="checkbox"
            id={switchId}
            className="sr-only"
            checked={checked}
            onChange={handleChange}
            ref={ref}
            {...props}
          />
          <div className={cn(
            "w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
            checked ? "bg-black" : "bg-gray-200"
          )}>
            <div className={cn(
              "absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform duration-200 ease-in-out shadow-sm",
              checked ? "translate-x-5" : "translate-x-0"
            )} />
          </div>
        </label>
      </div>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
