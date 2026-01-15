export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl && envUrl.length > 0) {
    return envUrl.replace(/\/$/, '')
  }

  // Em produção Vercel, VERCEL_URL está disponível
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Em clientes, podemos usar a origem atual
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // Fallback para domínio personalizado (configurar NEXT_PUBLIC_SITE_URL na Vercel)
  return 'https://goghlab.com.br'
}

