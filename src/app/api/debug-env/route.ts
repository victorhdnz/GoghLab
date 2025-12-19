import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configurado' : 'não configurado',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configurado' : 'não configurado',
    supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configurado' : 'não configurado',
    url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  })
}