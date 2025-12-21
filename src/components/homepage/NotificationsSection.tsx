'use client'

import { AnimatedList } from '@/components/ui/animated-list'
import { Bell, Mail, MessageCircle, Heart, UserPlus, TrendingUp, CheckCircle, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FadeInSection } from '@/components/ui/FadeInSection'

export interface NotificationItem {
  id: string
  name: string
  description: string
  icon: 'whatsapp' | 'email' | 'instagram' | 'like' | 'user' | 'trending' | 'check' | 'sale'
  time: string
}

interface NotificationsSectionProps {
  enabled?: boolean
  title?: string
  description?: string
  notifications?: NotificationItem[]
  delay?: number
}

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

const Notification = ({ name, description, icon, time }: NotificationItem) => {
  const IconComponent = iconMap[icon] || Bell
  const color = iconColors[icon] || '#FFFFFF'

  return (
    <figure
      className={cn(
        'relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4',
        'transition-all duration-200 ease-in-out hover:scale-[103%]',
        'bg-gray-900 border border-gray-800 [box-shadow:0_0_0_1px_rgba(255,255,255,.05),0_2px_4px_rgba(0,0,0,.3),0_12px_24px_rgba(0,0,0,.2)]',
        'transform-gpu backdrop-blur-md'
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color + '20',
            border: `1px solid ${color}40`,
          }}
        >
          <IconComponent size={20} style={{ color }} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre text-white">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-400">{time}</span>
          </figcaption>
          <p className="text-sm font-normal text-gray-300">
            {description}
          </p>
        </div>
      </div>
    </figure>
  )
}

export function NotificationsSection({
  enabled = true,
  title,
  description,
  notifications = [],
  delay = 1500,
}: NotificationsSectionProps) {
  // Se não estiver habilitado explicitamente como false, verificar se há notificações
  if (enabled === false) return null
  
  // Garantir que notifications seja sempre um array válido
  const validNotifications = Array.isArray(notifications) ? notifications : []
  
  // Se não houver notificações, não renderizar
  if (!validNotifications || validNotifications.length === 0) return null

  return (
    <FadeInSection>
      <section className="py-16 md:py-24 px-4 bg-black">
        <div className="container mx-auto max-w-4xl">
          {title && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {title}
              </h2>
              {description && (
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  {description}
                </p>
              )}
            </div>
          )}

          <div className="relative flex h-[500px] w-full flex-col overflow-hidden p-2">
            <AnimatedList delay={delay}>
              {validNotifications.map((item) => (
                <Notification key={item.id} {...item} />
              ))}
            </AnimatedList>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black to-transparent"></div>
          </div>
        </div>
      </section>
    </FadeInSection>
  )
}

