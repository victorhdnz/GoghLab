'use client'

import { useState } from 'react'
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from './Button'
import { ImageUploader } from './ImageUploader'
import Image from 'next/image'

interface ArrayImageManagerProps {
  value: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  minImages?: number
  label?: string
  placeholder?: string
  className?: string
  cropType?: 'banner' | 'square' | 'custom' // Tipo de crop: banner = horizontal, square = Instagram, custom = livre
  aspectRatio?: number // Razão de aspecto (1 = quadrado, 1920/650 = banner, etc)
  targetSize?: { width: number; height: number } // Tamanho alvo final
  recommendedDimensions?: string // Texto com dimensões recomendadas
}

export function ArrayImageManager({
  value = [],
  onChange,
  maxImages,
  minImages = 0,
  label = 'Imagens',
  placeholder = 'Clique para fazer upload de uma imagem',
  className = '',
  cropType = 'square',
  aspectRatio,
  targetSize,
  recommendedDimensions,
}: ArrayImageManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAdd = () => {
    if (maxImages && value.length >= maxImages) {
      return
    }
    setEditingIndex(value.length)
  }

  const handleRemove = (index: number) => {
    if (minImages && value.length <= minImages) {
      return
    }
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleImageChange = (url: string) => {
    if (editingIndex !== null) {
      const newImages = [...value]
      if (editingIndex >= newImages.length) {
        newImages.push(url)
      } else {
        newImages[editingIndex] = url
      }
      onChange(newImages.filter(Boolean)) // Remove strings vazias
      setEditingIndex(null)
    }
  }

  const handleReplace = (index: number) => {
    setEditingIndex(index)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {maxImages && (
            <span className="text-xs text-gray-500 ml-2">
              (máx. {maxImages} imagens)
            </span>
          )}
        </label>
        {(!maxImages || value.length < maxImages) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
          >
            <Plus size={16} className="mr-2" />
            Adicionar Imagem
          </Button>
        )}
      </div>

      {/* Grid de Imagens */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {value.map((image, index) => (
            <div key={index} className="relative group">
              <div 
                className="bg-gray-200 rounded-lg overflow-hidden"
                style={{
                  aspectRatio: cropType === 'banner' && aspectRatio 
                    ? aspectRatio 
                    : cropType === 'banner' 
                      ? 1920/650 
                      : 1 // square por padrão
                }}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={`${label} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleReplace(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-gray-100"
                >
                  Substituir
                </Button>
                {(!minImages || value.length > minImages) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white border-red-500"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
              {index === 0 && value.length > 0 && (
                <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editor de Upload */}
      {editingIndex !== null && (
        <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">
              {editingIndex >= value.length
                ? 'Adicionando nova imagem'
                : `Substituindo imagem ${editingIndex + 1}`}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingIndex(null)}
            >
              Cancelar
            </Button>
          </div>
              <ImageUploader
                value={editingIndex < value.length ? value[editingIndex] : ''}
                onChange={handleImageChange}
                placeholder={placeholder}
                cropType={cropType}
                aspectRatio={aspectRatio}
                targetSize={targetSize}
                recommendedDimensions={recommendedDimensions}
                showMediaManager={false}
              />
        </div>
      )}

      {/* Placeholder quando não há imagens */}
      {value.length === 0 && editingIndex === null && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon size={48} className="mx-auto mb-2 text-gray-400" />
          <p>Nenhuma imagem adicionada</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="mt-4"
          >
            <Plus size={16} className="mr-2" />
            Adicionar Primeira Imagem
          </Button>
        </div>
      )}
    </div>
  )
}

