'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { StarRating } from '@/components/ui/StarRating'

export default function NovoProduct() {
  const router = useRouter()
  const { isAuthenticated, isEditor } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [existingCategories, setExistingCategories] = useState<string[]>([])
  const [showCategoryList, setShowCategoryList] = useState(false)
  const [loadingSpecs, setLoadingSpecs] = useState(false)
  const [categoryTopics, setCategoryTopics] = useState<Array<{ topic_key: string; topic_label: string; topic_type: 'rating' | 'text' }>>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '', // Preço único
    category: '',
    slug: '',
    product_code: '',
    ecommerce_url: '', // URL do produto no e-commerce externo
    images: [] as string[],
    specifications: [] as { key: string; value: string }[],
    is_active: true,
  })
  const [linkedGifts, setLinkedGifts] = useState<string[]>([])

  // Carregar categorias existentes
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Carregar categorias dos produtos
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('category')
          .not('category', 'is', null)
          .neq('category', '')

        // Carregar categorias dos tópicos (mesmo que não existam produtos ainda)
        const { data: topicsData, error: topicsError } = await supabase
          .from('category_topics')
          .select('category_name')

        if (!productsError && productsData) {
          const productCategories = [...new Set(productsData.map((p: any) => p.category).filter(Boolean))] as string[]
          const topicCategories = topicsData ? [...new Set(topicsData.map((t: any) => t.category_name).filter(Boolean))] as string[] : []
          
          // Unir e remover duplicatas
          const allCategories = [...new Set([...productCategories, ...topicCategories])]
          setExistingCategories(allCategories.sort())
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }
    loadCategories()
  }, [])

  // Carregar tópicos pré-definidos da categoria quando categoria mudar
  useEffect(() => {
    const loadCategoryTopics = async () => {
      if (!formData.category) {
        setFormData(prev => ({ ...prev, specifications: [] }))
        return
      }

      setLoadingSpecs(true)
      try {
        // Carregar tópicos pré-definidos da categoria
        const { data: topicsData, error: topicsError } = await supabase
          .from('category_topics')
          .select('*')
          .eq('category_name', formData.category)
          .order('display_order', { ascending: true })

        if (!topicsError && topicsData && topicsData.length > 0) {
          // Armazenar tópicos da categoria
          setCategoryTopics(topicsData.map(topic => ({
            topic_key: topic.topic_key,
            topic_label: topic.topic_label,
            topic_type: topic.topic_type
          })))

          // Obter chaves dos tópicos da nova categoria
          const newTopicKeys = new Set(topicsData.map(t => t.topic_key))
          
          // Manter apenas valores existentes que ainda existem na nova categoria
          const existingSpecs = formData.specifications.filter(s => 
            s.key && newTopicKeys.has(s.key)
          )
          
          // Criar especificações para novos tópicos que não têm valor ainda
          const existingKeys = new Set(existingSpecs.map(s => s.key))
          const newSpecs = topicsData
            .filter(topic => !existingKeys.has(topic.topic_key))
            .map(topic => ({
              key: topic.topic_key,
              value: topic.topic_type === 'rating' ? '0' : ''
            }))

          // Combinar especificações existentes com novas
          const finalSpecs = [...existingSpecs, ...newSpecs]

          setFormData(prev => ({
            ...prev,
            specifications: finalSpecs
          }))
        } else {
          // Se não houver tópicos pré-definidos, limpar lista de tópicos
          setCategoryTopics([])
          setFormData(prev => ({ ...prev, specifications: [] }))
        }
      } catch (error) {
        console.error('Erro ao carregar tópicos da categoria:', error)
      } finally {
        setLoadingSpecs(false)
      }
    }

    loadCategoryTopics()
  }, [formData.category])

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: images
    }))
  }


  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome do produto')
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Preencha um preço válido')
      return
    }

    setLoading(true)
    try {
      // Garantir que o slug não está vazio
      const finalSlug = formData.slug || generateSlug(formData.name) || `produto-${Date.now()}`
      const price = parseFloat(formData.price)
      
      // Criar produto - usar campo price único
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description || null,
          short_description: formData.description ? formData.description.substring(0, 150) : null,
          price: price,
          category: formData.category || null,
          slug: finalSlug,
          product_code: formData.product_code || null,
          ecommerce_url: formData.ecommerce_url || null,
          images: formData.images.length > 0 ? formData.images : [],
          specifications: formData.specifications.length > 0 ? formData.specifications : [],
          is_active: formData.is_active,
        })
        .select()
        .single()

      if (productError) {
        console.error('Erro detalhado ao criar produto:', productError)
        
        // Mensagem mais específica para erro de coluna ausente
        if (productError.code === 'PGRST204') {
          if (productError.message?.includes('images')) {
            toast.error('Erro: Coluna "images" não encontrada na tabela products. Execute o SQL script "supabase/add_missing_product_columns.sql" no Supabase.')
          } else if (productError.message?.includes('product_code')) {
            toast.error('Erro: Coluna "product_code" não encontrada na tabela products. Execute o SQL script "supabase/add_missing_product_columns.sql" no Supabase.')
          } else {
            toast.error(`Erro: ${productError.message}. Verifique o console para mais detalhes.`)
          }
        } else {
          toast.error(productError.message || 'Erro ao criar produto. Verifique o console para mais detalhes.')
        }
        
        throw productError
      }

      // Não salvar mais em category_specifications - sistema de tópicos fixos removido

      toast.success('Produto criado com sucesso!')
      router.push('/dashboard/produtos')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast.error('Erro ao criar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <DashboardNavigation
          title="Novo Produto"
          subtitle="Preencha as informações do produto"
          backUrl="/dashboard/produtos"
          backLabel="Voltar aos Produtos"
        />

        <div className="flex justify-end mb-8">
          <Button onClick={handleSave} isLoading={loading} size="lg">
            <Save size={18} className="mr-2" />
            Salvar Produto
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Informações Básicas</h2>
              
              <div className="space-y-4">
                <Input
                  label="Nome do Produto *"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Relógio Smartwatch Premium"
                />

                <Input
                  label="URL do Produto no E-commerce"
                  value={formData.ecommerce_url}
                  onChange={(e) => setFormData({ ...formData, ecommerce_url: e.target.value })}
                  placeholder="https://seu-ecommerce.com.br/produto/exemplo"
                />
                <p className="text-xs text-gray-500 -mt-2">
                  Link direto para o produto no e-commerce. Será usado nos botões de redirecionamento.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categoria *
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value })
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Selecione uma categoria</option>
                        {existingCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição detalhada do produto..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preço *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="299.90"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preço único do produto (será usado para local e nacional)
                  </p>
                </div>
              </div>
            </div>

            {/* Imagens */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Imagens do Produto</h2>
              <ArrayImageManager
                value={formData.images}
                onChange={handleImagesChange}
                maxImages={10}
                label="Imagens"
                placeholder="Clique para fazer upload de uma imagem"
                cropType="square"
                aspectRatio={1}
                targetSize={{ width: 1080, height: 1080 }}
                recommendedDimensions="Imagens: 1080 x 1080px (Formato Quadrado)"
              />
            </div>

            {/* Tópicos de Classificação */}
            {categoryTopics.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Tópicos de Classificação</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Preencha os valores dos tópicos pré-definidos para esta categoria. Para editar os tópicos, acesse a página "Tópicos de Classificação".
                </p>
                
                <div className="space-y-4">
                  {categoryTopics.map((topic) => {
                    const spec = formData.specifications.find(s => s.key === topic.topic_key)
                    const value = spec?.value || (topic.topic_type === 'rating' ? '0' : '')
                    
                    return (
                      <div key={topic.topic_key} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-semibold text-gray-900">{topic.topic_label}</span>
                          {topic.topic_type === 'rating' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                              Estrelas
                            </span>
                          )}
                          {topic.topic_type === 'text' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Texto
                            </span>
                          )}
                        </div>
                        
                        {topic.topic_type === 'rating' ? (
                          <div className="flex items-center gap-4">
                            <StarRating
                              value={parseInt(value) || 0}
                              onChange={(rating) => {
                                const newSpecs = [...formData.specifications]
                                const existingIndex = newSpecs.findIndex(s => s.key === topic.topic_key)
                                
                                if (existingIndex >= 0) {
                                  newSpecs[existingIndex].value = rating.toString()
                                } else {
                                  newSpecs.push({ key: topic.topic_key, value: rating.toString() })
                                }
                                
                                setFormData({ ...formData, specifications: newSpecs })
                              }}
                              size={24}
                            />
                            <span className="text-sm text-gray-500">
                              {parseInt(value) || 0} de 5 estrelas
                            </span>
                          </div>
                        ) : (
                          <Input
                            placeholder={`Digite o valor para ${topic.topic_label.toLowerCase()}`}
                            value={value}
                            onChange={(e) => {
                              const newSpecs = [...formData.specifications]
                              const existingIndex = newSpecs.findIndex(s => s.key === topic.topic_key)
                              
                              if (existingIndex >= 0) {
                                newSpecs[existingIndex].value = e.target.value
                              } else {
                                newSpecs.push({ key: topic.topic_key, value: e.target.value })
                              }
                              
                              setFormData({ ...formData, specifications: newSpecs })
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Configurações */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Configurações</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>Produto Ativo</span>
                </label>
              </div>
            </div>

            {/* Botão Mobile */}
            <div className="lg:hidden">
              <Button onClick={handleSave} isLoading={loading} className="w-full" size="lg">
                <Save size={18} className="mr-2" />
                Salvar Produto
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

