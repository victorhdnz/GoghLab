'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WhatsAppFloat } from '@/components/ui/WhatsAppFloat'
import { createClient } from '@/lib/supabase/client'

/**
 * Renderiza o WhatsAppFloat apenas em páginas que não sejam catálogos e suporte
 * Busca configuração do botão flutuante do site_settings
 */
export function ConditionalWhatsAppFloat() {
  const pathname = usePathname()
  const [config, setConfig] = useState<{
    enabled: boolean
    phoneNumber?: string
    message?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Não mostrar o botão global em catálogos e suporte
  const isCatalog = pathname?.startsWith('/catalogo')
  const isSupport = pathname?.startsWith('/suporte')
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const supabase = createClient()
        const isComparador = pathname?.startsWith('/comparar')
        const isServicePage = pathname?.startsWith('/portfolio/') && pathname !== '/portfolio'
        
        // Se estiver na página do comparador, buscar do comparison_footer
        if (isComparador) {
          const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'general')
            .maybeSingle()

          if (error) {
            console.error('Erro ao carregar configuração do WhatsApp:', error)
            setConfig({ enabled: false })
            return
          }

          const comparisonFooter = (data?.value as any)?.comparison_footer
          const whatsappEnabled = comparisonFooter?.whatsapp_enabled !== false
          const phoneNumber = comparisonFooter?.whatsapp_number?.replace(/\D/g, '') || ''
          const message = 'Olá! Gostaria de saber mais sobre os serviços.'

          setConfig({
            enabled: whatsappEnabled && phoneNumber.length > 0,
            phoneNumber,
            message,
          })
        } else if (isServicePage) {
          // Se estiver na página de serviço, buscar do detail_layout do serviço
          const slug = pathname.split('/portfolio/')[1]?.split('?')[0]
          if (!slug) {
            setConfig({ enabled: false })
            return
          }

          const { data: serviceData, error: serviceError } = await supabase
            .from('services')
            .select('detail_layout')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle()

          if (serviceError || !serviceData) {
            console.error('Erro ao carregar serviço:', serviceError)
            // Fallback para configuração da homepage
            const { data, error } = await supabase
              .from('site_settings')
              .select('homepage_content, contact_whatsapp')
              .eq('key', 'general')
              .maybeSingle()

            if (error) {
              setConfig({ enabled: false })
              return
            }

            const homepageContent = data?.homepage_content || {}
            const whatsappFloatEnabled = homepageContent.whatsapp_float_enabled !== false
            const phoneNumber = homepageContent.contact_whatsapp_number || homepageContent.whatsapp_float_number || data?.contact_whatsapp || '5534984136291'
            const message = homepageContent.whatsapp_float_message || 'Olá! Gostaria de saber mais sobre os serviços.'

            setConfig({
              enabled: whatsappFloatEnabled && phoneNumber,
              phoneNumber,
              message,
            })
            return
          }

          const detailLayout = serviceData.detail_layout as any
          const whatsappFloatEnabled = detailLayout?.whatsapp_float_enabled !== false
          const phoneNumber = detailLayout?.whatsapp_float_number?.replace(/\D/g, '') || ''
          const message = detailLayout?.whatsapp_float_message || 'Olá! Gostaria de saber mais sobre este serviço.'

          // Se não tiver configuração no serviço, usar da homepage como fallback
          if (!phoneNumber) {
            const { data, error } = await supabase
              .from('site_settings')
              .select('homepage_content, contact_whatsapp')
              .eq('key', 'general')
              .maybeSingle()

            if (!error && data) {
              const homepageContent = data?.homepage_content || {}
              const fallbackNumber = homepageContent.contact_whatsapp_number || homepageContent.whatsapp_float_number || data?.contact_whatsapp || '5534984136291'
              const fallbackMessage = homepageContent.whatsapp_float_message || 'Olá! Gostaria de saber mais sobre os serviços.'

              setConfig({
                enabled: whatsappFloatEnabled && fallbackNumber,
                phoneNumber: fallbackNumber,
                message: message || fallbackMessage,
              })
              return
            }
          }

          setConfig({
            enabled: whatsappFloatEnabled && phoneNumber,
            phoneNumber,
            message,
          })
        } else {
          // Para outras páginas (homepage), usar configuração da homepage
          const { data, error } = await supabase
            .from('site_settings')
            .select('homepage_content, contact_whatsapp')
            .eq('key', 'general')
            .maybeSingle()

          if (error) {
            console.error('Erro ao carregar configuração do WhatsApp:', error)
            setConfig({ enabled: false })
            return
          }

          const homepageContent = data?.homepage_content || {}
          const whatsappFloatEnabled = homepageContent.whatsapp_float_enabled !== false // Default true
          // Priorizar contact_whatsapp_number (usado nos botões de contato) para manter sincronizado
          const phoneNumber = homepageContent.contact_whatsapp_number || homepageContent.whatsapp_float_number || data?.contact_whatsapp || '5534984136291'
          const message = homepageContent.whatsapp_float_message || 'Olá! Gostaria de saber mais sobre os serviços.'

          setConfig({
            enabled: whatsappFloatEnabled && phoneNumber,
            phoneNumber,
            message,
          })
        }
      } catch (error) {
        console.error('Erro ao carregar configuração do WhatsApp:', error)
        setConfig({ enabled: false })
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [pathname])
  
  if (isCatalog || isSupport || loading || !config?.enabled) {
    return null
  }
  
  return <WhatsAppFloat phoneNumber={config.phoneNumber} message={config.message} />
}

