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
  return 'MV Company - Prestadora de serviços digitais. Criação de sites, tráfego pago, criação de conteúdo e gestão de redes sociais.'
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
        return `${fallbackData.site_name} - Relógios Premium`
      }
    }

    if (data?.site_title) {
      return data.site_title
    }
    // Se não tiver site_title, usar site_name + sufixo
    if (data?.site_name) {
      return `${data.site_name} - Relógios Premium`
    }
  } catch (error) {
    console.error('Erro ao buscar título do site:', error)
  }

  return null
}

// Gerar metadata dinamicamente com dados do banco
export async function generateMetadata(): Promise<Metadata> {
  const siteDescription = await getSiteDescription()
  const siteName = await getSiteName()
  const siteTitle = await getSiteTitle() || `${siteName} - Serviços Digitais`
  const siteUrl = getSiteUrl()

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
      images: [
        {
          url: `${siteUrl}/og-image.jpg`, // Você pode adicionar uma imagem OG personalizada
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
      images: [`${siteUrl}/og-image.jpg`],
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
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
      </body>
    </html>
  )
}

