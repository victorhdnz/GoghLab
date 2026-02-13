import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SERVICE_ERROR_MESSAGE =
  'Ocorreu uma instabilidade ao processar sua solicitação. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.'

/** GET ?videoId=xxx — retorna status e, se completed, o vídeo em base64. */
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    if (!videoId) {
      return NextResponse.json({ error: 'videoId é obrigatório' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[video-status] OPENAI_API_KEY não configurada')
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }

    const statusRes = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    })
    if (!statusRes.ok) {
      const err = await statusRes.text()
      console.error('[video-status] Erro ao consultar vídeo:', statusRes.status, err)
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }
    const statusData = await statusRes.json()
    const status = statusData?.status ?? 'unknown'

    if (status !== 'completed') {
      return NextResponse.json({
        ok: true,
        status,
        progress: statusData?.progress ?? 0,
        message: status === 'failed' ? SERVICE_ERROR_MESSAGE : undefined,
      })
    }

    const contentRes = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    })
    if (!contentRes.ok) {
      console.error('[video-status] Erro ao baixar vídeo:', contentRes.status)
      return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
    }
    const buffer = await contentRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = contentRes.headers.get('content-type') || 'video/mp4'

    return NextResponse.json({
      ok: true,
      status: 'completed',
      videoBase64: base64,
      contentType,
    })
  } catch (e: any) {
    console.error('[creation/generate/video-status]', e)
    return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
  }
}
