'use client';

import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { LinkItem } from '@/types/link-aggregator';
import { IconSelector } from './IconSelector';

interface LinksManagerProps {
  value: LinkItem[];
  onChange: (items: LinkItem[]) => void;
  label?: string;
}

export function LinksManager({ value = [], onChange, label = 'Links' }: LinksManagerProps) {
  const generateId = () => `link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const handleAdd = () => {
    const newItem: LinkItem = {
      id: generateId(),
      title: 'Novo Link',
      description: '',
      url: '',
      icon: '',
      icon_type: 'lucide',
      order: value.length,
      enabled: true,
    };
    onChange([...value, newItem]);
  };

  const handleRemove = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleUpdate = (index: number, field: keyof LinkItem, newValue: string | number | boolean) => {
    const newItems = [...value];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= value.length) return;

    const newItems = [...value];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, removed);
    // Atualizar ordem
    newItems.forEach((item, i) => {
      item.order = i;
    });
    onChange(newItems);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus size={16} className="mr-2" />
          Adicionar Link
        </Button>
      </div>

      <div className="space-y-4">
        {value.map((item, index) => (
          <div key={item.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Link {index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                    title="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === value.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
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
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="space-y-3">
              <Input
                label="Título"
                value={item.title || ''}
                onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                placeholder="Ex: TikTok, Instagram, Contato"
              />
              <Input
                label="Descrição (opcional)"
                value={item.description || ''}
                onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                placeholder="Ex: Rede social, Clique para copiar email"
              />
              <Input
                label="URL"
                type="url"
                value={item.url || ''}
                onChange={(e) => handleUpdate(index, 'url', e.target.value)}
                placeholder="https://... ou mailto:email@exemplo.com"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone
                </label>
                <IconSelector
                  type="link"
                  value={item.icon || ''}
                  onChange={(iconName) => {
                    handleUpdate(index, 'icon', iconName);
                    handleUpdate(index, 'icon_type', 'lucide');
                  }}
                />
                <select
                  value={item.icon_type || 'lucide'}
                  onChange={(e) => handleUpdate(index, 'icon_type', e.target.value)}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="lucide">Ícone Lucide</option>
                  <option value="image">URL de Imagem</option>
                </select>
                {item.icon_type === 'image' && (
                  <Input
                    value={item.icon || ''}
                    onChange={(e) => handleUpdate(index, 'icon', e.target.value)}
                    placeholder="URL da imagem..."
                    className="mt-2"
                  />
                )}
                {item.icon_type === 'lucide' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Ou digite manualmente o nome do ícone
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.enabled !== false}
                  onChange={(e) => handleUpdate(index, 'enabled', e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Habilitado</label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="mb-4">Nenhum link adicionado</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus size={16} className="mr-2" />
            Adicionar Primeiro Link
          </Button>
        </div>
      )}
    </div>
  );
}

