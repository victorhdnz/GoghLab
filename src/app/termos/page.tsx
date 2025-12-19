'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FileText, Shield, Truck, RotateCcw, Loader2, ChevronRight } from 'lucide-react'
import { FadeInSection } from '@/components/ui/FadeInSection'
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
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
          const termsData = result.terms as Term[]
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
      <FadeInSection>
        <div className="min-h-screen bg-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Carregando termos...</p>
            </div>
          </div>
        </div>
      </FadeInSection>
    )
  }

  if (terms.length === 0) {
    return (
      <FadeInSection>
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
      </FadeInSection>
    )
  }

  return (
    <FadeInSection>
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Termos e Políticas</h1>
            <div className="w-24 h-1 bg-black mx-auto mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Acesse nossos termos, políticas e informações importantes sobre nossos serviços
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar lateral com lista de termos */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sticky top-4">
                <h3 className="font-bold text-lg mb-4">Termos Disponíveis</h3>
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
                            ? 'bg-black text-white shadow-lg'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md'
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
                  <TermsContent
                    termKey={selectedTerm}
                    defaultTitle={selectedTermData?.title || 'Termo'}
                    defaultContent={selectedTermData?.content || `# ${selectedTermData?.title || 'Termo'}\n\nConteúdo do termo aqui.`}
                    cachedContent={selectedTermData?.content}
                  />
                )
              })() : (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-gray-600">Selecione um termo para visualizar</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </FadeInSection>
  )
}
