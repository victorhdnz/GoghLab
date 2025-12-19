// Cálculo de frete

import axios from 'axios'

export interface ShippingParams {
  cep: string
  weight: number
  width: number
  height: number
  length: number
}

export interface ShippingResult {
  price: number
  days: number
  method: 'local' | 'national'
  service?: string
}

const UBERLANDIA_CEP_PREFIX = process.env.NEXT_PUBLIC_CEP_UBERLANDIA || '38400'
const LOCAL_SHIPPING_PRICE = parseFloat(process.env.NEXT_PUBLIC_FRETE_UBERLANDIA || '15')

export const isUberlandia = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '')
  return cleanCep.startsWith(UBERLANDIA_CEP_PREFIX)
}

export const calculateShipping = async (params: ShippingParams): Promise<ShippingResult> => {
  const { cep } = params

  // Verifica se é Uberlândia
  if (isUberlandia(cep)) {
    return {
      price: LOCAL_SHIPPING_PRICE,
      days: 1,
      method: 'local',
      service: 'Entrega Local',
    }
  }

  // Cálculo via Melhor Envio para outras cidades
  try {
    const response = await axios.post('/api/shipping/calculate', params)
    return {
      price: response.data.price,
      days: response.data.days,
      method: 'national',
      service: response.data.service,
    }
  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    throw new Error('Não foi possível calcular o frete. Tente novamente.')
  }
}

export const validateCEP = async (cep: string): Promise<{
  valid: boolean
  address?: {
    street: string
    neighborhood: string
    city: string
    state: string
  }
}> => {
  const cleanCep = cep.replace(/\D/g, '')

  if (cleanCep.length !== 8) {
    return { valid: false }
  }

  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`)
    
    if (response.data.erro) {
      return { valid: false }
    }

    return {
      valid: true,
      address: {
        street: response.data.logradouro,
        neighborhood: response.data.bairro,
        city: response.data.localidade,
        state: response.data.uf,
      },
    }
  } catch (error) {
    return { valid: false }
  }
}

