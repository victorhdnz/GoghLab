'use client'

import { cn } from "@/lib/utils"
import {
  IconScissors,
  IconPalette,
  IconRobot,
  IconSchool,
  IconBrandInstagram,
  IconSpeakerphone,
  IconVideo,
  IconSparkles,
  IconSettings,
  IconTarget,
} from "@tabler/icons-react"

// Mapeamento de string para componentes de ícone
const iconMap: Record<string, React.ReactNode> = {
  scissors: <IconScissors className="w-6 h-6" />,
  palette: <IconPalette className="w-6 h-6" />,
  robot: <IconRobot className="w-6 h-6" />,
  video: <IconVideo className="w-6 h-6" />,
  instagram: <IconBrandInstagram className="w-6 h-6" />,
  megaphone: <IconSpeakerphone className="w-6 h-6" />,
  school: <IconSchool className="w-6 h-6" />,
  sparkles: <IconSparkles className="w-6 h-6" />,
  settings: <IconSettings className="w-6 h-6" />,
  target: <IconTarget className="w-6 h-6" />,
}

export interface FeatureItem {
  title: string
  description: string
  icon: React.ReactNode | string
}

export interface FeatureItemData {
  id: string
  title: string
  description: string
  icon: string
}

const defaultFeatures: FeatureItemData[] = [
  {
    id: '1',
    title: "Acesso ao CapCut Pro",
    description: "Edite vídeos profissionais com todas as funcionalidades premium do CapCut incluídas na sua assinatura.",
    icon: 'scissors',
  },
  {
    id: '2',
    title: "Acesso ao Canva Pro",
    description: "Crie artes incríveis com acesso completo ao Canva Pro, templates exclusivos e recursos premium.",
    icon: 'palette',
  },
  {
    id: '3',
    title: "Agente de IA para Vídeos",
    description: "Crie roteiros, ganchos, ideias de takes e legendas para seus vídeos com inteligência artificial.",
    icon: 'video',
  },
  {
    id: '4',
    title: "Agente de IA para Redes Sociais",
    description: "Ideias de posts, legendas, hashtags e adaptação de linguagem para cada persona e público.",
    icon: 'instagram',
  },
  {
    id: '5',
    title: "Agente de IA para Anúncios",
    description: "Copies, criativos e direcionamento estratégico para Meta Ads, YouTube Ads, TikTok e Shopee.",
    icon: 'megaphone',
  },
  {
    id: '6',
    title: "Cursos de Edição Completos",
    description: "Aprenda edição de fotos e vídeos com cursos práticos e avançados de Canva e CapCut.",
    icon: 'school',
  },
  {
    id: '7',
    title: "Agentes Treinados para Seu Nicho",
    description: "Os agentes aprendem sobre seu negócio e criam conteúdo personalizado para sua audiência.",
    icon: 'settings',
  },
  {
    id: '8',
    title: "Crie com Autonomia Total",
    description: "Faça sozinho o que antes dependia de social media, editor ou gestor de tráfego.",
    icon: 'sparkles',
  },
]

interface FeaturesSectionWithHoverEffectsProps {
  features?: FeatureItemData[]
  title?: string
  subtitle?: string
  className?: string
}

export function FeaturesSectionWithHoverEffects({
  features = defaultFeatures,
  title = "O que oferecemos",
  subtitle = "Ferramentas profissionais, agentes de IA e cursos completos para transformar sua presença digital",
  className,
}: FeaturesSectionWithHoverEffectsProps) {
  return (
    <section className={cn("py-16 md:py-24 px-4 bg-gogh-beige", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gogh-black mb-4">
            {title}
          </h2>
          <p className="text-lg text-gogh-grayDark max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10">
          {features.map((feature, index) => (
            <Feature 
              key={feature.id || feature.title} 
              title={feature.title}
              description={feature.description}
              icon={typeof feature.icon === 'string' ? iconMap[feature.icon] || <IconSparkles className="w-6 h-6" /> : feature.icon}
              index={index} 
            />
          ))}
        </div>
      </div>
    </section>
  )
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: { title: string; description: string; icon: React.ReactNode; index: number }) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-gogh-yellow/30",
        (index === 0 || index === 4) && "lg:border-l border-gogh-yellow/30",
        index < 4 && "lg:border-b border-gogh-yellow/30"
      )}
    >
      {/* Hover Effect - Gradient from bottom for top row */}
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-gogh-yellow/20 to-transparent pointer-events-none" />
      )}
      {/* Hover Effect - Gradient from top for bottom row */}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-gogh-yellow/20 to-transparent pointer-events-none" />
      )}
      
      {/* Icon */}
      <div className="mb-4 relative z-10 px-10 text-gogh-yellow-dark group-hover/feature:text-gogh-yellow transition-colors duration-200">
        {icon}
      </div>
      
      {/* Title with animated bar */}
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-gogh-yellow/50 group-hover/feature:bg-gogh-yellow transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-gogh-black">
          {title}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gogh-grayDark max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  )
}

export default FeaturesSectionWithHoverEffects

