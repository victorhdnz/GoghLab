'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { createClient } from '@/lib/supabase/client'
import { Save, ArrowLeft, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'

interface HomepageSettings {
  hero_title: string
  hero_subtitle: string
  hero_description: string
  hero_button_text: string
  hero_background_image?: string
  
  services_title: string
  services_description: string
  
  comparison_title: string
  comparison_description: string
  comparison_button_text: string
  
  contact_title: string
  contact_description: string
  contact_whatsapp: string
  contact_instagram: string
}

export default function HomepageEditorPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<HomepageSettings>({
    hero_title: 'MV Company',
    hero_subtitle: 'Transformamos sua presença digital com serviços de alta qualidade',
    hero_description: 'Criação de sites, tráfego pago, criação de conteúdo e gestão de redes sociais',
    hero_button_text: 'Ver Serviços',
    hero_background_image: '',
    
    services_title: 'Nossos Serviços',
    services_description: 'Soluções completas para impulsionar seu negócio no mundo digital',
    
    comparison_title: 'Compare a MV Company com outras empresas',
    comparison_description: 'Veja por que somos a melhor escolha para transformar sua presença digital',
    comparison_button_text: 'Comparar Agora',
    
    contact_title: 'Pronto para transformar seu negócio?',
    contact_description: 'Entre em contato e descubra como podemos ajudar você',
    contact_whatsapp: '5534999999999',
    contact_instagram: 'https://instagram.com/mvcompany',
  })

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isEditor)) {
      router.push('/dashboard')
    } else if (isAuthenticated && isEditor) {
      loadSettings()
    }
  }, [isAuthenticated, isEditor, authLoading, router])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'general')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error)
      }

      if (data?.value?.homepage) {
        setSettings({ ...settings, ...data.value.homepage })
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
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'general',
          value: {
            homepage: settings
          }
        }, {
          onConflict: 'key'
        })

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardNavigation
          title="Editar Homepage"
          subtitle="Personalize o conteúdo da página inicial"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
          actions={
            <div className="flex gap-3">
              <Link href="/" target="_blank">
                <Button variant="outline" size="lg">
                  <Eye size={18} className="mr-2" />
                  Ver Preview
                </Button>
              </Link>
              <Button onClick={handleSave} isLoading={saving} size="lg">
                <Save size={18} className="mr-2" />
                Salvar Alterações
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Seção Hero (Principal)</h2>
            <div className="space-y-4">
              <Input
                label="Título Principal"
                value={settings.hero_title}
                onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                placeholder="Ex: MV Company"
              />
              <Input
                label="Subtítulo"
                value={settings.hero_subtitle}
                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                placeholder="Ex: Transformamos sua presença digital..."
              />
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={settings.hero_description}
                  onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
                  placeholder="Descrição adicional..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Input
                label="Texto do Botão"
                value={settings.hero_button_text}
                onChange={(e) => setSettings({ ...settings, hero_button_text: e.target.value })}
                placeholder="Ex: Ver Serviços"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Imagem de Fundo (Opcional)</label>
                <ImageUploader
                  value={settings.hero_background_image || ''}
                  onChange={(url) => setSettings({ ...settings, hero_background_image: url })}
                  placeholder="Upload de imagem de fundo"
                  cropType="banner"
                  aspectRatio={16 / 9}
                />
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Seção de Serviços</h2>
            <div className="space-y-4">
              <Input
                label="Título da Seção"
                value={settings.services_title}
                onChange={(e) => setSettings({ ...settings, services_title: e.target.value })}
                placeholder="Ex: Nossos Serviços"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={settings.services_description}
                  onChange={(e) => setSettings({ ...settings, services_description: e.target.value })}
                  placeholder="Descrição da seção de serviços..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-gray-500">
                Os serviços são gerenciados em <Link href="/dashboard/portfolio" className="text-blue-600 underline">Gerenciar Serviços</Link>
              </p>
            </div>
          </div>

          {/* Comparison Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Seção de Comparação</h2>
            <div className="space-y-4">
              <Input
                label="Título"
                value={settings.comparison_title}
                onChange={(e) => setSettings({ ...settings, comparison_title: e.target.value })}
                placeholder="Ex: Compare a MV Company..."
              />
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={settings.comparison_description}
                  onChange={(e) => setSettings({ ...settings, comparison_description: e.target.value })}
                  placeholder="Descrição da comparação..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Input
                label="Texto do Botão"
                value={settings.comparison_button_text}
                onChange={(e) => setSettings({ ...settings, comparison_button_text: e.target.value })}
                placeholder="Ex: Comparar Agora"
              />
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Seção de Contato</h2>
            <div className="space-y-4">
              <Input
                label="Título"
                value={settings.contact_title}
                onChange={(e) => setSettings({ ...settings, contact_title: e.target.value })}
                placeholder="Ex: Pronto para transformar seu negócio?"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={settings.contact_description}
                  onChange={(e) => setSettings({ ...settings, contact_description: e.target.value })}
                  placeholder="Descrição do contato..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Input
                label="WhatsApp (apenas números)"
                value={settings.contact_whatsapp}
                onChange={(e) => setSettings({ ...settings, contact_whatsapp: e.target.value.replace(/\D/g, '') })}
                placeholder="5534999999999"
              />
              <Input
                label="URL do Instagram"
                value={settings.contact_instagram}
                onChange={(e) => setSettings({ ...settings, contact_instagram: e.target.value })}
                placeholder="https://instagram.com/mvcompany"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

