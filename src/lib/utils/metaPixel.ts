/**
 * Helper para disparar eventos do Meta Pixel
 * Verifica se o fbq está disponível antes de disparar
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

/**
 * Dispara um evento do Meta Pixel
 */
export function trackMetaPixelEvent(eventName: string, eventData?: Record<string, any>) {
  if (typeof window === 'undefined') return
  
  if (window.fbq) {
    if (eventData) {
      window.fbq('track', eventName, eventData)
    } else {
      window.fbq('track', eventName)
    }
  }
}

/**
 * Eventos específicos do Meta Pixel
 */
export const MetaPixelEvents = {
  // Evento padrão - já disparado automaticamente no PageView
  pageView: () => trackMetaPixelEvent('PageView'),
  
  // Visualização de conteúdo (ex: página de preços)
  viewContent: (contentName?: string, contentCategory?: string) => {
    trackMetaPixelEvent('ViewContent', {
      content_name: contentName,
      content_category: contentCategory,
    })
  },
  
  // Início de checkout
  initiateCheckout: (value?: number, currency: string = 'BRL') => {
    trackMetaPixelEvent('InitiateCheckout', {
      value,
      currency,
    })
  },
  
  // Lead (ex: solicitação de acesso às ferramentas)
  lead: (contentName?: string) => {
    trackMetaPixelEvent('Lead', {
      content_name: contentName,
    })
  },
  
  /**
   * Purchase (compra/assinatura) - padrão Meta:
   * value, currency (BRL), content_name, content_ids?, event_id? (deduplicação CAPI)
   */
  purchase: (
    value: number,
    currency: string = 'BRL',
    planName?: string,
    options?: { content_ids?: string[]; event_id?: string }
  ) => {
    trackMetaPixelEvent('Purchase', {
      value,
      currency,
      content_name: planName,
      content_type: options?.content_ids?.length ? 'product' : undefined,
      content_ids: options?.content_ids,
      event_id: options?.event_id,
    })
  },
  
  // AddToCart (adicionar ao carrinho - início de assinatura)
  addToCart: (value?: number, currency: string = 'BRL', planName?: string) => {
    trackMetaPixelEvent('AddToCart', {
      value,
      currency,
      content_name: planName,
    })
  },
  
  // CompleteRegistration (completar cadastro)
  completeRegistration: () => {
    trackMetaPixelEvent('CompleteRegistration')
  },
}

