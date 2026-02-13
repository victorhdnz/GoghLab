'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Wrench,
  ExternalLink,
  Calendar,
  CreditCard,
  CheckCircle2,
  MessageCircle,
  Phone
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { Button } from '@/components/ui/button'

/** Limites de quantidade dos serviços personalizados (mensal e anual). Definidos nos termos. */
const SERVICE_QUANTITY_LIMITS: Record<string, { quantity: number; label: string }> = {
  'Criação de conteúdo completa': { quantity: 10, label: 'até 10 conteúdos por mês' },
  'Gestão de redes sociais': { quantity: 12, label: 'até 12 publicações por mês' },
}

interface ServiceSubscription {
  id: string
  plan_name: string | null
  billing_cycle: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  selected_services: string[]
  created_at: string
}

export default function ServicosPage() {
  const { user } = useAuth()
  const [serviceSubscriptions, setServiceSubscriptions] = useState<ServiceSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState<string>('5534999999999')
  const [contactPhone, setContactPhone] = useState<string | null>(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const loadServiceSubscriptions = async () => {
      if (!user) {
        setServiceSubscriptions([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await (supabase as any)
          .from('service_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Erro ao carregar serviços:', error)
          toast.error('Erro ao carregar serviços contratados')
          return
        }

        let services = (data || []) as ServiceSubscription[]
        
        // Remover duplicatas: manter apenas a mais recente
        if (services.length > 1) {
          // Agrupar por serviços selecionados e manter apenas a mais recente de cada grupo
          const serviceMap = new Map<string, ServiceSubscription>()
          services.forEach((service) => {
            const serviceKey = JSON.stringify(
              ((service.selected_services || []) as string[]).sort().join(',')
            )
            const existing = serviceMap.get(serviceKey)
            if (!existing || new Date(service.created_at) > new Date(existing.created_at)) {
              serviceMap.set(serviceKey, {
                ...service,
                selected_services: [...new Set(service.selected_services || [])] as string[]
              })
            }
          })
          
          // Converter de volta para array
          services = Array.from(serviceMap.values())
          
          // Se ainda houver múltiplas assinaturas, manter apenas a mais recente
          if (services.length > 1) {
            services = [services.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]]
          }
        } else if (services.length === 1) {
          // Remover duplicatas dentro do array de serviços selecionados
          services = [{
            ...services[0],
            selected_services: [...new Set(services[0].selected_services || [])] as string[]
          }]
        }
        
        setServiceSubscriptions(services)

        // Carregar telefone do perfil (para exibir e para exigir cadastro na primeira entrada)
        const loadProfilePhone = async () => {
          if (!user) return
          try {
            const { data } = await (supabase as any)
              .from('profiles')
              .select('contact_phone, phone')
              .eq('id', user.id)
              .single()
            const phone = data?.contact_phone ?? data?.phone ?? null
            setContactPhone(phone)
            if (services.length > 0 && !phone) setShowPhoneModal(true)
          } catch {
            if (services.length > 0) setShowPhoneModal(true)
          }
        }
        loadProfilePhone()
      } catch (error) {
        console.error('Erro ao carregar serviços:', error)
        toast.error('Erro ao carregar serviços contratados')
      } finally {
        setLoading(false)
      }
    }

    loadServiceSubscriptions()
    
    // Atualizar serviços quando a página ganha foco
    const handleFocus = () => {
      loadServiceSubscriptions()
    }
    
    // Atualizar quando receber evento de atualização de serviço
    const handleServiceUpdate = () => {
      loadServiceSubscriptions()
    }
    
    // Atualizar periodicamente (a cada 30 segundos) para pegar mudanças manuais
    // Intervalo aumentado para evitar atualizações muito frequentes
    const interval = setInterval(() => {
      loadServiceSubscriptions()
    }, 30000)
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('service-subscription-updated', handleServiceUpdate)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('service-subscription-updated', handleServiceUpdate)
      clearInterval(interval)
    }
  }, [user, supabase])

  useEffect(() => {
    const loadWhatsapp = async () => {
      try {
        const { data } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', 'contact_whatsapp')
          .single()

        if (data?.value) {
          const number = data.value.replace(/\D/g, '')
          setWhatsappNumber(number || '5534999999999')
        }
      } catch (error) {
        console.error('Erro ao carregar WhatsApp:', error)
      }
    }

    loadWhatsapp()
  }, [supabase])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <LumaSpin size="default" />
        </div>
      </div>
    )
  }

  const handleSavePhone = async () => {
    const raw = phoneInput.replace(/\D/g, '')
    if (raw.length < 10) {
      toast.error('Informe um número válido com DDD')
      return
    }
    setSavingPhone(true)
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ contact_phone: raw, updated_at: new Date().toISOString() })
        .eq('id', user!.id)
      if (error) throw error
      setContactPhone(raw)
      setShowPhoneModal(false)
      setPhoneInput('')
      toast.success('Número cadastrado. Nossa equipe pode entrar em contato por ele.')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar número')
    } finally {
      setSavingPhone(false)
    }
  }

  const mustShowPhoneModal = showPhoneModal && serviceSubscriptions.length > 0 && !contactPhone

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modal obrigatório: cadastrar telefone na primeira entrada (quem tem serviços e ainda não tem número) */}
      {mustShowPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl border border-gogh-grayLight p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gogh-yellow/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-gogh-black" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gogh-black">Cadastre seu número para contato</h3>
                <p className="text-sm text-gogh-grayDark mt-0.5">
                  Para acessar esta área e para que nossa equipe possa entrar em contato sobre seus serviços, informe seu WhatsApp ou telefone.
                </p>
              </div>
            </div>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full px-4 py-3 border border-gogh-grayLight rounded-xl text-gogh-black placeholder:text-gray-400 focus:ring-2 focus:ring-gogh-yellow focus:border-gogh-yellow"
              aria-label="Telefone para contato"
            />
            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowPhoneModal(false)}
              >
                Depois
              </Button>
              <Button
                type="button"
                className="flex-1 bg-gogh-yellow hover:bg-gogh-yellow/90 text-gogh-black"
                onClick={handleSavePhone}
                disabled={savingPhone}
              >
                {savingPhone ? 'Salvando...' : 'Salvar e continuar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
          Meus Serviços
        </h1>
        <p className="text-gogh-grayDark">
          Gerencie seus serviços personalizados contratados
        </p>
      </div>

      {/* Serviços Contratados */}
      {serviceSubscriptions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gogh-grayLight p-8 lg:p-12 text-center"
        >
          <div className="w-16 h-16 bg-gogh-grayLight rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-gogh-grayDark" />
          </div>
          <h3 className="text-xl font-bold text-gogh-black mb-2">
            Nenhum serviço contratado
          </h3>
          <p className="text-gogh-grayDark mb-6">
            Você ainda não contratou serviços personalizados. Confira as opções disponíveis na seção de planos.
          </p>
          <a
            href="/precos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
          >
            Ver serviços disponíveis
          </a>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {serviceSubscriptions.map((service, index) => {
            // Remover duplicatas dos serviços
            const serviceNames = service.selected_services?.length
              ? [...new Set(service.selected_services)]
              : ['Serviços personalizados']
            
            const message = `Olá! Gostaria de falar sobre meu serviço contratado (${service.plan_name || 'Serviços Personalizados'}). Serviços: ${serviceNames.join(', ')}.`
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

            const isActive = service.status === 'active' || service.status === 'trialing'
            const nextChargeDate = service.current_period_end 
              ? new Date(service.current_period_end).toLocaleDateString('pt-BR')
              : null

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gogh-grayLight overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header do Card */}
                <div className="bg-gradient-to-r from-gogh-yellow/20 to-gogh-yellow/10 p-6 border-b border-gogh-grayLight">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gogh-yellow rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-6 h-6 text-gogh-black" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gogh-black mb-1">
                          {service.plan_name || 'Serviços Personalizados'}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isActive ? 'Ativo' : service.status}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gogh-grayLight rounded-full text-xs font-medium text-gogh-grayDark">
                            <CreditCard className="w-3.5 h-3.5" />
                            {service.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}
                          </span>
                          {nextChargeDate && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full text-xs font-medium text-blue-700">
                              <Calendar className="w-3.5 h-3.5" />
                              Próxima cobrança: {nextChargeDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-6">
                  {/* Lista de Serviços */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gogh-black mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gogh-yellow rounded-full"></span>
                      Serviços Contratados
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {serviceNames.map((serviceName, idx) => {
                        const limit = SERVICE_QUANTITY_LIMITS[serviceName]
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2 px-4 py-2.5 bg-gogh-grayLight/50 rounded-lg border border-gogh-grayLight"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-gogh-black">{serviceName}</span>
                              {limit && (
                                <p className="text-xs text-gogh-grayDark mt-0.5">{limit.label}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Botão de WhatsApp */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Falar no WhatsApp sobre este serviço
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
