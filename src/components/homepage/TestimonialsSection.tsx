'use client'

import { useMemo, memo } from 'react'
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

const ReviewCard = memo(({
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
        // dark styles adaptados para paleta preto/branco/cinza - igual à demo
        'border-gray-800 bg-gray-900/50 hover:bg-gray-800/50',
        'backdrop-blur-sm'
      )}
    >
      <div className="flex flex-row items-center gap-2">
        {img ? (
          <img className="rounded-full" width="32" height="32" alt="" src={img} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-gray-400">👤</span>
          </div>
        )}
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-gray-400">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm text-gray-300">{body}</blockquote>
    </figure>
  )
})

ReviewCard.displayName = 'ReviewCard'

export function TestimonialsSection({
  enabled = true,
  title,
  description,
  testimonials = [],
  duration = 200,
}: TestimonialsSectionProps) {
  // Se não estiver habilitado explicitamente como false, verificar se há depoimentos
  if (enabled === false) return null
  
  // Garantir que testimonials seja sempre um array válido
  const validTestimonials = Array.isArray(testimonials) ? testimonials : []
  
  // Se não houver depoimentos, não renderizar
  if (!validTestimonials || validTestimonials.length === 0) return null

  // Memoizar a criação dos arrays intercalados para evitar recálculos desnecessários
  const [firstRow, secondRow, thirdRow, fourthRow] = useMemo(() => {
    const createInterleavedColumns = (items: TestimonialItem[]) => {
      if (!Array.isArray(items) || items.length === 0) return [[], [], [], []]
      
      // Função para embaralhar sem repetições consecutivas
      const shuffleWithoutConsecutive = (arr: TestimonialItem[]): TestimonialItem[] => {
        if (!Array.isArray(arr) || arr.length === 0) return []
        
        const shuffled: TestimonialItem[] = []
        const available = [...arr]
        let lastItem: TestimonialItem | null = null
        let iterations = 0
        const maxIterations = arr.length * 10 // Proteção contra loop infinito
        
        while (available.length > 0 && iterations < maxIterations) {
          iterations++
          
          // Filtrar itens que não são iguais ao último adicionado
          const candidates = available.filter(item => item.id !== lastItem?.id)
          
          // Se não houver candidatos (todos são iguais), usar todos
          const pool = candidates.length > 0 ? candidates : available
          
          // Se o pool estiver vazio, parar
          if (pool.length === 0) break
          
          // Escolher aleatoriamente
          const randomIndex = Math.floor(Math.random() * pool.length)
          const selected = pool[randomIndex]
          
          shuffled.push(selected)
          lastItem = selected
          
          // Remover o item selecionado do pool disponível
          const itemIndex = available.indexOf(selected)
          if (itemIndex >= 0) {
            available.splice(itemIndex, 1)
          }
          
          // Se o array disponível ficou vazio, recarregar com todos os itens originais
          if (available.length === 0) {
            available.push(...arr)
          }
        }
        
        return shuffled
      }
      
      // Criar sequências suficientes para preencher todas as 4 colunas
      // Usar 6 sequências para garantir que todas as colunas tenham conteúdo suficiente
      // e passem juntas de forma sincronizada
      const extendedItems: TestimonialItem[] = []
      for (let i = 0; i < 6; i++) {
        const shuffled = shuffleWithoutConsecutive(items)
        extendedItems.push(...shuffled)
      }
      
      // Distribuir de forma intercalada (round-robin) entre as 4 colunas
      // Isso garante que cada coluna receba itens de forma equilibrada e sincronizada
      const columns: TestimonialItem[][] = [[], [], [], []]
      extendedItems.forEach((item, index) => {
        columns[index % 4].push(item)
      })
      
      // Garantir que todas as colunas tenham pelo menos o mesmo número mínimo de itens
      const minLength = Math.min(...columns.map(col => col.length))
      if (minLength > 0) {
        // Se alguma coluna tiver muito menos itens, redistribuir
        columns.forEach((col, colIndex) => {
          if (col.length < minLength * 0.8) {
            // Adicionar itens de outras colunas que têm mais
            const sourceCol = columns.find((c, idx) => idx !== colIndex && c.length > minLength * 1.2)
            if (sourceCol && sourceCol.length > 0) {
              const itemsToMove = Math.ceil((minLength - col.length) / 2)
              col.push(...sourceCol.splice(0, Math.min(itemsToMove, sourceCol.length)))
            }
          }
        })
      }
      
      return columns
    }

    return createInterleavedColumns(validTestimonials)
  }, [validTestimonials])

  return (
    <FadeInSection>
      <section className="py-16 md:py-24 px-4 bg-black">
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

          <div className="relative flex h-96 w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:300px] bg-black">
            <div
              className="flex flex-row items-center gap-4"
              style={{
                transform:
                  'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
              }}
            >
              <Marquee pauseOnHover vertical className="[--duration:20s]">
                {firstRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover className="[--duration:20s]" vertical>
                {secondRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover className="[--duration:20s]" vertical>
                {thirdRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
              <Marquee pauseOnHover className="[--duration:20s]" vertical>
                {fourthRow.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </Marquee>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black"></div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black"></div>
          </div>
        </div>
      </section>
    </FadeInSection>
  )
}

