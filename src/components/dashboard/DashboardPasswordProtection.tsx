'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { DashboardNotificationBell } from './DashboardNotificationBell'

const DASHBOARD_PASSWORD = 'Goghlab053149@'
const STORAGE_KEY = 'dashboard_password_verified'

interface DashboardPasswordProtectionProps {
  children: React.ReactNode
}

export function DashboardPasswordProtection({ children }: DashboardPasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar se já foi autenticado (usando localStorage para persistir após login)
    // IMPORTANTE: A senha é pedida apenas UMA VEZ após o login do Google
    // Depois disso, fica salva no localStorage até o usuário fazer logout
    const verified = localStorage.getItem(STORAGE_KEY) === 'true'
    setIsVerified(verified)
    setIsChecking(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password === DASHBOARD_PASSWORD) {
      // Salvar verificação no localStorage (persiste entre sessões)
      // IMPORTANTE: Será limpa apenas quando o usuário fizer logout do Google
      localStorage.setItem(STORAGE_KEY, 'true')
      setIsVerified(true)
      setPassword('')
    } else {
      setError('Senha incorreta. Tente novamente.')
      setPassword('')
    }
  }

  const handleLogout = () => {
    // Limpar verificação e redirecionar
    localStorage.removeItem(STORAGE_KEY)
    router.push('/')
  }

  // Mostrar loading enquanto verifica
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LumaSpin size="default" className="mx-auto mb-4" />
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não está verificado, mostrar modal de senha
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso ao Dashboard
            </h2>
            <p className="text-gray-600">
              Por segurança, digite a senha de acesso ao dashboard administrativo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Digite a senha"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Acessar Dashboard
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Voltar para a página inicial
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // Se está verificado, mostrar conteúdo do dashboard com sino de notificações fixo
  return (
    <>
      <DashboardNotificationBell />
      {children}
    </>
  )
}

