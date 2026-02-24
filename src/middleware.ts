import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Remove de vez a navegação/estrutura antiga de /membro.
  // Qualquer acesso legado é redirecionado para as rotas atuais.
  if (pathname.startsWith('/membro')) {
    const legacyMap: Record<string, string> = {
      '/membro': '/conta',
      '/membro/conta': '/conta',
      '/membro/cursos': '/cursos',
      '/membro/ferramentas': '/ferramentas',
      '/membro/planejamento': '/planejamento',
      '/membro/agentes': '/criar',
      '/membro/prompts': '/criar',
      '/membro/perfil': '/conta',
      '/membro/servicos': '/servicos',
    }

    const mappedPath =
      legacyMap[pathname] ||
      (pathname.startsWith('/membro/agentes/chat/') ? '/criar' : '/conta')

    const url = req.nextUrl.clone()
    url.pathname = mappedPath
    return NextResponse.redirect(url)
  }

  // Por enquanto, deixar apenas o cliente fazer a verificação
  // O middleware estava causando problemas de cookies na Vercel
  // A verificação no cliente (useAuth) já está funcionando corretamente
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/membro/:path*'],
}

