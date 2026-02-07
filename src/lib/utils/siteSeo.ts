/**
 * Dados do site para SEO (metadata e JSON-LD).
 * Usado no layout e em componentes de structured data.
 */

import { createServerClient } from '@/lib/supabase/server'
import { getSiteUrl } from './siteUrl'

export interface SiteSeoData {
  name: string
  title: string
  description: string
  url: string
  logo: string | null
  instagramUrl: string | null
  contactEmail: string | null
}

export async function getSiteSeoData(): Promise<SiteSeoData> {
  const supabase = createServerClient()
  const siteUrl = getSiteUrl()

  type Row = {
    site_name: string | null
    site_title: string | null
    site_description: string | null
    site_logo: string | null
    instagram_url: string | null
    contact_email: string | null
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('site_name, site_title, site_description, site_logo, instagram_url, contact_email')
    .eq('key', 'general')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const row = data as Row | null

  if (error && error.code !== 'PGRST116') {
    console.error('[siteSeo] Erro ao buscar site_settings:', error)
  }

  const name = row?.site_name || 'Gogh Lab'
  const title = row?.site_title || `${name} - Criatividade guiada por tecnologia`
  const description =
    row?.site_description ||
    'Plataforma com agentes de IA, cursos de edição, ferramentas (Canva, CapCut) e prompts para criação de conteúdo. Assinatura com tudo incluso.'
  const logo = row?.site_logo || null
  const instagramUrl = row?.instagram_url || null
  const contactEmail = row?.contact_email || null

  return {
    name,
    title,
    description,
    url: siteUrl,
    logo,
    instagramUrl,
    contactEmail,
  }
}
