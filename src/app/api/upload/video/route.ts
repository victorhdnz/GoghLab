import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar se é um vídeo
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ 
        error: 'Apenas arquivos de vídeo são permitidos' 
      }, { status: 400 })
    }

    // Validar tamanho (máximo 100MB)
    const MAX_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: `Arquivo muito grande. Tamanho máximo: 100MB` 
      }, { status: 400 })
    }

    // Obter cliente Supabase autenticado
    const supabase = createServerClient()

    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Não autenticado. Faça login para fazer upload de vídeos.' 
      }, { status: 401 })
    }

    // Verificar se o usuário tem permissão (admin ou editor)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Erro ao verificar permissões' 
      }, { status: 500 })
    }

    if (profile.role !== 'admin' && profile.role !== 'editor') {
      return NextResponse.json({ 
        error: 'Apenas administradores podem fazer upload de vídeos' 
      }, { status: 403 })
    }

    // Gerar nome único para o arquivo (sanitizado)
    // Remover caracteres especiais e espaços do nome do arquivo original
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Substituir caracteres inválidos por underscore
      .replace(/\s+/g, '_') // Substituir espaços por underscore
      .toLowerCase()
    
    const fileExt = sanitizedName.split('.').pop() || 'mp4'
    // Validar extensão de vídeo
    const validExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    const finalExt = validExtensions.includes(fileExt.toLowerCase()) ? fileExt.toLowerCase() : 'mp4'
    
    // Gerar nome único: timestamp + random + extensão (apenas caracteres alfanuméricos e underscore)
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${finalExt}`
    const filePath = fileName

    // Fazer upload para Supabase Storage usando o File diretamente
    // O Supabase Storage aceita File, Blob ou ArrayBuffer
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || `video/${finalExt}`,
      })

    if (uploadError) {
      console.error('Erro no upload do Supabase:', uploadError)
      
      // Mensagens de erro mais específicas
      let errorMessage = uploadError.message || 'Erro ao fazer upload do vídeo'
      
      // Tratar erros comuns
      if (errorMessage.includes('pattern') || errorMessage.includes('match')) {
        errorMessage = 'Formato de arquivo inválido. Verifique se o arquivo é um vídeo válido.'
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('exists')) {
        errorMessage = 'Um arquivo com este nome já existe. Tente novamente.'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? JSON.stringify(uploadError, null, 2) : undefined
      }, { status: 500 })
    }

    // Obter URL pública do vídeo
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return NextResponse.json({ 
        error: 'Erro ao obter URL do vídeo' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    console.error('Erro no upload de vídeo:', error)
    
    // Garantir que sempre retornamos JSON, mesmo em caso de erro não tratado
    const errorMessage = error?.message || 'Erro ao fazer upload do vídeo'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

