import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Por enquanto, deixar apenas o cliente fazer a verificação
  // O middleware estava causando problemas de cookies na Vercel
  // A verificação no cliente (useAuth) já está funcionando corretamente
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}

