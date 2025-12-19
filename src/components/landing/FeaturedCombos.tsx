'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Star, Percent, ChevronLeft, ChevronRight, Eye, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { getProductPrice } from '@/lib/utils/price'
import { useUserLocation } from '@/hooks/useUserLocation'
import { useAuth } from '@/hooks/useAuth'
import { Product } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ComboItem {
  id: string
  product_id: string
  quantity: number
  product?: {
    id: string
    name: string
    price: number
    images: string[]
  }
}

interface Combo {
  id: string
  name: string
  description: string
  slug?: string
  discount_percentage: number
  discount_amount: number
  final_price: number
  is_active: boolean
  is_featured: boolean
  combo_items?: ComboItem[]
  comboProduct?: {
    price: number
  }
}

interface FeaturedCombosProps {
  combos: Combo[]
  title?: string
  subtitle?: string
}

export const FeaturedCombos = ({
  combos,
  title = 'Combos em Destaque',
  subtitle = 'Economize mais comprando nossos kits promocionais',
}: FeaturedCombosProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [comboProducts, setComboProducts] = useState<Record<string, { price: number }>>({})
  const [showAddressModal, setShowAddressModal] = useState(false)
  const { isUberlandia, needsAddress, loading: locationLoading } = useUserLocation()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Buscar produtos combo para obter preços baseados na localização
  useEffect(() => {
    const loadComboProducts = async () => {
      const productsMap: Record<string, { price: number }> = {}
      
      await Promise.all(
        combos.map(async (combo) => {
          if (!combo.slug) return
          try {
            const { data: productData } = await supabase
              .from('products')
              .select('price')
              .eq('slug', combo.slug)
              .eq('category', 'Combos')
              .maybeSingle()
            
            if (productData) {
              productsMap[combo.id] = {
                price: productData.price || 0
              }
            }
          } catch (error) {
            console.error('Erro ao buscar produto combo:', error)
          }
        })
      )
      
      setComboProducts(productsMap)
    }
    
    if (combos.length > 0) {
      loadComboProducts()
    }
  }, [combos, supabase])

  if (!combos || combos.length === 0) {
    return null
  }

  // Mostrar 3 combos por vez no desktop, 2 no tablet, 1 no mobile
  const itemsPerPage = 3
  const totalPages = Math.ceil(combos.length / itemsPerPage)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const getCurrentCombos = () => {
    const start = currentIndex * itemsPerPage
    return combos.slice(start, start + itemsPerPage)
  }

  const calculateOriginalPrice = (combo: Combo) => {
    return combo.combo_items?.reduce((sum, item) => {
      if (!item.product) return sum
      const itemPrice = item.product.price || 0
      return sum + itemPrice * item.quantity
    }, 0) || 0
  }

  const calculateSavings = (combo: Combo) => {
    const originalPrice = calculateOriginalPrice(combo)
    const comboProduct = comboProducts[combo.id]
    const finalPrice = comboProduct 
      ? comboProduct.price
      : combo.final_price
    return originalPrice - finalPrice
  }

  const getComboFinalPrice = (combo: Combo) => {
    const comboProduct = comboProducts[combo.id]
    return comboProduct 
      ? comboProduct.price
      : combo.final_price
  }


  return (
    <section className="py-20" style={{ backgroundColor: 'transparent' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
          <div className="w-24 h-1 bg-black mx-auto mt-6" />
        </motion.div>

        <div className="relative">
          {/* Navigation Arrows */}
          {totalPages > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
                aria-label="Combo anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
                aria-label="Próximo combo"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Combos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getCurrentCombos().map((combo, index) => {
            const originalPrice = calculateOriginalPrice(combo)
            const finalPrice = getComboFinalPrice(combo)
            const savings = originalPrice - finalPrice
            const discountPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0

            return (
                <motion.div
                  key={combo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                {/* Header with Badge */}
                <div className="relative p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package size={20} />
                      <span className="text-sm font-semibold uppercase tracking-wide">Combo</span>
                    </div>
                    {combo.is_featured && (
                      <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                        <Star size={12} />
                        Destaque
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{combo.name}</h3>
                  <p className="text-green-100 text-sm">{combo.description}</p>
                </div>

                {/* Products Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {combo.combo_items?.slice(0, 4).map((item, itemIndex) => (
                      <div key={item.id} className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg overflow-hidden">
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              ⌚
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.quantity}x {item.product?.name?.substring(0, 15)}
                          {item.product?.name && item.product.name.length > 15 ? '...' : ''}
                        </div>
                      </div>
                    ))}
                  </div>

                  {combo.combo_items && combo.combo_items.length > 4 && (
                    <div className="text-center text-sm text-gray-500 mb-4">
                      +{combo.combo_items.length - 4} produtos adicionais
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="space-y-2 mb-4">
                    {!needsAddress && !locationLoading && originalPrice > finalPrice && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Preço individual:</span>
                        <span className="text-gray-500 line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                      </div>
                    )}
                    
                    {!needsAddress && !locationLoading && discountPercentage > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 font-semibold flex items-center gap-1">
                          <Percent size={14} />
                          Desconto:
                        </span>
                        <span className="text-green-600 font-bold">
                          -{discountPercentage}% (Economize {formatCurrency(savings)})
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Preço do combo:</span>
                      {needsAddress && !locationLoading && isAuthenticated ? (
                        <button
                          onClick={() => setShowAddressModal(true)}
                          className="relative cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Eye size={20} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                            <span className="text-2xl font-bold text-gray-400 blur-sm select-none">
                              {formatCurrency(finalPrice)}
                            </span>
                            <MapPin size={16} className="text-gray-400" />
                          </div>
                        </button>
                      ) : !isAuthenticated ? (
                        <div className="text-left">
                          <span className="text-2xl font-bold text-gray-400 blur-sm select-none">
                            {formatCurrency(finalPrice)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Faça login para ver o preço
                          </p>
                        </div>
                      ) : (
                        <div className="text-left">
                          <span className="text-2xl font-bold text-green-600">
                            {locationLoading 
                              ? 'Carregando...' 
                              : formatCurrency(finalPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/combos/${combo.id}`}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
             })}
           </div>

           {/* Pagination Dots */}
           {totalPages > 1 && (
             <div className="flex justify-center mt-8 gap-2">
               {Array.from({ length: totalPages }).map((_, index) => (
                 <button
                   key={index}
                   onClick={() => setCurrentIndex(index)}
                   className={`w-3 h-3 rounded-full transition-colors ${
                     index === currentIndex ? 'bg-green-600' : 'bg-gray-300'
                   }`}
                   aria-label={`Ir para página ${index + 1}`}
                 />
               ))}
             </div>
           )}
         </div>
      </div>

      {/* Modal de Cadastro de Endereço */}
      {typeof window !== 'undefined' && showAddressModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
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
                  Para visualizar o preço do combo, precisamos do seu endereço
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
    </section>
  )
}