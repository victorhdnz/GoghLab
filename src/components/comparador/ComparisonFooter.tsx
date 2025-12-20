'use client'

import { MessageCircle, Mail, Instagram } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ComparisonFooterContent {
  title?: string
  subtitle?: string
  whatsapp_enabled?: boolean
  whatsapp_number?: string
  whatsapp_text?: string
  email_enabled?: boolean
  email_address?: string
  email_text?: string
  instagram_enabled?: boolean
  instagram_url?: string
  instagram_text?: string
}

export function ComparisonFooter() {
  const [content, setContent] = useState<ComparisonFooterContent | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadFooterContent()
  }, [])

  const loadFooterContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'general')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar rodapé:', error)
        return
      }

      const footerData = (data?.value as any)?.comparison_footer
      if (footerData) {
        setContent(footerData as ComparisonFooterContent)
      } else {
        // Valores padrão
        setContent({
          title: 'Pronto para trabalhar com a MV Company?',
          subtitle: 'Entre em contato e descubra como podemos transformar seu negócio',
          whatsapp_enabled: true,
          whatsapp_number: '',
          whatsapp_text: 'WhatsApp',
          email_enabled: true,
          email_address: '',
          email_text: 'E-mail',
          instagram_enabled: true,
          instagram_url: '',
          instagram_text: 'Instagram',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar rodapé:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !content) {
    return null
  }

  const whatsappNumber = content.whatsapp_number?.replace(/\D/g, '') || ''

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto max-w-4xl text-center">
        {content.title && (
          <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-8 mb-6 backdrop-blur-sm inline-block">
            <h2 className="text-3xl md:text-5xl font-bold">
              {content.title}
            </h2>
          </div>
        )}
        {content.subtitle && (
          <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-12 max-w-2xl mx-auto backdrop-blur-sm">
            <p className="text-gray-300 text-lg md:text-xl">
              {content.subtitle}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {content.whatsapp_enabled && whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto min-w-[200px] bg-gray-800/80 border-2 border-gray-700/50 text-white px-8 py-4 rounded-full font-semibold hover:border-gray-600 hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105"
            >
              <MessageCircle 
                size={20} 
                className="group-hover:rotate-12 transition-transform duration-300" 
              />
              <span>{content.whatsapp_text || 'WhatsApp'}</span>
            </a>
          )}
          {content.email_enabled && content.email_address && (
            <a
              href={`mailto:${content.email_address}`}
              className="group w-full sm:w-auto min-w-[200px] bg-gray-800/80 border-2 border-gray-700/50 text-white px-8 py-4 rounded-full font-semibold hover:border-gray-600 hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Mail 
                size={20} 
                className="group-hover:scale-110 transition-transform duration-300" 
              />
              <span>{content.email_text || 'E-mail'}</span>
            </a>
          )}
          {content.instagram_enabled && content.instagram_url && (
            <a
              href={content.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto min-w-[200px] bg-gray-800/80 border-2 border-gray-700/50 text-white px-8 py-4 rounded-full font-semibold hover:border-gray-600 hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Instagram 
                size={20} 
                className="group-hover:rotate-12 transition-transform duration-300" 
              />
              <span>{content.instagram_text || 'Instagram'}</span>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

