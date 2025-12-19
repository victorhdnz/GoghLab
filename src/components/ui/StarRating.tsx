'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: number
  disabled?: boolean
}

export const StarRating = ({ value, onChange, size = 24, disabled = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating)
    }
  }

  const displayValue = hoverValue ?? value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => !disabled && setHoverValue(null)}
          disabled={disabled}
          className={`transition-all ${
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
        >
          <Star
            size={size}
            className={
              star <= displayValue
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-300 text-gray-300'
            }
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {value}/5
        </span>
      )}
    </div>
  )
}

