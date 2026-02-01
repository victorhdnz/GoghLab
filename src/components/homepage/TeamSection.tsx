'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Instagram } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { FadeInElement } from '@/components/ui/FadeInElement'

export interface TeamMemberItem {
  id: string
  image_url: string
  name: string
  role: string
  quote: string
  instagram_url?: string
}

interface TeamSectionProps {
  enabled?: boolean
  title?: string
  subtitle?: string
  members?: TeamMemberItem[]
  autoplay?: boolean
}

export function TeamSection({
  enabled = true,
  title,
  subtitle,
  members = [],
  autoplay = true,
}: TeamSectionProps) {
  const [active, setActive] = useState(0)

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % Math.max(members.length, 1))
  }, [members.length])

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + members.length) % Math.max(members.length, 1))
  }

  useEffect(() => {
    if (!autoplay || members.length <= 1) return
    const interval = setInterval(handleNext, 5000)
    return () => clearInterval(interval)
  }, [autoplay, handleNext, members.length])

  const isActive = (index: number) => index === active
  const randomRotations = useMemo(
    () => members.map(() => `${Math.floor(Math.random() * 16) - 8}deg`),
    [members.length]
  )
  const getRotate = (index: number) => randomRotations[index] ?? '0deg'

  if (!enabled || members.length === 0) return null

  return (
    <section className="py-16 md:py-24 px-4 bg-[#F5F1E8]">
      <div className="container mx-auto max-w-5xl">
        {(title || subtitle) && (
          <FadeInElement className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:4xl font-bold text-[#0A0A0A] mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </FadeInElement>
        )}

        <div className="mx-auto max-w-sm px-4 py-8 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
          <div className="relative grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-20">
            {/* Imagem */}
            <div className="flex items-center justify-center">
              <div className="relative h-80 w-full max-w-xs">
                <AnimatePresence>
                  {members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, scale: 0.9, y: 50, rotate: getRotate(index) }}
                      animate={{
                        opacity: isActive(index) ? 1 : 0.5,
                        scale: isActive(index) ? 1 : 0.9,
                        y: isActive(index) ? 0 : 20,
                        zIndex: isActive(index) ? members.length : members.length - Math.abs(index - active),
                        rotate: isActive(index) ? '0deg' : getRotate(index),
                      }}
                      exit={{ opacity: 0, scale: 0.9, y: -50 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      className="absolute inset-0 origin-bottom"
                      style={{ perspective: '1000px' }}
                    >
                      {member.image_url ? (
                        <Image
                          src={member.image_url}
                          alt={member.name}
                          width={500}
                          height={500}
                          draggable={false}
                          className="h-full w-full rounded-3xl object-cover shadow-2xl border-2 border-[#F7C948]/30"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/500x500/e2e8f0/64748b?text=${member.name.charAt(0)}`
                            e.currentTarget.onerror = null
                          }}
                        />
                      ) : (
                        <div className="h-full w-full rounded-3xl bg-[#F7C948]/20 flex items-center justify-center shadow-2xl border-2 border-[#F7C948]/30 text-4xl text-[#0A0A0A] font-bold">
                          {member.name ? member.name.charAt(0) : '?'}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Nome, cargo, texto e Instagram */}
            <div className="flex flex-col justify-center py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-[#0A0A0A]">
                      {members[active]?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {members[active]?.role}
                    </p>
                    {members[active]?.instagram_url && (
                      <a
                        href={members[active].instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'inline-flex items-center gap-2 mt-2 text-sm font-medium text-[#0A0A0A]',
                          'hover:text-[#E5A800] focus:text-[#E5A800] transition-colors'
                        )}
                        aria-label={`Instagram de ${members[active]?.name}`}
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </a>
                    )}
                    <motion.p className="mt-8 text-lg text-gray-700 dark:text-slate-300">
                      &quot;{members[active]?.quote}&quot;
                    </motion.p>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex gap-4 pt-12">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Anterior"
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#F7C948]/50 transition-colors hover:bg-[#F7C948]/20 focus:outline-none focus:ring-2 focus:ring-[#F7C948] focus:ring-offset-2"
                >
                  <ArrowLeft className="h-5 w-5 text-[#0A0A0A] transition-transform duration-300 group-hover:-translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Próximo"
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#F7C948]/50 transition-colors hover:bg-[#F7C948]/20 focus:outline-none focus:ring-2 focus:ring-[#F7C948] focus:ring-offset-2"
                >
                  <ArrowRight className="h-5 w-5 text-[#0A0A0A] transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
