import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'
import { MainBackground } from '@/components/layout/MainBackground'
import { ConditionalWhatsAppFloat } from '@/components/layout/ConditionalWhatsAppFloat'
import { Toaster } from 'react-hot-toast'
import { getSiteUrl } from '@/lib/utils/siteUrl'
import { createServerClient } from '@/lib/supabase/server'
import { NotFoundProvider } from '@/contexts/NotFoundContext'

const inter = Inter({ subsets: ['latin'] })

// Função para buscar descrição do site do banco de dados
async function getSiteDescription(): Promise<string> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('site_description, site_name')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar descrição do site:', error)
      // Tentar buscar qualquer registro como fallback
      const { data: fallbackData } = await supabase
        .from('site_settings')
        .select('site_description, site_name')
        .limit(1)
        .maybeSingle()

      if (fallbackData?.site_description) {
        return fallbackData.site_description
      }
    }

    if (data?.site_description) {
      return data.site_description
    }
  } catch (error) {
    console.error('Erro ao buscar descrição do site:', error)
  }

  // Descrição padrão caso não encontre no banco
  return 'Toda sua gestão digital em um só lugar.'
}

// Função para buscar nome do site do banco de dados
async function getSiteName(): Promise<string> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('site_name')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar nome do site:', error)
      // Tentar buscar qualquer registro como fallback
      const { data: fallbackData } = await supabase
        .from('site_settings')
        .select('site_name')
        .limit(1)
        .maybeSingle()

      if (fallbackData?.site_name) {
        return fallbackData.site_name
      }
    }

    if (data?.site_name) {
      return data.site_name
    }
  } catch (error) {
    console.error('Erro ao buscar nome do site:', error)
  }

  // Nome padrão caso não encontre no banco
  return 'MV Company'
}

// Função para buscar título do site do banco de dados
async function getSiteTitle(): Promise<string | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('site_title, site_name')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar título do site:', error)
      // Tentar buscar qualquer registro como fallback
      const { data: fallbackData } = await supabase
        .from('site_settings')
        .select('site_title, site_name')
        .limit(1)
        .maybeSingle()

      if (fallbackData?.site_title) {
        return fallbackData.site_title
      }
      // Se não tiver site_title, usar site_name + sufixo
      if (fallbackData?.site_name) {
        return `${fallbackData.site_name} - Toda sua gestão digital em um só lugar.`
      }
    }

    if (data?.site_title) {
      return data.site_title
    }
    // Se não tiver site_title, usar site_name + sufixo
    if (data?.site_name) {
      return `${data.site_name} - Toda sua gestão digital em um só lugar.`
    }
  } catch (error) {
    console.error('Erro ao buscar título do site:', error)
  }

  return null
}

// Função para buscar logo do site do banco de dados
async function getSiteLogo(): Promise<string | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('site_logo, homepage_content')
      .eq('key', 'general')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar logo do site:', error)
      return null
    }

    if (data) {
      // Priorizar site_logo, mas usar hero_logo como fallback
      let logo = data.site_logo
      if (!logo && data.homepage_content && typeof data.homepage_content === 'object') {
        logo = (data.homepage_content as any)?.hero_logo || null
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
  const siteTitle = await getSiteTitle() || `${siteName} - Toda sua gestão digital em um só lugar.`
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
    keywords: ['serviços digitais', 'criação de sites', 'tráfego pago', 'marketing digital', 'gestão de redes sociais', 'MV Company', siteName],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NotFoundProvider>
          <MainBackground />
          <Header />
          <PageTransition>
            <main className="min-h-screen relative">
              {children}
            </main>
          </PageTransition>
          <Footer />
          <ConditionalWhatsAppFloat />
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
      </body>
    </html>
  )
}

