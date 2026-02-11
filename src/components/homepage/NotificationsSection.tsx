'use client'

import { AnimatedList } from '@/components/ui/animated-list'
import { Bell, Mail, MessageCircle, Heart, UserPlus, TrendingUp, CheckCircle, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FadeInElement } from '@/components/ui/FadeInElement'

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
  const color = iconColors[icon] || '#F7C948'

  return (
    <figure
      className={cn(
        'relative mx-auto min-h-fit w-full max-w-[300px] sm:max-w-[320px] cursor-pointer overflow-hidden rounded-xl p-3',
        'transition-all duration-200 ease-in-out hover:scale-[102%]',
        'bg-white border border-[#F7C948]/30 [box-shadow:0_0_0_1px_rgba(247,201,72,.1),0_2px_4px_rgba(0,0,0,.05),0_8px_16px_rgba(0,0,0,.06)]',
        'transform-gpu backdrop-blur-md'
      )}
    >
        <div className="flex flex-row items-center gap-2.5">
        <div
          className="flex size-8 items-center justify-center rounded-xl flex-shrink-0"
          style={{
            backgroundColor: color + '20',
            border: `1px solid ${color}40`,
          }}
        >
          <IconComponent size={16} style={{ color }} />
        </div>
        <div className="flex flex-col overflow-hidden min-w-0">
          <figcaption className="flex flex-row items-center font-medium whitespace-pre text-[#0A0A0A]">
            <span className="text-xs sm:text-sm">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-[10px] text-gray-500">{time}</span>
          </figcaption>
          <p className="text-xs font-normal text-gray-600 line-clamp-2">
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
    <section className="py-10 md:py-14 px-4 bg-[#F5F1E8]">
      <div className="container mx-auto max-w-3xl">
        {title && (
          <div className="text-center mb-8">
            <FadeInElement>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2">
                {title}
              </h2>
            </FadeInElement>
            {description && (
              <FadeInElement delay={0.1}>
                <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto">
                  {description}
                </p>
              </FadeInElement>
            )}
          </div>
        )}

        <FadeInElement delay={0.2}>
          <div className="relative flex h-[500px] w-full flex-col overflow-hidden p-2">
            <AnimatedList delay={delay}>
              {validNotifications.map((item) => (
                <Notification key={item.id} {...item} />
              ))}
            </AnimatedList>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#F5F1E8] to-transparent"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#F5F1E8] to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#F5F1E8] to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#F5F1E8] to-transparent"></div>
          </div>
        </FadeInElement>
      </div>
    </section>
  )
}

