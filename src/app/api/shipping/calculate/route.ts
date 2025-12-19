import { NextRequest, NextResponse } from 'next/server'

const MELHOR_ENVIO_API_URL = 'https://melhorenvio.com.br/api/v2/me'

interface ShippingCalculationRequest {
  from: {
    postal_code: string
  }
  to: {
    postal_code: string
  }
  products: Array<{
    id: string
    width: number
    height: number
    length: number
    weight: number
    insurance_value: number
    quantity: number
  }>
  services?: string
  receipt?: boolean
  own_hand?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const token = process.env.MELHOR_ENVIO_TOKEN

    if (!token) {
      return NextResponse.json(
        { error: 'Token do Melhor Envio não configurado' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { cep, items } = body

    if (!cep || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'CEP e itens são obrigatórios' },
        { status: 400 }
      )
    }

    // CEP de origem (Uberlândia/MG) - Shopping Planalto
    const originCep = '38413-108' // CEP padrão da loja em Uberlândia

    // Preparar produtos para cálculo
    const products = items
      .filter((item: any) => !item.is_gift) // Filtrar brindes
      .map((item: any) => {
        const product = item.product
        // Usar dimensões padrão se não tiver no produto
        const width = product.width || 15 // cm
        const height = product.height || 5 // cm
        const length = product.length || 20 // cm
        const weight = product.weight || 0.3 // kg

        return {
          id: product.id,
          width,
          height,
          length,
          weight,
          insurance_value: product.local_price || 0,
          quantity: item.quantity,
        }
      })

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum produto válido para cálculo de frete' },
        { status: 400 }
      )
    }

    // Calcular dimensões do pacote (considerando múltiplos itens)
    const totalWeight = products.reduce(
      (sum: number, p: any) => sum + p.weight * p.quantity,
      0
    )
    const maxDimensions = products.reduce(
      (max: any, p: any) => ({
        width: Math.max(max.width, p.width),
        height: Math.max(max.height, p.height),
        length: Math.max(max.length, p.length),
      }),
      { width: 0, height: 0, length: 0 }
    )

    // Se houver múltiplos itens, ajustar dimensões
    const totalLength =
      maxDimensions.length +
      maxDimensions.width * Math.min(products.length, 3) * 0.5 // Ajuste para empilhamento

    // Preparar requisição para Melhor Envio
    const shippingRequest: ShippingCalculationRequest = {
      from: {
        postal_code: originCep.replace(/\D/g, ''), // Remover caracteres não numéricos
      },
      to: {
        postal_code: cep.replace(/\D/g, ''), // Remover caracteres não numéricos
      },
      products: [
        {
          id: '1',
          width: Math.ceil(maxDimensions.width),
          height: Math.ceil(maxDimensions.height),
          length: Math.ceil(totalLength),
          weight: Math.max(0.3, Math.ceil(totalWeight * 10) / 10), // Mínimo 0.3kg
          insurance_value: products.reduce(
            (sum: number, p: any) => sum + p.insurance_value * p.quantity,
            0
          ),
          quantity: 1,
        },
      ],
    }

    // Fazer requisição ao Melhor Envio
    // A API do Melhor Envio usa o endpoint /api/v2/me/shipment/calculate
    const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Smart Time Prime (contato@smarttimeprime.com.br)',
      },
      body: JSON.stringify(shippingRequest),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Erro do Melhor Envio:', errorData)
      return NextResponse.json(
        { error: 'Erro ao calcular frete', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Verificar se o CEP é de Uberlândia (38400-000 até 38419-999)
    const cepNum = parseInt(cep.replace(/\D/g, ''))
    const isUberlandia = cepNum >= 38400000 && cepNum <= 38419999

    // Se for Uberlândia, adicionar opção de entrega local fixa R$15
    const shippingOptions: any[] = []
    
    if (isUberlandia) {
      shippingOptions.push({
        id: 'uberlandia-local',
        name: 'Entrega Local Uberlândia',
        price: 15.00,
        currency: 'BRL',
        delivery_time: 0.125, // 3 horas em dias (3/24)
        delivery_range: { min: 0, max: 1 },
        company: 'Smart Time Prime',
        is_local: true,
        description: 'Entrega em até 3 horas (pode ser mais rápido)',
      })
    }

    // Adicionar opções do Melhor Envio (apenas as válidas)
    if (Array.isArray(data)) {
      data.forEach((option: any) => {
        // Filtrar apenas opções válidas (com preço válido)
        if (option.price && !isNaN(option.price) && option.price > 0) {
          shippingOptions.push({
            id: option.id || `me-${Date.now()}-${Math.random()}`,
            name: option.name || 'Frete Padrão',
            price: parseFloat(option.price),
            currency: option.currency || 'BRL',
            delivery_time: option.delivery_time || option.delivery_range?.min || 0,
            delivery_range: option.delivery_range,
            company: option.company?.name || 'Desconhecida',
            is_local: false,
          })
        }
      })
    }

    // Ordenar: local primeiro, depois por preço
    shippingOptions.sort((a, b) => {
      if (a.is_local) return -1
      if (b.is_local) return 1
      return a.price - b.price
    })

    return NextResponse.json({ options: shippingOptions })
  } catch (error: any) {
    console.error('Erro ao calcular frete:', error)
    return NextResponse.json(
      { error: 'Erro interno ao calcular frete', details: error.message },
      { status: 500 }
    )
  }
}
