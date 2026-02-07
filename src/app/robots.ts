import { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/utils/siteUrl'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/membro/', '/minha-conta/', '/checkout/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

