'use client';

import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { SocialLink } from '@/types/link-aggregator';
import { IconSelector } from './IconSelector';

interface SocialLinksManagerProps {
  value: SocialLink[];
  onChange: (items: SocialLink[]) => void;
  label?: string;
}

export function SocialLinksManager({ value = [], onChange, label = 'Redes Sociais' }: SocialLinksManagerProps) {
  const generateId = () => `social_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const handleAdd = () => {
    const newItem: SocialLink = {
      id: generateId(),
      platform: 'instagram',
      url: '',
      icon: 'instagram',
      order: value.length,
      enabled: true,
    };
    onChange([...value, newItem]);
  };

  const handleRemove = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleUpdate = (index: number, field: keyof SocialLink, newValue: string | number | boolean) => {
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
          Adicionar Rede Social
        </Button>
      </div>

      <div className="space-y-4">
        {value.map((item, index) => (
          <div key={item.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Rede Social {index + 1}</span>
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
                label="Plataforma"
                value={item.platform || ''}
                onChange={(e) => handleUpdate(index, 'platform', e.target.value)}
                placeholder="Ex: instagram, github, tiktok"
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
                  type="social"
                  value={item.icon || ''}
                  onChange={(iconName) => handleUpdate(index, 'icon', iconName)}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Ou digite manualmente o nome do ícone (ex: instagram, tiktok, github)
                </p>
                <Input
                  value={item.icon || ''}
                  onChange={(e) => handleUpdate(index, 'icon', e.target.value)}
                  placeholder="Ou digite manualmente..."
                  className="mt-2"
                />
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
          <p className="mb-4">Nenhuma rede social adicionada</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus size={16} className="mr-2" />
            Adicionar Primeira Rede Social
          </Button>
        </div>
      )}
    </div>
  );
}

