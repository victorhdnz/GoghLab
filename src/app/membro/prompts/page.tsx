'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Sparkles, Copy, Check, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface PromptCategory {
  id: string
  name: string
  slug: string
  order_position: number
}

interface Prompt {
  id: string
  category_id: string
  title: string
  content: string
  order_position: number
  category?: PromptCategory
}

export default function PromptsPage() {
  const { user, subscription, hasActiveSubscription } = useAuth()
  const [categories, setCategories] = useState<PromptCategory[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createClient()

  // Verificar se o plano inclui acesso a prompts (plan_products com product slug 'prompts')
  const [hasPromptAccess, setHasPromptAccess] = useState(false)

  useEffect(() => {
    const fetchAccessAndData = async () => {
      if (!user) return

      try {
        const planId = subscription?.plan_id || null
        if (!planId) {
          setHasPromptAccess(false)
          setLoading(false)
          return
        }

        // Verificar se o plano tem o produto "prompts" (via plan_products + products)
        const { data: planProducts } = await (supabase as any)
          .from('plan_products')
          .select(`
            product_id,
            products (
              slug
            )
          `)
          .eq('plan_id', planId)

        const hasPrompts = (Array.isArray(planProducts) && planProducts.some(
          (pp: any) => pp.products?.slug === 'prompts'
        )) ?? false
        setHasPromptAccess(hasActiveSubscription && !!hasPrompts)

        if (!hasPrompts) {
          setLoading(false)
          return
        }

        const { data: catsData } = await (supabase as any)
          .from('prompt_categories')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true })

        const { data: promptsData } = await (supabase as any)
          .from('prompts')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true })

        setCategories(catsData || [])
        setPrompts(promptsData || [])
        if (catsData?.length) setSelectedCategoryId(catsData[0].id)
      } catch (error) {
        console.error('Erro ao carregar prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccessAndData()
  }, [user, subscription, hasActiveSubscription, supabase])

  const filteredPrompts = selectedCategoryId
    ? prompts.filter((p) => p.category_id === selectedCategoryId)
    : prompts

  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopiedId(prompt.id)
      toast.success('Prompt copiado!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gogh-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando prompts...</p>
        </div>
      </div>
    )
  }

  if (!hasPromptAccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Sparkles className="w-16 h-16 text-gogh-yellow mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gogh-black mb-2">Prompts</h1>
        <p className="text-gogh-grayDark mb-6">
          O acesso à biblioteca de prompts está disponível no seu plano. Verifique sua assinatura ou faça upgrade para utilizar esta área.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
          Biblioteca de Prompts
        </h1>
        <p className="text-gogh-grayDark">
          Use estes prompts em qualquer ferramenta de IA. Clique para copiar.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gogh-grayDark" />
          <span className="text-sm text-gogh-grayDark">Categoria:</span>
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-gogh-yellow text-gogh-black'
                : 'bg-white border border-gogh-grayLight text-gogh-grayDark hover:border-gogh-yellow'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-gogh-yellow text-gogh-black'
                  : 'bg-white border border-gogh-grayLight text-gogh-grayDark hover:border-gogh-yellow'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gogh-grayLight">
            <Sparkles className="w-12 h-12 text-gogh-grayLight mx-auto mb-3" />
            <p className="text-gogh-grayDark">Nenhum prompt nesta categoria.</p>
          </div>
        ) : (
          filteredPrompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-gogh-grayLight p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gogh-black mb-2">
                    {prompt.title}
                  </h3>
                  <pre className="text-sm text-gogh-grayDark whitespace-pre-wrap font-sans overflow-x-auto">
                    {prompt.content}
                  </pre>
                </div>
                <button
                  onClick={() => handleCopy(prompt)}
                  className="flex-shrink-0 p-2 rounded-lg bg-gogh-yellow/20 text-gogh-black hover:bg-gogh-yellow transition-colors"
                  title="Copiar prompt"
                >
                  {copiedId === prompt.id ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
