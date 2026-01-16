'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
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
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'


// Dashboard Principal
function DashboardContent() {
  const { profile } = useAuth()
  const supabase = createClient()

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
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-600">
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
        <div className="space-y-8">
          {mainSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                  <section.icon size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.items.map((item) => (
                  <Link 
                    key={item.title} 
                    href={item.href}
                    target={(item as any).external ? '_blank' : undefined}
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group h-full">
                      <div className="flex items-start justify-between">
                        <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon size={24} />
                        </div>
                        <ArrowRight className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" size={20} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
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
