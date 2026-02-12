/**
 * Utilitários para vídeos do Cloudinary (URL e formato vertical/horizontal)
 */

export function isCloudinaryVideoUrl(url: string): boolean {
  if (!url) return false
  return /res\.cloudinary\.com.*\/video\/upload\//.test(url) || /cloudinary\.com.*video/i.test(url)
}

/**
 * Detecta se o vídeo é vertical a partir das transformações na URL do Cloudinary.
 * Formato: /upload/TRANSFORMATIONS/id - ex: ar_9:16, w_400,h_720 (h>w = vertical)
 */
function isCloudinaryVerticalFromUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  // ar_9:16 ou ar_1:1 (quadrado tratamos como vertical para preview)
  if (/ar_9:16|ar_1:1/.test(lower)) return true
  const wMatch = lower.match(/w_(\d+)/)
  const hMatch = lower.match(/h_(\d+)/)
  if (wMatch && hMatch) {
    const w = parseInt(wMatch[1], 10)
    const h = parseInt(hMatch[1], 10)
    if (h > w) return true
  }
  return false
}

/**
 * Retorna classes CSS para o container do vídeo (igual ao YouTube).
 * Vertical (9:16) ou horizontal (16:9) de forma inteligente.
 */
export function getCloudinaryContainerClasses(url: string): {
  wrapper: string
  aspectRatio: string
  maxWidth: string
} {
  const isVertical = isCloudinaryVerticalFromUrl(url)
  return {
    wrapper: isVertical ? 'max-w-[400px] mx-auto' : 'max-w-4xl mx-auto',
    aspectRatio: isVertical ? 'aspect-[9/16]' : 'aspect-video',
    maxWidth: isVertical ? 'max-w-[400px]' : 'max-w-4xl',
  }
}
