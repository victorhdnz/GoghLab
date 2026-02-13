import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const TAB_IDS = ['foto', 'video', 'roteiro', 'vangogh'] as const
type TabId = (typeof TAB_IDS)[number]

const XAI_BASE = 'https://api.x.ai/v1'

/** Mensagem genérica para o usuário quando a falha for do serviço (API não configurada, sem saldo no provedor, etc.). Não expõe detalhes internos. */
const SERVICE_ERROR_MESSAGE =
  'Ocorreu uma instabilidade ao processar sua solicitação. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.'

function isXaiModel(modelKey: string | null): boolean {
  return !!modelKey && modelKey.startsWith('xai/')
}

function getXaiModelId(modelKey: string): string {
  return modelKey.replace(/^xai\//, '')
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    let body: { tab?: string; prompt?: string; modelId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    const tab = TAB_IDS.includes(body.tab as TabId) ? (body.tab as TabId) : 'foto'
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const modelId = typeof body.modelId === 'string' ? body.modelId : null

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 })
    }

    const { data: modelRow, error: modelError } = await (supabase as any)
      .from('creation_ai_models')
      .select('id, name, model_key, can_image, can_video, can_prompt')
      .eq('id', modelId)
      .eq('is_active', true)
      .maybeSingle()

    if (modelError || !modelRow) {
      return NextResponse.json({ error: 'Modelo não encontrado ou inativo' }, { status: 400 })
    }

    const modelKey: string | null = modelRow.model_key ?? null
    if (!modelKey) {
      return NextResponse.json({
        error: 'Este modelo não suporta geração pela API.',
        code: 'MODEL_NOT_SUPPORTED',
      }, { status: 400 })
    }

    const useXai = isXaiModel(modelKey)
    if (useXai) {
      if (!process.env.XAI_API_KEY) {
        console.error('[creation/generate] XAI_API_KEY não configurada')
        return NextResponse.json({
          error: SERVICE_ERROR_MESSAGE,
          code: 'XAI_NOT_CONFIGURED',
        }, { status: 503 })
      }
    } else if (!modelKey.startsWith('openai/')) {
      return NextResponse.json({
        error: 'Este modelo não suporta geração pela API. Escolha um modelo da lista.',
        code: 'MODEL_NOT_SUPPORTED',
      }, { status: 400 })
    } else if (!process.env.OPENAI_API_KEY) {
      console.error('[creation/generate] OPENAI_API_KEY não configurada')
      return NextResponse.json({
        error: SERVICE_ERROR_MESSAGE,
        code: 'OPENAI_NOT_CONFIGURED',
      }, { status: 503 })
    }

    const openai = useXai ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const openaiModelId = !useXai ? modelKey.replace(/^openai\//, '') : ''
    const xaiModelId = useXai ? getXaiModelId(modelKey) : ''

    // --- xAI: foto (imagem)
    if (useXai && tab === 'foto') {
      if (!modelRow.can_image) {
        return NextResponse.json({ error: 'Modelo não disponível para criação de foto' }, { status: 400 })
      }
      if (xaiModelId !== 'grok-imagine-image') {
        return NextResponse.json({ error: 'Use o modelo Grok Imagine (imagem) para foto.' }, { status: 400 })
      }
      const res = await fetch(`${XAI_BASE}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-imagine-image',
          prompt,
          response_format: 'b64_json',
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        console.error('[creation/generate] xAI image error:', res.status, errText)
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const data = await res.json()
      const b64 = data?.data?.[0]?.b64_json ?? data?.data?.[0]?.image
      if (!b64) {
        console.error('[creation/generate] xAI: nenhuma imagem retornada')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({
        ok: true,
        type: 'image',
        imageBase64: b64,
        contentType: 'image/png',
      })
    }

    // --- xAI: vídeo
    if (useXai && tab === 'video') {
      if (!modelRow.can_video) {
        return NextResponse.json({ error: 'Modelo não disponível para vídeo' }, { status: 400 })
      }
      if (xaiModelId !== 'grok-imagine-video') {
        return NextResponse.json({ error: 'Use o modelo Grok Imagine (vídeo) para vídeo.' }, { status: 400 })
      }
      const res = await fetch(`${XAI_BASE}/videos/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-imagine-video',
          prompt,
          duration: 8,
          aspect_ratio: '16:9',
          resolution: '720p',
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        console.error('[creation/generate] xAI video error:', res.status, errText)
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const videoJob = await res.json()
      const requestId = videoJob?.request_id
      if (!requestId) {
        console.error('[creation/generate] xAI: resposta sem request_id')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({
        ok: true,
        type: 'video',
        videoId: `xai:${requestId}`,
        status: 'pending',
        message: 'Vídeo em geração. Use o endpoint de status para verificar e baixar quando pronto.',
      })
    }

    // --- xAI: texto (roteiro / vangogh)
    if (useXai && (tab === 'roteiro' || tab === 'vangogh')) {
      const forPrompt = tab === 'vangogh'
      if (!modelRow.can_prompt) {
        return NextResponse.json(
          { error: tab === 'roteiro' ? 'Modelo não disponível para roteiro.' : 'Modelo não disponível para criação de prompts.' },
          { status: 400 }
        )
      }
      const systemContent = forPrompt
        ? 'Gere um prompt criativo e detalhado para criação de conteúdo (imagem ou vídeo) com base no pedido do usuário. Responda apenas com o texto do prompt, sem explicações extras.'
        : 'Você é um roteirista. Elabore um roteiro de vídeo (cenas, falas, indicações) com base no pedido do usuário. Seja objetivo e criativo.'
      const res = await fetch(`${XAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: xaiModelId || 'grok-4-latest',
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          stream: false,
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        console.error('[creation/generate] xAI chat error:', res.status, errText)
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content?.trim() || '(Nenhum texto retornado.)'
      return NextResponse.json({
        ok: true,
        type: 'text',
        text,
      })
    }

    // --- OpenAI: foto
    if (!useXai && tab === 'foto') {
      if (!modelRow.can_image) {
        return NextResponse.json({ error: 'Modelo não disponível para criação de foto' }, { status: 400 })
      }
      const isImageModel =
        openaiModelId.startsWith('gpt-image') ||
        openaiModelId.startsWith('dall-e')
      if (!isImageModel) {
        return NextResponse.json({ error: 'Modelo não é de imagem. Use um modelo de foto.' }, { status: 400 })
      }

      const response = await openai!.images.generate({
        model: openaiModelId as 'gpt-image-1' | 'gpt-image-1.5' | 'dall-e-2' | 'dall-e-3',
        prompt,
        n: 1,
        response_format: 'b64_json',
        size: '1024x1024',
      })

      const b64 = response.data?.[0]?.b64_json
      if (!b64) {
        console.error('[creation/generate] Nenhuma imagem retornada pela API')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({
        ok: true,
        type: 'image',
        imageBase64: b64,
        contentType: 'image/png',
      })
    }

    // --- OpenAI: vídeo
    if (!useXai && tab === 'video') {
      if (!modelRow.can_video) {
        return NextResponse.json({ error: 'Modelo não disponível para vídeo' }, { status: 400 })
      }
      const isSora = openaiModelId.startsWith('sora-')
      if (!isSora) {
        return NextResponse.json({ error: 'Modelo não é de vídeo. Use Sora 2 ou Sora 2 Pro.' }, { status: 400 })
      }

      const form = new FormData()
      form.append('model', openaiModelId)
      form.append('prompt', prompt)
      form.append('size', '1280x720')
      form.append('seconds', '8')
      const res = await fetch('https://api.openai.com/v1/videos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[creation/generate] Erro API de vídeo:', res.status, errText)
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }

      const videoJob = await res.json()
      const videoId = videoJob?.id ?? videoJob?.video_id
      if (!videoId) {
        console.error('[creation/generate] Resposta da API de vídeo sem ID')
        return NextResponse.json({ error: SERVICE_ERROR_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({
        ok: true,
        type: 'video',
        videoId,
        status: videoJob?.status ?? 'queued',
        message: 'Vídeo em geração. Use o endpoint de status para verificar e baixar quando pronto.',
      })
    }

    // --- OpenAI: roteiro / vangogh
    if (!useXai && (tab === 'roteiro' || tab === 'vangogh')) {
      const forPrompt = tab === 'vangogh'
      if (!modelRow.can_prompt) {
        return NextResponse.json(
          { error: tab === 'roteiro' ? 'Modelo não disponível para roteiro (use modelo de texto)' : 'Modelo não disponível para criação de prompts' },
          { status: 400 }
        )
      }

      const textModel = openaiModelId.startsWith('gpt-') && !openaiModelId.startsWith('gpt-image')
      if (!textModel) {
        return NextResponse.json({
          error: 'Para texto/roteiro use um modelo de linguagem (ex.: GPT-5 ou GPT-4.1).',
          code: 'MODEL_NOT_SUPPORTED',
        }, { status: 400 })
      }

      const instructions = forPrompt
        ? 'Gere um prompt criativo e detalhado para criação de conteúdo (imagem ou vídeo) com base no pedido do usuário. Responda apenas com o texto do prompt, sem explicações extras.'
        : 'Você é um roteirista. Elabore um roteiro de vídeo (cenas, falas, indicações) com base no pedido do usuário. Seja objetivo e criativo.'

      const response = await openai!.responses.create({
        model: openaiModelId as string,
        instructions,
        input: prompt,
      })

      const output = response.output ?? []
      let text = ''
      for (const item of output) {
        if (item?.type === 'message' && Array.isArray((item as any).content)) {
          for (const block of (item as any).content) {
            if (block?.type === 'output_text' && typeof block.text === 'string') {
              text += block.text
            }
          }
        }
      }
      if ((response as any).output_text) {
        text = (response as any).output_text
      }
      if (!text.trim()) {
        text = '(Nenhum texto retornado.)'
      }
      return NextResponse.json({
        ok: true,
        type: 'text',
        text,
      })
    }

    return NextResponse.json({ error: 'Aba não suportada' }, { status: 400 })
  } catch (e: any) {
    console.error('[creation/generate]', e)
    return NextResponse.json(
      { error: SERVICE_ERROR_MESSAGE },
      { status: 503 }
    )
  }
}
