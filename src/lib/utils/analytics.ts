import { createClient } from '@/lib/supabase/client'

interface TrackEventParams {
  pageType: 'homepage' | 'service' | 'product'
  pageId?: string | null
  pageSlug?: string
  eventType: 'page_view' | 'click' | 'scroll' | 'time_on_page' | 'exit' | 'conversion'
  eventData?: {
    element?: string
    scroll_depth?: number
    time_seconds?: number
    url?: string
    text?: string
    [key: string]: any
  }
}

/**
 * Registra um evento de analytics
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const supabase = createClient() as any
    
    // Gerar ou recuperar session_id
    let sessionId: string | null = null
    if (typeof window !== 'undefined') {
      sessionId = sessionStorage.getItem('analytics_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        sessionStorage.setItem('analytics_session_id', sessionId)
      }
    }

    if (!sessionId) return

    await supabase
      .from('page_analytics')
      .insert({
        page_type: params.pageType,
        page_id: params.pageId || null,
        page_slug: params.pageSlug,
        session_id: sessionId,
        event_type: params.eventType,
        event_data: params.eventData || {},
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        referrer: typeof window !== 'undefined' ? document.referrer || null : null,
      })
  } catch (error) {
    // Silenciosamente falhar - não quebrar a experiência do usuário
    console.error('Erro ao registrar analytics:', error)
  }
}

/**
 * Registra um click em um elemento
 */
export async function trackClick(params: {
  pageType: 'homepage' | 'service' | 'product'
  pageId?: string | null
  pageSlug?: string
  element: string
  url?: string
  text?: string
}): Promise<void> {
  await trackEvent({
    pageType: params.pageType,
    pageId: params.pageId,
    pageSlug: params.pageSlug,
    eventType: 'click',
    eventData: {
      element: params.element,
      url: params.url || (typeof window !== 'undefined' ? window.location.href : ''),
      text: params.text,
    }
  })
}

/**
 * Registra uma conversão (ex: click em CTA principal)
 */
export async function trackConversion(params: {
  pageType: 'homepage' | 'service' | 'product'
  pageId?: string | null
  pageSlug?: string
  element: string
}): Promise<void> {
  await trackEvent({
    pageType: params.pageType,
    pageId: params.pageId,
    pageSlug: params.pageSlug,
    eventType: 'conversion',
    eventData: {
      element: params.element,
    }
  })
}
