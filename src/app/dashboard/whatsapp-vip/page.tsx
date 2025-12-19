'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, User, Mail, Phone, Calendar, ExternalLink, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface WhatsAppVipRegistration {
  id: string
  name: string
  email: string
  phone: string
  whatsapp_group_link?: string
  created_at: string
}

export default function DashboardWhatsAppVipPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<WhatsAppVipRegistration[]>([])
  const [whatsappGroupLink, setWhatsappGroupLink] = useState<string>('')
  const [requireRegistration, setRequireRegistration] = useState<boolean>(true)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard')
      return
    }

    if (isAuthenticated && isAdmin) {
      loadRegistrations()
      loadWhatsAppLink()
      loadRequireRegistration()
    }
  }, [isAuthenticated, isAdmin, authLoading, router])

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('whatsapp_vip_registrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRegistrations(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar registros:', error)
      toast.error('Erro ao carregar registros')
    } finally {
      setLoading(false)
    }
  }

  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) return ''
    const str = String(field)
    // Se contém vírgula, aspas ou quebra de linha, precisa ser escapado
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      // Escapar aspas duplicando-as e envolver em aspas
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const handleExportCSV = () => {
    // Cabeçalho com separador ponto-e-vírgula (padrão brasileiro)
    const headers = ['Nome', 'E-mail', 'Telefone', 'Data de Cadastro']
    const rows = registrations.map(reg => [
      escapeCSVField(reg.name || ''),
      escapeCSVField(reg.email || ''),
      escapeCSVField(reg.phone || ''),
      new Date(reg.created_at).toLocaleDateString('pt-BR'),
    ])

    // Criar CSV com separador ponto-e-vírgula
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n')

    // Adicionar BOM UTF-8 para compatibilidade com planilhas e editores
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `grupo_vip_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('CSV exportado com sucesso!')
  }

  const loadWhatsAppLink = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_vip_group_link')
        .maybeSingle()

      if (data?.value) {
        setWhatsappGroupLink(typeof data.value === 'string' ? data.value : '')
      }
    } catch (error) {
      console.error('Erro ao carregar link do WhatsApp:', error)
    }
  }

  const loadRequireRegistration = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_vip_require_registration')
        .maybeSingle()

      if (data?.value !== undefined) {
        setRequireRegistration(typeof data.value === 'boolean' ? data.value : data.value === 'true' || data.value === true)
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de cadastro:', error)
    }
  }

  const updateRequireRegistration = async (value: boolean) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'whatsapp_vip_require_registration',
          value: value,
          description: 'Exigir cadastro antes de acessar o grupo WhatsApp',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })

      if (error) throw error

      setRequireRegistration(value)
      toast.success(value ? 'Cadastro obrigatório ativado' : 'Cadastro obrigatório desativado')
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error)
      toast.error('Erro ao atualizar configuração')
    }
  }

  const updateWhatsAppLink = async () => {
    const newLink = prompt('Digite o link do grupo VIP do WhatsApp:', whatsappGroupLink || 'https://chat.whatsapp.com/EVPNbUpwsjW7FMlerVRDqo?mode=wwt')
    
    if (newLink === null) return

    if (!newLink.trim()) {
      toast.error('Link não pode estar vazio')
      return
    }

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'whatsapp_vip_group_link',
          value: newLink.trim(),
          description: 'Link do Grupo VIP do WhatsApp',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })

      if (error) throw error

      setWhatsappGroupLink(newLink.trim())
      toast.success('Link atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar link:', error)
      toast.error('Erro ao atualizar link')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DashboardNavigation
          title="Grupo VIP do WhatsApp"
          subtitle="Visualizar registros do Grupo VIP"
          backUrl="/dashboard"
        />

        {/* Configuração do Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Link do Grupo WhatsApp</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure o link do grupo VIP que será exibido após o cadastro
                </p>
                {whatsappGroupLink && (
                  <a
                    href={whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 flex items-center gap-2 text-sm"
                  >
                    <ExternalLink size={16} />
                    {whatsappGroupLink}
                  </a>
                )}
              </div>
              <button
                onClick={updateWhatsAppLink}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                {whatsappGroupLink ? 'Editar Link' : 'Adicionar Link'}
              </button>
            </div>

            {/* Configuração de Cadastro */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">Exigir Cadastro</h3>
                  <p className="text-sm text-gray-600">
                    {requireRegistration 
                      ? 'O usuário precisa preencher o formulário antes de acessar o grupo'
                      : 'O usuário pode acessar o grupo diretamente sem preencher o formulário'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireRegistration}
                    onChange={(e) => updateRequireRegistration(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>

            {registrations.length > 0 && (
              <div className="border-t pt-4">
                <Button onClick={handleExportCSV} variant="outline" className="w-full">
                  <Download size={18} className="mr-2" />
                  Exportar CSV dos Registros
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{registrations.length}</h3>
              <p className="text-gray-600">Total de Registros</p>
            </div>
          </div>
        </motion.div>

        {/* Lista de Registros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-2xl font-bold mb-6">Registros</h3>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((registration, index) => (
                <motion.div
                  key={registration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-green-600" />
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Nome</p>
                      <p className="text-gray-900 font-medium">{registration.name}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Mail size={14} />
                        E-mail
                      </p>
                      <p className="text-gray-900">{registration.email}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Phone size={14} />
                        WhatsApp
                      </p>
                      <a
                        href={`https://wa.me/${registration.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 flex items-center gap-2"
                      >
                        {registration.phone}
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

