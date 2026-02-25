import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PageTransition } from '@/components/layout/PageTransition'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { ScrollEnabler } from '@/components/layout/ScrollEnabler'
import { PurchaseNotificationGlobal } from '@/components/layout/PurchaseNotificationGlobal'
import { ContentStatusNotificationsGlobal } from '@/components/layout/ContentStatusNotificationsGlobal'
import { Toaster } from 'react-hot-toast'
import { getSiteUrl } from '@/lib/utils/siteUrl'
import { createServerClient } from '@/lib/supabase/server'
import { NotFoundProvider } from '@/contexts/NotFoundContext'
import { Providers } from '@/components/providers/Providers'
import { MetaPixelWrapper } from '@/components/analytics/MetaPixelWrapper'
import { JsonLd } from '@/components/seo/JsonLd'

const inter = Inter({ subsets: ['latin'] })

// Função para buscar descrição do site do banco de dados
async function getSiteDescription(): Promise<string> {
  try {
    const supabase = createServerClient()
    type SiteSettingsData = {
      site_description: string | null
      site_name: string | null
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('site_description, site_name')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dataTyped = data as SiteSettingsData | null

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar descrição do site:', error)
      // Tentar buscar qualquer registro como fallback
      const { data: fallbackData } = await supabase
        .from('site_settings')
        .select('site_description, site_name')
        .limit(1)
        .maybeSingle()

      const fallbackDataTyped = fallbackData as SiteSettingsData | null

      if (fallbackDataTyped?.site_description) {
        return fallbackDataTyped.site_description
      }
    }

    if (dataTyped?.site_description) {
      return dataTyped.site_description
    }
  } catch (error) {
    console.error('Erro ao buscar descrição do site:', error)
  }

  // Descrição padrão caso não encontre no banco
  return 'Planejamento de conteúdo com IA: agenda de vídeos, roteiros, legendas e hashtags para creators e empresas.'
}

// Função para buscar nome do site do banco de dados
async function getSiteName(): Promise<string> {
  try {
    const supabase = createServerClient()
    type SiteSettingsData = {
      site_name: string | null
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('site_name')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dataTyped = data as SiteSettingsData | null

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar nome do site:', error)
      // Tentar buscar qualquer registro como fallback
      const { data: fallbackData } = await supabase
        .from('site_settings')
        .select('site_name')
        .limit(1)
        .maybeSingle()

      const fallbackDataTyped = fallbackData as SiteSettingsData | null

      if (fallbackDataTyped?.site_name) {
        return fallbackDataTyped.site_name
      }
    }

    if (dataTyped?.site_name) {
      return dataTyped.site_name
    }
  } catch (error) {
    console.error('Erro ao buscar nome do site:', error)
  }

  // Nome padrão caso não encontre no banco
  return 'Gogh Lab'
}

// Função para buscar título do site do banco de dados
async function getSiteTitle(): Promise<string | null> {
  try {
    const supabase = createServerClient()
    type SiteSettingsData = {
      site_title: string | null
      site_name: string | null
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('site_title, site_name')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dataTyped = data as SiteSettingsData | null

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar título do site:', error)
      // Tentar buscar qualquer registro como fallback
      const { data: fallbackData } = await supabase
        .from('site_settings')
        .select('site_title, site_name')
        .limit(1)
        .maybeSingle()

      const fallbackDataTyped = fallbackData as SiteSettingsData | null

      if (fallbackDataTyped?.site_title) {
        return fallbackDataTyped.site_title
      }
      // Se não tiver site_title, usar site_name + sufixo
      if (fallbackDataTyped?.site_name) {
        return `${fallbackDataTyped.site_name} - Planejamento e criação de conteúdo com IA`
      }
    }

    if (dataTyped?.site_title) {
      return dataTyped.site_title
    }
    // Se não tiver site_title, usar site_name + sufixo padrão
    if (dataTyped?.site_name) {
      return `${dataTyped.site_name} - Planejamento e criação de conteúdo com IA`
    }
  } catch (error) {
    console.error('Erro ao buscar título do site:', error)
  }

  return 'Gogh Lab - Planejamento e criação de conteúdo com IA'
}

