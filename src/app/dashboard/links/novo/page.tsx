'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { LinkItem, SocialLink } from '@/types/link-aggregator';
import { LinksManager } from '@/components/link-aggregator/LinksManager';
import { SocialLinksManager } from '@/components/link-aggregator/SocialLinksManager';
import { ArrowLeft, Save } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewLinkAggregatorPage() {
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    main_title: 'Portfolio',
    main_title_letter: 'o',
    profile_image: '',
    profile_name: '',
    homepage_button_enabled: true,
    homepage_button_title: 'Visite nosso site',
    homepage_button_url: '',
    links: [] as LinkItem[],
    social_links: [] as SocialLink[],
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isEditor)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isEditor, authLoading, router]);

  // Gerar slug automaticamente a partir do nome
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast.error('Preencha o nome e o slug');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Verificar se o slug já existe
      const { data: existing } = await (supabase as any)
        .from('link_aggregators')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existing) {
        toast.error('Este slug já está em uso. Escolha outro.');
        return;
      }

      const { error } = await (supabase as any)
        .from('link_aggregators')
        .insert({
          user_id: user.id,
          name: formData.name,
          slug: formData.slug,
          main_title: formData.main_title || 'Portfolio',
          main_title_letter: formData.main_title_letter || 'o',
          profile_image: formData.profile_image || null,
          profile_name: formData.profile_name || formData.name,
          homepage_button_enabled: formData.homepage_button_enabled,
          homepage_button_title: formData.homepage_button_title,
          homepage_button_url: formData.homepage_button_url || null,
          links: formData.links,
          social_links: formData.social_links,
        });

      if (error) throw error;

      toast.success('Agregador criado com sucesso!');
      router.push('/dashboard/links');
    } catch (error: any) {
      console.error('Erro ao criar agregador:', error);
      toast.error(error.message || 'Erro ao criar agregador');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Voltar para Agregadores
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Novo Agregador de Links</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Informações Básicas</h2>
            
            <Input
              label="Título Principal (com efeito Portfolio)"
              value={formData.main_title}
              onChange={(e) => setFormData(prev => ({ ...prev, main_title: e.target.value }))}
              placeholder="Ex: Portfolio"
            />
            <p className="text-sm text-gray-500 -mt-2">
              Este título aparecerá no topo da página com o efeito animado
            </p>

            <Input
              label="Letra para Animação"
              value={formData.main_title_letter}
              onChange={(e) => setFormData(prev => ({ ...prev, main_title_letter: e.target.value.slice(0, 1) }))}
              placeholder="Ex: o"
              maxLength={1}
            />
            <p className="text-sm text-gray-500 -mt-2">
              A primeira ocorrência desta letra será substituída pela animação (padrão: "o")
            </p>
            
            <Input
              label="Nome do Agregador"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Victor Diniz"
              required
            />

            <Input
              label="Slug (URL)"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
              placeholder="Ex: victor-diniz"
              required
            />

            <Input
              label="Nome Exibido no Perfil"
              value={formData.profile_name}
              onChange={(e) => setFormData(prev => ({ ...prev, profile_name: e.target.value }))}
              placeholder="Ex: Victor Diniz (deixe vazio para usar o nome acima)"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Perfil
              </label>
              <ImageUploader
                value={formData.profile_image}
                onChange={(url) => setFormData(prev => ({ ...prev, profile_image: url }))}
                placeholder="Clique para fazer upload da foto de perfil"
                cropType="square"
                aspectRatio={1}
                targetSize={{ width: 200, height: 200 }}
              />
            </div>
          </div>

          {/* Botão Homepage */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Botão Homepage</h2>
                <p className="text-sm text-gray-500">Botão destacado que leva para o site principal</p>
              </div>
              <Switch
                checked={formData.homepage_button_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, homepage_button_enabled: checked }))}
              />
            </div>

            {formData.homepage_button_enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                <Input
                  label="Título do Botão"
                  value={formData.homepage_button_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, homepage_button_title: e.target.value }))}
                  placeholder="Ex: Visite nosso site"
                />

                <Input
                  label="URL do Botão"
                  type="url"
                  value={formData.homepage_button_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, homepage_button_url: e.target.value }))}
                  placeholder="https://seusite.com"
                />
              </div>
            )}
          </div>

          {/* Links */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Links</h2>
            <LinksManager
              value={formData.links}
              onChange={(links) => setFormData(prev => ({ ...prev, links }))}
            />
          </div>

          {/* Redes Sociais */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Redes Sociais</h2>
            <SocialLinksManager
              value={formData.social_links}
              onChange={(social_links) => setFormData(prev => ({ ...prev, social_links }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
            <Link href="/dashboard/links">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Criar Agregador
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

