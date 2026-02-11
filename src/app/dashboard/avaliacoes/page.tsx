'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ServiceTestimonial, Service } from '@/types'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, Star, Image as ImageIcon } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import toast from 'react-hot-toast'
import { BackButton } from '@/components/ui/BackButton'
import Image from 'next/image'
import Link from 'next/link'

export default function DashboardAvaliacoesPage() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<ServiceTestimonial[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredTestimonials, setFilteredTestimonials] = useState<ServiceTestimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const supabase = createClient()

  useEffect(() => {
    // Carregar dados - autenticação é verificada pelo middleware
    loadData()
  }, [])

  // Recarregar quando a página receber foco
  useEffect(() => {
    
    const handleFocus = () => {
      loadData()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [testimonialsResult, servicesResult] = await Promise.all([
        supabase
          .from('service_testimonials')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('services')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
      ])

      if (testimonialsResult.error) throw testimonialsResult.error
      if (servicesResult.error) throw servicesResult.error

      setTestimonials(testimonialsResult.data as ServiceTestimonial[] || [])
      setServices(servicesResult.data as Service[] || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }

  const toggleTestimonialStatus = async (testimonialId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('service_testimonials')
        .update({ is_active: !currentStatus })
        .eq('id', testimonialId)

      if (error) throw error

      toast.success('Status atualizado')
      loadData()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const deleteTestimonial = async (testimonialId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return

    try {
      const { error } = await (supabase as any)
        .from('service_testimonials')
        .delete()
        .eq('id', testimonialId)

      if (error) throw error

      toast.success('Avaliação excluída')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir avaliação')
    }
  }

  // Filter testimonials
  useEffect(() => {
    let filtered = testimonials

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(testimonial =>
        testimonial.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimonial.client_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimonial.testimonial_text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(testimonial =>
        statusFilter === 'active' ? testimonial.is_active : !testimonial.is_active
      )
    }

    // Service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(testimonial =>
        testimonial.service_id === serviceFilter
      )
    }

    setFilteredTestimonials(filtered)
    setCurrentPage(1)
  }, [testimonials, searchTerm, statusFilter, serviceFilter])

  // Pagination
  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTestimonials = filteredTestimonials.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getServiceName = (serviceId?: string) => {
    if (!serviceId) return 'Geral'
    const service = services.find(s => s.id === serviceId)
    return service?.name || 'Serviço não encontrado'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LumaSpin size="default" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton href="/dashboard" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Avaliações de Clientes</h1>
            <p className="text-gray-600">Gerencie depoimentos e avaliações dos clientes</p>
          </div>
          <Link href="/dashboard/avaliacoes/novo">
            <Button className="flex items-center gap-2">
              <Plus size={20} />
              Nova Avaliação
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar avaliações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Service Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Todos os serviços</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
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

        {/* Testimonials List */}
        {paginatedTestimonials.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all'
                ? 'Nenhuma avaliação encontrada com os filtros aplicados'
                : 'Nenhuma avaliação cadastrada ainda'}
            </p>
            {!searchTerm && statusFilter === 'all' && serviceFilter === 'all' && (
              <Link href="/dashboard/avaliacoes/novo">
                <Button className="mt-4">
                  <Plus size={20} className="mr-2" />
                  Criar Primeira Avaliação
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedTestimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {testimonial.client_photo ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={testimonial.client_photo}
                            alt={testimonial.client_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">👤</span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.client_name}</div>
                        {testimonial.client_company && (
                          <div className="text-sm text-gray-500">{testimonial.client_company}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTestimonialStatus(testimonial.id, testimonial.is_active)}
                      className={`p-1 rounded ${
                        testimonial.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {testimonial.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {testimonial.rating && (
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < testimonial.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-gray-700 text-sm mb-3 line-clamp-4">
                    "{testimonial.testimonial_text}"
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      {getServiceName(testimonial.service_id)}
                      {testimonial.is_featured && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                          Destaque
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/avaliacoes/${testimonial.id}`}>
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <Edit size={16} />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteTestimonial(testimonial.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTestimonials.length)} de {filteredTestimonials.length} avaliações
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
      </div>
    </div>
  )
}

