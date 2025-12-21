'use client'

import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { ImageUploader } from './ImageUploader'
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react'
import { TestimonialItem } from '@/components/homepage/TestimonialsSection'

interface TestimonialsManagerProps {
  value?: TestimonialItem[]
  onChange: (testimonials: TestimonialItem[]) => void
  label?: string
}

export function TestimonialsManager({
  value = [],
  onChange,
  label = 'Depoimentos',
}: TestimonialsManagerProps) {
  const generateId = () => {
    return `testimonial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const handleAdd = () => {
    const newTestimonial: TestimonialItem = {
      id: generateId(),
      name: '',
      username: '',
      body: '',
      img: '',
    }
    onChange([...value, newTestimonial])
  }

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleUpdate = (
    index: number,
    field: keyof TestimonialItem,
    newValue: string
  ) => {
    const updated = [...value]
    updated[index] = { ...updated[index], [field]: newValue }
    onChange(updated)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === value.length - 1)
    ) {
      return
    }

    const updated = [...value]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    onChange(updated)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Adicionar Depoimento
        </Button>
      </div>

      <div className="space-y-4">
        {value.map((item, index) => (
          <div key={item.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Depoimento {index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === value.length - 1}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Nome"
                value={item.name || ''}
                onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                placeholder="Ex: João Silva"
              />
              <Input
                label="Username (ex: @joaosilva)"
                value={item.username || ''}
                onChange={(e) => handleUpdate(index, 'username', e.target.value)}
                placeholder="Ex: @joaosilva"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Depoimento</label>
                <textarea
                  value={item.body || ''}
                  onChange={(e) => handleUpdate(index, 'body', e.target.value)}
                  placeholder="Ex: Excelente serviço! Recomendo muito."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Foto do Cliente</label>
                <ImageUploader
                  value={item.img || ''}
                  onChange={(url) => handleUpdate(index, 'img', url)}
                  cropType="square"
                  aspectRatio={1}
                  targetSize={{ width: 200, height: 200 }}
                  placeholder="Clique para fazer upload da foto"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p>Nenhum depoimento adicionado ainda.</p>
          <p className="text-sm mt-1">Clique em "Adicionar Depoimento" para começar.</p>
        </div>
      )}
    </div>
  )
}