// Função para buscar logo do site do banco de dados
async function getSiteLogo(): Promise<string | null> {
  try {
    const supabase = createServerClient()
    type SiteSettingsData = {
      site_logo: string | null
      homepage_content: any
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('site_logo, homepage_content')
      .eq('key', 'general')
      .maybeSingle()

    const dataTyped = data as SiteSettingsData | null

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar logo do site:', error)
      return null
    }

    if (dataTyped) {
      // Priorizar site_logo, mas usar hero_logo como fallback
      let logo = dataTyped.site_logo
      if (!logo && dataTyped.homepage_content && typeof dataTyped.homepage_content === 'object') {
        logo = (dataTyped.homepage_content as any)?.hero_logo || null
      }
      return logo
    }
  } catch (error) {
    console.error('Erro ao buscar logo do site:', error)
  }

  return null
}

// Gerar metadata dinamicamente com dados do banco
export async function generateMetadata(): Promise<Metadata> {
  const siteDescription = await getSiteDescription()
  const siteName = await getSiteName()
  const siteTitle = await getSiteTitle() || `${siteName} - Criatividade guiada por tecnologia`
  const siteUrl = getSiteUrl()
  const siteLogo = await getSiteLogo()

  // Construir array de ícones - usar logo do banco se disponível
  const iconArray: Array<{ url: string; sizes?: string; type?: string }> = []

  if (siteLogo) {
    // Usar logo do banco de dados como ícone principal
    iconArray.push({ url: siteLogo, sizes: 'any' })
    iconArray.push({ url: siteLogo, sizes: '16x16', type: 'image/png' })
    iconArray.push({ url: siteLogo, sizes: '32x32', type: 'image/png' })
  } else {
    // Fallback para arquivos estáticos se não houver logo no banco
    iconArray.push({ url: '/favicon.ico', sizes: 'any' })
    iconArray.push({ url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' })
    iconArray.push({ url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' })
  }

  // Apple Touch Icon - sempre usar logo do banco se disponível (importante para Safari)
  const appleIconArray = siteLogo
    ? [{ url: siteLogo, sizes: '180x180', type: 'image/png' }]
    : [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }]

  return {
    metadataBase: new URL(siteUrl),
    title: siteTitle,
    description: siteDescription,
    alternates: { canonical: siteUrl },
    keywords: [
      'Gogh Lab',
      siteName,
      'planejamento de conteúdo',
      'agenda de conteúdo',
      'calendário editorial',
      'roteiro de vídeo',
      'legenda para Instagram',
      'hashtags para redes sociais',
      'inteligência artificial',
      'IA para creators',
      'IA para marketing',
      'cursos de edição',
      'Canva Pro',
      'CapCut Pro',
      'ferramentas de criação',
      'plataforma de conteúdo',
      'marketing digital',
      'redes sociais',
      'assinatura mensal',
      'plano essencial',
      'plano pro',
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      type: 'website',
      locale: 'pt_BR',
      siteName: siteName,
      url: siteUrl,
      images: siteLogo
        ? [
            {
              url: siteLogo,
              width: 1200,
              height: 630,
              alt: siteTitle,
            },
          ]
        : [
            {
              url: `${siteUrl}/og-image.jpg`,
              width: 1200,
              height: 630,
              alt: siteTitle,
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: siteLogo ? [siteLogo] : [`${siteUrl}/og-image.jpg`],
    },
    icons: {
      icon: iconArray,
      apple: appleIconArray,
    },
    manifest: '/manifest.json',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [siteLogo, siteName] = await Promise.all([getSiteLogo(), getSiteName()])
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <JsonLd />
        <MetaPixelWrapper />
        <ScrollEnabler />
        <Providers>
          <NotFoundProvider>
            <ConditionalLayout initialSiteLogo={siteLogo ?? undefined} initialSiteName={siteName ?? undefined}>
              <PurchaseNotificationGlobal />
              <ContentStatusNotificationsGlobal />
              <PageTransition>
                <main className="relative">
                  {children}
                </main>
              </PageTransition>
            </ConditionalLayout>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 2000,
                style: {
                  background: '#000',
                  color: '#fff',
                },
              }}
            />
          </NotFoundProvider>
        </Providers>
      </body>
    </html>
  )
}
