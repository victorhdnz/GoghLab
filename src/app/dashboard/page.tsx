'use client'

import { motion } from 'framer-motion'
import {
  GitCompare,
  Layers,
  Palette,
  LogOut,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Users,
  FileText,
  MessageSquare,
  Wrench,
  BookOpen,
  Settings,
  CalendarDays,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'


// Dashboard Principal
function DashboardContent() {
  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      // Forçar redirecionamento completo para limpar estado
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, redirecionar
      window.location.href = '/'
    }
  }

  const mainSections = [
    {
      title: 'Páginas',
      description: 'Edite a homepage e configure os planos',
      icon: Layers,
      items: [
        {
          title: 'Editar Homepage',
          description: 'Personalize textos, imagens e seções da página inicial',
          href: '/dashboard/homepage',
          icon: Palette,
          color: 'bg-indigo-500',
        },
        {
          title: 'Planos de Assinatura',
          description: 'Configure planos, preços e integração com Stripe',
          href: '/dashboard/pricing',
          icon: Sparkles,
          color: 'bg-yellow-500',
        },
      ],
    },
    {
      title: 'Membros',
      description: 'Gerencie usuários cadastrados e seus planos',
      icon: Users,
      items: [
        {
          title: 'Gerenciar Membros',
          description: 'Ver usuários, planos e alterar manualmente assinaturas',
          href: '/dashboard/membros',
          icon: Users,
          color: 'bg-emerald-500',
        },
      ],
    },
    {
      title: 'Agenda IA',
      description: 'Visualize a agenda de conteúdo dos usuários e apague por mês para liberar nova geração',
      icon: CalendarDays,
      items: [
        {
          title: 'Agenda IA',
          description: 'Ver agendas dos usuários e apagar agenda por mês (libera botão Gerar agenda)',
          href: '/dashboard/agenda-ia',
          icon: CalendarDays,
          color: 'bg-amber-500',
        },
      ],
    },
    {
      title: 'Comparador de Empresas',
      description: 'Configure empresas e tópicos para o comparador público',
      icon: GitCompare,
      items: [
        {
          title: 'Gerenciar Comparações',
          description: 'Adicionar, editar e organizar comparações de empresas',
          href: '/dashboard/comparador',
          icon: GitCompare,
          color: 'bg-orange-500',
        },
      ],
    },
    {
      title: 'Agregadores de Links',
      description: 'Crie e gerencie agregadores de links (link-in-bio)',
      icon: LinkIcon,
      items: [
        {
          title: 'Gerenciar Agregadores',
          description: 'Criar e editar agregadores de links com efeitos 3D',
          href: '/dashboard/links',
          icon: LinkIcon,
          color: 'bg-pink-500',
        },
      ],
    },
    {
      title: 'Termos e Políticas',
      description: 'Gerencie termos de uso e políticas do site',
      icon: FileText,
      items: [
        {
          title: 'Gerenciar Termos',
          description: 'Editar termos de uso, política de privacidade e outros',
          href: '/dashboard/termos',
          icon: FileText,
          color: 'bg-purple-500',
        },
      ],
    },
    {
      title: 'Solicitações',
      description: 'Gerencie solicitações de acesso às ferramentas',
      icon: MessageSquare,
      items: [
        {
          title: 'Solicitações de Ferramentas',
          description: 'Visualize e responda solicitações de acesso às ferramentas',
          href: '/dashboard/solicitacoes',
          icon: Wrench,
          color: 'bg-purple-500',
        },
      ],
    },
    {
      title: 'Ferramentas',
      description: 'Configure ferramentas que os planos podem incluir',
      icon: Wrench,
      items: [
        {
          title: 'Gerenciar Ferramentas',
          description: 'Crie ferramentas, vincule a produto, link do vídeo e prazo de 8 dias',
          href: '/dashboard/ferramentas',
          icon: Wrench,
          color: 'bg-slate-600',
        },
      ],
    },
    {
      title: 'Cursos',
      description: 'Gerencie cursos e aulas para os membros',
      icon: BookOpen,
      items: [
        {
          title: 'Gerenciar Cursos',
          description: 'Crie e edite cursos de Canva e CapCut com vídeos e sequência de aulas',
          href: '/dashboard/cursos',
          icon: BookOpen,
          color: 'bg-teal-500',
        },
      ],
    },
    {
      title: 'Configurações',
      description: 'Configure logo e número de WhatsApp para suporte',
      icon: Settings,
      items: [
        {
          title: 'Configurações Gerais',
          description: 'Configure a logo da empresa e número de WhatsApp para suporte',
          href: '/dashboard/configuracoes',
          icon: Settings,
          color: 'bg-gray-600',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Dashboard Administrativo</h1>
            <p className="text-sm text-gray-600">
              Olá, <span className="font-medium">Gogh Lab</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        {/* Main Sections */}
        <div className="space-y-6">
          {mainSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.15 }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white flex-shrink-0">
                  <section.icon size={16} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">{section.title}</h2>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {section.items.map((item) => (
                  <Link 
                    key={item.title} 
                    href={item.href}
                    target={(item as any).external ? '_blank' : undefined}
                  >
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group h-full">
                      <div className="flex items-start justify-between">
                        <div className={`${item.color} w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform flex-shrink-0`}>
                          <item.icon size={20} />
                        </div>
                        <ArrowRight className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all flex-shrink-0" size={18} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                      <p className="text-xs text-gray-500 leading-snug">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente Principal - Sem verificações de autenticação
// O middleware já protege todas as rotas /dashboard/*
// Esta página apenas exibe o conteúdo
export default function DashboardPage() {
  // Sem verificações - confiar totalmente no middleware
  // Se chegou aqui, o middleware já verificou a autenticação
  return <DashboardContent />
}
