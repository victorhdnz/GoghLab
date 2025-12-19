'use client'

import { useEffect, useState, Suspense } from 'react'
import { useProductComparison } from '@/hooks/useProductComparison'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/format'
import { Product } from '@/types'
import Image from 'next/image'
import { X, Check, XCircle, GitCompare, Star, Link2, Copy, Gift, ShoppingCart, MessageCircle, Instagram } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface ProductGift {
  id: string
  name: string
  images: string[]
}

// Componente wrapper para usar Suspense com useSearchParams
function ComparePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { products, removeProduct, clearComparison, addProduct, canAddMore } = useProductComparison()
  const [comparisonFields, setComparisonFields] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [urlProductsLoaded, setUrlProductsLoaded] = useState(false)
  const [productGifts, setProductGifts] = useState<Record<string, ProductGift[]>>({})
  const [selectedGiftImage, setSelectedGiftImage] = useState<{ name: string; image: string } | null>(null)
  const [ecommerceUrl, setEcommerceUrl] = useState<string>('')
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerImage, setBannerImage] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [footerEnabled, setFooterEnabled] = useState(false)
  const [footerLogo, setFooterLogo] = useState('')
  const [footerCompanyName, setFooterCompanyName] = useState('')
  const [footerWhatsapp, setFooterWhatsapp] = useState('')
  const [footerInstagram, setFooterInstagram] = useState('')
  const supabase = createClient()

  // Carregar configurações do comparador
  useEffect(() => {
    const loadComparatorConfig = async () => {
      try {
        // Carregar URL do e-commerce
        const { data: urlData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'comparator_ecommerce_url')
          .maybeSingle()
        
        if (urlData?.value) {
          setEcommerceUrl(urlData.value as string)
        }

        // Carregar configurações de banner e rodapé
        const { data: configData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'comparator_config')
          .maybeSingle()
        
        if (configData?.value) {
          const config = configData.value as any
          setBannerEnabled(config.banner_enabled || false)
          setBannerImage(config.banner_image || '')
          setBannerLink(config.banner_link || '')
          setFooterEnabled(config.footer_enabled || false)
          setFooterLogo(config.footer_logo || '')
          setFooterCompanyName(config.footer_company_name || '')
          setFooterWhatsapp(config.footer_whatsapp || '')
          setFooterInstagram(config.footer_instagram || '')
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do comparador:', error)
      }
    }
    loadComparatorConfig()
  }, [])

  // Carregar produtos da URL (se houver)
  useEffect(() => {
    const loadProductsFromUrl = async () => {
      const productIds = searchParams.get('produtos')
      if (productIds && !urlProductsLoaded) {
        const ids = productIds.split(',').filter(Boolean)
        if (ids.length > 0) {
          try {
            const { data } = await supabase
              .from('products')
              .select('*')
              .in('id', ids)
              .eq('is_active', true)

            if (data && data.length > 0) {
              // Limpar comparação atual e adicionar os produtos da URL
              clearComparison()
              data.forEach(product => {
                addProduct(product as Product)
              })
            }
          } catch (error) {
            console.error('Erro ao carregar produtos da URL:', error)
          }
        }
        setUrlProductsLoaded(true)
      }
    }

    loadProductsFromUrl()
  }, [searchParams, urlProductsLoaded])

  const loadComparisonFields = async () => {
    try {
      // Se não há produtos, não precisa carregar campos
      if (products.length === 0) {
        setComparisonFields([])
        setLoading(false)
        return
      }

      // Buscar campos de comparação usando as especificações dos produtos
      const allSpecKeys = new Set<string>()
      products.forEach(product => {
        if (product.specifications) {
          product.specifications.forEach(spec => {
            if (spec.key && spec.key.trim()) {
              allSpecKeys.add(spec.key.trim())
            }
          })
        }
      })
      
      // Campos padrão sempre presentes (sem Estoque)
      const defaultFields = ['Nome', 'Preço', 'Categoria']
      
      // Buscar ordem dos tópicos da categoria (se todos os produtos forem da mesma categoria)
      const categories = new Set(products.map(p => p.category).filter(Boolean))
      let orderedSpecs: string[] = []
      
      // Se todos os produtos são da mesma categoria, usar a ordem definida nos tópicos
      if (categories.size === 1) {
        const category = Array.from(categories)[0]
        try {
          const { data: topicsData } = await supabase
            .from('category_topics')
            .select('topic_key, display_order')
            .eq('category_name', category)
            .order('display_order', { ascending: true })
          
          if (topicsData && topicsData.length > 0) {
            // Criar mapa de ordem dos tópicos
            const topicOrderMap = new Map<string, number>()
            topicsData.forEach((topic, index) => {
              topicOrderMap.set(topic.topic_key, topic.display_order ?? index)
            })
            
            // Ordenar especificações pela ordem definida nos tópicos
            orderedSpecs = Array.from(allSpecKeys).sort((a, b) => {
              const orderA = topicOrderMap.get(a) ?? 999
              const orderB = topicOrderMap.get(b) ?? 999
              return orderA - orderB
            })
          } else {
            // Se não houver tópicos definidos, ordenar alfabeticamente
            orderedSpecs = Array.from(allSpecKeys).sort()
          }
        } catch (error) {
          console.error('Erro ao buscar ordem dos tópicos:', error)
          // Em caso de erro, ordenar alfabeticamente
          orderedSpecs = Array.from(allSpecKeys).sort()
        }
      } else {
        // Se produtos de categorias diferentes, ordenar alfabeticamente
        orderedSpecs = Array.from(allSpecKeys).sort()
      }
      
      setComparisonFields([...defaultFields, ...orderedSpecs])
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar campos de comparação:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComparisonFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, products.map(p => p.id).join(',')])

  // Carregar brindes dos produtos
  useEffect(() => {
    const loadProductGifts = async () => {
      if (products.length === 0) {
        setProductGifts({})
        return
      }

      try {
        const giftsMap: Record<string, ProductGift[]> = {}
        
        for (const product of products) {
          const { data, error } = await supabase
            .from('product_gifts')
            .select(`
              id,
              gift_product:products!product_gifts_gift_product_id_fkey(id, name, images)
            `)
            .eq('product_id', product.id)
            .eq('is_active', true)
          
          if (!error && data) {
            giftsMap[product.id] = data
              .filter((g: any) => g.gift_product)
              .map((g: any) => ({
                id: g.gift_product.id,
                name: g.gift_product.name,
                images: g.gift_product.images || []
              }))
          } else {
            giftsMap[product.id] = []
          }
        }
        
        setProductGifts(giftsMap)
      } catch (error) {
        console.error('Erro ao carregar brindes:', error)
      }
    }

    loadProductGifts()
  }, [products.length, products.map(p => p.id).join(',')])

  const handleRemoveProduct = (productId: string) => {
    removeProduct(productId)
    // Remover redirecionamento - manter na página de comparação mesmo quando vazio
  }


  // Carregar produtos e categorias
  useEffect(() => {
    const loadProductsAndCategories = async () => {
      try {
        setLoading(true)
        
        // Usar API para carregar produtos
        const response = await fetch('/api/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Sempre buscar dados atualizados no cliente
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Erro na resposta da API:', errorText)
          throw new Error(`Erro ao carregar produtos: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.products) {
          const productsData = result.products as Product[]
          setAllProducts(productsData)
          const uniqueCategories = [...new Set(productsData.map((p: any) => p.category).filter(Boolean))] as string[]
          setCategories(uniqueCategories.sort())
        } else {
          console.warn('API retornou sem produtos:', result)
          setAllProducts([])
          setCategories([])
        }
        setLoading(false)
      } catch (error: any) {
        console.error('Erro ao carregar produtos:', error)
        toast.error(`Erro ao carregar produtos: ${error.message || 'Erro desconhecido'}`)
        setAllProducts([])
        setCategories([])
        setLoading(false)
      }
    }

    loadProductsAndCategories()
  }, [])

  const handleAddProductToComparison = (product: Product) => {
    // Removida restrição de categoria - agora permite comparar produtos de categorias diferentes
    if (!canAddMore()) {
      toast.error('Você pode comparar até 2 produtos. Limpe a comparação atual ou remova algum produto.')
      return
    }

    if (products.some(p => p.id === product.id)) {
      toast('Produto já está na comparação')
      return
    }

    addProduct(product)
    toast.success('Produto adicionado à comparação!')
    setShowProductSelector(false)
  }

  const filteredProducts = selectedCategory
    ? allProducts.filter(p => p.category === selectedCategory)
    : allProducts

  // Renderização condicional APÓS todos os hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Comparar Produtos</h1>
          <p className="text-gray-600 mb-8">
            Selecione produtos para comparar suas características lado a lado
          </p>
        </div>

        {/* Seletor de categoria e produtos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Selecione uma categoria</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === null
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-black'
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-black'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <p className="text-sm text-gray-600 mb-4">
              Produtos da categoria: <strong>{selectedCategory}</strong>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleAddProductToComparison(product)}
              >
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      ⌚
                    </div>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category}</p>
                <Button
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddProductToComparison(product)
                  }}
                >
                  <GitCompare size={16} className="mr-2" />
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-12">
      {/* Banner Promocional */}
      {bannerEnabled && bannerImage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl overflow-hidden"
        >
          {bannerLink ? (
            <a
              href={bannerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <div className="relative w-full" style={{ aspectRatio: '1920/300', maxHeight: '200px' }}>
                <Image
                  src={bannerImage}
                  alt="Banner promocional"
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            </a>
          ) : (
            <div className="relative w-full" style={{ aspectRatio: '1920/300', maxHeight: '200px' }}>
              <Image
                src={bannerImage}
                alt="Banner promocional"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Banner de retorno ao E-commerce */}
      {ecommerceUrl && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-black to-gray-800 text-white rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="text-center sm:text-left">
            <p className="font-semibold">🛒 Pronto para comprar?</p>
            <p className="text-sm text-gray-300">Volte ao e-commerce e garanta seu produto!</p>
          </div>
          <a
            href={ecommerceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <ShoppingCart size={18} />
            Ir para o E-commerce
          </a>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-4xl font-bold">Comparar Produtos</h1>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <Button 
            onClick={() => setShowProductSelector(!showProductSelector)} 
            variant="outline"
            size="sm"
            className="text-xs sm:text-base"
          >
            <GitCompare size={14} className="sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{showProductSelector ? 'Fechar Seleção' : 'Adicionar Produtos'}</span>
            <span className="sm:hidden">{showProductSelector ? 'Fechar' : 'Adicionar'}</span>
          </Button>
          <Button 
            onClick={clearComparison} 
            variant="outline"
            size="sm"
            className="text-xs sm:text-base"
          >
            <span className="hidden sm:inline">Limpar Comparação</span>
            <span className="sm:hidden">Limpar</span>
          </Button>
        </div>
      </div>

      {/* Seletor de produtos */}
      {showProductSelector && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Selecione produtos para comparar</h2>
          <p className="text-sm text-gray-600 mb-4">
            {products.length > 0 && (
              <>
                Você pode comparar até 2 produtos de qualquer categoria.
                <br />
                {products.length} produto(s) na comparação
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === null
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-black'
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-black'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts
              .filter(p => !products.some(prod => prod.id === p.id))
              .map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        ⌚
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{product.category}</p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleAddProductToComparison(product)}
                    disabled={!canAddMore()}
                  >
                    <GitCompare size={16} className="mr-2" />
                    Adicionar
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mobile Layout - Cards Verticais */}
      <div className="block md:hidden space-y-4">
        {/* Header dos Produtos no Mobile */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  className="self-end text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Remover produto"
                >
                  <X size={16} />
                </button>
                <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      ⌚
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-xs text-center line-clamp-2 leading-tight">{product.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Cards de Comparação */}
        {comparisonFields.map((field, index) => (
          <div 
            key={field}
            className={`bg-white rounded-lg shadow-md p-4 ${
              index % 2 === 0 
                ? 'bg-white' 
                : 'bg-gray-50/30'
            }`}
          >
            <h3 className="font-bold text-sm mb-3 text-gray-800 border-b pb-2">{field}</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => {
                let value: string | number | React.ReactNode = '—'
                
                switch (field) {
                  case 'Nome':
                    value = product.name
                    break
                  case 'Preço':
                    value = formatCurrency(product.price || 0)
                    break
                  case 'Categoria':
                    value = product.category || '—'
                    break
                  default:
                    const spec = product.specifications?.find(s => s.key === field)
                    if (spec && spec.value && spec.value.trim() !== '') {
                      const trimmedValue = spec.value.trim()
                      const rating = parseInt(trimmedValue)
                      const isRating = !isNaN(rating) && rating >= 1 && rating <= 5 && trimmedValue === String(rating)
                      
                      if (isRating) {
                        value = (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={12}
                                  className={
                                    star <= rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'fill-gray-200 text-gray-200'
                                  }
                                />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{rating}/5</span>
                          </div>
                        )
                      } else {
                        // Valor textual - pode ser "À prova d'água", "Resistente", etc.
                        value = <span className="text-gray-700 text-xs break-words">{trimmedValue}</span>
                      }
                    } else {
                      // Produto não possui esta especificação
                      value = <span className="text-gray-400 text-xs italic">Não possui</span>
                    }
                    break
                }
                
                return (
                  <div key={product.id} className="text-center">
                    {typeof value === 'string' || typeof value === 'number' ? (
                      <span className="text-gray-700 text-xs break-words font-medium">{value}</span>
                    ) : (
                      value
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Layout - Tabela */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-x-auto -mx-2 sm:-mx-4 sm:mx-0">
        <div className="px-2 sm:px-4 sm:px-0">
          <table className="w-full min-w-[600px] sm:min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="px-1.5 py-1.5 sm:px-3 sm:py-3 text-left font-bold sticky left-0 bg-white z-10 min-w-[100px] sm:min-w-[150px]">
                  <span className="text-[10px] sm:text-sm">Característica</span>
                </th>
                {products.map((product) => (
                  <th key={product.id} className="px-1.5 py-1.5 sm:px-3 sm:py-3 text-center min-w-[120px] sm:min-w-[200px]">
                    <div className="flex flex-col items-center gap-1 sm:gap-3">
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="ml-auto text-gray-400 hover:text-red-600 transition-colors mb-0.5"
                        aria-label="Remover produto"
                      >
                        <X size={14} className="sm:w-5 sm:h-5" />
                      </button>
                      <div className="relative w-12 h-12 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 48px, 128px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg sm:text-4xl">
                            ⌚
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-[10px] sm:text-lg text-center px-0.5 leading-tight line-clamp-2">{product.name}</h3>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          <tbody>
            {comparisonFields.map((field, index) => (
              <tr 
                key={field} 
                className={`border-b transition-colors ${
                  index % 2 === 0 
                    ? 'bg-white hover:bg-gray-50/50' 
                    : 'bg-gray-50/30 hover:bg-gray-50/70'
                }`}
                style={{ height: 'auto' }}
              >
                <td className="px-1.5 py-1 sm:px-3 sm:py-2 font-semibold sticky left-0 bg-white z-10 text-[10px] sm:text-sm border-r border-gray-200 align-top">
                  <span className="text-gray-800 break-words inline-block" style={{ wordBreak: 'break-word' }}>{field}</span>
                </td>
                {products.map((product) => {
                  let value: string | number | React.ReactNode = '—'
                  
                  switch (field) {
                    case 'Nome':
                      value = product.name
                      break
                    case 'Preço':
                      value = formatCurrency(product.price || 0)
                      break
                    case 'Categoria':
                      value = product.category || '—'
                      break
                    default:
                      // Buscar na especificações
                      const specDesktop = product.specifications?.find(s => s.key === field)
                      if (specDesktop && specDesktop.value && specDesktop.value.trim() !== '') {
                        const trimmedValue = specDesktop.value.trim()
                        const rating = parseInt(trimmedValue)
                        const isRating = !isNaN(rating) && rating >= 1 && rating <= 5 && trimmedValue === String(rating)
                        
                        if (isRating) {
                          value = (
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-0.5 sm:py-1">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={12}
                                    className={`sm:w-[18px] sm:h-[18px] ${
                                      star <= rating
                                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                                        : 'fill-gray-200 text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-sm font-semibold text-gray-700">{rating}/5</span>
                            </div>
                          )
                        } else {
                          // Valor textual - pode ser "À prova d'água", "Resistente", etc.
                          value = <span className="text-gray-700 break-words">{trimmedValue}</span>
                        }
                      } else {
                        // Produto não possui esta especificação
                        value = <span className="text-gray-400 italic">Não possui</span>
                      }
                      break
                  }
                  
                  return (
                    <td key={product.id} className="px-1.5 py-1 sm:px-3 sm:py-2 text-center text-[10px] sm:text-sm bg-transparent align-top">
                      {typeof value === 'string' || typeof value === 'number' ? (
                        <span className="text-gray-700 break-words font-medium inline-block" style={{ wordBreak: 'break-word' }}>{value}</span>
                      ) : (
                        value
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Seção de Brindes */}
      {products.length > 0 && Object.values(productGifts).some(gifts => gifts.length > 0) && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="text-pink-500" size={24} />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">🎁 Brindes Inclusos</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => {
              const gifts = productGifts[product.id] || []
              
              return (
                <div key={product.id} className="border rounded-lg p-3">
                  <h3 className="font-semibold text-sm mb-3 text-gray-700 truncate">{product.name}</h3>
                  
                  {gifts.length > 0 ? (
                    <div className="space-y-2">
                      {gifts.map((gift) => (
                        <button
                          key={gift.id}
                          onClick={() => gift.images?.[0] && setSelectedGiftImage({ name: gift.name, image: gift.images[0] })}
                          className="w-full flex items-center gap-2 p-2 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors text-left"
                        >
                          {gift.images?.[0] ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 border">
                              <Image
                                src={gift.images[0]}
                                alt={gift.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              <Gift size={20} className="text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700 truncate">{gift.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-12" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal para visualizar imagem do brinde */}
      <AnimatePresence>
        {selectedGiftImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedGiftImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-4 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Gift className="text-pink-500" size={20} />
                  {selectedGiftImage.name}
                </h3>
                <button
                  onClick={() => setSelectedGiftImage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={selectedGiftImage.image}
                  alt={selectedGiftImage.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé */}
      {footerEnabled && (footerLogo || footerCompanyName || footerWhatsapp || footerInstagram) && (
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col items-center gap-6 py-6">
            {/* Logo */}
            {footerLogo && (
              <div className="relative w-24 h-24">
                <Image
                  src={footerLogo}
                  alt="Logo"
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              </div>
            )}

            {/* Nome da Empresa */}
            {footerCompanyName && (
              <h3 className="text-xl font-bold text-gray-900 text-center">
                {footerCompanyName}
              </h3>
            )}

            {/* Links Sociais */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {footerWhatsapp && (
                <a
                  href={`https://wa.me/${footerWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <MessageCircle size={20} />
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
              )}

              {footerInstagram && (
                <a
                  href={footerInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Instagram size={20} />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
              )}
            </div>
          </div>
        </footer>
      )}

    </div>
  )
}

// Export com Suspense para useSearchParams
export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  )
}

