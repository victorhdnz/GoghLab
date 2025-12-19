'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

interface ComparisonStore {
  products: Product[]
  addProduct: (product: Product) => void
  removeProduct: (productId: string) => void
  clearComparison: () => void
  canAddMore: () => boolean
}

export const useProductComparison = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      products: [],
      
      addProduct: (product) => {
        const { products } = get()
        // Verificar se já está na lista
        if (products.find(p => p.id === product.id)) {
          return
        }
        // Limitar a 2 produtos
        if (products.length >= 2) {
          return
        }
        set({ products: [...products, product] })
      },
      
      removeProduct: (productId) => {
        set({ products: get().products.filter(p => p.id !== productId) })
      },
      
      clearComparison: () => {
        set({ products: [] })
      },
      
      canAddMore: () => {
        return get().products.length < 2
      },
    }),
    {
      name: 'product-comparison-storage',
    }
  )
)

