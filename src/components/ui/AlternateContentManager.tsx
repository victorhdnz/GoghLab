'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { ImageUploader } from './ImageUploader'
import Image from 'next/image'
import { AlternateContentItem } from '@/types/service-detail'

interface AlternateContentManagerProps {
  value: AlternateContentItem[]
  onChange: (items: AlternateContentItem[]) => void
  label?: string
}

export function AlternateContentManager({ value = [], onChange, label = 'Conteúdo Alternado' }: AlternateContentManagerProps) {
  const generateId = () => `alt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const handleAdd = () => {
    const newItem: AlternateContentItem = {
      id: generateId(),
      position: value.length % 2 === 0 ? 'left' : 'right',
      title: '',
      description: '',
      image: '',
      image_position: 'right',
    }
    onChange([...value, newItem])
  }

  const handleRemove = (index: number) => {
    const newItems = value.filter((_, i) => i !== index)
    onChange(newItems)
  }

  const handleUpdate = (index: number, field: keyof AlternateContentItem, newValue: string | 'left' | 'right') => {
    const newItems = [...value]
    newItems[index] = { ...newItems[index], [field]: newValue }
    onChange(newItems)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus size={16} className="mr-2" />
          Adicionar Conteúdo
        </Button>
      </div>

      <div className="space-y-6">
        {value.map((item, index) => {
          const titleParts = item.title?.split(item.title_highlight || '') || [item.title || '']
          const highlightWord = item.title_highlight || ''
          const highlightColor = item.title_highlight_color || '#00D9FF'

          return (
            <div key={item.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Conteúdo {index + 1}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Posição do Conteúdo</label>
                    <select
                      value={item.position}
                      onChange={(e) => handleUpdate(index, 'position', e.target.value as 'left' | 'right')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Posição da Imagem</label>
                    <select
                      value={item.image_position || 'right'}
                      onChange={(e) => handleUpdate(index, 'image_position', e.target.value as 'left' | 'right')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Título"
                  value={item.title || ''}
                  onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                  placeholder="Ex: Os truques da alimentação natural"
                />
                <Input
                  label="Palavra para Destacar (dentro do título)"
                  value={item.title_highlight || ''}
                  onChange={(e) => handleUpdate(index, 'title_highlight', e.target.value)}
                  placeholder="Ex: truques"
                />
                <Input
                  label="Cor da Palavra Destacada"
                  value={item.title_highlight_color || '#00D9FF'}
                  onChange={(e) => handleUpdate(index, 'title_highlight_color', e.target.value)}
                  type="color"
                  className="h-12"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                    placeholder="Descrição do conteúdo..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Imagem (PNG transparente recomendado)</label>
                  <ImageUploader
                    value={item.image || ''}
                    onChange={(url) => handleUpdate(index, 'image', url)}
                    placeholder="Upload de imagem"
                    cropType="banner"
                    aspectRatio={16 / 9}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="mb-4">Nenhum conteúdo adicionado</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus size={16} className="mr-2" />
            Adicionar Primeiro Conteúdo
          </Button>
        </div>
      )}
    </div>
  )
}

