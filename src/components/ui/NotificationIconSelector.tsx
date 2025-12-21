'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Mail, Heart, UserPlus, TrendingUp, CheckCircle, Bell, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationIconSelectorProps {
  value?: 'whatsapp' | 'email' | 'instagram' | 'like' | 'user' | 'trending' | 'check' | 'sale'
  onChange: (icon: 'whatsapp' | 'email' | 'instagram' | 'like' | 'user' | 'trending' | 'check' | 'sale') => void
  label?: string
}

// Mapeamento de ícones para componentes
const iconMap: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  email: Mail,
  instagram: Heart,
  like: Heart,
  user: UserPlus,
  trending: TrendingUp,
  check: CheckCircle,
  sale: ShoppingCart,
}

const iconLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  instagram: 'Instagram',
  like: 'Curtida',
  user: 'Novo Usuário',
  trending: 'Tendência',
  check: 'Concluído',
  sale: 'Venda',
}

const iconColors: Record<string, string> = {
  whatsapp: '#25D366',
  email: '#EA4335',
  instagram: '#E4405F',
  like: '#E4405F',
  user: '#FFB800',
  trending: '#1E86FF',
  check: '#00C9A7',
  sale: '#10B981',
}

const iconOptions: Array<'whatsapp' | 'email' | 'instagram' | 'like' | 'user' | 'trending' | 'check' | 'sale'> = [
  'whatsapp',
  'email',
  'instagram',
  'like',
  'user',
  'trending',
  'check',
  'sale',
]

export function NotificationIconSelector({ 
  value = 'whatsapp', 
  onChange, 
  label = 'Ícone' 
}: NotificationIconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedIcon = value && iconMap[value] ? iconMap[value] : MessageCircle
  const SelectedIcon = selectedIcon
  const selectedColor = iconColors[value] || '#25D366'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                backgroundColor: selectedColor + '20',
                border: `1px solid ${selectedColor}40`,
              }}
            >
              <SelectedIcon size={18} style={{ color: selectedColor }} />
            </div>
            <span className="text-sm text-gray-700">
              {value ? iconLabels[value] : 'Selecione um ícone'}
            </span>
          </div>
          <svg
            className={cn(
              "h-4 w-4 text-gray-500 transition-transform",
              isOpen && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={dropdownRef}
              className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-[400px] overflow-y-auto overscroll-contain"
            >
              <div className="p-3 grid grid-cols-4 gap-2 pb-3">
                {iconOptions.map((iconName) => {
                  const Icon = iconMap[iconName]
                  const isSelected = value === iconName
                  const color = iconColors[iconName] || '#25D366'
                  
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        onChange(iconName)
                        setIsOpen(false)
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex flex-col items-center justify-center gap-2",
                        isSelected
                          ? "border-black bg-gray-100"
                          : "border-gray-200"
                      )}
                      title={iconLabels[iconName]}
                    >
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-lg"
                        style={{
                          backgroundColor: color + '20',
                          border: `1px solid ${color}40`,
                        }}
                      >
                        <Icon size={20} style={{ color }} />
                      </div>
                      <span className={cn(
                        "text-xs text-center",
                        isSelected ? "text-black font-medium" : "text-gray-600"
                      )}>
                        {iconLabels[iconName]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

