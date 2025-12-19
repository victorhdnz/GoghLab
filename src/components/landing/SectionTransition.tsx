'use client'

import { ReactNode } from 'react'

interface SectionTransitionProps {
  children: ReactNode
  backgroundColor?: string
  className?: string
  isFirst?: boolean
  isLast?: boolean
  previousBgColor?: string
  nextBgColor?: string
}

export function SectionTransition({
  children,
  backgroundColor = '#ffffff',
  className = '',
  isFirst = false,
  isLast = false,
  previousBgColor,
  nextBgColor,
}: SectionTransitionProps) {

  // Converter RGB/RGBA para hex para comparação
  const rgbToHex = (rgb: string): string => {
    if (!rgb) return '#ffffff'
    if (rgb.startsWith('#')) return rgb.toLowerCase()
    
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (!match) return '#ffffff'
    
    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  // Normalizar cor para hex
  const normalizeColor = (color: string | undefined): string => {
    if (!color) return '#ffffff'
    return rgbToHex(color)
  }

  // Verificar se as cores são diferentes o suficiente para aplicar transição
  const shouldApplyTransition = (color1: string | undefined, color2: string | undefined): boolean => {
    if (!color1 || !color2) return false
    
    const hex1 = normalizeColor(color1)
    const hex2 = normalizeColor(color2)
    
    // Se as cores são iguais, não aplicar transição
    if (hex1 === hex2) return false
    
    // Calcular diferença de luminosidade
    const getLuminance = (hex: string): number => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      
      const [rs, gs, bs] = [r, g, b].map(val => {
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
      })
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }
    
    const lum1 = getLuminance(hex1)
    const lum2 = getLuminance(hex2)
    const contrast = Math.abs(lum1 - lum2)
    
    // Aplicar transição se houver contraste significativo (mais de 0.1)
    return contrast > 0.1
  }

  const needsTopTransition = !isFirst && shouldApplyTransition(previousBgColor, backgroundColor)
  const needsBottomTransition = !isLast && shouldApplyTransition(backgroundColor, nextBgColor)

  // Usar a cor de background fornecida
  const finalBgColor = backgroundColor

  return (
    <div 
      className={`relative ${className}`}
      style={{ backgroundColor: finalBgColor }}
    >
      {/* Sombreamento sutil superior */}
      {needsTopTransition && previousBgColor && backgroundColor && (
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none z-10"
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        />
      )}

      {/* Conteúdo da seção */}
      <div className="relative z-0">
        {children}
      </div>

      {/* Sombreamento sutil inferior */}
      {needsBottomTransition && backgroundColor && nextBgColor && (
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none z-10"
          style={{
            boxShadow: '0 -2px 4px rgba(0,0,0,0.08)',
          }}
        />
      )}
    </div>
  )
}

