import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
          <div className="text-6xl mb-4">😕</div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Página Não Encontrada</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Desculpe, não conseguimos encontrar a página que você está procurando.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">
              <Home size={20} className="mr-2" />
              Voltar ao Início
            </Button>
          </Link>
          <Link href="/produtos">
            <Button variant="outline" size="lg">
              <Search size={20} className="mr-2" />
              Ver Produtos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

