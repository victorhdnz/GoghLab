'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Heart, GitCompare } from 'lucide-react'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils/format'
// Removido: useCart (e-commerce não utilizado)
import Link from 'next/link'
import Image from 'next/image'

interface FeaturedProductsProps {
  products: Product[]
  title?: string
  subtitle?: string
}

export const FeaturedProducts = ({
  products,
  title = 'Produtos em Destaque',
  subtitle = 'Conheça nossos relógios mais populares',
}: FeaturedProductsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!products || products.length === 0) {
    return null
  }

  // Mostrar 4 produtos por vez no desktop, 2 no tablet, 1 no mobile
  const itemsPerPage = 4
  const totalPages = Math.ceil(products.length / itemsPerPage)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const getCurrentProducts = () => {
    const start = currentIndex * itemsPerPage
    return products.slice(start, start + itemsPerPage)
  }

  // Removido: handleAddToCart (e-commerce não utilizado)

  return (
    <section className="py-20" style={{ backgroundColor: 'transparent' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">{title}</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">{subtitle}</p>
          <div className="w-24 h-1 bg-gray-900 mx-auto mt-6" />
        </motion.div>

        <div className="relative">
          {/* Navigation Arrows */}
          {totalPages > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
                aria-label="Produto anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
                aria-label="Próximo produto"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getCurrentProducts().map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Link href={`/produtos/${product.id}`}>
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <div className="text-6xl">⌚</div>
                      </div>
                    )}
                  </Link>
                  
                  {/* Wishlist Button */}
                  <button className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors">
                    <Heart size={18} className="text-gray-600 hover:text-red-500" />
                  </button>

                  {/* Featured Badge */}
                  {product.is_featured && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star size={12} />
                      Destaque
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <Link href={`/produtos/${product.id}`}>
                    <h3 className="text-lg font-semibold mb-2 hover:text-gray-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(product.price || 0)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href="/comparar"
                      className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <GitCompare size={16} />
                      Comparar
                    </Link>
                    <Link
                      href={`/produtos/${product.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Dots */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-black' : 'bg-gray-300'
                  }`}
                  aria-label={`Ir para página ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Products Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/produtos"
            className="inline-block bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
          >
            Ver Todos os Produtos
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

