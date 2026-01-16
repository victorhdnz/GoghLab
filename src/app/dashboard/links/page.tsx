'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { LinkAggregator } from '@/types/link-aggregator';
import { Plus, ExternalLink, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LinkAggregatorsDashboard() {
  const { isAuthenticated, isEditor, loading: authLoading, emailIsAdmin, user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [aggregators, setAggregators] = useState<LinkAggregator[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se tem acesso - emailIsAdmin funciona mesmo sem profile carregado
  const hasAccess = emailIsAdmin || isEditor;

  useEffect(() => {
    if (!authLoading && hasAccess) {
      loadAggregators();
    }
  }, [hasAccess, authLoading]);

  const loadAggregators = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('link_aggregators')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAggregators((data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        slug: item.slug,
        profile_image: item.profile_image || undefined,
        profile_name: item.profile_name || item.name,
        homepage_button_enabled: item.homepage_button_enabled ?? true,
        homepage_button_title: item.homepage_button_title || 'Visite nosso site',
        homepage_button_url: item.homepage_button_url || undefined,
        links: (item.links as any) || [],
        social_links: (item.social_links as any) || [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      })));
    } catch (error: any) {
      console.error('Erro ao carregar agregadores:', error);
      toast.error('Erro ao carregar agregadores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agregador?')) return;

    try {
      const { error } = await (supabase as any)
        .from('link_aggregators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Agregador excluído com sucesso!');
      loadAggregators();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir agregador');
    }
  };

  const getPublicUrl = (slug: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/links/${slug}`;
  };

  // Loading - aguardar carregamento do auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Se não está autenticado E auth já carregou, redirecionar para login
  if (!authLoading && !isAuthenticated) {
    // Usar window.location para evitar problemas de navegação do Next.js
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
    return null
  }

  // Sem permissão - mostrar mensagem (só verificar após auth carregar e user estar disponível)
  // Se emailIsAdmin é true, sempre permitir acesso mesmo sem profile
  if (!emailIsAdmin && !hasAccess && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Você não tem permissão.</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">Voltar</a>
        </div>
      </div>
    );
  }

  // Carregando dados
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Agregadores de Links</h1>
            <p className="text-gray-600">Gerencie seus agregadores de links (link-in-bio)</p>
          </div>
          <Link
            href="/dashboard/links/novo"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Agregador
          </Link>
        </div>

        {/* Lista de Agregadores */}
        {aggregators.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum agregador criado</h3>
            <p className="text-gray-500 mb-6">Crie seu primeiro agregador de links para começar</p>
            <Link
              href="/dashboard/links/novo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
              Criar Primeiro Agregador
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aggregators.map((aggregator) => (
              <div
                key={aggregator.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {aggregator.profile_name || aggregator.name}
                    </h3>
                    <p className="text-sm text-gray-500">/{aggregator.slug}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Links:</span> {(aggregator.links || []).length}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Redes sociais:</span> {(aggregator.social_links || []).length}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <Link
                    href={`/dashboard/links/${aggregator.id}`}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit size={16} />
                    Editar
                  </Link>
                  <a
                    href={getPublicUrl(aggregator.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
                  >
                    <ExternalLink size={16} />
                    Ver
                  </a>
                  <button
                    onClick={() => handleDelete(aggregator.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

