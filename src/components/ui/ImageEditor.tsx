'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, RotateCw, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'

interface ImageEditorProps {
  file: File
  onSave: (url: string) => void
  onCancel: () => void
  aspectRatio?: number // Razão de aspecto (1 = quadrado Instagram, 1920/650 = banner horizontal, etc)
  cropType?: 'banner' | 'square' | 'custom' // Tipo de crop: banner = horizontal, square = Instagram, custom = livre
  targetSize?: { width: number; height: number } // Tamanho alvo final (ex: { width: 1920, height: 650 } para banner)
}

export function ImageEditor({ 
  file, 
  onSave, 
  onCancel,
  aspectRatio,
  cropType = 'square',
  targetSize
}: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Carregar imagem ao montar o componente
  useEffect(() => {
    if (!file) return
    
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        setImageSrc(result)
        setLoading(false)
      }
    }
    reader.onerror = () => {
      toast.error('Erro ao carregar imagem')
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }, [file])

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) {
      throw new Error('Erro ao criar contexto do canvas')
    }

    // Determinar tamanho alvo baseado no tipo de crop
    let finalWidth: number
    let finalHeight: number
    
    if (targetSize) {
      finalWidth = targetSize.width
      finalHeight = targetSize.height
    } else if (cropType === 'banner') {
      // Banner padrão: 1920x650
      finalWidth = 1920
      finalHeight = 650
    } else {
      // Instagram padrão: 1080x1080
      finalWidth = 1080
      finalHeight = 1080
    }

    // Tamanho da área de crop
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = finalWidth
    canvas.height = finalHeight

    // Limpar canvas com fundo transparente
    ctx.clearRect(0, 0, finalWidth, finalHeight)

    ctx.translate(finalWidth / 2, finalHeight / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-finalWidth / 2, -finalHeight / 2)

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      finalWidth,
      finalHeight
    )

    // Detectar se a imagem tem transparência
    const hasTransparency = (() => {
      try {
        const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight)
        const data = imageData.data
        
        // Verificar se há pixels com alpha < 255 (transparência)
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            return true
          }
        }
        return false
      } catch (e) {
        // Se houver erro, assumir que pode ter transparência
        return true
      }
    })()

    // Detectar tipo original do arquivo
    const originalType = file.type.toLowerCase()
    const supportsTransparency = originalType === 'image/png' || 
                                  originalType === 'image/webp' || 
                                  originalType === 'image/gif' ||
                                  file.name.toLowerCase().endsWith('.png') ||
                                  file.name.toLowerCase().endsWith('.webp') ||
                                  file.name.toLowerCase().endsWith('.gif')

    // Usar PNG se a imagem original suporta transparência OU se detectamos transparência
    const usePNG = supportsTransparency || hasTransparency

    return new Promise((resolve) => {
      if (usePNG) {
        // Usar PNG para preservar transparência
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Erro ao processar imagem')
          }
          resolve(blob)
        }, 'image/png')
      } else {
        // Usar JPEG para imagens sem transparência (melhor compressão). Qualidade maior para fotos grandes (ex: equipe 800x800).
        const quality = (targetSize && targetSize.width >= 1920) || cropType === 'banner' ? 0.95 : (targetSize && targetSize.width >= 600 ? 0.92 : 0.9)
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Erro ao processar imagem')
          }
          resolve(blob)
        }, 'image/jpeg', quality)
      }
    })
  }

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error('Por favor, ajuste o crop da imagem')
      return
    }

    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      )

      const formData = new FormData()
      // Preservar extensão original se for PNG/WebP para manter transparência
      const originalName = file.name.toLowerCase()
      const originalType = file.type.toLowerCase()
      const isTransparentFormat = originalName.endsWith('.png') || 
                                   originalName.endsWith('.webp') || 
                                   originalName.endsWith('.gif') ||
                                   originalType === 'image/png' ||
                                   originalType === 'image/webp' ||
                                   originalType === 'image/gif'
      
      // Determinar nome do arquivo com extensão correta baseado no tipo do blob
      let fileName = file.name
      if (croppedImage.type === 'image/png') {
        // Se o blob é PNG, usar extensão .png
        if (!originalName.endsWith('.png')) {
          fileName = file.name.replace(/\.[^/.]+$/, '') + '.png'
        }
      } else if (croppedImage.type === 'image/jpeg') {
        // Se o blob é JPEG, usar extensão .jpg
        if (!originalName.endsWith('.jpg') && !originalName.endsWith('.jpeg')) {
          fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
        }
      }
      
      formData.append('file', croppedImage, fileName)
      formData.append('folder', 'images')
      // Passar informação sobre tipo de imagem para API ajustar qualidade
      if (targetSize && targetSize.width >= 1920) {
        formData.append('isBanner', 'true')
      }
      // Para imagens de alta qualidade (como About Us), marcar como high quality
      if (targetSize && targetSize.width >= 1920 && targetSize.height >= 1440) {
        formData.append('isHighQuality', 'true')
      }
      // Passar informação se é logo (para preservar transparência na API também)
      if (isTransparentFormat || croppedImage.type === 'image/png') {
        formData.append('preserveTransparency', 'true')
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      onSave(data.url)
      toast.success('Imagem editada e enviada com sucesso!')
    } catch (error: any) {
      console.error('Erro no upload:', error)
      toast.error(error.message || 'Erro ao fazer upload da imagem')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[95vh] sm:h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold">Editar e Recortar Imagem</h2>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              📐 Arraste a imagem para posicionar • Ajuste o zoom e rotação • Dimensão final: <strong>
                {targetSize 
                  ? `${targetSize.width} x ${targetSize.height}px`
                  : cropType === 'banner'
                    ? '1920 x 650px'
                    : cropType === 'square'
                      ? '1080 x 1080px'
                      : 'Personalizado'
                }
              </strong>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Editor Area com React Easy Crop */}
        <div className="flex-1 relative bg-gray-900 w-full overflow-hidden" style={{ minHeight: '250px' }}>
          {loading ? (
            <div className="flex items-center justify-center w-full h-full text-white">
              <p>Carregando imagem...</p>
            </div>
          ) : imageSrc ? (
            <div className="relative w-full h-full" style={{ height: '100%' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={
                  aspectRatio !== undefined 
                    ? aspectRatio 
                    : cropType === 'banner' 
                      ? 1920/650 
                      : cropType === 'square' 
                        ? 1 
                        : undefined
                }
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={false}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    background: '#111827',
                  },
                  cropAreaStyle: {
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                  },
                  mediaStyle: {
                    width: 'auto',
                    height: 'auto',
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-white">
              <p>Erro ao carregar imagem</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="border-t p-3 sm:p-4 bg-white flex-shrink-0 overflow-y-auto">
          <div className="space-y-3 sm:space-y-4">
            {/* Zoom Control */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => prev - 90)}
                title="Rotacionar Esquerda"
                className="text-xs sm:text-sm"
              >
                <RotateCcw size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">-90°</span>
              </Button>
              <div className="flex-1 text-center text-xs sm:text-sm text-gray-600">
                Rotação: {rotation}°
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => prev + 90)}
                title="Rotacionar Direita"
                className="text-xs sm:text-sm"
              >
                <RotateCw size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">+90°</span>
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 pb-2 bg-white border-t sticky bottom-0 z-10">
              <Button type="button" variant="outline" onClick={onCancel} size="sm" className="text-xs sm:text-sm">
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} size="sm" className="text-xs sm:text-sm">
                <Check size={16} className="sm:mr-2" />
                Salvar e Upload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
