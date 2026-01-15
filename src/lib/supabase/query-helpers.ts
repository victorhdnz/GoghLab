/**
 * Helpers para queries do Supabase com timeout e tratamento de erro
 */

export interface QueryOptions {
  timeout?: number // Timeout em milissegundos (padrão: 5000ms)
  defaultValue?: any // Valor padrão em caso de erro ou timeout
}

/**
 * Executa uma query do Supabase com timeout
 */
export async function queryWithTimeout<T>(
  queryPromise: Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const { timeout = 5000, defaultValue = null } = options

  try {
    const timeoutPromise = new Promise<{ data: T | null; error: { message: string } }>((resolve) => {
      setTimeout(() => {
        resolve({ data: defaultValue, error: { message: 'Query timeout' } })
      }, timeout)
    })

    const result = await Promise.race([queryPromise, timeoutPromise])
    return result
  } catch (error: any) {
    console.error('Erro na query com timeout:', error)
    return { data: defaultValue, error: { message: error.message || 'Erro desconhecido' } }
  }
}

/**
 * Valores padrão para site_settings
 */
export const DEFAULT_SITE_SETTINGS = {
  site_name: 'Gogh Lab',
  site_description: 'Plataforma inteligente e autônoma baseada em agentes de IA',
  contact_email: 'contato.goghlab@gmail.com',
  contact_whatsapp: null,
  instagram_url: null,
  site_logo: null,
  homepage_content: {}
}

