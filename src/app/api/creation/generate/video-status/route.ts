import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const dynamic = 'force-dynamic'

const XAI_BASE = 'https://api.x.ai/v1'

const SERVICE_ERROR_MESSAGE =
  'Ocorreu uma instabilidade ao processar sua solicitação. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.'

/** GET ?videoId=xxx — retorna status e, se completed, o vídeo em base64. videoId pode ser "xai:request_id" ou "google:operations/xxx" (Veo). */
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawVideoId = searchParams.get('videoId')
    if (!rawVideoId) {
      return NextResponse.json({ error: 'videoId é obrigatório' }, { status: 400 })
    }

    const isGoogle = rawVideoId.startsWith('google:')
    const isXai = rawVideoId.startsWith('xai:')
    const videoId = isGoogle ? rawVideoId.slice(7) : isXai ? rawVideoId.slice(4) : rawVideoId

    if (isGoogle) {
      if (!process.env.GEMINI_API_KEY) {
        console.error('[video-status] GEMINI_API_KEY não configurada')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      // A API só precisa de operation.name para buscar o status; o tipo do SDK exige a classe completa
      const operation = await ai.operations.getVideosOperation({
        operation: { name: videoId } as any,
      })
      const done = (operation as any).done === true
      if (!done) {
        return NextResponse.json({
          ok: true,
          status: 'pending',
          progress: 0,
        })
      }
      const response = (operation as any).response
      const videoFile = response?.generatedVideos?.[0]?.video
      if (!videoFile) {
        console.error('[video-status] Google Veo: sem vídeo na resposta')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const tmpPath = path.join(os.tmpdir(), `veo-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`)
      try {
        await ai.files.download({
          file: videoFile,
          downloadPath: tmpPath,
        })
        const buffer = fs.readFileSync(tmpPath)
        const base64 = buffer.toString('base64')
        return NextResponse.json({
          ok: true,
          status: 'completed',
          videoBase64: base64,
          contentType: 'video/mp4',
        })
      } finally {
        try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
      }
    }

    if (isXai) {
      if (!process.env.XAI_API_KEY) {
        console.error('[video-status] XAI_API_KEY não configurada')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const statusRes = await fetch(`${XAI_BASE}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      })
      if (!statusRes.ok) {
        const err = await statusRes.text()
        console.error('[video-status] xAI vídeo:', statusRes.status, err)
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const statusData = await statusRes.json()
      const status = statusData?.status ?? 'unknown'
      const completed = status === 'done'

      if (!completed) {
        return NextResponse.json({
          ok: true,
          status: status === 'done' ? 'completed' : status === 'expired' ? 'failed' : 'pending',
          progress: completed ? 100 : 0,
          message: status === 'expired' ? SERVICE_ERROR_MESSAGE : undefined,
        })
      }

      const videoUrl = statusData?.video?.url
      if (!videoUrl) {
        console.error('[video-status] xAI: sem URL do vídeo')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const contentRes = await fetch(videoUrl)
      if (!contentRes.ok) {
        console.error('[video-status] xAI download:', contentRes.status)
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
