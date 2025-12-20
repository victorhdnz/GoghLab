'use client'

import { useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Edit2 } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { ImageUploader } from './ImageUploader'
import Image from 'next/image'

export interface ServiceCard {
  id: string
  title: string
  description?: string
  image?: string
  link?: string
  buttonText?: string
}

interface ServiceCardsManagerProps {
  value: ServiceCard[]
  onChange: (cards: ServiceCard[]) => void
  maxCards?: number
  minCards?: number
  label?: string
  className?: string
}

export function ServiceCardsManager({
  value = [],
  onChange,
  maxCards,
  minCards = 0,
  label = 'Cards de Serviços',
  className = '',
}: ServiceCardsManagerProps) {
  const generateId = () => `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const handleAdd = () => {
    if (maxCards && value.length >= maxCards) {
      return
    }
    const newCard: ServiceCard = {
      id: generateId(),
      title: '',
      description: '',
      image: '',
      link: '',
      buttonText: 'Ver detalhes',
    }
    onChange([...value, newCard])
  }

  const handleRemove = (index: number) => {
    if (minCards && value.length <= minCards) {
      return
    }
    const newCards = value.filter((_, i) => i !== index)
    onChange(newCards)
  }

  const handleUpdate = (index: number, field: keyof ServiceCard, newValue: string) => {
    const newCards = [...value]
    newCards[index] = { ...newCards[index], [field]: newValue }
    onChange(newCards)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= value.length) return

    const newCards = [...value]
    const [removed] = newCards.splice(index, 1)
    newCards.splice(newIndex, 0, removed)
    onChange(newCards)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={maxCards ? value.length >= maxCards : false}
        >
          <Plus size={16} className="mr-2" />
          Adicionar Card
        </Button>
      </div>

      {/* Lista de Cards */}
      <div className="space-y-4">
        {value.map((card, index) => (
          <div
            key={card.id}
            className="border border-gray-300 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Card {index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === value.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={minCards ? value.length <= minCards : false}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            {/* Campos do Card */}
            <div className="space-y-3">
              <Input
                label="Título do Card"
                value={card.title || ''}
                onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                placeholder="Ex: Criação de Sites"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={card.description || ''}
                  onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                  placeholder="Descrição do serviço..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Imagem do Card</label>
                <ImageUploader
                  value={card.image || ''}
                  onChange={(url) => handleUpdate(index, 'image', url)}
                  placeholder="Upload de imagem do card"
                  cropType="square"
                  aspectRatio={1}
                  recommendedDimensions="400x400px"
                />
                {card.image && (
                  <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                    <Image
                      src={card.image}
                      alt={card.title || 'Preview'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              <Input
                label="Link do Card (URL)"
                value={card.link || ''}
                onChange={(e) => handleUpdate(index, 'link', e.target.value)}
                placeholder="Ex: /portfolio/criacao-sites ou https://..."
              />
              <Input
                label="Texto do Botão"
                value={card.buttonText || 'Saiba Mais'}
                onChange={(e) => handleUpdate(index, 'buttonText', e.target.value)}
                placeholder="Ex: Saiba Mais, Ver Detalhes..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder quando não há cards */}
      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="mb-4">Nenhum card adicionado</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
          >
            <Plus size={16} className="mr-2" />
            Adicionar Primeiro Card
          </Button>
        </div>
      )}
    </div>
  )
}

