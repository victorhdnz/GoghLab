'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { User, Package, LayoutDashboard, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMobile } from '@/hooks/useMobile'
import { isAdminEmail } from '@/lib/utils/admin'

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { profile, signOut, isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const isMobile = useMobile()

  // Fechar menu com useCallback para evitar recriações
  const closeMenu = useCallback(() => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsClosing(true)
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      timeoutRef.current = null
    }, 200)
  }, [])

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, closeMenu])

  // Fechar menu ao pressionar ESC
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeMenu])

  const handleSignOut = async () => {
    closeMenu()
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleMenuClick = useCallback((href: string) => {
    closeMenu()
    router.push(href)
  }, [closeMenu, router])

  // Memoizar menuItems para evitar recriações
  // REMOVIDO: Dashboard não aparece mais no menu (acessível apenas por /admin)
  const menuItems = useMemo(() => {
    const items = [
      {
        label: 'Minha Conta',
        href: '/minha-conta',
        icon: User,
        visible: false, // Desabilitado - sistema não usa mais conta de cliente
        description: 'Configurações do perfil'
      },
      {
        label: 'Meus Pedidos',
        href: '/minha-conta/pedidos',
        icon: Package,
        visible: false, // Desabilitado - sistema não usa mais pedidos
        description: 'Histórico de compras'
      },
      // Dashboard removido - acessível apenas por URL /admin
    ]
    return items.filter(item => item.visible)
  }, [user?.email])

  // Adicionar classe no body para prevenir scroll quando menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Se ainda está carregando, mostrar ícone padrão (sempre visível)
  if (loading) {
    return (
      <button
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        disabled
        aria-label="Carregando perfil"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center">
          <User size={24} className="text-black" strokeWidth={1.5} />
        </div>
      </button>
    )
  }

  // Se não autenticado, não mostrar (deixar o Header mostrar o botão "Entrar")
  if (!isAuthenticated) {
    return null
  }

  // Sempre mostrar ícone, mesmo se profile não estiver carregado ainda
  // O profile pode estar sendo carregado em background

  return (
    <div className="relative group">
      {/* Botão do Avatar - Sempre mostrar ícone, nunca imagem */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Menu do usuário"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center">
          <User size={24} className="text-black" strokeWidth={1.5} />
        </div>
      </button>

      {/* Overlay para mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`${
              isMobile 
                ? 'fixed top-16 right-4 left-4 w-auto' 
                : 'absolute right-0 mt-2 w-56'
            } bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden backdrop-blur-sm`}
          >
            {/* Cabeçalho do Menu */}
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile?.full_name || user?.email || 'Usuário'}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {profile?.email || user?.email || ''}
              </p>
            </div>

            {/* Itens do Menu */}
            <div className="py-1">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <button
                    onClick={() => handleMenuClick(item.href)}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 transition-all duration-200 group relative"
                    aria-label={item.label}
                    title={item.description}
                  >
                    <div className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700 transition-colors transform group-hover:scale-110">
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{item.label}</span>
                      {item.description && (
                        <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Separador */}
            <div className="border-t border-gray-100"></div>

            {/* Logout */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: menuItems.length * 0.1, duration: 0.3 }}
            >
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 transition-all duration-200 group"
              >
                <div className="w-5 h-5 mr-3 text-red-500 group-hover:text-red-600 transition-colors transform group-hover:scale-110">
                  <LogOut size={20} />
                </div>
                <span className="font-medium">Sair</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}