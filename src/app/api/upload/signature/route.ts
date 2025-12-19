import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Gerar assinatura para upload direto do cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { folder = 'mv-company', resourceType = 'auto' } = body
    
    // Debug: verificar valores recebidos
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 Body recebido:', body)
      console.log('📥 folder:', folder)
      console.log('📥 resourceType:', resourceType, typeof resourceType)
    }

    // Verificar configuração do Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ 
        error: 'Cloudinary não configurado corretamente' 
      }, { status: 500 })
    }

    // Gerar timestamp
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Parâmetros para assinatura - TODOS os parâmetros enviados no upload devem estar aqui
    // IMPORTANTE: Os parâmetros devem estar em ordem alfabética para a assinatura funcionar
    // E TODOS os parâmetros que serão enviados no FormData (exceto file, api_key, signature) devem estar aqui
    
    // Construir parâmetros - ordem alfabética: folder, resource_type, timestamp
    // É CRÍTICO incluir TODOS os parâmetros que serão enviados no FormData
    const params: Record<string, string | number> = {}
    
    // Adicionar folder (sempre presente)
    params.folder = folder
    
    // Adicionar resource_type - CRÍTICO para vídeos
    // Se resourceType for 'video', 'image', etc., DEVE estar incluído na assinatura
    // Para vídeos, resource_type é obrigatório na assinatura
    // SEMPRE incluir quando não for 'auto' (inclui 'video', 'image', etc.)
    if (resourceType && resourceType !== 'auto') {
      const trimmedResourceType = String(resourceType).trim()
      if (trimmedResourceType !== '') {
        params.resource_type = trimmedResourceType
      }
    }
    
    // Adicionar timestamp (sempre presente)
    params.timestamp = timestamp
    
    // Debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Gerando assinatura:')
      console.log('- resourceType recebido:', resourceType, 'tipo:', typeof resourceType)
      console.log('- folder recebido:', folder)
      console.log('- Parâmetros para assinatura ANTES:', params)
      console.log('- resource_type incluído?', 'resource_type' in params)
      console.log('- Chaves em ordem alfabética:', Object.keys(params).sort())
    }

    // Gerar assinatura usando o método correto do Cloudinary
    // A função api_sign_request automaticamente ordena os parâmetros alfabeticamente
    const signature = cloudinary.utils.api_sign_request(
      params,
      apiSecret!
    )
    
    // Debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('- Assinatura gerada com sucesso')
    }

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
    })
  } catch (error: any) {
    console.error('Erro ao gerar assinatura:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar assinatura de upload' },
      { status: 500 }
    )
  }
}

