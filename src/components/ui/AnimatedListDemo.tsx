'use client'

import { cn } from '@/lib/utils'
import { AnimatedList } from './animated-list'
import { Check, Bell, Mail, Calendar, User } from 'lucide-react'

interface Item {
  name: string
  description: string
  icon: React.ElementType
  color: string
  time: string
}

const notifications: Item[] = [
  {
    name: 'Payment received',
    description: 'Magic UI',
    time: '15m ago',
    icon: Check,
    color: '#00C9A7',
  },
  {
    name: 'User signed up',
    description: 'Magic UI',
    time: '10m ago',
    icon: User,
    color: '#FFB800',
  },
  {
    name: 'New message',
    description: 'Magic UI',
    time: '5m ago',
    icon: Mail,
    color: '#FF3D71',
  },
  {
    name: 'New event',
    description: 'Magic UI',
    time: '2m ago',
    icon: Calendar,
    color: '#1E86FF',
  },
  {
    name: 'Notification',
    description: 'Magic UI',
    time: '1m ago',
    icon: Bell,
    color: '#8B5CF6',
  },
]

const Notification = ({ name, description, icon: Icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        'relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4',
        // animation styles
        'transition-all duration-200 ease-in-out hover:scale-[103%]',
        // dark styles - adaptado para paleta preto/branco/cinza
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
          <Icon size={20} style={{ color }} />
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

export function AnimatedListDemo({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex h-[500px] w-full flex-col overflow-hidden p-2',
        className
      )}
    >
      <AnimatedList delay={1500}>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-gray-900"></div>
    </div>
  )
}

