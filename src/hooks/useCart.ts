'use client'

// Hook de carrinho removido - sistema de e-commerce não utilizado
// Mantido apenas para evitar erros de importação

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, ProductColor } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, color?: ProductColor, quantity?: number) => Promise<void>
  removeItem: (productId: string, colorId?: string) => void
  updateQuantity: (productId: string, quantity: number, colorId?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [] as CartItem[],
      addItem: async () => {
        // Função desabilitada - carrinho não utilizado
      },
      removeItem: () => {
        // Função desabilitada - carrinho não utilizado
      },
      updateQuantity: () => {
        // Função desabilitada - carrinho não utilizado
      },
      clearCart: () => {
        // Função desabilitada - carrinho não utilizado
      },
      getTotal: () => 0,
      getItemCount: () => 0,
    }),
    {
      name: 'cart-storage',
    }
  )
)
