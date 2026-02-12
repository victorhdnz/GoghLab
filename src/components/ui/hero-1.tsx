'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { WorldMap } from '@/components/ui/world-map'

// Paleta Gogh Lab: yellow #F7C948, black #0A0A0A, beige #F5F1E8
const GOGH_BLACK = '#0A0A0A'
const GOGH_BEIGE = '#F5F1E8'
const GOGH_YELLOW = '#F7C948'

interface HeroProps {
  eyebrow?: string
  eyebrowHref?: string
  title: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}

export function Hero({
  eyebrow = 'Criar',
  eyebrowHref = '/criar',
  title,
  subtitle,
  ctaLabel = 'Ver planos',
  ctaHref = '/precos',
}: HeroProps) {
  const router = useRouter()
  const safeTitle = typeof title === 'string' ? title : 'Gogh Lab'
  const safeSubtitle = typeof subtitle === 'string' ? subtitle : 'Criatividade guiada por tecnologia.'
  return (
    <section
      id="hero"
      className="relative mx-auto w-full pt-8 lg:pt-24 px-6 text-center md:px-8 overflow-visible rounded-b-xl bg-[#F5F1E8] dark:bg-[linear-gradient(to_bottom,#0A0A0A,#0A0A0A_30%,#1A1A1A_78%,#2a2a2a_99%)]"
    >
      {/* Grid BG - cores Gogh */}
      <div
        className="absolute -z-10 inset-0 opacity-80 h-[600px] w-full bg-[linear-gradient(to_right,#e8e4dc_1px,transparent_1px),linear-gradient(to_bottom,#e8e4dc_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
      />

      {/* Eyebrow - link para página dos chats de IA */}
      {eyebrow && (
        <Link href={eyebrowHref} className="group inline-block">
          <span className="text-sm text-[#0A0A0A] dark:text-gray-400 mx-auto px-5 py-2 bg-gradient-to-tr from-[#F7C948]/10 via-gray-400/5 to-transparent border-[2px] border-[#0A0A0A]/10 dark:border-white/5 rounded-3xl w-fit tracking-tight uppercase flex items-center justify-center gap-2">
            {eyebrow}
            <ChevronRight className="inline w-4 h-4 ml-0 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      )}

      {/* Title - preto/amarelo Gogh */}
      <h1 className="animate-fade-in-up text-balance bg-gradient-to-br from-[#0A0A0A] to-[#0A0A0A]/40 bg-clip-text py-6 text-5xl font-semibold leading-tight tracking-tighter text-transparent opacity-0 sm:text-6xl md:text-7xl lg:text-8xl dark:from-white dark:to-white/40 [animation-fill-mode:forwards] motion-reduce:opacity-100">
        {safeTitle}
      </h1>

      {/* Subtitle */}
      <p className="animate-fade-in-up mb-12 text-balance text-lg tracking-tight text-[#0A0A0A]/80 dark:text-gray-400 opacity-0 md:text-xl max-w-3xl mx-auto [animation-fill-mode:forwards] motion-reduce:opacity-100" style={{ animationDelay: '0.1s' }}>
        {safeSubtitle}
      </p>

      {/* CTA - ShimmerButton que leva para planos */}
      {ctaLabel && (
        <div className="flex justify-center">
          <ShimmerButton
            type="button"
            background={GOGH_BLACK}
            shimmerColor="#F7C948"
            className="mt-[-20px] w-fit md:w-52 z-20 tracking-tighter text-center text-lg text-white border-[#0A0A0A]"
            onClick={() => router.push(ctaHref)}
          >
            <span className="relative z-10 whitespace-nowrap">{ctaLabel}</span>
          </ShimmerButton>
        </div>
      )}

      {/* World map - efeito abaixo do texto (só o mapa, sem texto do demo) */}
      <div className="mt-6 md:mt-12 w-full max-w-4xl mx-auto px-0 opacity-0 [animation-fill-mode:forwards] animate-fade-in-up motion-reduce:opacity-100" style={{ animationDelay: '0.2s' }}>
        <WorldMap
          theme="light"
          lineColor="#F7C948"
          dots={[
            { start: { lat: 64.2, lng: -149.5 }, end: { lat: 34.05, lng: -118.24 } },
            { start: { lat: 64.2, lng: -149.5 }, end: { lat: -15.8, lng: -47.9 } },
            { start: { lat: -15.8, lng: -47.9 }, end: { lat: 38.72, lng: -9.14 } },
            { start: { lat: 51.51, lng: -0.13 }, end: { lat: 28.61, lng: 77.21 } },
            { start: { lat: 28.61, lng: 77.21 }, end: { lat: -1.29, lng: 36.82 } },
          ]}
        />
      </div>

      {/* Bottom Fade */}
      <div
        className="animate-fade-up relative mt-6 lg:mt-16 opacity-0 [perspective:2000px] after:absolute after:inset-0 after:z-50 after:[background:linear-gradient(to_top,#F5F1E8_10%,transparent)] dark:after:[background:linear-gradient(to_top,hsl(var(--background))_10%,transparent)]"
      />
    </section>
  )
}
