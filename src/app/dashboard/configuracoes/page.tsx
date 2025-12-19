'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { saveSiteSettings } from '@/lib/supabase/site-settings-helper'

interface SiteConfig {
  site_name: string
  site_title: string
  site_logo: string
  site_description: string
  footer_text: string
  copyright_text: string
  contact_email: string
  contact_whatsapp: string
  instagram_url: string
  facebook_url: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  loading_emoji: string
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SiteConfig>({
    site_name: 'MV Company',
    site_title: 'MV Company - Serviços Digitais',
    site_logo: '',
    site_description: 'E-commerce de produtos premium',
    footer_text: 'Produtos de qualidade com design moderno e elegante.',
    copyright_text: 'Todos os direitos reservados.',
    contact_email: 'contato@smarttimeprime.com.br',
    contact_whatsapp: '+55 34 8413-6291',
    instagram_url: 'https://www.instagram.com/smarttimeprime',
    facebook_url: 'https://www.facebook.com/smarttimeprime/',
    address_street: 'Av. Imbaúba, 1676 - Loja 1046',
    address_city: 'Uberlândia',
    address_state: 'MG',
    address_zip: '38413-108',
    loading_emoji: '⌚',
  })

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard')
    }

    if (isAuthenticated && isAdmin) {
      loadConfig()
    }
  }, [isAuthenticated, isAdmin, authLoading, router])

  const loadConfig = async () => {
    try {
      // Buscar registro com key = 'general'
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'general')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações:', error)
        throw error
      }

      if (data) {
        // Priorizar colunas diretas, mas também verificar dentro do JSONB value
        const generalSettings = data.value || {}
        setConfig({
          site_name: data.site_name || generalSettings.site_name || config.site_name,
          site_title: data.site_title || generalSettings.site_title || `${data.site_name || generalSettings.site_name || config.site_name} - Relógios Premium`,
          site_logo: data.site_logo || generalSettings.site_logo || config.site_logo,
          site_description: data.site_description || generalSettings.site_description || config.site_description,
          footer_text: data.footer_text || generalSettings.footer_text || config.footer_text,
          copyright_text: data.copyright_text || generalSettings.copyright_text || config.copyright_text,
          contact_email: data.contact_email || generalSettings.contact_email || config.contact_email,
          contact_whatsapp: data.contact_whatsapp || generalSettings.contact_whatsapp || config.contact_whatsapp,
          instagram_url: data.instagram_url || generalSettings.instagram_url || config.instagram_url,
          facebook_url: data.facebook_url || generalSettings.facebook_url || config.facebook_url,
          address_street: data.address_street || generalSettings.address_street || config.address_street,
          address_city: data.address_city || generalSettings.address_city || config.address_city,
          address_state: data.address_state || generalSettings.address_state || config.address_state,
          address_zip: data.address_zip || generalSettings.address_zip || config.address_zip,
          loading_emoji: data.loading_emoji || generalSettings.loading_emoji || config.loading_emoji,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Preparar dados para salvar usando o helper seguro
      const fieldsToSave: any = {
        // Colunas diretas
        site_name: config.site_name,
        site_title: config.site_title,
        site_logo: config.site_logo || null,
        site_description: config.site_description,
        footer_text: config.footer_text,
        copyright_text: config.copyright_text,
        contact_email: config.contact_email,
        contact_whatsapp: config.contact_whatsapp,
        instagram_url: config.instagram_url,
        facebook_url: config.facebook_url,
        address_street: config.address_street,
        address_city: config.address_city,
        address_state: config.address_state,
        address_zip: config.address_zip,
        loading_emoji: config.loading_emoji,
      }

      // Usar o helper seguro que faz merge inteligente
      const result = await saveSiteSettings({ fieldsToUpdate: fieldsToSave })
      
      if (!result.success) {
        throw result.error || new Error('Erro ao salvar configurações')
      }

      // Recarregar configurações após salvar
      await loadConfig()
      
      toast.success('Configurações salvas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      toast.error(error.message || 'Erro ao salvar configurações. Verifique o console para mais detalhes.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <DashboardNavigation
          title="Configurações"
          subtitle="Configure as informações gerais do site"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
        />

        <div className="flex justify-end mb-8">
          <Button onClick={handleSave} isLoading={saving}>
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </Button>
        </div>

        {/* Form */}
        <div className="max-w-4xl space-y-6">
          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Informações Gerais</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Logo da Empresa
                </label>
                <ImageUploader
                  value={config.site_logo}
                  onChange={(url: string) => setConfig({ ...config, site_logo: url })}
                  placeholder="Clique para fazer upload da logo"
                  cropType="square"
                  aspectRatio={1}
                  targetSize={{ width: 200, height: 200 }}
                  recommendedDimensions="Recomendado: 200x200px (quadrado). A logo será redimensionada automaticamente."
                />
                <p className="text-xs text-gray-500 mt-2">
                  A logo aparecerá ao lado esquerdo do nome da empresa no navigation. Dimensões ideais: 200x200px (formato quadrado).
                </p>
              </div>

              <Input
                label="Nome da Empresa"
                value={config.site_name}
                onChange={(e) =>
                  setConfig({ ...config, site_name: e.target.value })
                }
                placeholder="MV Company"
              />
              <p className="text-xs text-gray-500 -mt-2">
                Este nome aparecerá no navigation, rodapé e seção "Nossa História"
              </p>

              <Input
                label="Título do Site (Google)"
                value={config.site_title}
                onChange={(e) =>
                  setConfig({ ...config, site_title: e.target.value })
                }
                placeholder="MV Company - Serviços Digitais"
              />
              <p className="text-xs text-gray-500 -mt-2">
                Este título aparecerá nos resultados de busca do Google e na aba do navegador. Recomendado: máximo de 60 caracteres.
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição do Site
                </label>
                <textarea
                  value={config.site_description}
                  onChange={(e) =>
                    setConfig({ ...config, site_description: e.target.value })
                  }
                  placeholder="Breve descrição"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Esta descrição aparecerá quando o link do site for compartilhado no WhatsApp, redes sociais e outros lugares. Use uma descrição atrativa e informativa.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Info e Redes Sociais (Rodapé) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Informações de Contato e Redes Sociais (Rodapé)</h2>
            <p className="text-sm text-gray-600 mb-6">
              Estas informações aparecerão no rodapé do site (universal para todas as páginas).
            </p>
            
            <div className="space-y-6">
              {/* Contato Básico */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contato Básico</h3>
                <Input
                  label="E-mail"
                  type="email"
                  value={config.contact_email}
                  onChange={(e) =>
                    setConfig({ ...config, contact_email: e.target.value })
                  }
                  placeholder="contato@smarttimeprime.com.br"
                />
                <p className="text-xs text-gray-500 -mt-2">
                  Este e-mail aparecerá no rodapé.
                </p>

                <Input
                  label="WhatsApp"
                  value={config.contact_whatsapp}
                  onChange={(e) =>
                    setConfig({ ...config, contact_whatsapp: e.target.value })
                  }
                  placeholder="+55 34 8413-6291"
                />
                <p className="text-xs text-gray-500 -mt-2">
                  Este WhatsApp aparecerá no rodapé.
                </p>
              </div>

              {/* Redes Sociais */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Redes Sociais</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Links das redes sociais que aparecerão no rodapé.
                </p>
                <Input
                  label="Instagram"
                  value={config.instagram_url}
                  onChange={(e) =>
                    setConfig({ ...config, instagram_url: e.target.value })
                  }
                  placeholder="https://www.instagram.com/smarttimeprime"
                />

                <Input
                  label="Facebook"
                  value={config.facebook_url}
                  onChange={(e) =>
                    setConfig({ ...config, facebook_url: e.target.value })
                  }
                  placeholder="https://www.facebook.com/smarttimeprime/"
                />
              </div>
            </div>
          </motion.div>

          {/* Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Endereço</h2>
            
            <div className="space-y-4">
              <Input
                label="Endereço Completo"
                value={config.address_street}
                onChange={(e) =>
                  setConfig({ ...config, address_street: e.target.value })
                }
                placeholder="Av. Imbaúba, 1676 - Loja 1046"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Cidade"
                    value={config.address_city}
                    onChange={(e) =>
                      setConfig({ ...config, address_city: e.target.value })
                    }
                    placeholder="Uberlândia"
                  />
                </div>

                <Input
                  label="Estado"
                  value={config.address_state}
                  onChange={(e) =>
                    setConfig({ ...config, address_state: e.target.value })
                  }
                  placeholder="MG"
                  maxLength={2}
                />
              </div>

              <Input
                label="CEP"
                value={config.address_zip}
                onChange={(e) =>
                  setConfig({ ...config, address_zip: e.target.value })
                }
                placeholder="38413-108"
              />
            </div>
          </motion.div>

          {/* Loading Emoji Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Emoji de Carregamento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Emoji para Animações de Carregamento
                </label>
                <Input
                  value={config.loading_emoji}
                  onChange={(e) =>
                    setConfig({ ...config, loading_emoji: e.target.value })
                  }
                  placeholder="⌚"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Emoji que aparece nas animações de carregamento do site (ex: ⌚, ⏰, 🔄)
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl">{config.loading_emoji || '⌚'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Animação de carregamento</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Rodapé</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Texto do Rodapé
                </label>
                <textarea
                  value={config.footer_text}
                  onChange={(e) =>
                    setConfig({ ...config, footer_text: e.target.value })
                  }
                  placeholder="Produtos de qualidade com design moderno e elegante."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Texto que aparece abaixo do nome da empresa no rodapé
                </p>
              </div>

              <Input
                label="Texto de Copyright"
                value={config.copyright_text}
                onChange={(e) =>
                  setConfig({ ...config, copyright_text: e.target.value })
                }
                placeholder="Todos os direitos reservados."
              />
              <p className="text-xs text-gray-500 -mt-2">
                Será exibido como: &quot;© [ano] [Nome da Empresa]. [Texto de Copyright]&quot;
              </p>
            </div>
          </motion.div>

          {/* Save Button (Mobile) */}
          <div className="lg:hidden">
            <Button onClick={handleSave} isLoading={saving} className="w-full" size="lg">
              <Save size={18} className="mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

