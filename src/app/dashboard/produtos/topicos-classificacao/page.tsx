'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Plus, Trash2, Edit, Save, X, Star, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface CategoryTopic {
  id: string
  category_name: string
  topic_key: string
  topic_label: string
  topic_type: 'rating' | 'text'
  display_order: number
  created_at: string
  updated_at: string
}

export default function CategoryTopicsPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [topics, setTopics] = useState<CategoryTopic[]>([])
  const [editingTopic, setEditingTopic] = useState<CategoryTopic | null>(null)
  const [newTopic, setNewTopic] = useState({ key: '', label: '', type: 'rating' as 'rating' | 'text' })
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    loadCategories()
  }, [isAuthenticated, isEditor, authLoading, router])

  useEffect(() => {
    if (selectedCategory) {
      loadTopics()
    } else {
      setTopics([])
    }
  }, [selectedCategory])

  const loadCategories = async () => {
    try {
      // Carregar categorias dos produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)
        .neq('category', '')

      if (productsError) throw productsError

      // Carregar categorias dos tópicos (mesmo que não existam produtos ainda)
      const { data: topicsData, error: topicsError } = await supabase
        .from('category_topics')
        .select('category_name')

      if (topicsError) throw topicsError

      // Combinar ambas as listas
      const productCategories = Array.from(new Set(productsData?.map(p => p.category).filter(Boolean) || [])) as string[]
      const topicCategories = Array.from(new Set(topicsData?.map(t => t.category_name).filter(Boolean) || [])) as string[]
      
      // Unir e remover duplicatas
      const allCategories = Array.from(new Set([...productCategories, ...topicCategories]))
      
      setCategories(allCategories.sort())
      setLoading(false)
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
      setLoading(false)
    }
  }

  const loadTopics = async () => {
    if (!selectedCategory) return

    try {
      const { data, error } = await supabase
        .from('category_topics')
        .select('*')
        .eq('category_name', selectedCategory)
        .order('display_order', { ascending: true })

      if (error) throw error

      setTopics(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar tópicos:', error)
      toast.error('Erro ao carregar tópicos')
    }
  }

  const handleAddTopic = async () => {
    if (!selectedCategory) {
      toast.error('Selecione uma categoria primeiro')
      return
    }

    if (!newTopic.key.trim() || !newTopic.label.trim()) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      const { data, error } = await supabase
        .from('category_topics')
        .insert({
          category_name: selectedCategory,
          topic_key: newTopic.key.trim(),
          topic_label: newTopic.label.trim(),
          topic_type: newTopic.type,
          display_order: topics.length,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Tópico adicionado com sucesso!')
      setNewTopic({ key: '', label: '', type: 'rating' })
      loadTopics()
    } catch (error: any) {
      console.error('Erro ao adicionar tópico:', error)
      toast.error(error.message || 'Erro ao adicionar tópico')
    }
  }

  const handleEditTopic = (topic: CategoryTopic) => {
    setEditingTopic(topic)
  }

  const handleSaveEdit = async () => {
    if (!editingTopic) return

    if (!editingTopic.topic_key.trim() || !editingTopic.topic_label.trim()) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      const { error } = await supabase
        .from('category_topics')
        .update({
          topic_key: editingTopic.topic_key.trim(),
          topic_label: editingTopic.topic_label.trim(),
          topic_type: editingTopic.topic_type,
        })
        .eq('id', editingTopic.id)

      if (error) throw error

      toast.success('Tópico atualizado com sucesso!')
      setEditingTopic(null)
      loadTopics()
    } catch (error: any) {
      console.error('Erro ao atualizar tópico:', error)
      toast.error(error.message || 'Erro ao atualizar tópico')
    }
  }

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este tópico?')) return

    try {
      const { error } = await supabase
        .from('category_topics')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Tópico removido com sucesso!')
      loadTopics()
    } catch (error: any) {
      console.error('Erro ao remover tópico:', error)
      toast.error(error.message || 'Erro ao remover tópico')
    }
  }

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Digite o nome da categoria')
      return
    }

    const categoryName = newCategoryName.trim()
    
    // Verificar se a categoria já existe
    if (categories.includes(categoryName)) {
      toast.error('Esta categoria já existe')
      return
    }

    // Adicionar à lista de categorias
    const updatedCategories = [...categories, categoryName].sort()
    setCategories(updatedCategories)
    setSelectedCategory(categoryName)
    setShowNewCategoryInput(false)
    setNewCategoryName('')
    toast.success(`Categoria "${categoryName}" criada com sucesso! Agora você pode configurar os tópicos.`)
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) {
      toast.error('Selecione uma categoria primeiro')
      return
    }

    if (!confirm(`Tem certeza que deseja remover a categoria "${selectedCategory}" e todos os seus tópicos? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      // Deletar todos os tópicos da categoria
      const { error: topicsError } = await supabase
        .from('category_topics')
        .delete()
        .eq('category_name', selectedCategory)

      if (topicsError) throw topicsError

      // Remover da lista de categorias
      const updatedCategories = categories.filter(cat => cat !== selectedCategory)
      setCategories(updatedCategories)
      setSelectedCategory('')
      setTopics([])
      
      toast.success(`Categoria "${selectedCategory}" e todos os seus tópicos foram removidos com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao remover categoria:', error)
      toast.error(error.message || 'Erro ao remover categoria')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedCategory) return

    const items = Array.from(topics)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Atualizar display_order de todos os itens
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    setTopics(updatedItems)

    // Salvar a nova ordem no banco
    try {
      const updates = updatedItems.map((item, index) =>
        supabase
          .from('category_topics')
          .update({ display_order: index })
          .eq('id', item.id)
      )

      await Promise.all(updates.map(update => update.then(({ error }) => {
        if (error) throw error
      })))

      toast.success('Ordem dos tópicos atualizada!')
    } catch (error: any) {
      console.error('Erro ao salvar ordem dos tópicos:', error)
      toast.error('Erro ao salvar ordem dos tópicos')
      // Recarregar do banco em caso de erro
      loadTopics()
    }
  }

  const handleUpdateProductTopics = async () => {
    if (!selectedCategory) {
      toast.error('Selecione uma categoria primeiro')
      return
    }

    if (topics.length === 0) {
      toast.error('Não há tópicos para espelhar')
      return
    }

    if (!confirm(`Deseja atualizar os tópicos de todos os produtos da categoria "${selectedCategory}"? Isso adicionará apenas os novos tópicos, sem remover os existentes.`)) return

    try {
      // Buscar todos os produtos da categoria
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, specifications')
        .eq('category', selectedCategory)

      if (productsError) throw productsError

      if (!products || products.length === 0) {
        toast.error('Nenhum produto encontrado nesta categoria')
        return
      }

      let updated = 0
      for (const product of products) {
        const currentSpecs = (product.specifications as Array<{ key: string; value: string }>) || []
        const existingKeys = new Set(currentSpecs.map(s => s.key.trim().toLowerCase()))

        // Adicionar apenas tópicos que não existem
        const newSpecs = topics
          .filter(topic => !existingKeys.has(topic.topic_key.trim().toLowerCase()))
          .map(topic => ({
            key: topic.topic_key,
            value: topic.topic_type === 'rating' ? '0' : ''
          }))

        if (newSpecs.length > 0) {
          const updatedSpecs = [...currentSpecs, ...newSpecs]

          const { error: updateError } = await supabase
            .from('products')
            .update({ specifications: updatedSpecs })
            .eq('id', product.id)

          if (updateError) {
            console.error(`Erro ao atualizar produto ${product.id}:`, updateError)
            continue
          }

          updated++
        }
      }

      toast.success(`${updated} produto(s) atualizado(s) com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao atualizar produtos:', error)
      toast.error(error.message || 'Erro ao atualizar produtos')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DashboardNavigation
          title="Tópicos de Classificação por Categoria"
          subtitle="Gerencie os tópicos de classificação para cada categoria de produto"
          backUrl="/dashboard/produtos"
        />

        {/* Seleção de Categoria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Selecionar ou Criar Categoria</h2>
          
          {!showNewCategoryInput ? (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => {
                  setShowNewCategoryInput(true)
                  setNewCategoryName('')
                }}
                variant="outline"
              >
                <Plus size={18} className="mr-2" />
                Criar Nova Categoria
              </Button>
              {selectedCategory && (
                <Button
                  onClick={handleDeleteCategory}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 size={18} className="mr-2" />
                  Deletar Categoria
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    Nome da Nova Categoria
                  </label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Relógios Inteligentes"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCategoryName.trim()) {
                        handleCreateCategory()
                      } else if (e.key === 'Escape') {
                        setShowNewCategoryInput(false)
                        setNewCategoryName('')
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                >
                  <Save size={18} className="mr-2" />
                  Criar
                </Button>
                <Button
                  onClick={() => {
                    setShowNewCategoryInput(false)
                    setNewCategoryName('')
                  }}
                  variant="outline"
                >
                  <X size={18} className="mr-2" />
                  Cancelar
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Digite o nome da nova categoria e clique em "Criar". Você poderá configurar os tópicos em seguida.
              </p>
            </div>
          )}
        </motion.div>

        {selectedCategory && (
          <>
            {/* Adicionar Novo Tópico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-2xl font-bold mb-4">Adicionar Novo Tópico</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Chave do Tópico (ID interno)"
                  value={newTopic.key}
                  onChange={(e) => setNewTopic({ ...newTopic, key: e.target.value })}
                  placeholder="Ex: resistencia_agua"
                />
                <Input
                  label="Rótulo do Tópico (Exibido)"
                  value={newTopic.label}
                  onChange={(e) => setNewTopic({ ...newTopic, label: e.target.value })}
                  placeholder="Ex: Resistência à Água"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo
                  </label>
                  <select
                    value={newTopic.type}
                    onChange={(e) => setNewTopic({ ...newTopic, type: e.target.value as 'rating' | 'text' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="rating">Estrelas (1-5)</option>
                    <option value="text">Texto</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleAddTopic}>
                  <Plus size={18} className="mr-2" />
                  Adicionar Tópico
                </Button>
              </div>
            </motion.div>

            {/* Lista de Tópicos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Tópicos da Categoria: {selectedCategory}</h2>
                {topics.length > 0 && (
                  <Button onClick={handleUpdateProductTopics} variant="outline">
                    <Star size={18} className="mr-2" />
                    Atualizar Produtos Existentes
                  </Button>
                )}
              </div>

              {topics.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum tópico cadastrado para esta categoria.</p>
                  <p className="text-sm mt-2">Adicione um tópico acima para começar.</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="topics">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {topics.map((topic, index) => (
                          <Draggable key={topic.id} draggableId={topic.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                                  snapshot.isDragging ? 'bg-gray-100 shadow-lg' : ''
                                }`}
                              >
                                {editingTopic?.id === topic.id ? (
                                  <>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <Input
                                        value={editingTopic.topic_key}
                                        onChange={(e) => setEditingTopic({ ...editingTopic, topic_key: e.target.value })}
                                        placeholder="Chave"
                                      />
                                      <Input
                                        value={editingTopic.topic_label}
                                        onChange={(e) => setEditingTopic({ ...editingTopic, topic_label: e.target.value })}
                                        placeholder="Rótulo"
                                      />
                                      <select
                                        value={editingTopic.topic_type}
                                        onChange={(e) => setEditingTopic({ ...editingTopic, topic_type: e.target.value as 'rating' | 'text' })}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                      >
                                        <option value="rating">Estrelas</option>
                                        <option value="text">Texto</option>
                                      </select>
                                    </div>
                                    <Button onClick={handleSaveEdit} size="sm">
                                      <Save size={16} />
                                    </Button>
                                    <Button onClick={() => setEditingTopic(null)} variant="outline" size="sm">
                                      <X size={16} />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <GripVertical size={20} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">{topic.topic_label}</span>
                                        <span className="text-xs text-gray-500">({topic.topic_key})</span>
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
                                    </div>
                                    <Button onClick={() => handleEditTopic(topic)} variant="outline" size="sm">
                                      <Edit size={16} />
                                    </Button>
                                    <Button onClick={() => handleDeleteTopic(topic.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 size={16} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

