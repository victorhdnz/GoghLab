'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, Copy, Check, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import Image from 'next/image'

export default function DashboardPortfolioPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [creating, setCreating] = useState(false)
  const hasCheckedAuth = useRef(false)

  const supabase = createClient()

  useEffect(() => {
    // Aguardar o carregamento da autenticação terminar
    if (authLoading) return

    // Evitar múltiplas verificações
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    // Verificar autenticação
    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    // Carregar serviços
    loadServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, isEditor])

  const loadServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar serviços:', error)
        throw error
      }
      
      setServices(data as Service[] || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId)

      if (error) throw error

      toast.success('Status atualizado')
      loadServices()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error

      toast.success('Serviço excluído')
      loadServices()
    } catch (error) {
      toast.error('Erro ao excluir serviço')
    }
  }

  const copyServiceLink = async (service: Service) => {
    const link = `${window.location.origin}/portfolio/${service.slug}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLinkId(service.id)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopiedLinkId(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  // Filter services
  useEffect(() => {
    let filtered = services

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(service =>
        statusFilter === 'active' ? service.is_active : !service.is_active
      )
    }

    setFilteredServices(filtered)
    setCurrentPage(1)
  }, [services, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedServices = filteredServices.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      toast.error('Digite o nome do serviço')
      return
    }

    try {
      setCreating(true)

      // Gerar slug automaticamente
      const slug = newServiceName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('services')
        .insert({
          name: newServiceName.trim(),
          slug,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Serviço criado com sucesso!')
      setShowCreateModal(false)
      setNewServiceName('')
      
      // Redirecionar para o editor do serviço recém-criado
      router.push(`/dashboard/portfolio/${data.id}`)
    } catch (error: any) {
      console.error('Erro ao criar serviço:', error)
      toast.error(error.message || 'Erro ao criar serviço')
    } finally {
      setCreating(false)
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton href="/dashboard" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Serviços</h1>
            <p className="text-gray-600">Crie, edite e configure o layout das páginas de serviços</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Serviço
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services List */}
        {paginatedServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhum serviço encontrado com os filtros aplicados'
                : 'Nenhum serviço cadastrado ainda'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
              >
                <Plus size={20} className="mr-2" />
                Criar Primeiro Serviço
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serviço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {service.cover_image ? (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={service.cover_image}
                                  alt={service.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                                <Briefcase className="text-gray-600" size={28} />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{service.name}</div>
                              <div className="text-sm text-gray-500">/{service.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleServiceStatus(service.id, service.is_active)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              service.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {service.is_active ? (
                              <>
                                <Eye size={14} />
                                Ativo
                              </>
                            ) : (
                              <>
                                <EyeOff size={14} />
                                Inativo
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyServiceLink(service)}
                              className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded"
                              title="Copiar link do serviço"
                            >
                              {copiedLinkId === service.id ? (
                                <Check size={18} className="text-green-600" />
                              ) : (
                                <Copy size={18} />
                              )}
                            </button>
                            <Link href={`/dashboard/portfolio/${service.id}`}>
                              <button className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded" title="Editar serviço">
                                <Edit size={18} />
                              </button>
                            </Link>
                            <button
                              onClick={() => deleteService(service.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                              title="Excluir serviço"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredServices.length)} de {filteredServices.length} serviços
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-4 py-2 border rounded-lg ${
                        currentPage === page
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Criação de Serviço */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setNewServiceName('')
          }}
          title="Criar Novo Serviço"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Digite o nome do serviço. Após criar, você poderá editar o layout completo.
            </p>
            <Input
              label="Nome do Serviço *"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="Ex: Criação de Sites Responsivos"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newServiceName.trim()) {
                  handleCreateService()
                }
              }}
            />
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewServiceName('')
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateService}
                isLoading={creating}
                disabled={!newServiceName.trim()}
              >
                Criar e Editar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
