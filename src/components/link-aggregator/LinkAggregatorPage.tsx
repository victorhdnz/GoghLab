'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LinkAggregator, LinkItem, SocialLink } from '@/types/link-aggregator';
import { AnimatedLetterText } from '@/components/ui/potfolio-text';
import { 
  Github, 
  Instagram, 
  Mail, 
  ExternalLink,
  Copy,
  Check,
  Link,
  Globe,
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  FileText,
  Download,
  Video,
  Image as ImageIcon,
  Music,
  Heart,
  Star,
  Bell,
  User,
  Users,
  ShoppingCart,
  CreditCard,
  Gift,
  Trophy,
  Award,
  Zap,
  Rocket,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LinkAggregatorPageProps {
  aggregator: LinkAggregator;
}

// Mapeamento de ícones do Lucide
const iconMap: Record<string, any> = {
  // Redes Sociais
  github: Github,
  instagram: Instagram,
  email: Mail,
  mail: Mail,
  tiktok: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  // Links Gerais
  'external-link': ExternalLink,
  link: Link,
  globe: Globe,
  phone: Phone,
  'message-square': MessageSquare,
  calendar: Calendar,
  'map-pin': MapPin,
  'file-text': FileText,
  download: Download,
  video: Video,
  image: ImageIcon,
  music: Music,
  heart: Heart,
  star: Star,
  bell: Bell,
  user: User,
  users: Users,
  'shopping-cart': ShoppingCart,
  'credit-card': CreditCard,
  gift: Gift,
  trophy: Trophy,
  award: Award,
  zap: Zap,
  rocket: Rocket,
};

export function LinkAggregatorPage({ aggregator }: LinkAggregatorPageProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleLinkClick = (link: LinkItem) => {
    if (link.url.startsWith('mailto:')) {
      // Copiar email para clipboard
      const email = link.url.replace('mailto:', '');
      navigator.clipboard.writeText(email).then(() => {
        toast.success('Email copiado!');
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      });
    } else {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSocialClick = (social: SocialLink) => {
    if (social.url.startsWith('mailto:')) {
      const email = social.url.replace('mailto:', '');
      navigator.clipboard.writeText(email).then(() => {
        toast.success('Email copiado!');
      });
    } else {
      window.open(social.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getIcon = (link: LinkItem | SocialLink) => {
    // Verificar se é LinkItem e tem icon_type
    if ('icon_type' in link && link.icon_type === 'image' && link.icon) {
      const linkItem = link as LinkItem;
      // Já verificamos que link.icon existe na condição acima
      return (
        <Image
          src={linkItem.icon!}
          alt={linkItem.title || ''}
          width={24}
          height={24}
          className="rounded-full"
        />
      );
    }
    
    const iconName = link.icon?.toLowerCase() || '';
    const IconComponent = iconMap[iconName] || ExternalLink;
    
    return <IconComponent className="w-5 h-5" />;
  };

  // Filtrar links e social links habilitados e ordenar
  const enabledLinks = (aggregator.links || [])
    .filter((link: LinkItem) => link.enabled !== false)
    .sort((a: LinkItem, b: LinkItem) => (a.order || 0) - (b.order || 0));

  const enabledSocialLinks = (aggregator.social_links || [])
    .filter((social: SocialLink) => social.enabled !== false)
    .sort((a: SocialLink, b: SocialLink) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white relative overflow-hidden">
      {/* Efeito de pontos no fundo */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }} />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Título Principal com Efeito Portfolio Text */}
          <div className="text-center mb-4">
            <AnimatedLetterText 
              text={aggregator.main_title || 'Portfolio'} 
              letterToReplace={aggregator.main_title_letter || 'o'} 
              className="text-5xl md:text-7xl text-white"
            />
          </div>

          {/* Foto de Perfil */}
          {aggregator.profile_image && (
            <div className="flex justify-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 backdrop-blur-sm bg-white/5">
                <Image
                  src={aggregator.profile_image}
                  alt={aggregator.profile_name || aggregator.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Nome */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {aggregator.profile_name || aggregator.name}
            </h1>
          </div>

          {/* Botão Homepage (Destacado) */}
          {aggregator.homepage_button_enabled && aggregator.homepage_button_url && (
            <button
              onClick={() => window.open(aggregator.homepage_button_url, '_blank', 'noopener,noreferrer')}
              className="w-full bg-white text-black py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 backdrop-blur-sm border border-white/20"
            >
              <span>{aggregator.homepage_button_title || 'Visite nosso site'}</span>
              <ExternalLink className="w-5 h-5" />
            </button>
          )}

          {/* Título "Links" */}
          {enabledLinks.length > 0 && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-white/90 mb-6 relative inline-block">
                Links
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30"></span>
              </h2>
            </div>
          )}

          {/* Lista de Links */}
          <div className="space-y-3">
            {enabledLinks.map((link: LinkItem) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all flex items-center gap-4 group"
              >
                {/* Ícone */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  {getIcon(link)}
                </div>

                {/* Texto */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white">{link.title}</div>
                  {link.description && (
                    <div className="text-sm text-white/70">{link.description}</div>
                  )}
                </div>

                {/* Seta */}
                <ExternalLink className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>

          {/* Links Sociais */}
          {enabledSocialLinks.length > 0 && (
            <div className="flex justify-center gap-4 pt-4">
              {enabledSocialLinks.map((social: SocialLink) => (
                <button
                  key={social.id}
                  onClick={() => handleSocialClick(social)}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                  aria-label={social.platform}
                >
                  {getIcon(social)}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

