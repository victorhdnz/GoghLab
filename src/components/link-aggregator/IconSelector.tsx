'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';

interface IconSelectorProps {
  value: string;
  onChange: (iconName: string) => void;
  type?: 'social' | 'link';
  onClose?: () => void;
}

// Ícones para redes sociais
const socialIcons = [
  { name: 'instagram', label: 'Instagram', icon: LucideIcons.Instagram },
  { name: 'tiktok', label: 'TikTok', icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )},
  { name: 'github', label: 'GitHub', icon: LucideIcons.Github },
  { name: 'mail', label: 'Email', icon: LucideIcons.Mail },
  { name: 'youtube', label: 'YouTube', icon: LucideIcons.Youtube },
  { name: 'facebook', label: 'Facebook', icon: LucideIcons.Facebook },
  { name: 'twitter', label: 'Twitter', icon: LucideIcons.Twitter },
  { name: 'linkedin', label: 'LinkedIn', icon: LucideIcons.Linkedin },
  { name: 'whatsapp', label: 'WhatsApp', icon: LucideIcons.MessageCircle },
];

// Ícones para links gerais
const linkIcons = [
  { name: 'external-link', label: 'Link Externo', icon: LucideIcons.ExternalLink },
  { name: 'link', label: 'Link', icon: LucideIcons.Link },
  { name: 'globe', label: 'Site', icon: LucideIcons.Globe },
  { name: 'mail', label: 'Email', icon: LucideIcons.Mail },
  { name: 'phone', label: 'Telefone', icon: LucideIcons.Phone },
  { name: 'message-square', label: 'Mensagem', icon: LucideIcons.MessageSquare },
  { name: 'calendar', label: 'Calendário', icon: LucideIcons.Calendar },
  { name: 'map-pin', label: 'Localização', icon: LucideIcons.MapPin },
  { name: 'file-text', label: 'Documento', icon: LucideIcons.FileText },
  { name: 'download', label: 'Download', icon: LucideIcons.Download },
  { name: 'video', label: 'Vídeo', icon: LucideIcons.Video },
  { name: 'image', label: 'Imagem', icon: LucideIcons.Image },
  { name: 'music', label: 'Música', icon: LucideIcons.Music },
  { name: 'heart', label: 'Favorito', icon: LucideIcons.Heart },
  { name: 'star', label: 'Destaque', icon: LucideIcons.Star },
  { name: 'bell', label: 'Notificação', icon: LucideIcons.Bell },
  { name: 'user', label: 'Perfil', icon: LucideIcons.User },
  { name: 'users', label: 'Grupo', icon: LucideIcons.Users },
  { name: 'shopping-cart', label: 'Carrinho', icon: LucideIcons.ShoppingCart },
  { name: 'credit-card', label: 'Pagamento', icon: LucideIcons.CreditCard },
  { name: 'gift', label: 'Presente', icon: LucideIcons.Gift },
  { name: 'trophy', label: 'Troféu', icon: LucideIcons.Trophy },
  { name: 'award', label: 'Prêmio', icon: LucideIcons.Award },
  { name: 'zap', label: 'Rápido', icon: LucideIcons.Zap },
  { name: 'rocket', label: 'Lançamento', icon: LucideIcons.Rocket },
];

export function IconSelector({ value, onChange, type = 'link', onClose }: IconSelectorProps) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const icons = type === 'social' ? socialIcons : linkIcons;
  
  const filteredIcons = icons.filter(icon =>
    icon.label.toLowerCase().includes(search.toLowerCase()) ||
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setShowModal(false);
    if (onClose) onClose();
  };

  const currentIcon = icons.find(icon => icon.name === value);
  const CurrentIconComponent = currentIcon?.icon || LucideIcons.Circle;

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {currentIcon ? (
            <>
              <CurrentIconComponent className="w-5 h-5" />
              <span className="text-sm text-gray-700">{currentIcon.label}</span>
            </>
          ) : (
            <>
              <LucideIcons.Circle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Selecionar ícone</span>
            </>
          )}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Remover ícone"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Selecionar Ícone {type === 'social' ? '(Redes Sociais)' : '(Links)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Icons Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {filteredIcons.map((icon) => {
                  const IconComponent = icon.icon;
                  const isSelected = value === icon.name;
                  
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => handleSelect(icon.name)}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${isSelected 
                          ? 'border-black bg-black text-white' 
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        }
                      `}
                      title={icon.label}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                        {icon.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum ícone encontrado
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

