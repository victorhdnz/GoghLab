/**
 * Tipos para a página detalhada de serviços
 */

export interface ServiceDetailContent {
  // Hero Section
  hero_enabled?: boolean
  hero_video_url?: string
  hero_video_autoplay?: boolean
  hero_title?: string
  hero_title_highlight?: string // Palavra para destacar
  hero_title_highlight_color?: string // Cor da palavra destacada
  hero_subtitle?: string

  // O que você receberá
  benefits_enabled?: boolean
  benefits_title?: string
  benefits_items?: BenefitItem[]

  // Ganhe esses presentes
  gifts_enabled?: boolean
  gifts_title?: string
  gifts_items?: GiftItem[]

  // Layout alternado (conteúdo explicativo)
  alternate_content_enabled?: boolean
  alternate_content_items?: AlternateContentItem[]

  // Quem somos nós
  about_enabled?: boolean
  about_title?: string
  about_image?: string
  about_text?: string

  // Depoimentos
  testimonials_enabled?: boolean
  testimonials_title?: string
  testimonials_stats?: string // Ex: "Mais de 60 clientes satisfeitos"

  // CTA Final
  cta_enabled?: boolean
  cta_title?: string
  cta_description?: string
  cta_whatsapp_enabled?: boolean
  cta_whatsapp_number?: string
  cta_whatsapp_text?: string
  cta_email_enabled?: boolean
  cta_email_address?: string
  cta_email_text?: string
  cta_instagram_enabled?: boolean
  cta_instagram_url?: string
  cta_instagram_text?: string

  // Botão Flutuante do WhatsApp
  whatsapp_float_enabled?: boolean
  whatsapp_float_number?: string
  whatsapp_float_message?: string

  // Ordem e visibilidade
  section_order?: string[]
  section_visibility?: Record<string, boolean>
}

export interface BenefitItem {
  id: string
  title: string
  description?: string
  icon?: string // Emoji ou URL de imagem
}

export interface GiftItem {
  id: string
  title: string
  description?: string
  image?: string
  badge_text?: string // Texto do badge glassmorphism
}

export interface AlternateContentItem {
  id: string
  position: 'left' | 'right' // Posição do conteúdo
  title?: string
  title_highlight?: string
  title_highlight_color?: string
  description?: string
  image?: string
  image_position?: 'left' | 'right'
}

