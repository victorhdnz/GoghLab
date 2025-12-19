'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import { Product, ProductColor } from '@/types'
import Image from 'next/image'
import { Heart, Share2, Star, Truck, Shield, RefreshCw, MapPin, Eye, X, ChevronLeft, ChevronRight, GitCompare, Package, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUserLocation } from '@/hooks/useUserLocation'
import { useProductComparison } from '@/hooks/useProductComparison'
import { getProductPrice } from '@/lib/utils/price'

export default function ProductPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { addProduct, products, canAddMore } = useProductComparison()
  const { isUberlandia, needsAddress, loading: locationLoading } = useUserLocation()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [gifts, setGifts] = useState<Product[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [comboData, setComboData] = useState<any>(null)
  const [comboItems, setComboItems] = useState<Array<{ product: Product; quantity: number }>>([])
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [orderedSpecifications, setOrderedSpecifications] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    loadProduct()
  }, [params.slug, isAuthenticated])

  // Atualizar quando usuário cadastrar endereço (via evento customizado)
  useEffect(() => {
    const handleAddressRegistered = () => {
      // Quando o endereço for cadastrado, recarregar a página para atualizar o preço
      if (isAuthenticated) {
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    }
    
    window.addEventListener('addressRegistered', handleAddressRegistered)
    
    return () => {
      window.removeEventListener('addressRegistered', handleAddressRegistered)
    }
  }, [isAuthenticated])

  // Controlar body overflow quando modal abrir/fechar
  useEffect(() => {
    if (showAddressModal || showImageModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAddressModal, showImageModal])

  // Resetar selectedImage se estiver fora do range - DEVE estar no topo com outros hooks
  useEffect(() => {
    if (!product) return
    
    // Calcular imagens aqui dentro para garantir que sempre seja um array válido
    let productImages: string[] = []
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          productImages = JSON.parse(product.images)
        } catch (e) {
          productImages = []
        }
      } else if (Array.isArray(product.images)) {
        productImages = product.images
      }
    }
    
    const images = (productImages.length > 0 ? productImages : selectedColor?.images) || []
    
    if (images.length > 0 && selectedImage >= images.length) {
      setSelectedImage(0)
    }
  }, [product, selectedColor, selectedImage])

  const loadProduct = async () => {
    try {
      setLoading(true)
      
      // Carregar produto principal
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          colors:product_colors(*)
        `)
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single()

      if (error || !productData) {
        router.push('/produtos')
        return
      }

      // Garantir que o campo images seja sempre um array válido
      let images = productData.images || []
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
      
      productData.images = images

      // Preparar todas as queries paralelas como funções async
      const parallelQueries: Promise<any>[] = []

      // Query de tópicos da categoria (se necessário)
      if (productData.specifications && Array.isArray(productData.specifications) && productData.specifications.length > 0 && productData.category) {
        parallelQueries.push(
          (async () => {
            const result = await supabase
              .from('category_topics')
              .select('topic_key, display_order')
              .eq('category_name', productData.category)
              .order('display_order', { ascending: true })
            return result
          })()
        )
      }

      // Query de brindes
      parallelQueries.push(
        (async () => {
          const result = await supabase
            .from('product_gifts')
            .select(`
              gift_product:products!product_gifts_gift_product_id_fkey(*)
            `)
            .eq('product_id', productData.id)
            .eq('is_active', true)
          return result
        })()
      )

      // Query de combo (se for combo)
      if (productData.category === 'Combos' && productData.slug) {
        parallelQueries.push(
          (async () => {
            const result = await supabase
              .from('product_combos')
              .select(`
                *,
                combo_items (
                  id,
                  product_id,
                  quantity,
                  product:products (
                    id,
                    name,
                    description,
                    price,
                    images,
                    slug
                  )
                )
              `)
              .eq('slug', productData.slug)
              .eq('is_active', true)
              .maybeSingle()
            return result
          })()
        )
      }

      // Query de favoritos (se autenticado)
      if (isAuthenticated) {
        parallelQueries.push(
          (async () => {
            const userResult = await supabase.auth.getUser()
            if (userResult.data.user) {
              const result = await supabase
                .from('favorites')
                .select('id')
                .eq('product_id', productData.id)
                .eq('user_id', userResult.data.user.id)
                .single()
              return result
            }
            return { data: null, error: null }
          })()
        )
      }

      // Executar todas as queries em paralelo
      const results = await Promise.allSettled(parallelQueries)

      // Processar resultados - usar índices baseados na ordem de inserção
      let currentIndex = 0

      // Processar tópicos (se existir)
      if (productData.specifications && Array.isArray(productData.specifications) && productData.specifications.length > 0 && productData.category) {
        const topicsResult = results[currentIndex]
        currentIndex++
        if (topicsResult.status === 'fulfilled' && topicsResult.value.data) {
          const topicsData = topicsResult.value.data
          if (topicsData && topicsData.length > 0) {
            const topicOrderMap = new Map<string, number>()
            topicsData.forEach((topic: any, index: number) => {
              topicOrderMap.set(topic.topic_key, topic.display_order ?? index)
            })
            
            const sortedSpecs = [...productData.specifications].sort((a, b) => {
              const orderA = topicOrderMap.get(a.key) ?? 999
              const orderB = topicOrderMap.get(b.key) ?? 999
              return orderA - orderB
            })
            
            setOrderedSpecifications(sortedSpecs)
            productData.specifications = sortedSpecs
          } else {
            setOrderedSpecifications(productData.specifications)
          }
        } else {
          setOrderedSpecifications(productData.specifications)
        }
      } else {
        setOrderedSpecifications(productData.specifications || [])
      }

      // Processar brindes (sempre presente)
      const giftsResult = results[currentIndex]
      currentIndex++
      if (giftsResult.status === 'fulfilled' && giftsResult.value.data) {
        const giftsData = giftsResult.value.data
        if (giftsData && giftsData.length > 0) {
          setGifts(giftsData.map((g: any) => g.gift_product))
        }
      }

      // Processar combo (se for combo)
      if (productData.category === 'Combos' && productData.slug) {
        const comboResult = results[currentIndex]
        currentIndex++
        if (comboResult.status === 'fulfilled' && comboResult.value.data) {
          const comboData = comboResult.value.data
          if (comboData) {
            setComboData(comboData)
            if (comboData.combo_items) {
              const items = comboData.combo_items.map((item: any) => ({
                product: item.product,
                quantity: item.quantity
              }))
              setComboItems(items)
            }
          }
        }
      }

      // Processar favoritos (se autenticado)
      if (isAuthenticated) {
        const favoriteResult = results[currentIndex]
        if (favoriteResult.status === 'fulfilled' && favoriteResult.value.data) {
          setIsFavorite(!!favoriteResult.value.data)
        } else {
          setIsFavorite(false)
        }
      }

      setProduct(productData as any)

      if (productData.colors && productData.colors.length > 0) {
        setSelectedColor(productData.colors[0] as any)
      }

    } catch (error) {
      console.error('Erro ao carregar produto:', error)
      router.push('/produtos')
    } finally {
      setLoading(false)
    }
  }


  const handleUnlockPrice = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    setShowAddressModal(true)
  }

  // Garantir que product.images seja sempre um array válido e preparar imagens
  const productImages = product ? (() => {
    let images = product.images || []
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
    return images
  })() : []

  // Usar imagens do produto (se existir), caso contrário usar imagens da cor selecionada
  const images = (productImages.length > 0 ? productImages : selectedColor?.images) || []
  const currentImage = images[selectedImage] || images[0] || ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          {/* Main Image */}
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative"
          >
            {currentImage ? (
              <>
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={selectedImage === 0}
                />
                {/* Setas de navegação - só mostrar se houver mais de 1 imagem */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">
                ⌚
              </div>
            )}
          </motion.div>

          {/* Thumbnails - só mostrar se houver mais de 1 imagem */}
          {images.length > 1 && (
            <div className={`grid gap-4 ${images.length <= 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all relative ${
                    selectedImage === index
                      ? 'border-black scale-105'
                      : 'border-transparent hover:border-gray-400'
                  }`}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100">
                      ⌚
                    </div>
                  )}
                  {index === 0 && (
                    <span className="absolute top-1 left-1 bg-black text-white text-xs px-1.5 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>


          {/* Price */}
          <div className="mb-6">
            {needsAddress && !locationLoading && isAuthenticated ? (
              <button
                onClick={handleUnlockPrice}
                className="relative cursor-pointer group w-full text-left"
              >
                {/* Preço embaçado com olho */}
                <div className="flex items-center gap-3 mb-2">
                  <Eye size={32} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                  <span className="text-4xl font-bold text-gray-400 blur-md select-none">
                    {formatCurrency(product.price || 0)}
                  </span>
                  <MapPin size={24} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Clique para revelar o preço
                </p>
              </button>
            ) : !isAuthenticated ? (
              <div className="p-4 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300">
                <div className="text-4xl font-bold text-gray-400 blur-md select-none mb-2">
                  {formatCurrency(product.price || 0)}
                </div>
                <Button onClick={() => router.push('/login')} variant="outline" size="sm">
                  Faça login para ver o preço
                </Button>
              </div>
            ) : (
              <div>
                {/* Preço revelado - sem olho */}
                <span className="text-4xl font-bold">
                  {locationLoading 
                    ? 'Carregando...' 
                    : formatCurrency(getProductPrice(product, isUberlandia))}
                </span>
              </div>
            )}
          </div>

          {/* Modal de Visualização de Imagem */}
          {typeof window !== 'undefined' && showImageModal && images.length > 0 && createPortal(
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
              onClick={() => setShowImageModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-7xl max-h-[90vh] flex flex-col"
              >
                {/* Botão Fechar */}
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-4 right-4 z-20 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors"
                  aria-label="Fechar"
                >
                  <X size={24} />
                </button>

                {/* Navegação Anterior */}
                {images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                {/* Navegação Próxima */}
                {images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}

                {/* Imagem Principal */}
                <div className="relative w-full flex-1 flex items-center justify-center" style={{ minHeight: '60vh' }}>
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full h-full max-h-[80vh] flex items-center justify-center"
                  >
                    {currentImage ? (
                      <Image
                        src={currentImage}
                        alt={`${product.name} ${selectedImage + 1}`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-8xl text-white">
                        ⌚
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Thumbnails no Modal - só mostrar se houver mais de 1 imagem */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImage(index)
                        }}
                        className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index
                            ? 'border-white scale-110'
                            : 'border-white/50 hover:border-white/80'
                        }`}
                        style={{ aspectRatio: '1/1', width: '80px' }}
                      >
                        {image ? (
                          <Image
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl bg-gray-800">
                            ⌚
                          </div>
                        )}
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

          {/* Modal simplificado para redirecionar para cadastro de endereço - usando portal */}
          {typeof window !== 'undefined' && showAddressModal && createPortal(
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={(e) => {
                // Só fechar se clicar diretamente no overlay (não no modal)
                if (e.target === e.currentTarget) {
                  setShowAddressModal(false)
                }
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200"
              >
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  aria-label="Fechar"
                >
                  ✕
                </button>
                
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <MapPin size={40} className="text-blue-600" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Cadastre seu endereço
                    </h2>
                    <p className="text-gray-600">
                      Para visualizar o preço do produto, precisamos do seu endereço
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        setShowAddressModal(false)
                        router.push('/minha-conta/enderecos')
                      }}
                      className="flex-1"
                      size="lg"
                    >
                      <MapPin size={18} className="mr-2" />
                      Cadastrar Endereço
                    </Button>
                    <Button
                      onClick={() => setShowAddressModal(false)}
                      variant="outline"
                      size="lg"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Combo Products Section */}
          {comboItems.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Package size={24} className="text-green-600" />
                <h3 className="text-xl font-bold text-green-900">Este Combo Inclui:</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {comboItems.map((item, idx) => {
                  const itemImages = Array.isArray(item.product.images) 
                    ? item.product.images 
                    : typeof item.product.images === 'string'
                      ? [item.product.images]
                      : []
                  const itemImage = itemImages[0]
                  
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-all hover:shadow-md">
                      {/* Product Image */}
                      <Link href={`/produtos/${item.product.slug}`} className="flex-shrink-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                          {itemImage ? (
                            <Image
                              src={itemImage}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-2xl">⌚</span>
                            </div>
                          )}
                          {item.quantity > 1 && (
                            <div className="absolute top-1 right-1 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                              {item.quantity}x
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/produtos/${item.product.slug}`}>
                          <h4 className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                            {item.product.name}
                          </h4>
                        </Link>
                        {item.product.description && (
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {item.product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {needsAddress && !locationLoading && isAuthenticated ? (
                            <button
                              onClick={handleUnlockPrice}
                              className="relative cursor-pointer group text-left"
                            >
                              <div className="flex items-center gap-1">
                                <Eye size={14} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                                <span className="text-sm font-bold text-gray-400 blur-sm select-none">
                                  {formatCurrency(item.product.price || 0)}
                                </span>
                                <MapPin size={12} className="text-gray-400" />
                              </div>
                            </button>
                          ) : !isAuthenticated ? (
                            <div className="text-left">
                              <span className="text-sm font-bold text-gray-400 blur-sm select-none">
                                {formatCurrency(item.product.price || 0)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-green-700">
                                {locationLoading 
                                  ? 'Carregando...' 
                                  : formatCurrency(getProductPrice(item.product, isUberlandia))}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-500">
                                  (cada)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Plus Icon */}
                      {idx < comboItems.length - 1 && (
                        <div className="hidden md:flex items-center justify-center flex-shrink-0">
                          <Plus size={20} className="text-green-600" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Combo Summary */}
              {comboData && (() => {
                const totalOriginalPrice = comboItems.reduce((sum, item) => {
                  const itemPrice = getProductPrice(item.product, isUberlandia)
                  return sum + (itemPrice * item.quantity)
                }, 0)
                
                const discountPercentage = isUberlandia 
                  ? (comboData.discount_percentage_local || 0)
                  : (comboData.discount_percentage_national || 0)
                const discountAmount = isUberlandia
                  ? (comboData.discount_amount_local || 0)
                  : (comboData.discount_amount_national || 0)
                
                const finalPrice = getProductPrice(product, isUberlandia)
                
                const calculatedDiscount = discountPercentage > 0
                  ? totalOriginalPrice * (discountPercentage / 100)
                  : discountAmount
                
                return (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-green-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Total dos produtos separados:</span>
                      {needsAddress && !locationLoading && isAuthenticated ? (
                        <button
                          onClick={handleUnlockPrice}
                          className="relative cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Eye size={18} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                            <span className="text-lg font-bold text-gray-400 blur-sm select-none">
                              {formatCurrency(totalOriginalPrice)}
                            </span>
                            <MapPin size={16} className="text-gray-400" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {locationLoading 
                            ? 'Carregando...' 
                            : formatCurrency(totalOriginalPrice)}
                        </span>
                      )}
                    </div>
                    {!needsAddress && !locationLoading && (discountPercentage > 0 || discountAmount > 0) && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-600">Desconto do combo:</span>
                        <span className="text-lg font-bold text-green-600">
                          {discountPercentage > 0 
                            ? `- ${discountPercentage}% (${formatCurrency(calculatedDiscount)})`
                            : `- ${formatCurrency(discountAmount)}`
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-lg font-bold text-green-900">Preço do combo:</span>
                      {needsAddress && !locationLoading && isAuthenticated ? (
                        <button
                          onClick={handleUnlockPrice}
                          className="relative cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Eye size={24} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                            <span className="text-2xl font-bold text-gray-400 blur-sm select-none">
                              {formatCurrency(finalPrice)}
                            </span>
                            <MapPin size={20} className="text-gray-400" />
                          </div>
                        </button>
                      ) : (
                        <div className="text-left">
                          <span className="text-2xl font-bold text-green-700">
                            {locationLoading 
                              ? 'Carregando...' 
                              : formatCurrency(finalPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                    {!needsAddress && !locationLoading && (discountPercentage > 0 || discountAmount > 0) && (
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        💰 Você economiza {formatCurrency(calculatedDiscount)} com este combo!
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">
                Cor: {selectedColor?.color_name}
                {selectedColor?.stock !== undefined && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({selectedColor.stock} {selectedColor.stock === 1 ? 'unidade' : 'unidades'} em estoque)
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-3 mb-3">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setSelectedColor(color)
                      setSelectedImage(0)
                    }}
                    className={`relative w-12 h-12 rounded-full border-4 transition-all ${
                      selectedColor?.id === color.id
                        ? 'border-black scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.color_hex }}
                    title={`${color.color_name}${color.stock !== undefined ? ` - ${color.stock} ${color.stock === 1 ? 'unidade' : 'unidades'}` : ''}`}
                  >
                    {color.stock !== undefined && color.stock < 5 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        !
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {selectedColor?.stock !== undefined && selectedColor.stock < 5 && (
                <p className="text-sm text-orange-600">
                  ⚠️ Apenas {selectedColor.stock} {selectedColor.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'} nesta cor!
                </p>
              )}
            </div>
          )}

          {/* Gifts */}
          {gifts.length > 0 && (
            <div className="mb-6 p-4 bg-accent/10 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                🎁 Ganhe de Brinde:
              </h3>
              <ul className="space-y-1">
                {gifts.map((gift) => (
                  <li key={gift.id} className="text-sm flex items-center">
                    <span className="mr-2">•</span>
                    {gift.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">
              Quantidade
              {selectedColor?.stock !== undefined && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({selectedColor.stock} {selectedColor.stock === 1 ? 'unidade' : 'unidades'} disponível{selectedColor.stock === 1 ? '' : 'eis'})
                </span>
              )}
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-black transition-colors"
              >
                -
              </button>
              <span className="text-xl font-semibold w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => {
                  if (selectedColor?.stock !== undefined) {
                    setQuantity(Math.min(selectedColor.stock, quantity + 1))
                  } else {
                    setQuantity(quantity + 1)
                  }
                }}
                className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-black transition-colors"
                disabled={selectedColor?.stock !== undefined && quantity >= selectedColor.stock}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
            <Button
              onClick={() => {
                if (products.some(p => p.id === product.id)) {
                  toast('Produto já está na comparação')
                  router.push('/comparar')
                  return
                }
                // Removida restrição de categoria - agora permite comparar produtos de categorias diferentes
                if (!canAddMore()) {
                  toast.error('Você pode comparar até 2 produtos. Limpe a comparação atual ou remova algum produto.')
                  return
                }
                addProduct(product)
                toast.success('Produto adicionado à comparação!')
              }}
              disabled={!canAddMore() && !products.some(p => p.id === product.id)}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial min-w-[120px] sm:min-w-0 text-xs sm:text-base"
            >
              <GitCompare size={16} className="sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{products.some(p => p.id === product.id) ? 'Na Comparação' : 'Comparar'}</span>
              <span className="sm:hidden">{products.some(p => p.id === product.id) ? 'Na Comparação' : 'Comparar'}</span>
            </Button>
            <button
              onClick={async () => {
                if (!isAuthenticated) {
                  toast.error('Faça login para favoritar produtos')
                  router.push('/login')
                  return
                }
                try {
                  const user = await supabase.auth.getUser()
                  if (!user.data.user) return

                  if (isFavorite) {
                    // Remover dos favoritos
                    const { error } = await supabase
                      .from('favorites')
                      .delete()
                      .eq('product_id', product.id)
                      .eq('user_id', user.data.user.id)

                    if (error) throw error
                    setIsFavorite(false)
                    toast.success('Removido dos favoritos')
                  } else {
                    // Adicionar aos favoritos
                    const { error } = await supabase
                      .from('favorites')
                      .insert({
                        product_id: product.id,
                        user_id: user.data.user.id,
                      })

                    if (error) throw error
                    setIsFavorite(true)
                    toast.success('Adicionado aos favoritos')
                  }
                } catch (error) {
                  console.error('Erro ao favoritar:', error)
                  toast.error('Erro ao favoritar produto')
                }
              }}
              className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg border-2 transition-colors flex items-center justify-center flex-shrink-0 ${
                isFavorite
                  ? 'border-red-500 bg-red-50 text-red-500'
                  : 'border-gray-300 hover:border-black'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart size={18} className={`sm:w-6 sm:h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    text: product.short_description || product.description || '',
                    url: window.location.href,
                  }).catch(() => {})
                } else {
                  // Fallback: copiar para clipboard
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Link copiado para a área de transferência!')
                }
              }}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg border-2 border-gray-300 hover:border-black transition-colors flex items-center justify-center flex-shrink-0"
              title="Compartilhar produto"
            >
              <Share2 size={18} className="sm:w-6 sm:h-6" />
            </button>
          </div>


          {/* Benefits */}
          {product.benefits && (
            <div className="space-y-3 border-t pt-6">
              {product.benefits.free_shipping?.enabled && (
                <div className="flex items-center">
                  <Truck size={20} className="mr-3 flex-shrink-0" />
                  <span>{product.benefits.free_shipping.text || 'Frete grátis para Uberlândia acima de R$ 200'}</span>
                </div>
              )}
              {product.benefits.warranty?.enabled && (
                <div className="flex items-center">
                  <Shield size={20} className="mr-3 flex-shrink-0" />
                  <span>{product.benefits.warranty.text || 'Garantia de 1 ano'}</span>
                </div>
              )}
              {product.benefits.returns?.enabled && (
                <div className="flex items-center">
                  <RefreshCw size={20} className="mr-3 flex-shrink-0" />
                  <span>{product.benefits.returns.text || 'Troca grátis em 7 dias'}</span>
                </div>
              )}
            </div>
          )}

          {/* Specifications */}
          {orderedSpecifications && Array.isArray(orderedSpecifications) && orderedSpecifications.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-2xl font-bold mb-4">Especificações Técnicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderedSpecifications.map((spec: any, index: number) => {
                  const rating = parseInt(spec.value) || 0
                  const isRating = rating >= 1 && rating <= 5
                  
                  return (
                    <div key={index} className="flex justify-between items-center gap-2">
                      <span className="font-semibold text-gray-700">{spec.key}:</span>
                      {isRating ? (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={18}
                              className={
                                star <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-300 text-gray-300'
                              }
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-gray-600">{spec.value}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-2xl font-bold mb-4">Descrição</h3>
              <div className="text-gray-700 leading-relaxed">
                {showFullDescription ? (
                  <p className="whitespace-pre-line">{product.description}</p>
                ) : (
                  <p className="line-clamp-3 whitespace-pre-line">{product.description}</p>
                )}
                {product.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-3 text-black font-semibold hover:underline flex items-center gap-1 transition-colors"
                  >
                    {showFullDescription ? (
                      <>
                        Ver menos
                        <ChevronLeft size={16} className="rotate-90" />
                      </>
                    ) : (
                      <>
                        Ler mais
                        <ChevronRight size={16} className="rotate-90" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



