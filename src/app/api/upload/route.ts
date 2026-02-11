import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Formatos permitidos para imagens
const ALLOWED_IMAGE_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB (conforme exemplo fornecido)

// Validar tipo de arquivo (mais robusto)
function isValidImageFile(file: File): boolean {
  // Verificar MIME type
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validMimeTypes.includes(file.type) && !file.type.startsWith('image/')) {
    return false
  }
  
  // Verificar extensão do arquivo também (para casos onde MIME type pode estar incorreto)
  const fileName = file.name.toLowerCase()
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
  
  return hasValidExtension
}

// Validar tamanho do arquivo
// Vídeos: sem limite (removido para permitir alta qualidade)
// Imagens: 5MB
function isValidFileSize(size: number, isVideo: boolean = false): boolean {
  if (isVideo) {
    // Sem limite para vídeos
    return true
  }
  // 5MB para imagens
  return size <= MAX_FILE_SIZE
}

// Detectar se é vídeo por MIME ou por extensão (iOS pode enviar file.type vazio)
function isVideoFile(file: File): boolean {
  if (file.type && file.type.startsWith('video/')) return true
  const name = (file.name || '').toLowerCase()
  return /\.(mp4|mov|m4v|webm|ogg|avi|mkv)$/.test(name)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'mv-company'
    const isBanner = formData.get('isBanner') === 'true'
    const isHighQuality = formData.get('isHighQuality') === 'true'
    const preserveTransparency = formData.get('preserveTransparency') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Verificar configuração do Cloudinary (tentar ambos nomes de variáveis)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary não configurado:', {
        cloudName: !!cloudName,
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
        envVars: {
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
        }
      })
      return NextResponse.json({ 
        error: 'Cloudinary não configurado corretamente. Verifique as variáveis de ambiente.' 
      }, { status: 500 })
    }

    // Detectar tipo de arquivo (por MIME ou extensão — iOS pode enviar type vazio)
    const isVideo = isVideoFile(file)
    const resourceType = isVideo ? 'video' : 'image'

    // Validar tipo de arquivo
    if (!isVideo && !isValidImageFile(file)) {
      return NextResponse.json({ 
        error: `Apenas arquivos de imagem são permitidos. Formatos aceitos: ${ALLOWED_IMAGE_FORMATS.join(', ').toUpperCase()}. Tipo de arquivo recebido: ${file.type || 'desconhecido'}, Nome: ${file.name}` 
      }, { status: 400 })
    }

    // Validar tamanho (apenas para imagens, vídeos sem limite)
    if (!isValidFileSize(file.size, isVideo)) {
      // Apenas imagens têm limite (5MB)
      return NextResponse.json({ 
        error: `Arquivo muito grande. Tamanho máximo: 5MB para imagens` 
      }, { status: 400 })
    }

    // Converter File para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Configurar opções de upload (seguindo lógica do exemplo fornecido)
    const uploadOptions: any = {
      folder: folder || 'mv-company',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    }

    // Aplicar transformações para imagens
    if (!isVideo) {
      // Detectar se é PNG/WebP (formato com transparência)
      const fileName = file.name.toLowerCase()
      const isTransparentFormat = preserveTransparency || 
                                  fileName.endsWith('.png') || 
                                  fileName.endsWith('.webp') || 
                                  fileName.endsWith('.gif') ||
                                  file.type === 'image/png' ||
                                  file.type === 'image/webp' ||
                                  file.type === 'image/gif'
      
      // Para banners grandes (1920x650) ou imagens de alta qualidade, não aplicar nenhuma transformação para manter qualidade máxima
      if (isBanner || isHighQuality) {
        // Para banners e imagens de alta qualidade, não aplicar transformações - manter tamanho e qualidade original
        // O Cloudinary manterá a imagem no tamanho original sem compressão
        if (isTransparentFormat) {
          uploadOptions.allowed_formats = ['png', 'webp', 'gif'] // Preservar formatos com transparência
        } else {
          uploadOptions.allowed_formats = ALLOWED_IMAGE_FORMATS
        }
      } else {
        // Para imagens menores, aplicar limitação padrão
        if (isTransparentFormat) {
          // Para imagens com transparência, usar PNG e preservar transparência
          uploadOptions.transformation = [
            { width: 800, height: 600, crop: 'limit' }, // Limitar tamanho mas manter proporção
            { format: 'png' } // Forçar PNG para preservar transparência
          ]
          uploadOptions.allowed_formats = ['png', 'webp', 'gif'] // Preservar formatos com transparência
        } else {
          // Para imagens sem transparência, usar JPEG com compressão
          uploadOptions.transformation = [
            { width: 800, height: 600, crop: 'limit' }, // Limitar tamanho mas manter proporção
            { quality: 'auto:good' } // Otimização automática de qualidade
          ]
          uploadOptions.allowed_formats = ALLOWED_IMAGE_FORMATS
        }
      }
    } else {
      // Para vídeos, configurações básicas de upload
      // Transformações podem ser aplicadas via URL quando necessário
      uploadOptions.resource_type = 'video'
      uploadOptions.fetch_format = 'auto' // Formato automático otimizado
      uploadOptions.quality = 'auto' // Qualidade automática
      // Removendo eager transformations para evitar erro de formato
      // Se necessário, aplicar transformações via URL: /video/upload/w_1920,h_1080,c_limit,q_auto/
    }

    // Upload para Cloudinary usando upload_stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Erro no upload do Cloudinary:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      uploadStream.end(buffer)
    })

    const uploadResult = result as any

    console.log('Upload realizado com sucesso:', {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      size: file.size,
      format: uploadResult.format,
    })

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
    })
  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao fazer upload',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID não fornecido' }, { status: 400 })
    }

    // Verificar configuração do Cloudinary
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary não configurado' }, { status: 500 })
    }

    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      console.log('Imagem deletada com sucesso:', publicId)
      return NextResponse.json({ 
        success: true,
        message: 'Imagem deletada com sucesso!' 
      })
    } else {
      return NextResponse.json({ 
        error: 'Erro ao deletar imagem',
        result: result.result 
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Erro ao deletar:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar' },
      { status: 500 }
    )
  }
}

// Rota de teste para verificar se o serviço de upload está funcionando
export async function GET(request: NextRequest) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  return NextResponse.json({ 
    message: 'Serviço de upload funcionando!', 
    cloudinaryConfigured: !!cloudName && !!apiKey && !!apiSecret,
    cloudName: cloudName || 'não configurado',
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
  })
}

