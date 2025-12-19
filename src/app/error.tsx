'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <AlertTriangle size={80} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-4xl font-bold mb-4">Algo deu errado!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Desculpe, ocorreu um erro inesperado.
          </p>
          {error.message && (
            <p className="text-sm text-gray-500 font-mono bg-gray-100 p-3 rounded-lg">
              {error.message}
            </p>
          )}
        </div>

        <Button onClick={reset} size="lg">
          <RefreshCw size={20} className="mr-2" />
          Tentar Novamente
        </Button>
      </div>
    </div>
  )
}

