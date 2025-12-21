'use client'

import { cn } from '@/lib/utils'
import { Marquee } from '@/components/ui/marquee'
import { FadeInSection } from '@/components/ui/FadeInSection'
import Image from 'next/image'

export interface TestimonialItem {
  id: string
  name: string
  username: string
  body: string
  img: string
}

interface TestimonialsSectionProps {
  enabled?: boolean
  title?: string
  description?: string
  testimonials?: TestimonialItem[]
  duration?: number
}

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string
  name: string
  username: string
  body: string
}) => {
  return (
    <figure
      className={cn(
        'relative h-full w-fit cursor-pointer overflow-hidden rounded-xl border p-4 sm:w-36',
        // dark styles adaptados para paleta preto/branco/cinza
        'border-gray-800 bg-gray-900/50 hover:bg-gray-800/50',
        'backdrop-blur-sm'
      )}
    >
      <div className="flex flex-row items-center gap-2">
        {img ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={img}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-gray-400">👤</span>
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <figcaption className="text-sm font-medium text-white truncate">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-gray-400 truncate">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm text-gray-300 line-clamp-3">{body}</blockquote>
    </figure>
  )
}

export function TestimonialsSection({
  enabled = true,
  title,
  description,
  testimonials = [],
  duration = 20,
}: TestimonialsSectionProps) {
  // Se não estiver habilitado explicitamente como false, verificar se há depoimentos
  if (enabled === false) return null
  // Se não houver depoimentos, não renderizar
  if (!testimonials || testimonials.length === 0) return null

  // Dividir depoimentos em 4 grupos para as 4 colunas
  const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 4))
  const secondRow = testimonials.slice(
    Math.ceil(testimonials.length / 4),
    Math.ceil(testimonials.length / 2)
  )
  const thirdRow = testimonials.slice(
    Math.ceil(testimonials.length / 2),
    Math.ceil((testimonials.length * 3) / 4)
  )
  const fourthRow = testimonials.slice(Math.ceil((testimonials.length * 3) / 4))

  return (
    <FadeInSection>
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="container mx-auto max-w-7xl">
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

          <div className="relative flex h-96 w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:300px]">
            <div
              className="flex flex-row items-center gap-4"
              style={{
                transform:
                  'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
              }}
            >
              <Marquee pauseOnHover vertical className={`[--duration:${duration}s]`}>
                {firstRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover className={`[--duration:${duration}s]`} vertical>
                {secondRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover className={`[--duration:${duration}s]`} vertical>
                {thirdRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
              <Marquee pauseOnHover className={`[--duration:${duration}s]`} vertical>
                {fourthRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black via-gray-950"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black via-gray-950"></div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black via-gray-950"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black via-gray-950"></div>
          </div>
        </div>
      </section>
    </FadeInSection>
  )
}

