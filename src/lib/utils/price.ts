// Utilitários para cálculo de preços

import { Product } from '@/types'

export const getProductPrice = (product: Product, isUberlandia: boolean): number => {
  return product.price || 0
}

export const calculateCartTotal = (
  items: Array<{ product: Product; quantity: number; isUberlandia: boolean; is_gift?: boolean }>
): number => {
  return items.reduce((total, item) => {
    if (item.is_gift) return total
    const price = getProductPrice(item.product, item.isUberlandia)
    return total + price * item.quantity
  }, 0)
}

export const calculateDiscount = (originalPrice: number, discountPrice: number): number => {
  if (originalPrice <= discountPrice) return 0
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
}

