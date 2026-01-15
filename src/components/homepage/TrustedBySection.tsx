'use client'

import React, { type SVGProps } from "react"
import { LogoCarousel } from "@/components/ui/logo-carousel"
import { GradientHeading } from "@/components/ui/gradient-heading"
import { FadeInElement } from "@/components/ui/FadeInElement"

// Ícone do Canva
function CanvaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" width={256} height={256} {...props}>
      <defs>
        <linearGradient id="canva-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7B2FF2" />
          <stop offset="50%" stopColor="#00C4CC" />
          <stop offset="100%" stopColor="#7B2FF2" />
        </linearGradient>
      </defs>
      <circle cx="128" cy="128" r="120" fill="url(#canva-gradient)" />
      <text x="128" y="145" textAnchor="middle" fill="white" fontSize="80" fontWeight="bold" fontFamily="Arial">C</text>
    </svg>
  )
}

// Ícone do CapCut (tesoura estilizada)
function CapCutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" width={256} height={256} {...props}>
      <rect width="256" height="256" rx="50" fill="#000" />
      <path d="M80 60 L176 128 L80 196 Z" fill="#fff" />
      <rect x="160" y="100" width="40" height="56" rx="8" fill="#fff" />
    </svg>
  )
}

// Ícone OpenAI
function OpenAIIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 260" width={256} height={260} {...props}>
      <path
        fill="#10A37F"
        d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z"
      />
    </svg>
  )
}

// Ícone Stripe
function StripeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 214" width={512} height={214} {...props}>
      <path
        fill="#635BFF"
        d="M512 110.08c0-36.409-17.636-65.138-51.342-65.138c-33.85 0-54.33 28.73-54.33 64.854c0 42.808 24.179 64.426 58.88 64.426c16.925 0 29.725-3.84 39.396-9.244v-28.445c-9.67 4.836-20.764 7.823-34.844 7.823c-13.796 0-26.027-4.836-27.591-21.618h69.547c0-1.85.284-9.245.284-12.658m-70.258-13.511c0-16.071 9.814-22.756 18.774-22.756c8.675 0 17.92 6.685 17.92 22.756zm-90.31-51.627c-13.939 0-22.899 6.542-27.876 11.094l-1.85-8.818h-31.288v165.83l35.555-7.537l.143-40.249c5.12 3.698 12.657 8.96 25.173 8.96c25.458 0 48.64-20.48 48.64-65.564c-.142-41.245-23.609-63.716-48.498-63.716"
      />
    </svg>
  )
}

// Ícone Google
function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 262" width={256} height={262} {...props}>
      <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
      <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
      <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" />
      <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
    </svg>
  )
}

// Ícone Make.com / n8n (automação)
function AutomationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" width={256} height={256} {...props}>
      <circle cx="128" cy="128" r="120" fill="#6B00F5" />
      <circle cx="80" cy="128" r="20" fill="#fff" />
      <circle cx="176" cy="128" r="20" fill="#fff" />
      <circle cx="128" cy="80" r="20" fill="#fff" />
      <circle cx="128" cy="176" r="20" fill="#fff" />
      <line x1="80" y1="128" x2="176" y2="128" stroke="#fff" strokeWidth="4" />
      <line x1="128" y1="80" x2="128" y2="176" stroke="#fff" strokeWidth="4" />
    </svg>
  )
}

// Ícone Meta (Facebook/Instagram)
function MetaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" width={256} height={256} {...props}>
      <defs>
        <linearGradient id="meta-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0064E0" />
          <stop offset="50%" stopColor="#0064E0" />
          <stop offset="100%" stopColor="#0064E0" />
        </linearGradient>
      </defs>
      <path
        fill="url(#meta-gradient)"
        d="M128 0C57.308 0 0 57.308 0 128s57.308 128 128 128 128-57.308 128-128S198.692 0 128 0zm58.808 178.667c-7.475 0-13.817-3.567-21.2-14.467l-35.008-51.8-35.008 51.8c-7.383 10.9-13.725 14.467-21.2 14.467-12.483 0-21.725-9.4-21.725-21.317 0-5.017 1.433-10.033 4.775-15.517l40.075-58.5-37.133-54.017c-3.817-5.483-5.717-11.433-5.717-17.383 0-11.917 9.242-21.317 21.725-21.317 7.475 0 13.817 3.567 21.2 14.467l32.008 47.133 32.008-47.133c7.383-10.9 13.725-14.467 21.2-14.467 12.483 0 21.725 9.4 21.725 21.317 0 5.95-1.9 11.9-5.717 17.383l-37.133 54.017 40.075 58.5c3.342 5.483 4.775 10.5 4.775 15.517 0 11.917-9.242 21.317-21.725 21.317z"
      />
    </svg>
  )
}

