import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Cliente Supabase com service_role para uso em API routes quando for necessário
 * bypass de RLS (ex.: insert/update em user_usage que o usuário não tem permissão).
 * Usar apenas no servidor; nunca expor a chave no client.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para o cliente admin.')
  }
  return createClient<Database>(url, key)
}
