'use client'

import { Awards } from "@/components/ui/award"
import { FadeInElement } from "@/components/ui/FadeInElement"
import { cn } from "@/lib/utils"

export interface AwardSectionProps {
  className?: string
  variant?: "standalone" | "alongside-video"
  // Dados editáveis da medalha
  title?: string
  subtitle?: string
  recipient?: string
  date?: string
  level?: 'bronze' | 'silver' | 'gold' | 'platinum'
  // Dados da seção standalone
  standaloneTitle?: string
  standaloneDescription?: string
}

export function AwardSection({ 
  className, 
  variant = "standalone",
  title = "PIONEIROS",
  subtitle = "Plataforma Completa de IA para Criadores",
  recipient = "Gogh Lab",
  date = "Brasil 2025",
  level = "gold",
  standaloneTitle = "Primeira plataforma do Brasil",
  standaloneDescription = "A Gogh Lab é pioneira em oferecer uma solução completa com agentes de IA, cursos profissionais e acesso às melhores ferramentas de criação — tudo em uma única assinatura.",
}: AwardSectionProps) {
  if (variant === "alongside-video") {
    // Versão compacta para ficar ao lado do vídeo
    return (
      <FadeInElement delay={0.3}>
        <div className={cn("flex items-center justify-center", className)}>
          <Awards
            variant="award"
            title={title}
            subtitle={subtitle}
            recipient={recipient}
            date={date}
            level={level}
            className="scale-75 md:scale-90"
          />
        </div>
      </FadeInElement>
    )
  }

  // Versão standalone (seção completa)
  return (
    <section className={cn("py-16 md:py-24 px-4 bg-gogh-beige", className)}>
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <FadeInElement>
            <div className="text-center md:text-left max-w-md">
              <h2 className="text-3xl md:text-4xl font-bold text-gogh-black mb-4">
                {standaloneTitle}
              </h2>
              <p className="text-gogh-grayDark text-lg">
                {standaloneDescription}
              </p>
            </div>
          </FadeInElement>
          
          <FadeInElement delay={0.2}>
            <Awards
              variant="award"
              title={title}
              subtitle={subtitle}
              recipient={recipient}
              date={date}
              level={level}
            />
          </FadeInElement>
        </div>
      </div>
    </section>
  )
}

export default AwardSection

