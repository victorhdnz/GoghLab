'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Shield, Truck, RotateCcw, ChevronRight, ArrowLeft, Home } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { TermsContent } from '@/components/ui/TermsContent'

interface Term {
  id: string
  key: string
  title: string
  icon: string
  content?: string
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'shield':
      return Shield
    case 'file-text':
      return FileText
    case 'truck':
      return Truck
    case 'rotate-ccw':
      return RotateCcw
    default:
      return FileText
  }
}

export default function TermosPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Termos que devem ser mantidos (os novos e importantes)
  const allowedTerms = [
    'termos-login-google',
    'termos-assinatura-planos',
    'termos-uso',
    'politica-privacidade',
    'termos-servicos'
  ]

  const handleTermSelect = (termKey: string) => {
    setSelectedTerm(termKey)
    // Atualizar URL sem recarregar a página
    const newUrl = `/termos?termo=${termKey}`
    window.history.pushState({}, '', newUrl)
  }

  useEffect(() => {
    const loadTerms = async () => {
      try {
        // Usar API com cache (5 minutos)
        const response = await fetch('/api/terms', {
          next: { revalidate: 300 } // Cache de 5 minutos
        })
        
        if (!response.ok) {
          throw new Error('Erro ao carregar termos')
        }
        
        const result = await response.json()
        
        if (result.success && result.terms) {
          // Filtrar apenas termos permitidos (remover termos antigos)
          const termsData = (result.terms as Term[]).filter(term => 
            allowedTerms.includes(term.key)
          )
          setTerms(termsData)
          
          // Verificar se há um parâmetro de query para selecionar um termo específico
          const termFromQuery = searchParams.get('termo')
          if (termFromQuery) {
            // Verificar se o termo existe na lista
            const termExists = termsData.find(t => t.key === termFromQuery)
            if (termExists) {
              setSelectedTerm(termFromQuery)
            } else {
              // Se não encontrar, usar o primeiro termo
              setSelectedTerm(termsData[0]?.key || null)
            }
          } else {
            // Selecionar o primeiro termo automaticamente
            setSelectedTerm(termsData[0]?.key || null)
          }
        } else {
          setTerms([])
        }
      } catch (error) {
        console.error('Erro ao carregar termos:', error)
        setTerms([])
      } finally {
        setLoading(false)
      }
    }

    loadTerms()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center">
            <LumaSpin size="md" className="mx-auto mb-4" />
            <p className="text-gray-600">Carregando termos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (terms.length === 0) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Termos e Políticas</h1>
            <div className="w-24 h-1 bg-black mx-auto mb-6" />
            <p className="text-gray-600 text-lg">
              Nenhum termo disponível no momento.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige">
      {/* Header simples com botão de voltar */}
      <div className="bg-white border-b border-gogh-grayLight sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Verificar se há uma página anterior no histórico
                  if (window.history.length > 1) {
                    router.back()
                  } else {
                    router.push('/')
                  }
                }}
                className="flex items-center gap-2 text-gogh-grayDark hover:text-gogh-black transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 text-gogh-grayDark hover:text-gogh-black transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Homepage</span>
              </Link>
            </div>
            <Link href="/" className="text-xl font-bold text-gogh-black">
              Gogh Lab
            </Link>
          </div>
        </div>
      </div>

      <div className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gogh-black">Termos e Políticas</h1>
            <div className="w-24 h-1 bg-gogh-yellow mx-auto mb-6" />
            <p className="text-gogh-grayDark text-lg max-w-2xl mx-auto">
              Acesse nossos termos, políticas e informações importantes sobre nossos serviços
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar lateral com lista de termos */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white border-2 border-gogh-grayLight rounded-xl p-4 sticky top-20 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-gogh-black">Termos Disponíveis</h3>
                <nav className="space-y-2">
                  {terms.map((term) => {
                    const Icon = getIcon(term.icon)
                    const isActive = selectedTerm === term.key
                    return (
                      <button
                        key={term.id}
                        onClick={() => handleTermSelect(term.key)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                          isActive
                            ? 'bg-gogh-yellow text-gogh-black shadow-md'
                            : 'bg-gogh-grayLight hover:bg-gogh-yellow/20 text-gogh-grayDark hover:text-gogh-black'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm flex-1">{term.title}</span>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* Conteúdo do termo selecionado */}
            <main className="flex-1">
              {selectedTerm ? (() => {
                const selectedTermData = terms.find(t => t.key === selectedTerm)
                return (
                  <div className="bg-white border-2 border-gogh-grayLight rounded-xl shadow-sm overflow-hidden">
                    <TermsContent
                      termKey={selectedTerm}
                      defaultTitle={selectedTermData?.title || 'Termo'}
                      defaultContent={selectedTermData?.content || `# ${selectedTermData?.title || 'Termo'}\n\nConteúdo do termo aqui.`}
                      cachedContent={selectedTermData?.content}
                    />
                  </div>
                )
              })() : (
                <div className="bg-white border-2 border-gogh-grayLight rounded-xl p-8 text-center">
                  <p className="text-gogh-grayDark">Selecione um termo para visualizar</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
