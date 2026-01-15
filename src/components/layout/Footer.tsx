'use client'

import Link from 'next/link'
import { Instagram, Facebook, Mail, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useNotFound } from '@/contexts/NotFoundContext'

export const Footer = () => {
  const pathname = usePathname()
  const { isNotFound } = useNotFound()
  const currentYear = new Date().getFullYear()
  const [siteSettings, setSiteSettings] = useState<{
    site_name?: string
    footer_text?: string
    copyright_text?: string
    instagram_url?: string
    facebook_url?: string
    address_street?: string
    address_city?: string
    address_state?: string
    address_zip?: string
    contact_whatsapp?: string
    contact_email?: string
  } | null>(null)

  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'general')
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações:', error)
          return
        }

        if (data) {
          // Priorizar colunas diretas, mas também verificar dentro do JSONB value
          const generalSettings = data.value || {}
          setSiteSettings({
            site_name: data.site_name || generalSettings.site_name,
            footer_text: data.footer_text || generalSettings.footer_text,
            copyright_text: data.copyright_text || generalSettings.copyright_text,
            instagram_url: data.instagram_url || generalSettings.instagram_url,
            facebook_url: data.facebook_url || generalSettings.facebook_url,
            address_street: data.address_street || generalSettings.address_street,
            address_city: data.address_city || generalSettings.address_city,
            address_state: data.address_state || generalSettings.address_state,
            address_zip: data.address_zip || generalSettings.address_zip,
            contact_whatsapp: data.contact_whatsapp || generalSettings.contact_whatsapp,
            contact_email: data.contact_email || generalSettings.contact_email,
          })
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
    loadSiteSettings()
  }, [])

  // Ocultar footer em landing pages, página principal, dashboard, comparador, catálogos, suporte, páginas de serviço e páginas 404
  if (pathname?.startsWith('/lp/') || pathname === '/' || pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/comparar') || pathname?.startsWith('/catalogo') || pathname?.startsWith('/suporte') || pathname?.startsWith('/portfolio/') || pathname?.startsWith('/links/') || isNotFound) {
    return null
  }

  return (
    <footer className="bg-black text-white mt-0 relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-12 gap-y-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">{siteSettings?.site_name || 'MV Company'}</h3>
            <p className="text-gray-400 mb-4">
              {siteSettings?.footer_text || 'Produtos de qualidade com design moderno e elegante.'}
            </p>
            <div className="text-gray-400 text-sm space-y-1">
              <p className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {siteSettings?.address_street || 'Av. Imbaúba, 1676'}<br />
                  {siteSettings?.address_city && siteSettings?.address_state && `${siteSettings.address_city} - ${siteSettings.address_state}`}<br />
                  {siteSettings?.address_zip || '38413-108'}
                </span>
              </p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/produtos"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Produtos
                </Link>
              </li>
              <li>
                <Link
                  href="#sobre"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="#contato"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contato
                </Link>
              </li>
              {/* Removido: Minha Conta (e-commerce não utilizado) */}
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Informações</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/termos"
                  className="text-gray-400 hover:text-white transition-colors font-medium"
                >
                  Termos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-gray-400">
                <Phone size={18} />
                <a href={`https://wa.me/${siteSettings?.contact_whatsapp?.replace(/\D/g, '') || '5534984136291'}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {siteSettings?.contact_whatsapp || '(34) 98413-6291'}
                </a>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Mail size={18} />
                <a href={`mailto:${siteSettings?.contact_email || 'contato.goghlab@gmail.com'}`} className="hover:text-white transition-colors">
                  {siteSettings?.contact_email || 'contato.goghlab@gmail.com'}
                </a>
              </li>
            </ul>

            <div className="flex space-x-4 mt-6">
              {siteSettings?.instagram_url && (
                <a
                  href={siteSettings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Instagram size={20} />
                </a>
              )}
              {siteSettings?.facebook_url && (
                <a
                  href={siteSettings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Facebook size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>
            © {currentYear} {siteSettings?.site_name || 'MV Company'}. {siteSettings?.copyright_text || 'Todos os direitos reservados.'}
          </p>
        </div>
      </div>
    </footer>
  )
}

