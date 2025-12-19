'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'
import { createClient } from '@/lib/supabase/client'
import { Product, ProductColor } from '@/types'
import { formatCurrency } from '@/lib/utils/format'
import { ArrowLeft, Save, Plus, Trash2, Upload, Star, Eye, EyeOff } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'

interface EditProductPageProps {
  params: { id: string }
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingCategories, setExistingCategories] = useState<string[]>([])
  const [categoryTopics, setCategoryTopics] = useState<Array<{ topic_key: string; topic_label: string; topic_type: 'rating' | 'text' }>>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    product_code: '',
    ecommerce_url: '',
    is_active: true,
    is_featured: false,
    images: [] as string[],
    colors: [] as ProductColor[],
    specifications: [] as { key: string; value: string }[]
  })

  const supabase = createClient()

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
        setCategoryTopics([])
        return
      }

      try {
        const { data: topicsData, error: topicsError } = await supabase
          .from('category_topics')
          .select('*')
          .eq('category_name', formData.category)
          .order('display_order', { ascending: true })

        if (!topicsError && topicsData && topicsData.length > 0) {
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
          const newTopics = topicsData
            .filter(topic => !existingKeys.has(topic.topic_key))
            .map(topic => ({
              key: topic.topic_key,
              value: topic.topic_type === 'rating' ? '0' : ''
            }))

          // Combinar especificações existentes com novas
          const finalSpecs = [...existingSpecs, ...newTopics]

          setFormData(prev => ({
            ...prev,
            specifications: finalSpecs
          }))
        } else {
          setCategoryTopics([])
          // Se não houver tópicos pré-definidos, manter especificações existentes
          // (podem ser tópicos antigos que não foram migrados)
        }
      } catch (error) {
        console.error('Erro ao carregar tópicos da categoria:', error)
      }
    }

    loadCategoryTopics()
  }, [formData.category])

  useEffect(() => {
    let mounted = true

    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
      } else if (mounted) {
        loadProduct()
      }
    }

    return () => {
      mounted = false
    }
  }, [isAuthenticated, isEditor, authLoading, router, params.id])

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          colors:product_colors(*)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      if (data) {
        setProduct(data as Product)
        
        // Garantir que o campo images seja sempre um array válido
        let images = data.images || []
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images)
          } catch (e) {
            images = []
          }
        }
        if (!Array.isArray(images)) {
          images = []
        }
        
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: (data.price || data.local_price || data.national_price || 0)?.toString() || '',
          category: data.category || '',
          product_code: (data as any).product_code || '',
          ecommerce_url: (data as any).ecommerce_url || '',
          is_active: data.is_active ?? true,
          is_featured: data.is_featured ?? false,
          images: images,
          colors: data.colors || [],
          specifications: (data as any).specifications || []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error)
      toast.error('Erro ao carregar produto')
      router.push('/dashboard/produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório')
      return
    }

    setSaving(true)
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price) || 0,
        category: formData.category.trim(),
        product_code: formData.product_code.trim() || null,
        ecommerce_url: formData.ecommerce_url?.trim() || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        images: formData.images,
        specifications: formData.specifications,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id)

      if (error) throw error

      // Atualizar cores do produto
      if (formData.colors.length > 0) {
        // Deletar cores antigas
        await supabase
          .from('product_colors')
          .delete()
          .eq('product_id', params.id)

        // Inserir cores atualizadas
        const colorUpdates = formData.colors.map(color => ({
          product_id: params.id,
          color_name: color.color_name,
          color_hex: color.color_hex,
          stock: color.stock || 0,
          is_active: color.is_active !== undefined ? color.is_active : true,
          images: color.images || [],
        }))

        const { error: colorError } = await supabase
          .from('product_colors')
          .insert(colorUpdates)

        if (colorError) {
          console.error('Erro ao atualizar cores:', colorError)
          toast.error('Produto atualizado, mas houve erro ao atualizar as cores')
        }
      }

      toast.success('Produto atualizado com sucesso!')
      router.push('/dashboard/produtos')
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast.error('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: images
    }))
  }

  const handleColorAdd = () => {
    const name = prompt('Digite o nome da cor:')
    if (name && name.trim()) {
      const newColor: ProductColor = {
        id: Date.now().toString(),
        product_id: params.id,
        color_name: name.trim(),
        color_hex: '#000000',
        images: [],
        stock: 0,
        is_active: true
      }
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor]
      }))
    }
  }

  const handleColorRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
          <Link href="/dashboard/produtos">
            <Button>Voltar aos Produtos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <DashboardNavigation
          title="Editar Produto"
          subtitle="Atualize as informações do produto"
          backUrl="/dashboard/produtos"
          backLabel="Voltar aos Produtos"
        />

        <div className="flex justify-end gap-3 mb-8">
          <Button
            variant="outline"
            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={formData.is_active ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}
          >
            {formData.is_active ? <Eye size={18} className="mr-2" /> : <EyeOff size={18} className="mr-2" />}
            {formData.is_active ? 'Ativo' : 'Inativo'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
            className={formData.is_featured ? 'border-yellow-500 text-yellow-600' : ''}
          >
            <Star size={18} className="mr-2" />
            {formData.is_featured ? 'Em Destaque' : 'Destacar'}
          </Button>
          <Button onClick={handleSave} isLoading={saving} size="lg">
            <Save size={18} className="mr-2" />
            Salvar Alterações
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
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome do produto"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o produto..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <Input
                  label="URL do Produto no E-commerce"
                  value={formData.ecommerce_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, ecommerce_url: e.target.value }))}
                  placeholder="https://seu-ecommerce.com.br/produto/exemplo"
                />
                <p className="text-xs text-gray-500 -mt-2 mb-4">
                  Link direto para o produto no e-commerce. Será usado nos botões de redirecionamento.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, category: e.target.value }))
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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

            {/* Preços e Estoque */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Preços e Estoque</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Preço (R$) *"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
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

            {/* Cores */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Variações de Cor</h2>
                <Button variant="outline" onClick={handleColorAdd}>
                  <Plus size={18} className="mr-2" />
                  Adicionar Cor
                </Button>
              </div>

              <div className="space-y-3">
                {formData.colors.map((color, index) => (
                  <div key={color.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: color.color_hex }}
                      />
                      <Input
                        label="Nome da Cor"
                        value={color.color_name}
                        onChange={(e) => {
                          const newColors = [...formData.colors]
                          newColors[index] = { ...newColors[index], color_name: e.target.value }
                          setFormData({ ...formData, colors: newColors })
                        }}
                        placeholder="Nome da cor"
                        className="flex-1"
                      />
                      <div className="flex-shrink-0">
                        <label className="block text-sm font-medium mb-2">Cor</label>
                        <input
                          type="color"
                          value={color.color_hex}
                          onChange={(e) => {
                            const newColors = [...formData.colors]
                            newColors[index] = { ...newColors[index], color_hex: e.target.value }
                            setFormData({ ...formData, colors: newColors })
                          }}
                          className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <button
                        onClick={() => handleColorRemove(index)}
                        className="p-2 text-red-500 hover:text-red-700 self-end"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <Input
                      label="Estoque desta Cor"
                      type="number"
                      value={color.stock?.toString() || '0'}
                      onChange={(e) => {
                        const newColors = [...formData.colors]
                        newColors[index] = { ...newColors[index], stock: parseInt(e.target.value) || 0 }
                        setFormData({ ...formData, colors: newColors })
                      }}
                      placeholder="0"
                      className="max-w-xs"
                    />
                  </div>
                ))}
                
                {formData.colors.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Nenhuma variação de cor adicionada
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Preview</h3>
              
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                {formData.images[0] ? (
                  <img
                    src={formData.images[0]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    ⌚
                  </div>
                )}
              </div>

              <h4 className="font-bold text-lg mb-2">{formData.name || 'Nome do Produto'}</h4>
              <p className="text-gray-600 text-sm mb-4">{formData.description || 'Descrição do produto...'}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Preço:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(formData.price) || 0)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {formData.is_active ? 'Ativo' : 'Inativo'}
                </span>
                {formData.is_featured && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Destaque
                  </span>
                )}
              </div>
            </div>

            {/* Informações do Sistema */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Informações do Sistema</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-mono">{product.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Slug:</span>
                  <span className="ml-2 font-mono">{product.slug}</span>
                </div>

                <div>
                  <span className="text-gray-600">Criado em:</span>
                  <span className="ml-2">{new Date(product.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Atualizado em:</span>
                  <span className="ml-2">{new Date(product.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}