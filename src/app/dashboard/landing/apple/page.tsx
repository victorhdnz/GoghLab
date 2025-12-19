'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Home, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Eye, EyeOff, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { motion } from 'framer-motion'
import { LandingLayout, LandingVersion } from '@/types'
import { AppleWatchContent, defaultAppleWatchContent } from '@/components/landing/layouts/AppleWatchLayout'

// Seções disponíveis para ordenação
type SectionKey = 'hero' | 'products' | 'reasons' | 'features' | 'video' | 'accessories' | 'faq' | 'cta'

interface SectionVisibility {
  hero: boolean
  products: boolean
  reasons: boolean
  features: boolean
  video: boolean
  accessories: boolean
  faq: boolean
  cta: boolean
}

// Cores por seção
interface SectionColors {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
}

interface AllSectionColors {
  hero: SectionColors
  products: SectionColors
  reasons: SectionColors
  features: SectionColors
  video: SectionColors
  accessories: SectionColors
  faq: SectionColors
  cta: SectionColors
}

const defaultSectionColors: AllSectionColors = {
  hero: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  products: { backgroundColor: '#f9fafb', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  reasons: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  features: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  video: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  accessories: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  faq: { backgroundColor: '#f9fafb', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
  cta: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#0071e3', buttonTextColor: '#ffffff' },
}

const defaultSectionOrder: SectionKey[] = ['hero', 'products', 'reasons', 'features', 'video', 'accessories', 'faq', 'cta']
const defaultSectionVisibility: SectionVisibility = {
  hero: true,
  products: true,
  reasons: true,
  features: true,
  video: true,
  accessories: true,
  faq: true,
  cta: true,
}

const sectionLabels: Record<SectionKey, { emoji: string; label: string }> = {
  hero: { emoji: '🎯', label: 'Hero Section' },
  products: { emoji: '📦', label: 'Produtos em Destaque' },
  reasons: { emoji: '💡', label: 'Motivos para Comprar' },
  features: { emoji: '✨', label: 'Conheça Melhor' },
  video: { emoji: '🎬', label: 'Vídeo' },
  accessories: { emoji: '🎨', label: 'Acessórios' },
  faq: { emoji: '❓', label: 'FAQ / Perguntas Frequentes' },
  cta: { emoji: '🚀', label: 'CTA Final' },
}

function AppleEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const layoutId = searchParams.get('layout')
  const versionId = searchParams.get('version')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<LandingLayout | null>(null)
  const [currentVersion, setCurrentVersion] = useState<LandingVersion | null>(null)
  const [content, setContent] = useState<AppleWatchContent>(defaultAppleWatchContent)
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(defaultSectionOrder)
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(defaultSectionVisibility)
  const [sectionColors, setSectionColors] = useState<AllSectionColors>(defaultSectionColors)
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('hero')
  const [showColorEditor, setShowColorEditor] = useState<SectionKey | null>(null)
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    if (layoutId && versionId) {
      loadData()
    } else {
      router.push('/dashboard/layouts')
    }
  }, [isAuthenticated, isEditor, authLoading, layoutId, versionId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar layout
      const { data: layoutData } = await supabase
        .from('landing_layouts')
        .select('*')
        .eq('id', layoutId)
        .single()

      if (layoutData) setCurrentLayout(layoutData)

      // Carregar versão
      const { data: versionData } = await supabase
        .from('landing_versions')
        .select('*')
        .eq('id', versionId)
        .single()

      if (versionData) {
        setCurrentVersion(versionData)
        
        // Carregar conteúdo da versão
        if (versionData.sections_config && typeof versionData.sections_config === 'object') {
          const config = versionData.sections_config as any
          if (config.appleWatchContent) {
            setContent({
              ...defaultAppleWatchContent,
              ...config.appleWatchContent,
            })
          }
          if (config.sectionOrder) {
            setSectionOrder(config.sectionOrder)
          }
          if (config.sectionVisibility) {
            setSectionVisibility({ ...defaultSectionVisibility, ...config.sectionVisibility })
          }
          if (config.sectionColors) {
            setSectionColors({ ...defaultSectionColors, ...config.sectionColors })
          }
          if (config.showWhatsAppButton !== undefined) {
            console.log('📥 Carregando showWhatsAppButton:', config.showWhatsAppButton)
            setShowWhatsAppButton(config.showWhatsAppButton)
          } else {
            console.log('⚠️ showWhatsAppButton não definido no config, usando padrão: false')
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!versionId) return

    try {
      setSaving(true)

      const configToSave = { 
        appleWatchContent: content,
        sectionOrder,
        sectionVisibility,
        sectionColors,
        showWhatsAppButton,
      }

      console.log('💾 Salvando configuração:', {
        showWhatsAppButton,
        hasWhatsAppNumber: !!content.settings.whatsappNumber,
        fullConfig: configToSave,
      })

      const { error } = await supabase
        .from('landing_versions')
        .update({
          sections_config: configToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', versionId)

      if (error) throw error

      toast.success('Alterações salvas!')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error(`Erro ao salvar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Funções de ordenação de seções
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newOrder.length) return
    ;[newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]]
    setSectionOrder(newOrder)
  }

  const toggleSectionVisibility = (key: SectionKey) => {
    setSectionVisibility(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateSectionColor = (section: SectionKey, colorKey: keyof SectionColors, value: string) => {
    setSectionColors(prev => ({
      ...prev,
      [section]: { ...prev[section], [colorKey]: value }
    }))
  }

  // Funções de atualização do conteúdo
  const updateHero = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }))
  }

  const updateProduct = (index: number, field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      products: prev.products.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }))
  }

  const addProduct = () => {
    setContent(prev => ({
      ...prev,
      products: [...prev.products, {
        id: Date.now().toString(),
        name: 'Novo Produto',
        description: 'Descrição do produto',
        price: 'R$ 0,00',
        image: '',
        colors: ['#000000'],
        learnMoreLink: '#',
        buyLink: '#',
        learnMoreText: 'Saiba mais',
        buyText: 'Comprar',
      }]
    }))
  }

  const removeProduct = (index: number) => {
    setContent(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const updateProductColor = (productIndex: number, colorIndex: number, value: string) => {
    setContent(prev => ({
      ...prev,
      products: prev.products.map((p, i) => {
        if (i !== productIndex) return p
        const newColors = [...p.colors]
        newColors[colorIndex] = value
        return { ...p, colors: newColors }
      })
    }))
  }

  const addProductColor = (productIndex: number) => {
    setContent(prev => ({
      ...prev,
      products: prev.products.map((p, i) => {
        if (i !== productIndex) return p
        return { ...p, colors: [...p.colors, '#000000'] }
      })
    }))
  }

  const removeProductColor = (productIndex: number, colorIndex: number) => {
    setContent(prev => ({
      ...prev,
      products: prev.products.map((p, i) => {
        if (i !== productIndex) return p
        return { ...p, colors: p.colors.filter((_, ci) => ci !== colorIndex) }
      })
    }))
  }

  // Reasons
  const updateReasons = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      reasons: { ...prev.reasons, [field]: value }
    }))
  }

  const updateReasonItem = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      reasons: {
        ...prev.reasons,
        items: prev.reasons.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
      }
    }))
  }

  const addReasonItem = () => {
    setContent(prev => ({
      ...prev,
      reasons: {
        ...prev.reasons,
        items: [...prev.reasons.items, { title: 'Novo Motivo', subtitle: 'Subtítulo', description: 'Descrição', image: '' }]
      }
    }))
  }

  const removeReasonItem = (index: number) => {
    setContent(prev => ({
      ...prev,
      reasons: {
        ...prev.reasons,
        items: prev.reasons.items.filter((_, i) => i !== index)
      }
    }))
  }

  // Features
  const updateFeatures = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      features: { ...prev.features, [field]: value }
    }))
  }

  const updateFeatureItem = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
      }
    }))
  }

  const addFeatureItem = () => {
    setContent(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: [...prev.features.items, { category: 'Categoria', title: 'Título', image: '', textColor: '#ffffff' }]
      }
    }))
  }

  const removeFeatureItem = (index: number) => {
    setContent(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.filter((_, i) => i !== index)
      }
    }))
  }

  // Accessories
  const updateAccessories = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      accessories: { ...prev.accessories, [field]: value }
    }))
  }

  const updateAccessoriesBanner = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      accessories: {
        ...prev.accessories,
        banner: { ...prev.accessories.banner, [field]: value }
      }
    }))
  }

  // FAQ
  const updateFaq = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      faq: { ...prev.faq, [field]: value }
    }))
  }

  const updateFaqItem = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
      }
    }))
  }

  const addFaqItem = () => {
    setContent(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: [...prev.faq.items, { question: 'Nova Pergunta', answer: 'Resposta' }]
      }
    }))
  }

  const removeFaqItem = (index: number) => {
    setContent(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.filter((_, i) => i !== index)
      }
    }))
  }

  // CTA
  const updateCta = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      cta: { ...prev.cta, [field]: value }
    }))
  }

  // Settings
  const updateSettings = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value }
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  // Componente para editor de cores por seção - Usando portal/fixed para evitar corte
  const ColorEditorPopup = ({ section }: { section: SectionKey }) => {
    const colors = sectionColors[section]
    
    // Impedir TODOS os eventos de propagar para fora do modal
    return (
      <>
        {/* Overlay para fechar ao clicar fora */}
        <div 
          className="fixed inset-0 z-40 bg-black/20"
          onClick={(e) => { 
            e.stopPropagation()
            setShowColorEditor(null)
          }}
        />
        {/* Popup fixo no centro da tela */}
        <div 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl border w-96"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b bg-gray-50 rounded-t-xl flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Palette size={18} />
              Cores da Seção
            </h4>
            <button
              onClick={(e) => { 
                e.stopPropagation()
                setShowColorEditor(null) 
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-2">Cor de Fundo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.backgroundColor}
                  onChange={(e) => updateSectionColor(section, 'backgroundColor', e.target.value)}
                  onInput={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-lg border-2 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.backgroundColor}
                  onChange={(e) => updateSectionColor(section, 'backgroundColor', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onCopy={(e) => e.stopPropagation()}
                  onCut={(e) => e.stopPropagation()}
                  onPaste={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cor do Texto</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.textColor}
                  onChange={(e) => updateSectionColor(section, 'textColor', e.target.value)}
                  onInput={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-lg border-2 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.textColor}
                  onChange={(e) => updateSectionColor(section, 'textColor', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onCopy={(e) => e.stopPropagation()}
                  onCut={(e) => e.stopPropagation()}
                  onPaste={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cor do Botão</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.buttonColor}
                  onChange={(e) => updateSectionColor(section, 'buttonColor', e.target.value)}
                  onInput={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-lg border-2 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.buttonColor}
                  onChange={(e) => updateSectionColor(section, 'buttonColor', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onCopy={(e) => e.stopPropagation()}
                  onCut={(e) => e.stopPropagation()}
                  onPaste={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Texto do Botão</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.buttonTextColor}
                  onChange={(e) => updateSectionColor(section, 'buttonTextColor', e.target.value)}
                  onInput={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-lg border-2 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.buttonTextColor}
                  onChange={(e) => updateSectionColor(section, 'buttonTextColor', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onCopy={(e) => e.stopPropagation()}
                  onCut={(e) => e.stopPropagation()}
                  onPaste={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>
          <div className="p-4 border-t bg-gray-50 rounded-b-xl">
            <button
              onClick={(e) => { 
                e.stopPropagation()
                setShowColorEditor(null) 
              }}
              className="w-full py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Aplicar Cores
            </button>
          </div>
        </div>
      </>
    )
  }

  // Renderizar seção específica
  const renderSection = (key: SectionKey, index: number) => {
    const isExpanded = expandedSection === key
    const isVisible = sectionVisibility[key]
    const { emoji, label } = sectionLabels[key]

    return (
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`bg-white rounded-lg shadow-md overflow-hidden ${!isVisible ? 'opacity-50' : ''}`}
      >
        {/* Header da Seção */}
        <div
          className="p-4 flex items-center justify-between bg-gray-50 cursor-pointer hover:bg-gray-100"
          onClick={() => setExpandedSection(isExpanded ? null : key)}
        >
          <div className="flex items-center gap-3">
            <GripVertical size={18} className="text-gray-400" />
            <span className="text-xl">{emoji}</span>
            <h3 className="font-semibold text-gray-900">{label}</h3>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowColorEditor(showColorEditor === key ? null : key) }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-purple-600"
              title="Editar cores da seção"
            >
              <Palette size={18} />
            </button>
            {showColorEditor === key && <ColorEditorPopup section={key} />}
            <button
              onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(key) }}
              className={`p-2 rounded-lg transition-colors ${isVisible ? 'hover:bg-gray-200 text-gray-600' : 'bg-red-100 text-red-500'}`}
              title={isVisible ? 'Ocultar seção' : 'Mostrar seção'}
            >
              {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveSection(index, 'up') }}
              className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              disabled={index === 0}
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveSection(index, 'down') }}
              className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              disabled={index === sectionOrder.length - 1}
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        {/* Conteúdo da Seção */}
        {isExpanded && (
          <div className="p-6 border-t">
            {key === 'hero' && renderHeroEditor()}
            {key === 'products' && renderProductsEditor()}
            {key === 'reasons' && renderReasonsEditor()}
            {key === 'features' && renderFeaturesEditor()}
            {key === 'video' && renderVideoEditor()}
            {key === 'accessories' && renderAccessoriesEditor()}
            {key === 'faq' && renderFaqEditor()}
            {key === 'cta' && renderCtaEditor()}
          </div>
        )}
      </motion.div>
    )
  }

  // Editores específicos de cada seção
  const renderHeroEditor = () => (
    <div className="space-y-4">
      <Input
        label="Título Principal"
        value={content.hero.title}
        onChange={(e) => updateHero('title', e.target.value)}
        placeholder="Smart Watch"
      />
      <Input
        label="Subtítulo"
        value={content.hero.subtitle}
        onChange={(e) => updateHero('subtitle', e.target.value)}
        placeholder="O mais poderoso de todos os tempos."
      />
      <Input
        label="Badge (opcional)"
        value={content.hero.badge || ''}
        onChange={(e) => updateHero('badge', e.target.value)}
        placeholder="Novo"
      />
    </div>
  )

  const renderProductsEditor = () => (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={addProduct}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus size={18} />
          Adicionar Produto
        </button>
      </div>

      {content.products.map((product, index) => (
        <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-semibold">Produto {index + 1}: {product.name}</h4>
            {content.products.length > 1 && (
              <button
                onClick={() => removeProduct(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Nome do Produto"
              value={product.name}
              onChange={(e) => updateProduct(index, 'name', e.target.value)}
            />
            <Input
              label="Preço"
              value={product.price}
              onChange={(e) => updateProduct(index, 'price', e.target.value)}
              placeholder="R$ 0,00"
            />
            <Input
              label="Preço Mensal (opcional)"
              value={product.monthlyPrice || ''}
              onChange={(e) => updateProduct(index, 'monthlyPrice', e.target.value)}
              placeholder="R$ 458,25/mês"
            />
            <Input
              label="Badge (opcional)"
              value={product.badge || ''}
              onChange={(e) => updateProduct(index, 'badge', e.target.value)}
              placeholder="Novo"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={product.description}
              onChange={(e) => updateProduct(index, 'description', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          {/* Upload de Imagem */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Imagem do Produto</label>
            <ImageUploader
              value={product.image}
              onChange={(url) => updateProduct(index, 'image', url)}
              placeholder="Clique para fazer upload da imagem do produto"
              cropType="square"
              aspectRatio={1}
              targetSize={{ width: 600, height: 600 }}
              recommendedDimensions="600 x 600px (Formato quadrado)"
            />
          </div>

          {/* Links dos Botões */}
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <Input
              label="Texto do Botão 'Saiba mais'"
              value={product.learnMoreText || 'Saiba mais'}
              onChange={(e) => updateProduct(index, 'learnMoreText', e.target.value)}
            />
            <Input
              label="Link 'Saiba mais'"
              value={product.learnMoreLink || ''}
              onChange={(e) => updateProduct(index, 'learnMoreLink', e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Texto do Botão 'Comprar'"
              value={product.buyText || 'Comprar'}
              onChange={(e) => updateProduct(index, 'buyText', e.target.value)}
            />
            <Input
              label="Link 'Comprar'"
              value={product.buyLink || ''}
              onChange={(e) => updateProduct(index, 'buyLink', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Cores */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Cores do Produto (seletor de cores visível)</label>
            <div className="flex flex-wrap gap-2 items-center">
              {product.colors.map((color, colorIndex) => (
                <div key={colorIndex} className="flex items-center gap-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateProductColor(index, colorIndex, e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <button
                    onClick={() => removeProductColor(index, colorIndex)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addProductColor(index)}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderReasonsEditor = () => (
    <div className="space-y-6">
      <Input
        label="Título da Seção"
        value={content.reasons.title}
        onChange={(e) => updateReasons('title', e.target.value)}
        placeholder="Motivos para comprar seu Smart Watch aqui."
      />
      
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Texto do Link"
          value={content.reasons.link.text}
          onChange={(e) => updateReasons('link', { ...content.reasons.link, text: e.target.value })}
        />
        <Input
          label="URL do Link"
          value={content.reasons.link.url}
          onChange={(e) => updateReasons('link', { ...content.reasons.link, url: e.target.value })}
        />
      </div>

      <div className="flex justify-between items-center">
        <h4 className="font-medium">Itens</h4>
        <button
          onClick={addReasonItem}
          className="px-3 py-1.5 bg-black text-white rounded-lg text-sm flex items-center gap-1"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {content.reasons.items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <span className="font-medium">Item {index + 1}</span>
            <button
              onClick={() => removeReasonItem(index)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Título"
              value={item.title}
              onChange={(e) => updateReasonItem(index, 'title', e.target.value)}
            />
            <Input
              label="Subtítulo"
              value={item.subtitle}
              onChange={(e) => updateReasonItem(index, 'subtitle', e.target.value)}
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={item.description}
              onChange={(e) => updateReasonItem(index, 'description', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows={2}
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2">Imagem</label>
            <ImageUploader
              value={item.image}
              onChange={(url) => updateReasonItem(index, 'image', url)}
              placeholder="Clique para fazer upload da imagem"
              cropType="banner"
              aspectRatio={16/9}
              targetSize={{ width: 800, height: 450 }}
              recommendedDimensions="800 x 450px (Formato 16:9)"
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderFeaturesEditor = () => (
    <div className="space-y-6">
      <Input
        label="Título da Seção"
        value={content.features.title}
        onChange={(e) => updateFeatures('title', e.target.value)}
        placeholder="Conheça melhor o Smart Watch."
      />

      <div className="flex justify-between items-center">
        <h4 className="font-medium">Cards de Features</h4>
        <button
          onClick={addFeatureItem}
          className="px-3 py-1.5 bg-black text-white rounded-lg text-sm flex items-center gap-1"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {content.features.items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <span className="font-medium">Feature {index + 1}</span>
            <button
              onClick={() => removeFeatureItem(index)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Categoria"
              value={item.category}
              onChange={(e) => updateFeatureItem(index, 'category', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Cor do Texto</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={item.textColor || '#ffffff'}
                  onChange={(e) => updateFeatureItem(index, 'textColor', e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={item.textColor || '#ffffff'}
                  onChange={(e) => updateFeatureItem(index, 'textColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2">Título (use \n para quebra de linha)</label>
            <textarea
              value={item.title}
              onChange={(e) => updateFeatureItem(index, 'title', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows={2}
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2">Imagem de Fundo</label>
            <ImageUploader
              value={item.image}
              onChange={(url) => updateFeatureItem(index, 'image', url)}
              placeholder="Clique para fazer upload da imagem de fundo"
              cropType="custom"
              aspectRatio={280/400}
              targetSize={{ width: 560, height: 800 }}
              recommendedDimensions="560 x 800px (Formato vertical)"
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderVideoEditor = () => (
    <div className="space-y-6">
      <Input
        label="Título do Vídeo (opcional)"
        value={content.video?.title || ''}
        onChange={(e) => setContent(prev => ({
          ...prev,
          video: { ...prev.video, title: e.target.value, url: prev.video?.url || '', orientation: prev.video?.orientation || 'horizontal' }
        }))}
      />
      <div>
        <label className="block text-sm font-medium mb-2">Descrição do Vídeo (opcional)</label>
        <textarea
          value={content.video?.description || ''}
          onChange={(e) => setContent(prev => ({
            ...prev,
            video: { ...prev.video, description: e.target.value, url: prev.video?.url || '', orientation: prev.video?.orientation || 'horizontal' }
          }))}
          className="w-full px-4 py-2 border rounded-lg"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">URL do Vídeo (YouTube) ou Upload</label>
        <div className="space-y-2">
          <Input
            type="url"
            value={content.video?.url || ''}
            onChange={(e) => setContent(prev => ({
              ...prev,
              video: { ...prev.video, url: e.target.value, orientation: prev.video?.orientation || 'horizontal' }
            }))}
            placeholder="https://www.youtube.com/watch?v=... ou faça upload abaixo"
          />
          <VideoUploader
            value={content.video?.url || ''}
            onChange={(url) => setContent(prev => ({
              ...prev,
              video: { ...prev.video, url, orientation: prev.video?.orientation || 'horizontal' }
            }))}
            placeholder="Ou faça upload de um vídeo"
            orientation={content.video?.orientation || 'horizontal'}
            onOrientationChange={(orientation) => setContent(prev => ({
              ...prev,
              video: { ...prev.video, orientation, url: prev.video?.url || '' }
            }))}
          />
        </div>
      </div>
    </div>
  )

  const renderAccessoriesEditor = () => (
    <div className="space-y-6">
      <Input
        label="Título da Seção"
        value={content.accessories.title}
        onChange={(e) => updateAccessories('title', e.target.value)}
      />
      
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Texto do Link"
          value={content.accessories.link.text}
          onChange={(e) => updateAccessories('link', { ...content.accessories.link, text: e.target.value })}
        />
        <Input
          label="URL do Link"
          value={content.accessories.link.url}
          onChange={(e) => updateAccessories('link', { ...content.accessories.link, url: e.target.value })}
        />
      </div>

      <h4 className="font-medium pt-4 border-t">Banner</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Título do Banner"
          value={content.accessories.banner.title}
          onChange={(e) => updateAccessoriesBanner('title', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Descrição do Banner</label>
        <textarea
          value={content.accessories.banner.description}
          onChange={(e) => updateAccessoriesBanner('description', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
          rows={2}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Texto do Link do Banner"
          value={content.accessories.banner.link.text}
          onChange={(e) => updateAccessoriesBanner('link', { ...content.accessories.banner.link, text: e.target.value })}
        />
        <Input
          label="URL do Link do Banner"
          value={content.accessories.banner.link.url}
          onChange={(e) => updateAccessoriesBanner('link', { ...content.accessories.banner.link, url: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Imagem do Banner</label>
        <ImageUploader
          value={content.accessories.banner.image}
          onChange={(url) => updateAccessoriesBanner('image', url)}
          placeholder="Clique para fazer upload da imagem do banner"
          cropType="banner"
          aspectRatio={4/1}
          targetSize={{ width: 1200, height: 300 }}
          recommendedDimensions="1200 x 300px (Banner horizontal)"
        />
      </div>
    </div>
  )

  const renderFaqEditor = () => (
    <div className="space-y-6">
      <Input
        label="Título da Seção"
        value={content.faq.title}
        onChange={(e) => updateFaq('title', e.target.value)}
      />

      <div className="flex justify-between items-center">
        <h4 className="font-medium">Perguntas</h4>
        <button
          onClick={addFaqItem}
          className="px-3 py-1.5 bg-black text-white rounded-lg text-sm flex items-center gap-1"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {content.faq.items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <span className="font-medium">Pergunta {index + 1}</span>
            <button
              onClick={() => removeFaqItem(index)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <Input
            label="Pergunta"
            value={item.question}
            onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
          />
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2">Resposta</label>
            <textarea
              value={item.answer}
              onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderCtaEditor = () => (
    <div className="space-y-4">
      <Input
        label="Título"
        value={content.cta.title}
        onChange={(e) => updateCta('title', e.target.value)}
      />
      <Input
        label="Texto do Botão"
        value={content.cta.buttonText}
        onChange={(e) => updateCta('buttonText', e.target.value)}
      />
      <Input
        label="Link do Botão"
        value={content.cta.buttonLink}
        onChange={(e) => updateCta('buttonLink', e.target.value)}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/layouts?selected=${layoutId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar: {currentVersion?.name || 'Versão'}
              </h1>
              <p className="text-gray-600">
                Layout: {currentLayout?.name} • /lp/{currentLayout?.slug}/{currentVersion?.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Home size={18} />
              Dashboard
            </Link>
            <Button onClick={handleSave} isLoading={saving}>
              <Save size={18} className="mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Seções Ordenáveis */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Use as setas ↑↓ para reordenar. Clique na 🎨 paleta para editar cores de cada seção. Use o 👁️ olho para ocultar/mostrar.
              </p>
            </div>
            
            {sectionOrder.map((key, index) => renderSection(key, index))}
          </div>

          {/* WhatsApp e Ações */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-4"
            >
              <h2 className="text-xl font-bold mb-6">💬 WhatsApp Flutuante</h2>
              
              <div className="space-y-4">
                <Input
                  label="Número do WhatsApp"
                  value={content.settings.whatsappNumber || ''}
                  onChange={(e) => updateSettings('whatsappNumber', e.target.value)}
                  placeholder="5534999999999"
                />
                <p className="text-xs text-gray-500">
                  Formato: código do país + DDD + número (ex: 5534999999999)
                </p>
                
                <div className="pt-3 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWhatsAppButton}
                      onChange={(e) => setShowWhatsAppButton(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium">Mostrar botão flutuante</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    {showWhatsAppButton ? '✅ Botão visível na landing page' : '❌ Botão oculto na landing page'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link
                  href={`/lp/${currentLayout?.slug}/${currentVersion?.slug}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Eye size={18} />
                  Ver Prévia
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppleEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    }>
      <AppleEditorContent />
    </Suspense>
  )
}
