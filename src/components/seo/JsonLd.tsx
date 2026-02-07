import { getSiteSeoData } from '@/lib/utils/siteSeo'

/**
 * JSON-LD estruturado (Organization + WebSite) para Google e motores de busca/IA.
 * Melhora a exibição em resultados de pesquisa e entendimento por assistentes.
 */
export async function JsonLd() {
  const data = await getSiteSeoData()

  const sameAs: string[] = []
  if (data.instagramUrl) sameAs.push(data.instagramUrl)

  const orgId = `${data.url}/#organization`

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId,
    name: data.name,
    url: data.url,
    description: data.description,
    ...(data.logo && { logo: data.logo }),
    ...(data.contactEmail && { email: data.contactEmail }),
    ...(sameAs.length > 0 && { sameAs }),
  }

  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    description: data.description,
    publisher: { '@id': orgId },
    inLanguage: 'pt-BR',
  }

  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: data.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: data.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
  }

  const jsonLd = [organization, webSite, softwareApp]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
