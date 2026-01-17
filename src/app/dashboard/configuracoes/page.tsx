'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import { Settings, ArrowLeft, Save, Trash2, Phone, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState<string>('')

  // Carregar configurações existentes
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Carregar logo
        const { data: logoData, error: logoError } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', 'hero_logo')
          .single()

        if (!logoError && logoData?.value) {
          setLogo(logoData.value)
        }

        // Carregar WhatsApp
        const { data: whatsappData, error: whatsappError } = await (supabase as any)
          .from('site_settings')
          .select('value')
          .eq('key', 'contact_whatsapp')
          .single()

        if (!whatsappError && whatsappData?.value) {
          setWhatsappNumber(whatsappData.value)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
        toast.error('Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Salvar logo
      const { error: logoError } = await (supabase as any)
        .from('site_settings')
        .upsert({
          key: 'hero_logo',
          value: logo || null,
          description: 'Logo da empresa (aparece no topo das páginas e como favicon)'
        }, {
          onConflict: 'key'
        })

      if (logoError) {
        throw new Error(`Erro ao salvar logo: ${logoError.message}`)
      }

      // Salvar WhatsApp
      // Remover caracteres não numéricos e garantir formato internacional
      const cleanNumber = whatsappNumber.replace(/\D/g, '')
      
      const { error: whatsappError } = await (supabase as any)
        .from('site_settings')
        .upsert({
          key: 'contact_whatsapp',
          value: cleanNumber || null,
          description: 'Número do WhatsApp para suporte (formato: 5534999999999)'
        }, {
          onConflict: 'key'
        })

      if (whatsappError) {
        throw new Error(`Erro ao salvar WhatsApp: ${whatsappError.message}`)
      }

      toast.success('Configurações salvas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      toast.error(error.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogo(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center text-white">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações Gerais</h1>
              <p className="text-gray-600">Configure a logo da empresa e número de WhatsApp para suporte</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl space-y-6">
          {/* Logo Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Logo da Empresa</h2>
                <p className="text-sm text-gray-500">
                  Esta logo aparecerá no topo de todas as páginas, no sidebar da área de membros e como favicon
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <ImageUploader
                value={logo || ''}
                onChange={setLogo}
                placeholder="Clique para fazer upload da logo da empresa"
                cropType="square"
                aspectRatio={1}
                recommendedDimensions="200x200px (quadrada funciona melhor como favicon)"
              />

              {logo && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Preview da logo:</p>
                    <div className="w-32 h-32 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={logo}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} className="mr-2" />
                    Remover Logo
                  </Button>
                </div>
              )}

              {!logo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Se nenhuma logo for configurada, será exibido um ícone padrão (Sparkles) no lugar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">WhatsApp para Suporte</h2>
                <p className="text-sm text-gray-500">
                  Número que será usado no botão de suporte na área de membros
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Número do WhatsApp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Ex: 5534999999999 ou (34) 99999-9999"
                type="tel"
              />
              <p className="text-sm text-gray-500">
                <strong>Formato:</strong> Digite o número com ou sem formatação. O sistema automaticamente removerá caracteres não numéricos.
                <br />
                <strong>Exemplo:</strong> (34) 99999-9999 ou 5534999999999
              </p>

              {whatsappNumber && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Preview do link:</strong>
                  </p>
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-800 underline"
                  >
                    https://wa.me/{whatsappNumber.replace(/\D/g, '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

