'use client'

import { useEffect, useState } from 'react'
import { FadeInSection } from './FadeInSection'

interface TermsContentProps {
  termKey: string
  defaultTitle: string
  defaultContent: string
  cachedContent?: string
}

export const TermsContent = ({ termKey, defaultTitle, defaultContent, cachedContent }: TermsContentProps) => {
  const [title, setTitle] = useState(defaultTitle)
  const [content, setContent] = useState(cachedContent || defaultContent)
  const [loading, setLoading] = useState(!cachedContent) // Se já tem conteúdo em cache, não precisa carregar

  useEffect(() => {
    // Se já temos conteúdo em cache, usar diretamente
    if (cachedContent) {
      setContent(cachedContent)
      setLoading(false)
      return
    }

    // Caso contrário, carregar da API
    const loadTerm = async () => {
      try {
        // Usar API com cache (5 minutos)
        const response = await fetch('/api/terms', {
          next: { revalidate: 300 } // Cache de 5 minutos
        })
        
        if (!response.ok) {
          throw new Error('Erro ao carregar termo')
        }
        
        const result = await response.json()
        
        if (result.success && result.terms) {
          const term = result.terms.find((t: any) => t.key === termKey)
          if (term) {
            setTitle(term.title || defaultTitle)
            setContent(term.content || defaultContent)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar termo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTerm()
  }, [termKey, defaultTitle, defaultContent, cachedContent])

  // Função para converter Markdown simples para HTML
  const formatContent = (text: string) => {
    if (!text) return []

    const blocks: Array<{ type: string; text?: string; items?: string[]; key: string }> = []
    const lines = text.split('\n')
    let currentParagraph: string[] = []
    let currentList: string[] = []

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim()
        if (text) {
          blocks.push({ type: 'p', text, key: `p-${blocks.length}` })
        }
        currentParagraph = []
      }
    }

    const flushList = () => {
      if (currentList.length > 0) {
        blocks.push({ type: 'ul', items: currentList, key: `ul-${blocks.length}` })
        currentList = []
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) {
        flushParagraph()
        flushList()
        continue
      }

      // Verificar se é um título
      if (line.startsWith('#')) {
        flushParagraph()
        flushList()
        const level = line.match(/^#+/)?.[0]?.length || 1
        const text = line.replace(/^#+\s*/, '').trim()
        const type = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
        blocks.push({ type, text, key: `${type}-${blocks.length}` })
        continue
      }

      // Verificar se é uma lista
      if (line.startsWith('-') || line.startsWith('*')) {
        flushParagraph()
        const item = line.replace(/^[-*]\s+/, '').trim()
        // Processar negrito (**texto**)
        currentList.push(item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))
        continue
      }

      // Verificar se é negrito (**texto**)
      if (line.includes('**')) {
        flushList()
        currentParagraph.push(line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))
        continue
      }

      // Parágrafo normal
      flushList()
      currentParagraph.push(line)
    }

    flushParagraph()
    flushList()

    return blocks
  }

  if (loading) {
    return (
      <FadeInSection>
        <div className="min-h-screen bg-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>
    )
  }

  const formattedContent = formatContent(content)

  return (
    <FadeInSection>
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">{title}</h1>
          <div className="w-24 h-1 bg-black mb-12" />
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            {formattedContent.map((item) => {
              if (item.type === 'h1') {
                return (
                  <h1 key={item.key} className="text-3xl font-bold mb-4 mt-8">
                    {item.text}
                  </h1>
                )
              } else if (item.type === 'h2') {
                return (
                  <h2 key={item.key} className="text-2xl font-bold mb-4 mt-6">
                    {item.text}
                  </h2>
                )
              } else if (item.type === 'h3') {
                return (
                  <h3 key={item.key} className="text-xl font-bold mb-3 mt-4">
                    {item.text}
                  </h3>
                )
              } else if (item.type === 'ul') {
                return (
                  <ul key={item.key} className="list-disc pl-6 space-y-2">
                    {item.items?.map((listItem, idx) => (
                      <li key={idx} dangerouslySetInnerHTML={{ __html: listItem }} />
                    ))}
                  </ul>
                )
              } else {
                return (
                  <p 
                    key={item.key} 
                    className="mb-4 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.text || '' }}
                  />
                )
              }
            })}
          </div>
        </div>
      </div>
    </FadeInSection>
  )
}

