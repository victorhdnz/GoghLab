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
  standaloneDescription = "O Gogh Lab é pioneira em oferecer uma solução completa com agentes de IA, cursos profissionais e acesso às melhores ferramentas de criação — tudo em uma única assinatura.",
}: AwardSectionProps) {
  if (variant === "alongside-video") {
    // Versão compacta para ficar ao lado do vídeo
    return (
      <FadeInElement delay={0.3}>
        <div className={cn("flex items-center justify-center overflow-hidden", className)}>
          <div className="scale-70 md:scale-85">
            <Awards
              variant="award"
              title={title}
              subtitle={subtitle}
              recipient={recipient}
              date={date}
              level={level}
            />
          </div>
        </div>
      </FadeInElement>
    )
  }

  // Versão standalone (seção completa) — tamanho normalizado para não cortar
  return (
    <section className={cn("py-8 md:py-12 px-4 bg-gogh-beige", className)}>
      <div className="container mx-auto max-w-4xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          <FadeInElement>
            <div className="text-center md:text-left max-w-md w-full min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-gogh-black mb-2 break-words">
                {standaloneTitle}
              </h2>
              <p className="text-gogh-grayDark text-sm md:text-base break-words">
                {standaloneDescription}
              </p>
            </div>
          </FadeInElement>
          
          <FadeInElement delay={0.2} className="flex-shrink-0 max-w-full overflow-hidden">
            <div className="scale-75 origin-center md:scale-90">
              <Awards
                variant="award"
                title={title}
                subtitle={subtitle}
                recipient={recipient}
                date={date}
                level={level}
              />
            </div>
          </FadeInElement>
        </div>
      </div>
    </section>
  )
}

export default AwardSection

