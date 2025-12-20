'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BackButton } from '@/components/ui/BackButton'
import { Sparkles, Zap, Palette, Code } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TestesEfeitosPage() {
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<string>('framer-motion')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!isAuthenticated || !isEditor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'framer-motion', label: 'Framer Motion', icon: Zap },
    { id: 'gsap', label: 'GSAP', icon: Sparkles },
    { id: 'shadcn', label: 'Shadcn UI', icon: Palette },
    { id: 'custom', label: 'Custom', icon: Code },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/dashboard" />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Testes de Efeitos</h1>
          <p className="text-gray-600">
            Área experimental para testar diferentes bibliotecas e efeitos antes de implementar no projeto
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-black text-black'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'framer-motion' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Framer Motion</h2>
                  <p className="text-gray-600 mb-4">
                    Teste animações e transições com Framer Motion (já instalado no projeto)
                  </p>
                  
                  {/* Exemplo básico */}
                  <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Exemplo Básico</h3>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-lg p-4 shadow-sm"
                      >
                        <p className="text-gray-700">Este card aparece com animação de fade-in</p>
                      </motion.div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Hover Effect</h3>
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white rounded-lg p-4 shadow-sm cursor-pointer"
                      >
                        <p className="text-gray-700">Passe o mouse e clique para ver o efeito</p>
                      </motion.div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Área para seus testes</h3>
                      <div className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-300 min-h-[200px] flex items-center justify-center">
                        <p className="text-gray-400 text-center">
                          Adicione seus componentes e efeitos aqui
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gsap' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">GSAP</h2>
                  <p className="text-gray-600 mb-4">
                    Teste animações avançadas com GSAP
                  </p>
                  <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                    <p className="text-gray-500">Adicione seus testes de GSAP aqui</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shadcn' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Shadcn UI Components</h2>
                  <p className="text-gray-600 mb-4">
                    Teste componentes do Shadcn UI
                  </p>
                  <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                    <p className="text-gray-500">Adicione seus testes de Shadcn UI aqui</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Efeitos Customizados</h2>
                  <p className="text-gray-600 mb-4">
                    Teste efeitos e bibliotecas customizadas
                  </p>
                  <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                    <p className="text-gray-500">Adicione seus testes customizados aqui</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Como usar</h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li>Escolha uma aba acima para testar diferentes tipos de efeitos</li>
            <li>Adicione seus componentes e efeitos dentro da área de teste</li>
            <li>Teste e ajuste até ficar satisfeito</li>
            <li>Depois de validar, implemente onde precisar no projeto</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

