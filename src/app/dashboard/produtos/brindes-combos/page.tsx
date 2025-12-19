'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Gift, Package, Trash2, Link as LinkIcon, Edit, Star, Eye, EyeOff, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { formatCurrency, slugify } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  local_price: number
  national_price: number
  images: string[]
}

interface ProductGift {
  id: string
  product_id: string
  gift_product_id: string
  gift_product?: Product
}

interface Combo {
  id: string
  name: string
  description: string
  discount_percentage: number
  discount_amount: number
  discount_percentage_local?: number
  discount_amount_local?: number
  discount_percentage_national?: number
  discount_amount_national?: number
  final_price: number
  available_quantity?: number
  is_active: boolean
  is_featured: boolean
  slug?: string
  combo_items?: ComboItem[]
}

interface ComboItem {
  id: string
  combo_id: string
  product_id: string
  quantity: number
  product?: Product
}

type ActiveTab = 'gifts' | 'combos'

export default function BrindesECombosPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  // States for gifts
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productGifts, setProductGifts] = useState<ProductGift[]>([])
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [availableGifts, setAvailableGifts] = useState<Product[]>([])
  const [selectedGift, setSelectedGift] = useState('')

  // States for combos
  const [combos, setCombos] = useState<Combo[]>([])
  const [showComboModal, setShowComboModal] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [comboForm, setComboForm] = useState({
    name: '',
    description: '',
    discount_percentage_local: 0,
    discount_amount_local: 0,
    discount_percentage_national: 0,
    discount_amount_national: 0,
    local_price: '',
    national_price: '',
    available_quantity: 0,
    items: [] as { product_id: string; quantity: number }[]
  })

  // General states
  const [activeTab, setActiveTab] = useState<ActiveTab>('gifts')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
        return
      }
      
      if (mounted) {
        loadProducts()
        loadCombos()
      }
    }

    return () => {
      mounted = false
    }
  }, [isAuthenticated, isEditor, authLoading])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, local_price, national_price, images')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
      setAvailableGifts(data || [])
    } catch (error) {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const loadCombos = async () => {
    try {
      const { data, error } = await supabase
        .from('product_combos')
        .select(`
          *,
          combo_items (
            id,
            product_id,
            quantity,
            product:products (id, name, local_price, images)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCombos(data as any || [])
    } catch (error) {
      toast.error('Erro ao carregar combos')
    }
  }

  const loadProductGifts = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_gifts')
        .select(`
          id,
          product_id,
          gift_product_id,
          gift_product:products!product_gifts_gift_product_id_fkey(id, name, local_price, images)
        `)
        .eq('product_id', productId)
        .eq('is_active', true)

      if (error) throw error
      setProductGifts(data as any || [])
    } catch (error) {
      toast.error('Erro ao carregar brindes')
    }
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    loadProductGifts(product.id)
  }

  const handleAddGift = async () => {
    if (!selectedProduct || !selectedGift) {
      toast.error('Selecione um brinde')
      return
    }

    try {
      const { error } = await supabase
        .from('product_gifts')
        .insert({
          product_id: selectedProduct.id,
          gift_product_id: selectedGift,
          is_active: true,
        })

      if (error) throw error

      toast.success('Brinde adicionado com sucesso!')
      setShowGiftModal(false)
      setSelectedGift('')
      loadProductGifts(selectedProduct.id)
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Este brinde já está vinculado ao produto')
      } else {
        toast.error('Erro ao adicionar brinde')
      }
    }
  }

  const handleRemoveGift = async (giftId: string) => {
    if (!confirm('Deseja remover este brinde?')) return

    try {
      const { error } = await supabase
        .from('product_gifts')
        .delete()
        .eq('id', giftId)

      if (error) throw error

      toast.success('Brinde removido')
      loadProductGifts(selectedProduct!.id)
    } catch (error) {
      toast.error('Erro ao remover brinde')
    }
  }

  const calculateLocalPrice = () => {
    const totalPrice = comboForm.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id)
      return sum + (product?.local_price || 0) * item.quantity
    }, 0)

    if (comboForm.discount_percentage_local > 0) {
      return totalPrice * (1 - comboForm.discount_percentage_local / 100)
    }
    
    return Math.max(0, totalPrice - comboForm.discount_amount_local)
  }

  const calculateNationalPrice = () => {
    const totalPrice = comboForm.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id)
      return sum + (product?.national_price || product?.local_price || 0) * item.quantity
    }, 0)

    if (comboForm.discount_percentage_national > 0) {
      return totalPrice * (1 - comboForm.discount_percentage_national / 100)
    }
    
    return Math.max(0, totalPrice - comboForm.discount_amount_national)
  }

  const calculateComboPrice = () => {
    // Retorna o preço local calculado para o resumo do combo
    return calculateLocalPrice()
  }

  // Atualizar preços calculados quando os itens ou desconto mudarem
  useEffect(() => {
    if (comboForm.items.length > 0 && comboForm.items.every(item => item.product_id)) {
      const calculatedLocal = calculateLocalPrice()
      const calculatedNational = calculateNationalPrice()
      
      // Sempre atualizar os preços quando os produtos ou descontos mudarem
      // O usuário ainda pode editar manualmente depois
      setComboForm(prev => ({
        ...prev,
        local_price: calculatedLocal > 0 ? calculatedLocal.toFixed(2) : prev.local_price,
        national_price: calculatedNational > 0 ? calculatedNational.toFixed(2) : prev.national_price
      }))
    } else if (comboForm.items.length === 0) {
      // Limpar preços se não houver produtos
      setComboForm(prev => ({
        ...prev,
        local_price: '',
        national_price: ''
      }))
    }
  }, [comboForm.items.map(item => `${item.product_id}-${item.quantity}`).join(','), comboForm.discount_percentage_local, comboForm.discount_amount_local, comboForm.discount_percentage_national, comboForm.discount_amount_national])

  const handleSaveCombo = async () => {
    if (!comboForm.name || comboForm.items.length === 0) {
      toast.error('Preencha o nome e adicione pelo menos um produto')
      return
    }

    // Validar preços
    if (!comboForm.local_price || !comboForm.national_price) {
      toast.error('Preencha os preços local e nacional')
      return
    }

    const localPrice = parseFloat(comboForm.local_price) || 0
    const nationalPrice = parseFloat(comboForm.national_price) || 0
    
    if (localPrice <= 0 || nationalPrice <= 0) {
      toast.error('Os preços local e nacional devem ser maiores que zero')
      return
    }

    try {
      setLoading(true)
      
      // Usar o menor preço como final_price para compatibilidade
      const finalPrice = Math.min(localPrice, nationalPrice)
      
      // Gerar slug do nome do combo
      const slug = slugify(comboForm.name) || `combo-${Date.now()}`
      
      // Buscar imagens do primeiro produto do combo para usar como imagem do combo
      const firstItem = comboForm.items[0]
      const firstProduct = products.find(p => p.id === firstItem.product_id)
      const comboImages = firstProduct?.images || []
      
      let comboData: any = {
        name: comboForm.name,
        description: comboForm.description,
        slug: slug,
        discount_percentage: 0, // Mantido para compatibilidade
        discount_amount: 0, // Mantido para compatibilidade
        discount_percentage_local: comboForm.discount_percentage_local || 0,
        discount_amount_local: comboForm.discount_amount_local || 0,
        discount_percentage_national: comboForm.discount_percentage_national || 0,
        discount_amount_national: comboForm.discount_amount_national || 0,
        final_price: finalPrice,
        available_quantity: comboForm.available_quantity || 0,
        is_active: true,
        is_featured: false
      }

      let comboId: string

      if (editingCombo) {
        const { error } = await supabase
          .from('product_combos')
          .update(comboData)
          .eq('id', editingCombo.id)

        if (error) {
          console.error('Erro ao atualizar combo:', error)
          throw error
        }
        comboId = editingCombo.id

        // Remove existing items
        await supabase
          .from('combo_items')
          .delete()
          .eq('combo_id', comboId)
      } else {
        const { data, error } = await supabase
          .from('product_combos')
          .insert(comboData)
          .select()
          .single()

        if (error) {
          console.error('Erro ao criar combo:', error)
          throw error
        }
        comboId = data.id
      }

      // Add combo items
      const itemsData = comboForm.items.map(item => ({
        combo_id: comboId,
        product_id: item.product_id,
        quantity: item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('combo_items')
        .insert(itemsData)

      if (itemsError) {
        console.error('Erro ao adicionar itens do combo:', itemsError)
        throw itemsError
      }

      // Criar ou atualizar produto correspondente na tabela products
      const productData = {
        name: comboForm.name,
        description: comboForm.description || '',
        short_description: comboForm.description ? comboForm.description.substring(0, 150) : '',
        slug: slug,
        category: 'Combos',
        local_price: localPrice,
        national_price: nationalPrice,
        stock: 999, // Combos sempre em estoque
        images: comboImages,
        is_active: true,
        is_featured: false,
        product_code: `COMBO-${comboId.substring(0, 8).toUpperCase()}`,
        specifications: [],
        benefits: {},
      }

      // Verificar se já existe um produto para este combo
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existingProduct) {
        // Atualizar produto existente
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', existingProduct.id)

        if (updateError) {
          console.error('Erro ao atualizar produto do combo:', updateError)
          // Não falhar o save do combo por causa disso
        }
      } else {
        // Criar novo produto
        const { error: productError } = await supabase
          .from('products')
          .insert(productData)

        if (productError) {
          console.error('Erro ao criar produto do combo:', productError)
          // Não falhar o save do combo por causa disso
        }
      }

      toast.success(editingCombo ? 'Combo atualizado!' : 'Combo criado!')
      setShowComboModal(false)
      resetComboForm()
      loadCombos()
    } catch (error: any) {
      console.error('Erro detalhado ao salvar combo:', error)
      toast.error(error.message || 'Erro ao salvar combo. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const resetComboForm = () => {
    setComboForm({
      name: '',
      description: '',
      discount_percentage_local: 0,
      discount_amount_local: 0,
      discount_percentage_national: 0,
      discount_amount_national: 0,
      local_price: '',
      national_price: '',
      available_quantity: 0,
      items: []
    })
    setEditingCombo(null)
  }

  const handleEditCombo = async (combo: Combo) => {
    setEditingCombo(combo)
    
    // Buscar o produto correspondente para obter os preços
    let localPrice = ''
    let nationalPrice = ''
    
    // Gerar o slug a partir do nome do combo se não tiver slug
    const comboSlug = combo.slug || slugify(combo.name)
    
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('local_price, national_price')
        .eq('slug', comboSlug)
        .eq('category', 'Combos')
        .maybeSingle()
      
      if (productData) {
        localPrice = productData.local_price?.toString() || ''
        nationalPrice = productData.national_price?.toString() || ''
      }
    } catch (error) {
      console.error('Erro ao carregar preços do combo:', error)
    }
    
    setComboForm({
      name: combo.name,
      description: combo.description || '',
      discount_percentage_local: combo.discount_percentage_local || 0,
      discount_amount_local: combo.discount_amount_local || 0,
      discount_percentage_national: combo.discount_percentage_national || 0,
      discount_amount_national: combo.discount_amount_national || 0,
      local_price: localPrice,
      national_price: nationalPrice,
      available_quantity: combo.available_quantity || 0,
      items: combo.combo_items?.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })) || []
    })
    setShowComboModal(true)
  }

  const handleDeleteCombo = async (comboId: string) => {
    if (!confirm('Deseja excluir este combo?')) return

    try {
      // Buscar o combo para obter o nome
      const { data: combo } = await supabase
        .from('product_combos')
        .select('name')
        .eq('id', comboId)
        .single()

      // Deletar o produto correspondente se existir
      if (combo?.name) {
        const comboSlug = slugify(combo.name)
        await supabase
          .from('products')
          .delete()
          .eq('slug', comboSlug)
          .eq('category', 'Combos')
      }

      // Deletar o combo
      const { error } = await supabase
        .from('product_combos')
        .delete()
        .eq('id', comboId)

      if (error) throw error
      toast.success('Combo excluído')
      loadCombos()
    } catch (error) {
      console.error('Erro ao excluir combo:', error)
      toast.error('Erro ao excluir combo')
    }
  }

  const toggleComboStatus = async (comboId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('product_combos')
        .update({ is_active: !currentStatus })
        .eq('id', comboId)

      if (error) throw error
      toast.success(currentStatus ? 'Combo desativado' : 'Combo ativado')
      loadCombos()
    } catch (error) {
      toast.error('Erro ao alterar status')
    }
  }

  const toggleComboFeatured = async (comboId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('product_combos')
        .update({ is_featured: !currentFeatured })
        .eq('id', comboId)

      if (error) throw error
      toast.success(currentFeatured ? 'Combo removido dos destaques' : 'Combo destacado')
      loadCombos()
    } catch (error) {
      toast.error('Erro ao alterar destaque')
    }
  }

  const addComboItem = () => {
    setComboForm(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1 }]
    }))
  }

  const removeComboItem = (index: number) => {
    setComboForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateComboItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
    setComboForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <DashboardNavigation
          title="Brindes e Combos"
          subtitle="Gerencie brindes e combos promocionais"
          backUrl="/dashboard/produtos"
          backLabel="Voltar aos Produtos"
        />

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'gifts'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Gift size={18} className="inline mr-2" />
            Brindes
          </button>
          <button
            onClick={() => setActiveTab('combos')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'combos'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package size={18} className="inline mr-2" />
            Combos
          </button>
        </div>

        {/* Gifts Tab */}
        {activeTab === 'gifts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lista de Produtos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Produtos</h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            ⌚
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(product.local_price)}
                        </p>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <div className="text-black">
                          <LinkIcon size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brindes do Produto Selecionado */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedProduct ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">Brindes</h2>
                      <p className="text-gray-600 mt-1">{selectedProduct.name}</p>
                    </div>
                    <Button onClick={() => setShowGiftModal(true)} size="sm">
                      <Plus size={16} className="mr-2" />
                      Adicionar Brinde
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {productGifts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Gift size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum brinde vinculado</p>
                        <p className="text-sm mt-2">
                          Adicione brindes para este produto
                        </p>
                      </div>
                    ) : (
                      productGifts.map((gift) => (
                        <div
                          key={gift.id}
                          className="p-4 border border-green-200 bg-green-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                              {gift.gift_product?.images?.[0] ? (
                                <img
                                  src={gift.gift_product.images[0]}
                                  alt={gift.gift_product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  🎁
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                  BRINDE
                                </span>
                                <h3 className="font-semibold">
                                  {gift.gift_product?.name}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 line-through">
                                {formatCurrency(gift.gift_product?.local_price || 0)}
                              </p>
                              <p className="text-sm text-green-600 font-semibold">
                                GRÁTIS
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveGift(gift.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Selecione um produto</p>
                  <p className="text-sm mt-2">
                    Selecione um produto à esquerda para gerenciar seus brindes
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Combos Tab */}
        {activeTab === 'combos' && (
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Combos Promocionais</h2>
                <p className="text-gray-600">Crie combos com desconto para aumentar as vendas</p>
              </div>
              <Button onClick={() => setShowComboModal(true)}>
                <Plus size={18} className="mr-2" />
                Novo Combo
              </Button>
            </div>

            {/* Combos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo) => (
                <div key={combo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{combo.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{combo.description}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            combo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {combo.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          {combo.is_featured && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Destaque
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {((combo.discount_percentage_local ?? 0) > 0 || (combo.discount_percentage_national ?? 0) > 0 || (combo.discount_amount_local ?? 0) > 0 || (combo.discount_amount_national ?? 0) > 0) && (
                            <div className="flex flex-col gap-1 text-sm">
                              {((combo.discount_percentage_local ?? 0) > 0 || (combo.discount_amount_local ?? 0) > 0) && (
                                <div className="flex items-center gap-2">
                                  <Percent size={14} className="text-green-600" />
                                  <span className="text-green-600 font-semibold">
                                    Local: {(combo.discount_percentage_local ?? 0) > 0 
                                      ? `${combo.discount_percentage_local}%`
                                      : formatCurrency(combo.discount_amount_local ?? 0)
                                    }
                                  </span>
                                </div>
                              )}
                              {((combo.discount_percentage_national ?? 0) > 0 || (combo.discount_amount_national ?? 0) > 0) && (
                                <div className="flex items-center gap-2">
                                  <Percent size={14} className="text-blue-600" />
                                  <span className="text-blue-600 font-semibold">
                                    Nacional: {(combo.discount_percentage_national ?? 0) > 0 
                                      ? `${combo.discount_percentage_national}%`
                                      : formatCurrency(combo.discount_amount_national ?? 0)
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(combo.final_price)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Combo Items */}
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Produtos:</h4>
                      {combo.combo_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {item.quantity}x
                          </span>
                          <span className="flex-1">{item.product?.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleComboFeatured(combo.id, combo.is_featured)}
                        className={`p-2 rounded-lg ${
                          combo.is_featured ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={combo.is_featured ? 'Remover destaque' : 'Destacar combo'}
                      >
                        <Star size={16} />
                      </button>
                      <button
                        onClick={() => toggleComboStatus(combo.id, combo.is_active)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title={combo.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {combo.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleEditCombo(combo)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar combo"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCombo(combo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir combo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {combos.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum combo criado</h3>
                <p className="text-sm mb-6">
                  Crie combos promocionais para aumentar suas vendas
                </p>
                <Button onClick={() => setShowComboModal(true)}>
                  <Plus size={18} className="mr-2" />
                  Criar Primeiro Combo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Modal de Adicionar Brinde */}
        <Modal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          title="Adicionar Brinde"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecione qual produto será enviado como brinde junto com{' '}
              <strong>{selectedProduct?.name}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">
                Produto Brinde
              </label>
              <select
                value={selectedGift}
                onChange={(e) => setSelectedGift(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Selecione um produto</option>
                {availableGifts
                  .filter((p) => p.id !== selectedProduct?.id)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.local_price)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddGift} className="flex-1">
                Adicionar Brinde
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGiftModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Combo */}
        <Modal
          isOpen={showComboModal}
          onClose={() => {
            setShowComboModal(false)
            resetComboForm()
          }}
          title={editingCombo ? 'Editar Combo' : 'Novo Combo'}
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Combo</label>
                <Input
                  value={comboForm.name}
                  onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Kit Relógio + Pulseira"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Input
                  value={comboForm.description}
                  onChange={(e) => setComboForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do combo"
                />
              </div>
            </div>

            {/* Products - MOVED TO TOP */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium">Produtos do Combo</label>
                <Button size="sm" onClick={addComboItem}>
                  <Plus size={16} className="mr-1" />
                  Adicionar Produto
                </Button>
              </div>

              <div className="space-y-3">
                {comboForm.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateComboItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Selecione um produto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.local_price)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateComboItem(index, 'quantity', Number(e.target.value))}
                        placeholder="Qtd"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeComboItem(index)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                {comboForm.items.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Adicione produtos ao combo para começar
                  </p>
                )}
              </div>
            </div>

            {/* Discount Local */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Desconto para Preço Local (Uberlândia)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Desconto (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={comboForm.discount_percentage_local}
                    onChange={(e) => setComboForm(prev => ({ 
                      ...prev, 
                      discount_percentage_local: Number(e.target.value) || 0,
                      discount_amount_local: 0 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Desconto (R$)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={comboForm.discount_amount_local}
                    onChange={(e) => setComboForm(prev => ({ 
                      ...prev, 
                      discount_amount_local: Number(e.target.value) || 0,
                      discount_percentage_local: 0 
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Discount National */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Desconto para Preço Nacional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Desconto (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={comboForm.discount_percentage_national}
                    onChange={(e) => setComboForm(prev => ({ 
                      ...prev, 
                      discount_percentage_national: Number(e.target.value) || 0,
                      discount_amount_national: 0 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Desconto (R$)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={comboForm.discount_amount_national}
                    onChange={(e) => setComboForm(prev => ({ 
                      ...prev, 
                      discount_amount_national: Number(e.target.value) || 0,
                      discount_percentage_national: 0 
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Prices */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Preços Finais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preço Local (Uberlândia) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={comboForm.local_price}
                    onChange={(e) => setComboForm(prev => ({ 
                      ...prev, 
                      local_price: e.target.value 
                    }))}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preço calculado automaticamente com desconto aplicado. Você pode editar manualmente.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preço Nacional <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={comboForm.national_price}
                    onChange={(e) => setComboForm(prev => ({ 
                      ...prev, 
                      national_price: e.target.value 
                    }))}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preço calculado automaticamente com desconto aplicado. Você pode editar manualmente.
                  </p>
                </div>
              </div>
            </div>

            {/* Available Quantity */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Quantidade Disponível</h3>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Unidades Disponíveis
                </label>
                <Input
                  type="number"
                  min="0"
                  value={comboForm.available_quantity}
                  onChange={(e) => setComboForm(prev => ({ 
                    ...prev, 
                    available_quantity: Number(e.target.value) || 0
                  }))}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantidade de unidades deste combo disponíveis para venda. Deixe 0 para ilimitado.
                </p>
              </div>
            </div>

            {/* Price Preview */}
            {comboForm.items.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resumo do Combo:</h4>
                <div className="space-y-1 text-sm">
                  {comboForm.items.map((item, index) => {
                    const product = products.find(p => p.id === item.product_id)
                    if (!product) return null
                    return (
                      <div key={index} className="flex justify-between">
                        <span>{item.quantity}x {product.name}</span>
                        <span>{formatCurrency(product.local_price * item.quantity)}</span>
                      </div>
                    )
                  })}
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateComboPrice())}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSaveCombo} className="flex-1">
                {editingCombo ? 'Atualizar Combo' : 'Criar Combo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowComboModal(false)
                  resetComboForm()
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}