// Lista de logos padrão das plataformas (fallback quando não há logo customizada)
const defaultPlatformLogos: Record<string, { name: string; id: number; img: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  'Canva Pro': { name: "Canva Pro", id: 1, img: CanvaIcon },
  'CapCut Pro': { name: "CapCut Pro", id: 2, img: CapCutIcon },
  'OpenAI': { name: "OpenAI", id: 3, img: OpenAIIcon },
  'Stripe': { name: "Stripe", id: 4, img: StripeIcon },
  'Google': { name: "Google", id: 5, img: GoogleIcon },
  'Automação': { name: "Automação", id: 6, img: AutomationIcon },
  'Meta': { name: "Meta", id: 7, img: MetaIcon },
}

// Factory para criar componente de logo a partir de URL
function createImageLogoComponent(src: string, alt: string): React.ComponentType<SVGProps<SVGSVGElement>> {
  const ImageLogoComponent = (props: SVGProps<SVGSVGElement>) => (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-contain"
      {...(props as any)}
    />
  )
  ImageLogoComponent.displayName = `ImageLogo_${alt}`
  return ImageLogoComponent
}

// Factory para criar placeholder
function createPlaceholderComponent(name: string): React.ComponentType<SVGProps<SVGSVGElement>> {
  const PlaceholderComponent = (_props: SVGProps<SVGSVGElement>) => (
    <div className="w-full h-full flex items-center justify-center bg-gogh-beige-light rounded-lg border border-gogh-yellow/20">
      <span className="text-2xl font-bold text-gogh-yellow">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
  PlaceholderComponent.displayName = `Placeholder_${name}`
  return PlaceholderComponent
}

export interface TrustedByPlatform {
  id: string
  name: string
  logoUrl?: string
  enabled: boolean
}

interface TrustedBySectionProps {
  title?: string
  subtitle?: string
  platforms?: TrustedByPlatform[]
  className?: string
}

export function TrustedBySection({
  title = "Utilizamos as melhores ferramentas",
  subtitle = "Tecnologias de ponta para entregar resultados excepcionais",
  platforms,
  className,
}: TrustedBySectionProps) {
  // Construir lista de logos baseado nas plataformas
  const logosToShow = React.useMemo(() => {
    if (!platforms || platforms.length === 0) {
      // Se não há plataformas configuradas, usar os padrões
      return Object.values(defaultPlatformLogos)
    }

    return platforms
      .filter(p => p.enabled)
      .map((p, index) => {
        // Se tem logo customizada, usar ela
        if (p.logoUrl) {
          return {
            name: p.name,
            id: parseInt(p.id) || index + 100,
            img: createImageLogoComponent(p.logoUrl, p.name),
          }
        }
        // Se não tem logo customizada, tentar usar o padrão pelo nome
        if (defaultPlatformLogos[p.name]) {
          return defaultPlatformLogos[p.name]
        }
        // Se não tem nenhum, criar um placeholder
        return {
          name: p.name,
          id: parseInt(p.id) || index + 100,
          img: createPlaceholderComponent(p.name),
        }
      })
  }, [platforms])

  // Garantir que há pelo menos alguns logos para exibir
  const finalLogos = logosToShow.length > 0 ? logosToShow : Object.values(defaultPlatformLogos)

  return (
    <section className={`py-16 md:py-24 px-4 bg-gogh-beige ${className || ''}`}>
      <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center space-y-8">
        <div className="text-center">
          <FadeInElement>
            <GradientHeading variant="secondary" size="xs">
              {subtitle}
            </GradientHeading>
          </FadeInElement>
          <FadeInElement delay={0.1}>
            <GradientHeading size="lg" className="mt-2">
              {title}
            </GradientHeading>
          </FadeInElement>
        </div>

        <FadeInElement delay={0.2}>
          <LogoCarousel columnCount={Math.min(finalLogos.length, 4)} logos={finalLogos} />
        </FadeInElement>
      </div>
    </section>
  )
}

export default TrustedBySection

