/** Tipos para Prompts de Criação (Criar com IA) – dashboard e página /criar */

export type CreationTabId = 'foto' | 'video' | 'roteiro' | 'prompts'

export const INPUT_STRUCTURES = [
  { value: 'text_only', label: 'Só texto (chat tradicional)' },
  { value: 'image_only', label: 'Só foto (upload de imagem)' },
  { value: 'video_only', label: 'Só vídeo (upload de vídeo)' },
  { value: 'image_and_video', label: 'Foto e vídeo' },
  { value: 'motion_video_and_character_photo', label: 'Vídeo de movimento + foto do personagem' },
] as const

export type InputStructureId = (typeof INPUT_STRUCTURES)[number]['value']

export interface CreationPromptItem {
  id: string
  tabId: CreationTabId
  title: string
  subtitle: string
  /** URL da imagem de capa (card e ref no topo) */
  coverImage: string
  /** URL do vídeo de capa (opcional; se preenchido, card pode mostrar vídeo) */
  coverVideo?: string
  /** Prompt enviado à IA (não exibido ao cliente) */
  prompt: string
  inputStructure: InputStructureId
  /** Custo em créditos para esta geração */
  creditCost: number
  order: number
}

export function creationPromptToCarouselItem(p: CreationPromptItem): {
  id: string
  type: 'image' | 'video'
  title: string
  summary: string
  image: string
  prompt?: string
  videoUrl?: string
} {
  return {
    id: p.id,
    type: p.coverVideo ? 'video' : 'image',
    title: p.title,
    summary: p.subtitle,
    image: p.coverImage,
    prompt: p.prompt || undefined,
    videoUrl: p.coverVideo,
  }
}
