'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { Plus, Edit, Trash2, Eye, ArrowLeft, GitCompare, Search, Image as ImageIcon, Link2, Check, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { ImageUploader } from '@/components/ui/ImageUploader'

interface SavedComparison {
  id: string
  name: string
  product_ids: string[]
  slug: string
  created_at: string
}

export default function ComparadorDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([])
  const [comparisonName, setComparisonName] = useState('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [ecommerceUrl, setEcommerceUrl] = useState('')
  const [savingUrl, setSavingUrl] = useState(false)
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerImage, setBannerImage] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [footerEnabled, setFooterEnabled] = useState(false)
  const [footerLogo, setFooterLogo] = useState('')
  const [footerCompanyName, setFooterCompanyName] = useState('')
  const [footerWhatsapp, setFooterWhatsapp] = useState('')
  const [footerInstagram, setFooterInstagram] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    loadData()
  }, [isAuthenticated, isEditor, authLoading, router])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar produtos ativos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Carregar comparações salvas (se a tabela existir)
      try {
        const { data: comparisonsData } = await supabase
          .from('saved_comparisons')
          .select('*')
          .order('created_at', { ascending: false })
        
        setSavedComparisons(comparisonsData || [])
      } catch {
        // Tabela pode não existir ainda
        setSavedComparisons([])
      }

      // Carregar URL do e-commerce
      const { data: urlData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'comparator_ecommerce_url')
        .maybeSingle()
      
      if (urlData?.value) {
        setEcommerceUrl(urlData.value as string)
      }

      // Carregar configurações do comparador
      const { data: configData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'comparator_config')
        .maybeSingle()
      
      if (configData?.value) {
        const config = configData.value as any
        setBannerEnabled(config.banner_enabled || false)
        setBannerImage(config.banner_image || '')
        setBannerLink(config.banner_link || '')
        setFooterEnabled(config.footer_enabled || false)
        setFooterLogo(config.footer_logo || '')
        setFooterCompanyName(config.footer_company_name || '')
        setFooterWhatsapp(config.footer_whatsapp || '')
        setFooterInstagram(config.footer_instagram || '')
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const saveEcommerceUrl = async () => {
    try {
      setSavingUrl(true)
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'comparator_ecommerce_url',
          value: ecommerceUrl,
          description: 'URL do e-commerce para redirecionamento do comparador',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
      
      if (error) throw error
      toast.success('URL do e-commerce salva!')
    } catch (error: any) {
      console.error('Erro ao salvar URL:', error)
      toast.error('Erro ao salvar URL')
    } finally {
      setSavingUrl(false)
    }
  }

  const saveComparatorConfig = async () => {
    try {
      setSavingConfig(true)
      
      const config = {
        banner_enabled: bannerEnabled,
        banner_image: bannerImage,
        banner_link: bannerLink,
        footer_enabled: footerEnabled,
        footer_logo: footerLogo,
        footer_company_name: footerCompanyName,
        footer_whatsapp: footerWhatsapp,
        footer_instagram: footerInstagram,
      }
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'comparator_config',
          value: config,
          description: 'Configurações do comparador de produtos (banner e rodapé)',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
      
      if (error) throw error
      toast.success('Configurações do comparador salvas!')
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSavingConfig(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else if (selectedProducts.length < 2) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      toast.error('Você pode selecionar no máximo 2 produtos')
    }
  }

  const getComparisonUrl = (productIds?: string[]) => {
    const ids = productIds || selectedProducts
    if (ids.length === 0) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/comparar?produtos=${ids.join(',')}`
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(id)
      toast.success('Link copiado!')
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleSaveComparison = async () => {
    if (selectedProducts.length < 2) {
      toast.error('Selecione 2 produtos para criar uma comparação')
      return
    }

    if (!comparisonName.trim()) {
      toast.error('Digite um nome para a comparação')
      return
    }

    try {
      const slug = comparisonName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      const { error } = await supabase
        .from('saved_comparisons')
        .insert({
          name: comparisonName.trim(),
          product_ids: selectedProducts,
          slug,
        })

      if (error) throw error

      toast.success('Comparação salva!')
      setComparisonName('')
      setSelectedProducts([])
      setShowCreateModal(false)
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar comparação:', error)
      // Se a tabela não existir, apenas copiar o link
      const url = getComparisonUrl()
      await copyToClipboard(url, 'new')
      toast.success('Link copiado! (Tabela de comparações não configurada)')
    }
  }

  const handleDeleteComparison = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta comparação?')) return

    try {
      const { error } = await supabase
        .from('saved_comparisons')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Comparação excluída!')
      loadData()
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir')
    }
  }

  // Filtrar produtos
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Agrupar por categoria
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'Sem Categoria'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Comparador</h1>
              <p className="text-gray-600">Crie links de comparação pré-definidos para suas campanhas</p>
            </div>
            <Link
              href="/comparar"
              target="_blank"
              className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye size={18} />
              Ver Comparador
            </Link>
          </div>
        </div>

        {/* Configuração de URL do E-commerce */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">🛒 URL do E-commerce (Retorno)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure a URL para onde o usuário será redirecionado após usar o comparador.
            Um banner aparecerá no comparador convidando o usuário a voltar ao e-commerce.
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={ecommerceUrl}
              onChange={(e) => setEcommerceUrl(e.target.value)}
              placeholder="https://seu-ecommerce.com.br"
              className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={saveEcommerceUrl}
              disabled={savingUrl}
              className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {savingUrl ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {ecommerceUrl && (
            <p className="text-xs text-green-600 mt-2">
              ✓ Banner de retorno ativo no comparador
            </p>
          )}
        </div>

        {/* Configurações de Banner e Rodapé */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🎨 Banner e Rodapé do Comparador</h2>
          
          {/* Banner */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="banner_enabled"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="banner_enabled" className="font-medium cursor-pointer">
                Ativar Banner Promocional
              </label>
            </div>
            {bannerEnabled && (
              <div className="space-y-4 pl-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Imagem do Banner</label>
                  <ImageUploader
                    value={bannerImage}
                    onChange={(url) => setBannerImage(url)}
                    placeholder="Clique para fazer upload do banner (1920x400px recomendado)"
                    cropType="banner"
                    aspectRatio={1920/400}
                    recommendedDimensions="1920x400px (ou proporção similar)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Link do Banner (opcional)</label>
                  <input
                    type="url"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="https://exemplo.com/produto"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se preenchido, o banner será clicável e redirecionará para este link
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="footer_enabled"
                checked={footerEnabled}
                onChange={(e) => setFooterEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="footer_enabled" className="font-medium cursor-pointer">
                Ativar Rodapé com Informações da Empresa
              </label>
            </div>
            {footerEnabled && (
              <div className="pl-8 space-y-4">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Logo da Empresa (Marca d'água)</label>
                  <p className="text-xs text-gray-500 mb-2">
                    Logo pequena que aparecerá como marca d'água no rodapé
                  </p>
                  <ImageUploader
                    value={footerLogo}
                    onChange={(url) => setFooterLogo(url)}
                    placeholder="Clique para fazer upload da logo"
                    cropType="square"
                    aspectRatio={1}
                    recommendedDimensions="200x200px (quadrado)"
                  />
                </div>

                {/* Nome da Empresa */}
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
                  <input
                    type="text"
                    value={footerCompanyName}
                    onChange={(e) => setFooterCompanyName(e.target.value)}
                    placeholder="Ex: Smart Time Prime"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nome que aparecerá com destaque no rodapé
                  </p>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    📱 WhatsApp (Número para redirecionamento)
                  </label>
                  <input
                    type="text"
                    value={footerWhatsapp}
                    onChange={(e) => setFooterWhatsapp(e.target.value)}
                    placeholder="5534984136291"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas o número (ex: 5534984136291). Será usado para criar link do WhatsApp
                  </p>
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    📷 Instagram (Link do perfil)
                  </label>
                  <input
                    type="url"
                    value={footerInstagram}
                    onChange={(e) => setFooterInstagram(e.target.value)}
                    placeholder="https://instagram.com/smarttimeprime"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link completo do perfil do Instagram
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={saveComparatorConfig}
              disabled={savingConfig}
              className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {savingConfig ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>

        {/* Produtos Selecionados */}
        {selectedProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Produtos Selecionados ({selectedProducts.length}/2)</h2>
              <button
                onClick={() => setSelectedProducts([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpar seleção
              </button>
            </div>
            
            <div className="flex gap-4 mb-4">
              {selectedProducts.map(id => {
                const product = products.find(p => p.id === id)
                if (!product) return null
                return (
                  <div key={id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden relative">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <button
                      onClick={() => toggleProductSelection(id)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>

            {selectedProducts.length === 2 && (
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                  <Link2 size={16} className="text-gray-500" />
                  <input
                    type="text"
                    value={getComparisonUrl()}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                  />
                </div>
                <button
                  onClick={() => copyToClipboard(getComparisonUrl(), 'selected')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                >
                  {copiedLink === 'selected' ? <Check size={16} /> : <Copy size={16} />}
                  Copiar Link
                </button>
                <Link
                  href={getComparisonUrl()}
                  target="_blank"
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye size={16} />
                  Ver
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Busca */}
        <div className="mb-6">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
            />
          </div>
        </div>

        {/* Lista de Produtos por Categoria */}
        <div className="space-y-8">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {categoryProducts.map(product => {
                  const isSelected = selectedProducts.includes(product.id)
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-black ring-2 ring-black' 
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative mb-3">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={32} className="text-gray-300" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{product.name}</h4>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Como usar</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Selecione 2 produtos para criar uma comparação</li>
            <li>• Copie o link gerado para usar em suas campanhas</li>
            <li>• O link abrirá o comparador com os produtos já selecionados</li>
            <li>• Para editar os tópicos de comparação, use a página de "Tópicos de Classificação"</li>
          </ul>
          <div className="mt-4">
            <Link
              href="/dashboard/produtos/topicos-classificacao"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ir para Tópicos de Classificação
              <ArrowLeft size={14} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
