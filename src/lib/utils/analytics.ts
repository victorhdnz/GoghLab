import { createClient } from '@/lib/supabase/client'

interface TrackClickParams {
  layoutId: string
  versionId?: string | null
  element: string
  url?: string
  text?: string
}

/**
 * Registra um click em um elemento da landing page
 */
export async function trackClick(params: TrackClickParams): Promise<void> {
  try {
    const supabase = createClient()
    const sessionId = typeof window !== 'undefined' 
      ? sessionStorage.getItem('session_id') || `session_${Date.now()}_${Math.random()}`
      : null

    if (!sessionId) return

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('session_id', sessionId)
    }

    await supabase
      .from('landing_analytics')
      .insert({
        layout_id: params.layoutId,
        version_id: params.versionId || null,
        session_id: sessionId,
        event_type: 'click',
        event_data: {
          element: params.element,
          url: params.url || window.location.href,
          text: params.text,
        },
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        referrer: typeof window !== 'undefined' ? document.referrer : null,
      })
  } catch (error) {
    console.error('Erro ao registrar click:', error)
  }
}

/**
 * Registra uma conversão (ex: click em CTA principal)
 */
export async function trackConversion(params: TrackClickParams): Promise<void> {
  try {
    const supabase = createClient()
    const sessionId = typeof window !== 'undefined' 
      ? sessionStorage.getItem('session_id') || `session_${Date.now()}_${Math.random()}`
      : null

    if (!sessionId) return

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('session_id', sessionId)
    }

    await supabase
      .from('landing_analytics')
      .insert({
        layout_id: params.layoutId,
        version_id: params.versionId || null,
        session_id: sessionId,
        event_type: 'conversion',
        event_data: {
          element: params.element,
          url: params.url || window.location.href,
          text: params.text,
        },
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        referrer: typeof window !== 'undefined' ? document.referrer : null,
      })
  } catch (error) {
    console.error('Erro ao registrar conversão:', error)
  }
}

