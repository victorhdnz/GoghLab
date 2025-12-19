'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2, Edit, ArrowLeft, Home, ChevronDown, ChevronUp, Eye, EyeOff, Palette, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import { createClient } from '@/lib/supabase/client'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Modal } from '@/components/ui/Modal'
import { FAQ, LandingLayout, LandingVersion } from '@/types'
import { saveSiteSettings } from '@/lib/supabase/site-settings-helper'

interface LandingSettings {
  // Hero Section (expandido)
  hero_title: string
  hero_subtitle: string
  hero_badge_text: string
  hero_cta_text: string
  hero_button_text: string
  hero_button_link: string
  hero_viewer_count_text: string // Texto do status de pessoas vendo
  hero_viewer_count_enabled: boolean // Ativar/desativar status de pessoas vendo
  hero_timer_text: string // Texto do cronômetro fixo (ex: "Oferta termina em:")
  hero_bg_color: string
  hero_text_color: string
  hero_images: string[]
  hero_banner: string
  hero_banners: string[] // Array de banners para carrossel
  
  // Timer Section (Centralizado - controla todos os cronômetros)
  timer_enabled: boolean // Controla se os cronômetros estão ativos
  timer_end_date: string // Data/hora de finalização (controla todos os cronômetros)
  timer_title: string
  timer_bg_color: string
  timer_text_color: string
  
  // Fixed Timer
  fixed_timer_bg_color: string
  fixed_timer_text_color: string
  
  // Exit Popup
  exit_popup_enabled: boolean // Controla se o pop-up está ativo
  exit_popup_title: string
  exit_popup_message: string
  exit_popup_button_text: string
  exit_popup_whatsapp_number: string
  exit_popup_bg_color: string
  exit_popup_text_color: string
  
  // Media Showcase (expandido)
  media_showcase_title: string
  media_showcase_bg_color: string
  media_showcase_text_color: string
  media_showcase_features: Array<{icon: string, text: string}>
  showcase_images: string[] // Array de imagens
  showcase_image_1: string // Mantido para compatibilidade
  showcase_image_2: string
  showcase_image_3: string
  showcase_image_4: string
  showcase_video_url: string
  showcase_video_caption: string // Texto abaixo do vídeo (ex: "🔥 Confira nossos lançamentos")
  showcase_video_orientation: 'horizontal' | 'vertical' // Orientação do vídeo
  
  // Value Package
  value_package_title: string
  value_package_image: string
  value_package_items: Array<{name: string, price: string}>
  value_package_total_price: string
  value_package_sale_price: string
  value_package_delivery_text: string
  value_package_button_text: string
  value_package_use_custom_link: boolean
  value_package_button_link: string
  value_package_whatsapp_number: string
  value_package_discount_text: string
  value_package_promotion_text: string
  value_package_bg_color: string
  value_package_text_color: string
  
  // Story Section
  story_title: string
  story_content: string
  story_images: string[] // Array de imagens
  story_image: string // Mantido para compatibilidade
  story_founders_names: string
  story_bg_color: string
  story_text_color: string
  
  // About Us Section
  about_us_title: string
  about_us_description: string
  about_us_store_images: string[] // Array de imagens
  about_us_store_image: string // Mantido para compatibilidade
  about_us_founders_image: string // Removido do dashboard mas mantido para compatibilidade
  about_us_founders_names: string // Removido do dashboard mas mantido para compatibilidade
  about_us_location: string
  about_us_bg_color: string
  about_us_text_color: string
  
  // Social Proof
  social_proof_title: string
  social_proof_google_icon: boolean
  social_proof_allow_photos: boolean
  social_proof_testimonial_count: string
  social_proof_reviews: Array<{
    id: string
    customer_name: string
    comment: string
    rating: number
    photo?: string
    google_review_link?: string
  }>
  social_proof_bg_color: string
  social_proof_text_color: string
  
  // WhatsApp Fixo (Botão Flutuante)
  whatsapp_float_number: string
  whatsapp_float_message: string
  
  // Contact Section
  contact_title: string
  contact_description: string
  contact_email: string
  contact_whatsapp: string
  contact_maps_link: string
  contact_schedule_weekdays: string
  contact_schedule_saturday: string
  contact_schedule_sunday: string
  contact_location_street: string
  contact_location_neighborhood: string
  contact_location_city_state: string
  contact_location_zip: string
  contact_title_visible: boolean
  contact_description_visible: boolean
  contact_whatsapp_visible: boolean
  contact_email_visible: boolean
  contact_schedule_visible: boolean
  contact_location_visible: boolean
  contact_bg_color: string
  contact_text_color: string
  
  // FAQ Section
  faq_title: string
  faq_bg_color: string
  faq_text_color: string
  
    // Controles de visibilidade das seções
  section_hero_visible: boolean
  section_media_showcase_visible: boolean
  section_value_package_visible: boolean
  section_social_proof_visible: boolean
  section_story_visible: boolean
  section_whatsapp_vip_visible: boolean
  section_about_us_visible: boolean
  section_contact_visible: boolean
  section_faq_visible: boolean
  
  // Controles de visibilidade de elementos individuais
  // Hero Section
  hero_badge_visible: boolean
  hero_title_visible: boolean
  hero_subtitle_visible: boolean
  hero_cta_visible: boolean
  hero_button_visible: boolean
  hero_timer_visible: boolean
  hero_banner_visible: boolean
  
  // Media Showcase Section
  media_showcase_title_visible: boolean
  media_showcase_features_visible: boolean
  media_showcase_images_visible: boolean
  media_showcase_video_visible: boolean
  
  // Value Package Section
  value_package_title_visible: boolean
  value_package_image_visible: boolean
  value_package_items_visible: boolean
  value_package_prices_visible: boolean
  value_package_button_visible: boolean
  value_package_timer_visible: boolean
  
  // Social Proof Section
  social_proof_title_visible: boolean
  social_proof_reviews_visible: boolean
  
  // Story Section
  story_title_visible: boolean
  story_content_visible: boolean
  story_images_visible: boolean
  
  // About Us Section
  about_us_title_visible: boolean
  about_us_description_visible: boolean
  about_us_images_visible: boolean
  about_us_location_visible: boolean
  
  // FAQ Section
  faq_title_visible: boolean
  
  // Ordem dos elementos dentro de cada seção
  hero_element_order: string[]
  media_showcase_element_order: string[]
  value_package_element_order: string[]
  social_proof_element_order: string[]
  story_element_order: string[]
  about_us_element_order: string[]
  contact_element_order: string[]
  faq_element_order: string[]
  
  // Section visibility defaults (novos campos)
  section_hero_visible_default: boolean
  section_media_showcase_visible_default: boolean
  section_value_package_visible_default: boolean
  section_social_proof_visible_default: boolean
  section_story_visible_default: boolean
  section_whatsapp_vip_visible_default: boolean
  section_about_us_visible_default: boolean
  section_contact_visible_default: boolean
  section_faq_visible_default: boolean
  
  // About antigo (compatibilidade)
  about_title: string
  about_description: string
  about_image: string
  
  // Theme Colors (manter por enquanto)
  theme_colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    button: string
    buttonText: string
  }
}

// Interface para cores de seção
interface SectionColors {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
}

// Cores padrão para cada seção
const defaultSectionColors: SectionColors = {
  backgroundColor: '#ffffff',
  textColor: '#111827',
  buttonColor: '#000000',
  buttonTextColor: '#ffffff'
}

// Componente popup de edição de cores (estilo Apple)
interface ColorEditorPopupProps {
  section: string
  sectionColors: Record<string, SectionColors>
  updateSectionColor: (section: string, colorKey: keyof SectionColors, value: string) => void
  onClose: () => void
  settings?: any
}

const ColorEditorPopup: React.FC<ColorEditorPopupProps> = ({ section, sectionColors, updateSectionColor, onClose, settings }) => {
  // Buscar cores do sectionColors ou do settings (para seções com campos específicos)
  const settingsColorMap: Record<string, { bg: string, text: string }> = {
    hero: { bg: 'hero_bg_color', text: 'hero_text_color' },
    timer: { bg: 'timer_bg_color', text: 'timer_text_color' },
    exit_popup: { bg: 'exit_popup_bg_color', text: 'exit_popup_text_color' },
    media_showcase: { bg: 'media_showcase_bg_color', text: 'media_showcase_text_color' },
    value_package: { bg: 'value_package_bg_color', text: 'value_package_text_color' },
    social_proof: { bg: 'social_proof_bg_color', text: 'social_proof_text_color' },
    story: { bg: 'story_bg_color', text: 'story_text_color' },
    about_us: { bg: 'about_us_bg_color', text: 'about_us_text_color' },
    contact: { bg: 'contact_bg_color', text: 'contact_text_color' },
    faq: { bg: 'faq_bg_color', text: 'faq_text_color' },
    whatsapp_vip: { bg: 'whatsapp_vip_bg_color', text: 'whatsapp_vip_text_color' },
  }
  
  const sectionSettingsKeys = settingsColorMap[section]
  const savedColors = sectionColors[section] || defaultSectionColors
  
  // Usar cores do settings se existirem, senão usar do sectionColors
  const colors = {
    backgroundColor: (sectionSettingsKeys && settings?.[sectionSettingsKeys.bg]) || savedColors.backgroundColor,
    textColor: (sectionSettingsKeys && settings?.[sectionSettingsKeys.text]) || savedColors.textColor,
    buttonColor: savedColors.buttonColor,
    buttonTextColor: savedColors.buttonTextColor,
  }

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      <div 
        className="fixed inset-0 z-40 bg-black/20"
        onClick={(e) => { 
          e.stopPropagation()
          onClose()
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
              onClose() 
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
                className="flex-1 px-3 py-2.5 border rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={(e) => { 
              e.stopPropagation()
              onClose() 
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

// Componente wrapper para seções colapsáveis (estilo Apple Editor)
interface SectionWrapperProps {
  section: string
  icon: string
  title: string
  children: React.ReactNode
  expandedSection: string | null
  setExpandedSection: (section: string | null) => void
  toggleSectionVisibility: (section: string) => void
  settings: any
  showColorEditor: string | null
  setShowColorEditor: (section: string | null) => void
  index: number
  moveSection: (sectionId: string, direction: 'up' | 'down') => void
  sectionOrder: string[]
  totalSections: number
  sectionColors: Record<string, SectionColors>
  updateSectionColor: (section: string, colorKey: keyof SectionColors, value: string) => void
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ 
  section, 
  icon, 
  title, 
  children,
  expandedSection,
  setExpandedSection,
  toggleSectionVisibility,
  settings,
  showColorEditor,
  setShowColorEditor,
  index,
  moveSection,
  sectionOrder,
  totalSections,
  sectionColors,
  updateSectionColor
}) => {
  const isExpanded = expandedSection === section
  const isVisible = (settings[`section_${section}_visible` as keyof LandingSettings] ?? true) as boolean

  // Calcular order CSS baseado na posição no sectionOrder
  // Seções especiais (timer, exit_popup, visibility) ficam nas primeiras posições
  // Seções reordenáveis ficam depois, ordenadas pelo sectionOrder
  let cssOrder = index
  if (section === 'timer') {
    cssOrder = 0
  } else if (section === 'exit_popup') {
    cssOrder = 1
  } else if (section === 'visibility') {
    cssOrder = 2
  } else if (sectionOrder.includes(section)) {
    // Seções reordenáveis: ordem baseada no sectionOrder + offset para ficar depois das especiais
    cssOrder = sectionOrder.indexOf(section) + 3
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-lg shadow-md overflow-hidden ${!isVisible ? 'opacity-50' : ''}`}
      style={{ order: cssOrder }}
    >
      {/* Header da Seção - Estilo Apple */}
      <div
        className="p-4 flex items-center justify-between bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpandedSection(isExpanded ? null : section)}
      >
        <div className="flex items-center gap-3">
          <GripVertical size={18} className="text-gray-400" />
          <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
            {index + 1}
          </span>
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Botão Cores */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowColorEditor(showColorEditor === section ? null : section) }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-purple-600"
            title="Editar cores da seção"
          >
            <Palette size={18} />
          </button>
          {/* Botão Visibilidade */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(section) }}
            className={`p-2 rounded-lg transition-colors ${isVisible ? 'hover:bg-gray-200 text-gray-600' : 'bg-red-100 text-red-500'}`}
            title={isVisible ? 'Ocultar seção' : 'Mostrar seção'}
          >
            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          {/* Setas de Ordenação */}
          <button
            onClick={(e) => { e.stopPropagation(); moveSection(section, 'up') }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30"
            disabled={!sectionOrder.includes(section) || sectionOrder.indexOf(section) === 0}
            title="Mover para cima"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveSection(section, 'down') }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30"
            disabled={!sectionOrder.includes(section) || sectionOrder.indexOf(section) === sectionOrder.length - 1}
            title="Mover para baixo"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Popup de Cores */}
      {showColorEditor === section && (
        <ColorEditorPopup
          section={section}
          sectionColors={sectionColors}
          updateSectionColor={updateSectionColor}
          onClose={() => setShowColorEditor(null)}
          settings={settings}
        />
      )}

      {/* Conteúdo colapsável */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="p-6 border-t"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}

function EditLandingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Parâmetros de URL para versão
  const layoutId = searchParams.get('layout')
  const versionId = searchParams.get('version')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [faqFormData, setFaqFormData] = useState({
    question: '',
    answer: '',
  })
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'media_showcase',
    'value_package',
    'social_proof',
    'story',
    'whatsapp_vip',
    'about_us',
    'contact',
    'faq'
  ])
  
  // Estados para versão/layout
  const [currentLayout, setCurrentLayout] = useState<LandingLayout | null>(null)
  const [currentVersion, setCurrentVersion] = useState<LandingVersion | null>(null)
  
  // Estados para acordeão (estilo Apple Editor)
  const [expandedSection, setExpandedSection] = useState<string | null>('hero')
  const [showColorEditor, setShowColorEditor] = useState<string | null>(null)
  const [sectionColors, setSectionColors] = useState<Record<string, SectionColors>>({})

  // Função para alternar visibilidade de seções
  const toggleSectionVisibility = (section: string) => {
    const key = `section_${section}_visible` as keyof LandingSettings
    const newValue = !(settings[key] ?? true)
    setSettings({ ...settings, [key]: newValue })
    toast.success(`Seção ${newValue ? 'visível' : 'oculta'}! Clique em "Salvar Alterações" para aplicar.`)
  }

  // Função para atualizar cores de uma seção (salva tanto no sectionColors quanto no settings)
  const updateSectionColor = (section: string, colorKey: keyof SectionColors, value: string) => {
    // Atualizar o estado local de cores
    setSectionColors(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || defaultSectionColors),
        [colorKey]: value
      }
    }))
    
    // Mapear para o campo específico no settings para compatibilidade com a landing page
    const settingsKeyMap: Record<string, Record<string, string>> = {
      hero: { backgroundColor: 'hero_bg_color', textColor: 'hero_text_color' },
      timer: { backgroundColor: 'timer_bg_color', textColor: 'timer_text_color' },
      exit_popup: { backgroundColor: 'exit_popup_bg_color', textColor: 'exit_popup_text_color' },
      media_showcase: { backgroundColor: 'media_showcase_bg_color', textColor: 'media_showcase_text_color' },
      value_package: { backgroundColor: 'value_package_bg_color', textColor: 'value_package_text_color' },
      social_proof: { backgroundColor: 'social_proof_bg_color', textColor: 'social_proof_text_color' },
      story: { backgroundColor: 'story_bg_color', textColor: 'story_text_color' },
      about_us: { backgroundColor: 'about_us_bg_color', textColor: 'about_us_text_color' },
      contact: { backgroundColor: 'contact_bg_color', textColor: 'contact_text_color' },
      faq: { backgroundColor: 'faq_bg_color', textColor: 'faq_text_color' },
      whatsapp_vip: { backgroundColor: 'whatsapp_vip_bg_color', textColor: 'whatsapp_vip_text_color' },
    }
    
    const sectionMap = settingsKeyMap[section]
    if (sectionMap && sectionMap[colorKey]) {
      setSettings(prev => ({
        ...prev,
        [sectionMap[colorKey]]: value
      }))
    }
  }

  // Função para reordenar seções
  const moveSectionInOrder = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sectionOrder.indexOf(sectionId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sectionOrder.length) return
    
    const newOrder = [...sectionOrder]
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[newIndex]
    newOrder[newIndex] = temp
    setSectionOrder(newOrder)
    toast.success('Ordem alterada! Clique em "Salvar Alterações" para aplicar.')
  }
  
  // Estados para numeração de ordem
  const [sectionOrderNumbers, setSectionOrderNumbers] = useState<Record<string, number>>({})
  const [elementOrderNumbers, setElementOrderNumbers] = useState<Record<string, Record<string, number>>>({})
  const [settings, setSettings] = useState<LandingSettings>({
    // Hero
    hero_title: '',
    hero_subtitle: '',
    hero_badge_text: '',
    hero_cta_text: '',
    hero_button_text: '',
    hero_button_link: '',
    hero_viewer_count_text: 'pessoas vendo agora',
    hero_timer_text: 'Oferta termina em:',
    hero_viewer_count_enabled: true,
    hero_bg_color: '#FFFFFF',
    hero_text_color: '#000000',
    hero_images: [],
    hero_banner: '',
    hero_banners: [],
    // Timer (Centralizado)
    timer_enabled: true,
    timer_title: '⚡ Black Friday - Tempo Limitado!',
    timer_end_date: '',
    timer_bg_color: '#000000',
    timer_text_color: '#FFFFFF',
    // Fixed Timer
    fixed_timer_bg_color: '#000000',
    fixed_timer_text_color: '#FFFFFF',
    // Exit Popup
    exit_popup_enabled: true,
    exit_popup_title: '⚠️ Espere!',
    exit_popup_message: 'Ainda dá tempo de garantir seu Smartwatch Série 11 com 4 brindes grátis.',
    exit_popup_button_text: '💬 FALAR AGORA NO WHATSAPP',
    exit_popup_whatsapp_number: '5534984136291',
    exit_popup_bg_color: '#000000',
    exit_popup_text_color: '#FFFFFF',
    // Media Showcase
    media_showcase_title: '💡 TECNOLOGIA, ESTILO E PRATICIDADE — TUDO NO SEU PULSO',
    media_showcase_bg_color: '#F5F5F5',
    media_showcase_text_color: '#111827',
    media_showcase_features: [
      { icon: '📱', text: 'Responda mensagens e chamadas direto do relógio' },
      { icon: '❤️', text: 'Monitore batimentos, sono e pressão arterial' },
      { icon: '🔋', text: 'Bateria que dura até 5 dias' },
      { icon: '💧', text: 'Resistente à água e suor' },
      { icon: '🎨', text: 'Troque pulseiras em segundos' },
      { icon: '📲', text: 'Compatível com Android e iPhone' },
    ],
    showcase_images: [],
    showcase_image_1: '', // Mantido para compatibilidade
    showcase_image_2: '',
    showcase_image_3: '',
    showcase_image_4: '',
    showcase_video_url: '',
    showcase_video_caption: '🔥 Confira nossos lançamentos',
    showcase_video_orientation: 'vertical' as 'horizontal' | 'vertical',
    // Value Package
    value_package_title: '🎁 VOCÊ LEVA TUDO ISSO',
    value_package_image: '',
    value_package_items: [
      { name: 'Smartwatch Série 11', price: '' },
      { name: '2 Pulseiras extras', price: 'R$ 79' },
      { name: '1 Case protetor', price: 'R$ 39' },
      { name: '1 Película premium', price: 'R$ 29' },
    ],
          value_package_total_price: 'R$ 447',
          value_package_sale_price: 'R$ 299',
          value_package_delivery_text: '📍 Entrega em até 24h para Uberlândia',
          value_package_button_text: '💬 GARANTIR MEU DESCONTO AGORA!',
          value_package_use_custom_link: false,
          value_package_button_link: '',
          value_package_whatsapp_number: '5534984136291',
    value_package_discount_text: '🎯 De R$ 499 → por R$ 299 + 4 brindes grátis!',
    value_package_promotion_text: '🕒 Promoção válida enquanto durar o estoque.',
    value_package_bg_color: '#FFFFFF',
    value_package_text_color: '#000000',
    // Story
    story_title: '✍️ NOSSA HISTÓRIA',
    story_content: 'A MV Company nasceu com o propósito de transformar negócios através de serviços digitais de alta qualidade.\n\nSomos especialistas em criação de sites, tráfego pago, criação de conteúdo e gestão de redes sociais.',
    story_images: [],
    story_image: '',
    story_founders_names: 'Guilherme e Letícia',
    story_bg_color: '#FFFFFF',
    story_text_color: '#000000',
    // About Us
    about_us_title: '🏢 SOBRE A MV COMPANY',
    about_us_description: 'A MV Company é uma prestadora de serviços digitais especializada em transformar a presença online de empresas.\n\nOferecemos criação de sites profissionais, gestão de tráfego pago, criação de conteúdo estratégico e gestão completa de redes sociais.',
    about_us_store_images: [],
    about_us_store_image: '',
    about_us_founders_image: '',
    about_us_founders_names: 'Guilherme e Letícia',
    about_us_location: 'Shopping Planalto, Uberlândia/MG',
    about_us_bg_color: '#F9FAFB',
    about_us_text_color: '#111827',
    // Social Proof
    social_proof_title: '⭐ CLIENTES DE UBERLÂNDIA QUE JÁ ESTÃO USANDO',
    social_proof_google_icon: true,
    social_proof_allow_photos: true,
    social_proof_testimonial_count: '💬 Mais de 1.000 smartwatches entregues em Uberlândia.',
    social_proof_reviews: [
      {
        id: '1',
        customer_name: 'Maria C., Planalto',
        comment: 'Chegou em menos de 1 dia! Atendimento excelente.',
        rating: 5,
        photo: '',
        google_review_link: '',
      },
      {
        id: '2',
        customer_name: 'Juliana R., Santa Mônica',
        comment: 'Comprei pro meu marido, ele amou.',
        rating: 5,
        photo: '',
        google_review_link: '',
      },
      {
        id: '3',
        customer_name: 'Carlos S., Tibery',
        comment: 'Produto top e suporte pelo WhatsApp super rápido.',
        rating: 5,
        photo: '',
        google_review_link: '',
      },
    ],
    social_proof_bg_color: '#000000',
    social_proof_text_color: '#FFFFFF',
    // WhatsApp Fixo
    whatsapp_float_number: '5534984136291',
    whatsapp_float_message: 'Olá! Gostaria de saber mais sobre os produtos.',
    // Contact
    contact_title: 'Entre em Contato',
    contact_description: 'Estamos aqui para ajudar você!',
    contact_email: 'contato@smarttimeprime.com.br',
    contact_whatsapp: '+55 34 8413-6291',
    contact_maps_link: 'https://maps.app.goo.gl/sj7F35h9fJ86T7By6',
    contact_schedule_weekdays: '09:00 - 20:00',
    contact_schedule_saturday: '09:00 - 19:00',
    contact_schedule_sunday: 'Fechado',
    contact_location_street: 'Av. Imbaúba, 1676',
    contact_location_neighborhood: 'Chácaras Tubalina e Quartel',
    contact_location_city_state: 'Uberlândia - MG',
    contact_location_zip: 'CEP: 38413-109',
    contact_title_visible: true,
    contact_description_visible: true,
    contact_whatsapp_visible: true,
    contact_email_visible: true,
    contact_schedule_visible: true,
    contact_location_visible: true,
    contact_bg_color: '#FFFFFF',
    contact_text_color: '#000000',
    // FAQ
    faq_title: 'Perguntas Frequentes',
    faq_bg_color: '#000000',
    faq_text_color: '#FFFFFF',
    // Controles de visibilidade das seções (padrão: todas visíveis)
    section_hero_visible: true,
    section_media_showcase_visible: true,
    section_value_package_visible: true,
    section_social_proof_visible: true,
    section_story_visible: true,
    section_whatsapp_vip_visible: true,
    section_about_us_visible: true,
    section_contact_visible: true,
    section_faq_visible: true,
    // Section visibility defaults (novos campos)
    section_hero_visible_default: true,
    section_media_showcase_visible_default: true,
    section_value_package_visible_default: true,
    section_social_proof_visible_default: true,
    section_story_visible_default: true,
    section_whatsapp_vip_visible_default: true,
    section_about_us_visible_default: true,
    section_contact_visible_default: true,
    section_faq_visible_default: true,
    // Controles de visibilidade de elementos individuais (padrão: todos visíveis)
    // Hero Section
    hero_badge_visible: true,
    hero_title_visible: true,
    hero_subtitle_visible: true,
    hero_cta_visible: true,
    hero_button_visible: true,
    hero_timer_visible: true,
    hero_banner_visible: true,
    // Media Showcase Section
    media_showcase_title_visible: true,
    media_showcase_features_visible: true,
    media_showcase_images_visible: true,
    media_showcase_video_visible: true,
    // Value Package Section
    value_package_title_visible: true,
    value_package_image_visible: true,
    value_package_items_visible: true,
    value_package_prices_visible: true,
    value_package_button_visible: true,
    value_package_timer_visible: true,
    // Social Proof Section
    social_proof_title_visible: true,
    social_proof_reviews_visible: true,
    // Story Section
    story_title_visible: true,
    story_content_visible: true,
    story_images_visible: true,
    // About Us Section
    about_us_title_visible: true,
    about_us_description_visible: true,
    about_us_images_visible: true,
    about_us_location_visible: true,
    // FAQ Section
    faq_title_visible: true,
    // Ordem dos elementos (padrão: ordem original)
    hero_element_order: ['hero_banner_visible', 'hero_badge_visible', 'hero_title_visible', 'hero_subtitle_visible', 'hero_viewer_count', 'hero_timer_visible', 'hero_button_visible'],
    media_showcase_element_order: ['media_showcase_title_visible', 'media_showcase_features_visible', 'media_showcase_images_visible', 'media_showcase_video_visible'],
    value_package_element_order: ['value_package_title_visible', 'value_package_image_visible', 'value_package_items_visible', 'value_package_prices_visible', 'value_package_timer_visible', 'value_package_button_visible'],
    social_proof_element_order: ['social_proof_title_visible', 'social_proof_reviews_visible'],
    story_element_order: ['story_title_visible', 'story_content_visible', 'story_images_visible'],
    about_us_element_order: ['about_us_title_visible', 'about_us_description_visible', 'about_us_images_visible', 'about_us_location_visible'],
    contact_element_order: ['contact_title_visible', 'contact_description_visible', 'contact_whatsapp_visible', 'contact_email_visible', 'contact_schedule_visible', 'contact_location_visible'],
    faq_element_order: ['faq_title_visible'],
    // About antigo
    about_title: '',
    about_description: '',
    about_image: '',
    // Theme
    theme_colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#FFD700',
      background: '#ffffff',
      text: '#000000',
      button: '#000000',
      buttonText: '#ffffff',
    },
  })

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    // Carregar dados baseado na versão ou configurações globais
    if (layoutId && versionId) {
      loadLayoutAndVersion()
    } else {
      loadSettings()
    }
    loadSectionOrder()
    loadFaqs()
  }, [isAuthenticated, isEditor, authLoading, layoutId, versionId])

  const loadLayoutAndVersion = async () => {
    try {
      setLoading(true)
      
      // Carregar layout
      const { data: layoutData, error: layoutError } = await supabase
        .from('landing_layouts')
        .select('*')
        .eq('id', layoutId)
        .single()
      
      if (layoutError) throw layoutError
      setCurrentLayout(layoutData)
      
      // Carregar versão
      const { data: versionData, error: versionError } = await supabase
        .from('landing_versions')
        .select('*')
        .eq('id', versionId)
        .single()
      
      if (versionError) throw versionError
      setCurrentVersion(versionData)
      
      // Carregar configurações da versão ou usar padrão
      if (versionData.sections_config && typeof versionData.sections_config === 'object' && Object.keys(versionData.sections_config as any).length > 0) {
        const savedSettings = versionData.sections_config as any
        setSettings(prev => ({
          ...prev,
          ...savedSettings,
          theme_colors: savedSettings.theme_colors || prev.theme_colors,
        }))
        
        // Carregar ordem das seções se existir
        if (savedSettings.section_order && Array.isArray(savedSettings.section_order)) {
          setSectionOrder(savedSettings.section_order)
        }
        
        // Carregar cores das seções se existir
        if (savedSettings.section_colors && typeof savedSettings.section_colors === 'object') {
          setSectionColors(savedSettings.section_colors)
        }
      } else {
        // Se não tiver configurações na versão, carregar do site_settings como template
        const { data: siteSettings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'general')
          .maybeSingle()
        
        if (siteSettings?.value) {
          const savedSettings = siteSettings.value as any
          setSettings(prev => ({
            ...prev,
            ...savedSettings,
            theme_colors: savedSettings.theme_colors || prev.theme_colors,
          }))
        }
      }
      
      setLoading(false)
    } catch (error: any) {
      console.error('Erro ao carregar versão:', error)
      toast.error('Erro ao carregar versão')
      setLoading(false)
    }
  }

  const loadSectionOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'landing_section_order')
        .maybeSingle()

      if (error) throw error

      if (data?.value && Array.isArray(data.value)) {
        setSectionOrder(data.value)
      }
    } catch (error) {
      console.error('Erro ao carregar ordem das seções:', error)
    }
  }

  const saveSectionOrder = async (newOrder: string[]) => {
    try {
      await supabase
        .from('site_settings')
        .upsert({
          key: 'landing_section_order',
          value: newOrder,
          description: 'Ordem das seções da landing page',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
    } catch (error) {
      console.error('Erro ao salvar ordem das seções:', error)
      toast.error('Erro ao salvar ordem das seções')
    }
  }

  const loadFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_position', { ascending: true })

      if (error) throw error
      setFaqs(data as FAQ[] || [])
    } catch (error) {
      console.error('Erro ao carregar FAQs:', error)
      toast.error('Erro ao carregar FAQs')
    }
  }

  const handleOpenFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq)
      setFaqFormData({
        question: faq.question,
        answer: faq.answer,
      })
    } else {
      setEditingFaq(null)
      setFaqFormData({
        question: '',
        answer: '',
      })
    }
    setIsFaqModalOpen(true)
  }

  const handleSaveFaq = async () => {
    if (!faqFormData.question || !faqFormData.answer) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from('faqs')
          .update(faqFormData)
          .eq('id', editingFaq.id)

        if (error) throw error
        toast.success('FAQ atualizada')
      } else {
        const { error } = await supabase.from('faqs').insert({
          ...faqFormData,
          order_position: faqs.length,
          is_active: true,
        })

        if (error) throw error
        toast.success('FAQ criada')
      }

      setIsFaqModalOpen(false)
      loadFaqs()
    } catch (error: any) {
      console.error('Erro ao salvar FAQ:', error)
      toast.error(`Erro ao salvar FAQ: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta FAQ?')) return

    try {
      const { error } = await supabase.from('faqs').delete().eq('id', faqId)

      if (error) throw error
      toast.success('FAQ excluída')
      loadFaqs()
    } catch (error: any) {
      console.error('Erro ao excluir FAQ:', error)
      toast.error(`Erro ao excluir FAQ: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const toggleFaqStatus = async (faqId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_active: !currentStatus })
        .eq('id', faqId)

      if (error) throw error
      toast.success('Status atualizado')
      loadFaqs()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error(`Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`)
    }
  }

  // Mapeamento de seções
  const sectionMap: Record<string, { label: string; key: string; elements: Array<{ key: string; label: string }> }> = {
    hero: {
      label: 'Hero (Banner de Abertura)',
      key: 'section_hero_visible',
      elements: [
        { key: 'hero_banner_visible', label: 'Banner' },
        { key: 'hero_badge_visible', label: 'Badge' },
        { key: 'hero_title_visible', label: 'Título' },
        { key: 'hero_subtitle_visible', label: 'Subtítulo' },
        { key: 'hero_viewer_count', label: 'Status de Pessoas Vendo' },
        { key: 'hero_timer_visible', label: 'Cronômetro' },
        { key: 'hero_button_visible', label: 'Botão' },
      ]
    },
    media_showcase: {
      label: 'Fotos e Vídeo do Produto',
      key: 'section_media_showcase_visible',
      elements: [
        { key: 'media_showcase_title_visible', label: 'Título' },
        { key: 'media_showcase_features_visible', label: 'Características' },
        { key: 'media_showcase_images_visible', label: 'Imagens' },
        { key: 'media_showcase_video_visible', label: 'Vídeo' },
      ]
    },
    value_package: {
      label: 'Você Leva Tudo Isso',
      key: 'section_value_package_visible',
      elements: [
        { key: 'value_package_title_visible', label: 'Título' },
        { key: 'value_package_image_visible', label: 'Imagem' },
        { key: 'value_package_items_visible', label: 'Lista de Itens' },
        { key: 'value_package_prices_visible', label: 'Preços' },
        { key: 'value_package_timer_visible', label: 'Cronômetro' },
        { key: 'value_package_button_visible', label: 'Botão' },
      ]
    },
    social_proof: {
      label: 'Avaliações de Clientes',
      key: 'section_social_proof_visible',
      elements: [
        { key: 'social_proof_title_visible', label: 'Título' },
        { key: 'social_proof_reviews_visible', label: 'Avaliações' },
      ]
    },
    story: {
      label: 'Nossa História',
      key: 'section_story_visible',
      elements: [
        { key: 'story_title_visible', label: 'Título' },
        { key: 'story_content_visible', label: 'Conteúdo' },
        { key: 'story_images_visible', label: 'Imagens' },
      ]
    },
    about_us: {
      label: 'Sobre a MV Company',
      key: 'section_about_us_visible',
      elements: [
        { key: 'about_us_title_visible', label: 'Título' },
        { key: 'about_us_description_visible', label: 'Descrição' },
        { key: 'about_us_images_visible', label: 'Imagens' },
        { key: 'about_us_location_visible', label: 'Localização' },
      ]
    },
    whatsapp_vip: {
      label: 'Grupo VIP do WhatsApp',
      key: 'section_whatsapp_vip_visible',
      elements: []
    },
    contact: {
      label: 'Contato',
      key: 'section_contact_visible',
      elements: [
        { key: 'contact_title_visible', label: 'Título' },
        { key: 'contact_description_visible', label: 'Descrição' },
        { key: 'contact_whatsapp_visible', label: 'WhatsApp' },
        { key: 'contact_email_visible', label: 'Email' },
        { key: 'contact_schedule_visible', label: 'Horário' },
        { key: 'contact_location_visible', label: 'Localização' },
      ]
    },
    faq: {
      label: 'Perguntas Frequentes',
      key: 'section_faq_visible',
      elements: [
        { key: 'faq_title_visible', label: 'Título' },
      ]
    }
  }

  // Função para reordenar seções baseado em números
  const handleSectionOrderChange = (sectionId: string, newNumber: number) => {
    const maxNumber = sectionOrder.length
    const clampedNumber = Math.max(1, Math.min(maxNumber, newNumber))
    
    // Criar novo objeto de números
    const newNumbers: Record<string, number> = { ...sectionOrderNumbers }
    
    // Se já existe um item com esse número, trocar os números
    const existingSection = Object.entries(newNumbers).find(([id, num]) => num === clampedNumber && id !== sectionId)
    if (existingSection) {
      newNumbers[existingSection[0]] = newNumbers[sectionId] || sectionOrder.indexOf(sectionId) + 1
    }
    
    newNumbers[sectionId] = clampedNumber
    
    // Reordenar seções baseado nos números
    const sortedSections = [...sectionOrder].sort((a, b) => {
      const numA = newNumbers[a] || sectionOrder.indexOf(a) + 1
      const numB = newNumbers[b] || sectionOrder.indexOf(b) + 1
      return numA - numB
    })
    
    // Renumerar para garantir sequência 1, 2, 3...
    const finalNumbers: Record<string, number> = {}
    sortedSections.forEach((id, index) => {
      finalNumbers[id] = index + 1
    })
    
    setSectionOrderNumbers(finalNumbers)
    setSectionOrder(sortedSections)
    toast.success('Ordem das seções atualizada! Clique em "Salvar" para aplicar as mudanças.')
  }

  // Função para reordenar elementos dentro de uma seção baseado em números
  const handleElementOrderChange = (sectionKey: string, elementKey: string, newNumber: number) => {
    const orderKey = `${sectionKey}_element_order` as keyof LandingSettings
    const currentOrder = (settings[orderKey] as string[]) || []
    const maxNumber = currentOrder.length
    const clampedNumber = Math.max(1, Math.min(maxNumber, newNumber))
    
    // Criar novo objeto de números para esta seção
    const sectionNumbers = { ...(elementOrderNumbers[sectionKey] || {}) }
    
    // Inicializar números se não existirem
    currentOrder.forEach((key, index) => {
      if (!sectionNumbers[key]) {
        sectionNumbers[key] = index + 1
      }
    })
    
    // Se já existe um elemento com esse número, trocar os números
    const existingElement = Object.entries(sectionNumbers).find(([key, num]) => num === clampedNumber && key !== elementKey)
    if (existingElement) {
      sectionNumbers[existingElement[0]] = sectionNumbers[elementKey] || currentOrder.indexOf(elementKey) + 1
    }
    
    sectionNumbers[elementKey] = clampedNumber
    
    // Reordenar elementos baseado nos números
    const sortedElements = [...currentOrder].sort((a, b) => {
      const numA = sectionNumbers[a] || currentOrder.indexOf(a) + 1
      const numB = sectionNumbers[b] || currentOrder.indexOf(b) + 1
      return numA - numB
    })
    
    // Renumerar para garantir sequência 1, 2, 3...
    const finalNumbers: Record<string, number> = {}
    sortedElements.forEach((key, index) => {
      finalNumbers[key] = index + 1
    })
    
    setElementOrderNumbers({ ...elementOrderNumbers, [sectionKey]: finalNumbers })
    setSettings({ ...settings, [orderKey]: sortedElements } as any)
    toast.success('Ordem dos elementos atualizada! Clique em "Salvar" para aplicar as mudanças.')
  }
  
  // Inicializar números de ordem quando sectionOrder ou settings mudarem
  useEffect(() => {
    // Inicializar números das seções apenas se ainda não foram inicializados
    setSectionOrderNumbers(prev => {
      const updated = { ...prev }
      let hasChanges = false
      sectionOrder.forEach((id, index) => {
        if (!updated[id]) {
          updated[id] = index + 1
          hasChanges = true
        }
      })
      return hasChanges ? updated : prev
    })
    
    // Inicializar números dos elementos apenas se ainda não foram inicializados
    setElementOrderNumbers(prev => {
      const updated = { ...prev }
      let hasChanges = false
      Object.keys(sectionMap).forEach(sectionKey => {
        const orderKey = `${sectionKey}_element_order` as keyof LandingSettings
        const elementOrder = (settings[orderKey] as string[]) || []
        if (elementOrder.length > 0) {
          if (!updated[sectionKey]) {
            updated[sectionKey] = {}
          }
          elementOrder.forEach((elementKey, index) => {
            if (!updated[sectionKey][elementKey]) {
              updated[sectionKey][elementKey] = index + 1
              hasChanges = true
            }
          })
        }
      })
      return hasChanges ? updated : prev
    })
  }, [sectionOrder, settings]) // Re-executar quando sectionOrder ou settings mudarem


  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'general')
        .maybeSingle()

      if (error) throw error

      if (data?.value) {
        const savedSettings = data.value as any
        // Usar valores padrão apenas se não houver no banco
        setSettings({
          // Hero
          hero_title: savedSettings.hero_title || '',
          hero_subtitle: savedSettings.hero_subtitle || '',
          hero_badge_text: savedSettings.hero_badge_text || '',
          hero_cta_text: savedSettings.hero_cta_text || '',
          hero_button_text: savedSettings.hero_button_text || '',
          hero_button_link: savedSettings.hero_button_link || '',
          hero_viewer_count_text: savedSettings.hero_viewer_count_text || 'pessoas vendo agora',
          hero_viewer_count_enabled: savedSettings.hero_viewer_count_enabled !== undefined ? savedSettings.hero_viewer_count_enabled : true,
          hero_timer_text: savedSettings.hero_timer_text || 'Oferta termina em:',
          hero_bg_color: savedSettings.hero_bg_color || '#FFFFFF',
          hero_text_color: savedSettings.hero_text_color || '#000000',
          hero_images: Array.isArray(savedSettings.hero_images) ? savedSettings.hero_images : [],
          hero_banner: savedSettings.hero_banner || '',
          hero_banners: Array.isArray(savedSettings.hero_banners) ? savedSettings.hero_banners : [],
          // Timer (Centralizado)
          timer_enabled: savedSettings.timer_enabled !== undefined ? savedSettings.timer_enabled : true,
          timer_title: savedSettings.timer_title || '⚡ Black Friday - Tempo Limitado!',
          timer_end_date: savedSettings.timer_end_date 
            ? (() => {
                // Converter ISO string do banco para formato datetime-local (sem timezone)
                const date = new Date(savedSettings.timer_end_date)
                // Obter componentes no timezone local
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')
                return `${year}-${month}-${day}T${hours}:${minutes}`
              })()
            : '',
          timer_bg_color: savedSettings.timer_bg_color || '#000000',
          timer_text_color: savedSettings.timer_text_color || '#FFFFFF',
          // Fixed Timer
          fixed_timer_bg_color: savedSettings.fixed_timer_bg_color || '#000000',
          fixed_timer_text_color: savedSettings.fixed_timer_text_color || '#FFFFFF',
          // Exit Popup
          exit_popup_enabled: savedSettings.exit_popup_enabled !== undefined ? savedSettings.exit_popup_enabled : true,
          exit_popup_title: savedSettings.exit_popup_title || '⚠️ Espere!',
          exit_popup_message: savedSettings.exit_popup_message || 'Ainda dá tempo de garantir seu Smartwatch Série 11 com 4 brindes grátis.',
          exit_popup_button_text: savedSettings.exit_popup_button_text || '💬 FALAR AGORA NO WHATSAPP',
          exit_popup_whatsapp_number: savedSettings.exit_popup_whatsapp_number || '5534984136291',
          exit_popup_bg_color: savedSettings.exit_popup_bg_color || '#000000',
          exit_popup_text_color: savedSettings.exit_popup_text_color || '#FFFFFF',
          // Media Showcase
          media_showcase_title: savedSettings.media_showcase_title || '💡 TECNOLOGIA, ESTILO E PRATICIDADE — TUDO NO SEU PULSO',
          media_showcase_bg_color: savedSettings.media_showcase_bg_color || '#F5F5F5',
          media_showcase_text_color: savedSettings.media_showcase_text_color || '#111827',
          media_showcase_features: Array.isArray(savedSettings.media_showcase_features) 
            ? savedSettings.media_showcase_features 
            : [
                { icon: '📱', text: 'Responda mensagens e chamadas direto do relógio' },
                { icon: '❤️', text: 'Monitore batimentos, sono e pressão arterial' },
                { icon: '🔋', text: 'Bateria que dura até 5 dias' },
                { icon: '💧', text: 'Resistente à água e suor' },
                { icon: '🎨', text: 'Troque pulseiras em segundos' },
                { icon: '📲', text: 'Compatível com Android e iPhone' },
              ],
          // Converter showcase_image_1-4 para showcase_images se não existir
          showcase_images: Array.isArray(savedSettings.showcase_images) && savedSettings.showcase_images.length > 0
            ? savedSettings.showcase_images 
            : [
                savedSettings.showcase_image_1 || '',
                savedSettings.showcase_image_2 || '',
                savedSettings.showcase_image_3 || '',
                savedSettings.showcase_image_4 || '',
              ].filter(Boolean), // Remove strings vazias
          showcase_image_1: savedSettings.showcase_image_1 || '',
          showcase_image_2: savedSettings.showcase_image_2 || '',
          showcase_image_3: savedSettings.showcase_image_3 || '',
          showcase_image_4: savedSettings.showcase_image_4 || '',
          showcase_video_url: savedSettings.showcase_video_url || '',
          showcase_video_caption: savedSettings.showcase_video_caption || '🔥 Confira nossos lançamentos',
          showcase_video_orientation: savedSettings.showcase_video_orientation || 'vertical',
          // Value Package
          value_package_title: savedSettings.value_package_title || '🎁 VOCÊ LEVA TUDO ISSO',
          value_package_image: savedSettings.value_package_image || '',
          value_package_items: Array.isArray(savedSettings.value_package_items)
            ? savedSettings.value_package_items
            : [
                { name: 'Smartwatch Série 11', price: '' },
                { name: '2 Pulseiras extras', price: 'R$ 79' },
                { name: '1 Case protetor', price: 'R$ 39' },
                { name: '1 Película premium', price: 'R$ 29' },
              ],
          value_package_total_price: savedSettings.value_package_total_price || 'R$ 447',
          value_package_sale_price: savedSettings.value_package_sale_price || 'R$ 299',
          value_package_delivery_text: savedSettings.value_package_delivery_text || '📍 Entrega em até 24h para Uberlândia',
          value_package_button_text: savedSettings.value_package_button_text || '💬 GARANTIR MEU DESCONTO AGORA!',
          value_package_use_custom_link: savedSettings.value_package_use_custom_link !== undefined ? savedSettings.value_package_use_custom_link : false,
          value_package_button_link: savedSettings.value_package_button_link || '',
          value_package_whatsapp_number: savedSettings.value_package_whatsapp_number || '5534984136291',
          value_package_discount_text: savedSettings.value_package_discount_text || '🎯 De R$ 499 → por R$ 299 + 4 brindes grátis!',
          value_package_promotion_text: savedSettings.value_package_promotion_text || '🕒 Promoção válida enquanto durar o estoque.',
          value_package_bg_color: savedSettings.value_package_bg_color || '#FFFFFF',
          value_package_text_color: savedSettings.value_package_text_color || '#000000',
          // Story
          story_title: savedSettings.story_title || '✍️ NOSSA HISTÓRIA',
          story_content: savedSettings.story_content || 'A MV Company nasceu com o propósito de transformar negócios através de serviços digitais de alta qualidade.\n\nSomos especialistas em criação de sites, tráfego pago, criação de conteúdo e gestão de redes sociais.',
          story_images: Array.isArray(savedSettings.story_images) ? savedSettings.story_images : (savedSettings.story_image ? [savedSettings.story_image] : []),
          story_image: savedSettings.story_image || '',
          story_founders_names: savedSettings.story_founders_names || 'Guilherme e Letícia',
          story_bg_color: savedSettings.story_bg_color || '#FFFFFF',
          story_text_color: savedSettings.story_text_color || '#000000',
          // About Us
          about_us_title: savedSettings.about_us_title || '🏢 SOBRE A MV COMPANY',
          about_us_description: savedSettings.about_us_description || 'A MV Company é uma prestadora de serviços digitais especializada em transformar a presença online de empresas.\n\nOferecemos criação de sites profissionais, gestão de tráfego pago, criação de conteúdo estratégico e gestão completa de redes sociais.',
          about_us_store_images: Array.isArray(savedSettings.about_us_store_images) ? savedSettings.about_us_store_images : (savedSettings.about_us_store_image ? [savedSettings.about_us_store_image] : []),
          about_us_store_image: savedSettings.about_us_store_image || '',
          about_us_founders_image: savedSettings.about_us_founders_image || '',
          about_us_founders_names: savedSettings.about_us_founders_names || 'Guilherme e Letícia',
          about_us_location: savedSettings.about_us_location || 'Shopping Planalto, Uberlândia/MG',
          about_us_bg_color: savedSettings.about_us_bg_color || '#F9FAFB',
          about_us_text_color: savedSettings.about_us_text_color || '#111827',
          // Social Proof
          social_proof_title: savedSettings.social_proof_title || '⭐ CLIENTES DE UBERLÂNDIA QUE JÁ ESTÃO USANDO',
          social_proof_google_icon: savedSettings.social_proof_google_icon !== undefined ? savedSettings.social_proof_google_icon : true,
          social_proof_allow_photos: savedSettings.social_proof_allow_photos !== undefined ? savedSettings.social_proof_allow_photos : true,
          social_proof_testimonial_count: savedSettings.social_proof_testimonial_count || '💬 Mais de 1.000 smartwatches entregues em Uberlândia.',
          social_proof_reviews: Array.isArray(savedSettings.social_proof_reviews) && savedSettings.social_proof_reviews.length > 0
            ? savedSettings.social_proof_reviews
            : [
                {
                  id: '1',
                  customer_name: 'Maria C., Planalto',
                  comment: 'Chegou em menos de 1 dia! Atendimento excelente.',
                  rating: 5,
                  photo: '',
                  google_review_link: '',
                },
                {
                  id: '2',
                  customer_name: 'Juliana R., Santa Mônica',
                  comment: 'Comprei pro meu marido, ele amou.',
                  rating: 5,
                  photo: '',
                  google_review_link: '',
                },
                {
                  id: '3',
                  customer_name: 'Carlos S., Tibery',
                  comment: 'Produto top e suporte pelo WhatsApp super rápido.',
                  rating: 5,
                  photo: '',
                  google_review_link: '',
                },
              ],
          social_proof_bg_color: savedSettings.social_proof_bg_color || '#000000',
          social_proof_text_color: savedSettings.social_proof_text_color || '#FFFFFF',
          // WhatsApp Fixo
          whatsapp_float_number: savedSettings.whatsapp_float_number || '5534984136291',
          whatsapp_float_message: savedSettings.whatsapp_float_message || 'Olá! Gostaria de saber mais sobre os produtos.',
          // Contact
          contact_title: savedSettings.contact_title || 'Entre em Contato',
          contact_description: savedSettings.contact_description || 'Estamos aqui para ajudar você!',
          contact_email: savedSettings.contact_email || 'contato@smarttimeprime.com.br',
          contact_whatsapp: savedSettings.contact_whatsapp || '+55 34 8413-6291',
          contact_maps_link: savedSettings.contact_maps_link || 'https://maps.app.goo.gl/sj7F35h9fJ86T7By6',
          contact_schedule_weekdays: savedSettings.contact_schedule_weekdays || '09:00 - 20:00',
          contact_schedule_saturday: savedSettings.contact_schedule_saturday || '09:00 - 19:00',
          contact_schedule_sunday: savedSettings.contact_schedule_sunday || 'Fechado',
          contact_location_street: savedSettings.contact_location_street || 'Av. Imbaúba, 1676',
          contact_location_neighborhood: savedSettings.contact_location_neighborhood || 'Chácaras Tubalina e Quartel',
          contact_location_city_state: savedSettings.contact_location_city_state || 'Uberlândia - MG',
          contact_location_zip: savedSettings.contact_location_zip || 'CEP: 38413-109',
          contact_title_visible: savedSettings.contact_title_visible !== undefined ? savedSettings.contact_title_visible : true,
          contact_description_visible: savedSettings.contact_description_visible !== undefined ? savedSettings.contact_description_visible : true,
          contact_whatsapp_visible: savedSettings.contact_whatsapp_visible !== undefined ? savedSettings.contact_whatsapp_visible : true,
          contact_email_visible: savedSettings.contact_email_visible !== undefined ? savedSettings.contact_email_visible : true,
          contact_schedule_visible: savedSettings.contact_schedule_visible !== undefined ? savedSettings.contact_schedule_visible : true,
          contact_location_visible: savedSettings.contact_location_visible !== undefined ? savedSettings.contact_location_visible : true,
          contact_bg_color: savedSettings.contact_bg_color || '#FFFFFF',
          contact_text_color: savedSettings.contact_text_color || '#000000',
          // FAQ
          faq_title: savedSettings.faq_title || 'Perguntas Frequentes',
          faq_bg_color: savedSettings.faq_bg_color || '#000000',
          faq_text_color: savedSettings.faq_text_color || '#FFFFFF',
          // Controles de visibilidade das seções
          section_hero_visible: savedSettings.section_hero_visible !== undefined ? savedSettings.section_hero_visible : true,
          section_media_showcase_visible: savedSettings.section_media_showcase_visible !== undefined ? savedSettings.section_media_showcase_visible : true,
          section_value_package_visible: savedSettings.section_value_package_visible !== undefined ? savedSettings.section_value_package_visible : true,
          section_social_proof_visible: savedSettings.section_social_proof_visible !== undefined ? savedSettings.section_social_proof_visible : true,
          section_story_visible: savedSettings.section_story_visible !== undefined ? savedSettings.section_story_visible : true,
          section_whatsapp_vip_visible: savedSettings.section_whatsapp_vip_visible !== undefined ? savedSettings.section_whatsapp_vip_visible : true,
          section_about_us_visible: savedSettings.section_about_us_visible !== undefined ? savedSettings.section_about_us_visible : true,
          section_contact_visible: savedSettings.section_contact_visible !== undefined ? savedSettings.section_contact_visible : true,
          section_faq_visible: savedSettings.section_faq_visible !== undefined ? savedSettings.section_faq_visible : true,
          // Section visibility defaults (novos campos)
          section_hero_visible_default: savedSettings.section_hero_visible_default !== undefined ? savedSettings.section_hero_visible_default : true,
          section_media_showcase_visible_default: savedSettings.section_media_showcase_visible_default !== undefined ? savedSettings.section_media_showcase_visible_default : true,
          section_value_package_visible_default: savedSettings.section_value_package_visible_default !== undefined ? savedSettings.section_value_package_visible_default : true,
          section_social_proof_visible_default: savedSettings.section_social_proof_visible_default !== undefined ? savedSettings.section_social_proof_visible_default : true,
          section_story_visible_default: savedSettings.section_story_visible_default !== undefined ? savedSettings.section_story_visible_default : true,
          section_whatsapp_vip_visible_default: savedSettings.section_whatsapp_vip_visible_default !== undefined ? savedSettings.section_whatsapp_vip_visible_default : true,
          section_about_us_visible_default: savedSettings.section_about_us_visible_default !== undefined ? savedSettings.section_about_us_visible_default : true,
          section_contact_visible_default: savedSettings.section_contact_visible_default !== undefined ? savedSettings.section_contact_visible_default : true,
          section_faq_visible_default: savedSettings.section_faq_visible_default !== undefined ? savedSettings.section_faq_visible_default : true,
          // Controles de visibilidade de elementos individuais
          // Hero Section
          hero_badge_visible: savedSettings.hero_badge_visible !== undefined ? savedSettings.hero_badge_visible : true,
          hero_title_visible: savedSettings.hero_title_visible !== undefined ? savedSettings.hero_title_visible : true,
          hero_subtitle_visible: savedSettings.hero_subtitle_visible !== undefined ? savedSettings.hero_subtitle_visible : true,
          hero_cta_visible: savedSettings.hero_cta_visible !== undefined ? savedSettings.hero_cta_visible : true,
          hero_button_visible: savedSettings.hero_button_visible !== undefined ? savedSettings.hero_button_visible : true,
          hero_timer_visible: savedSettings.hero_timer_visible !== undefined ? savedSettings.hero_timer_visible : true,
          hero_banner_visible: savedSettings.hero_banner_visible !== undefined ? savedSettings.hero_banner_visible : true,
          // Media Showcase Section
          media_showcase_title_visible: savedSettings.media_showcase_title_visible !== undefined ? savedSettings.media_showcase_title_visible : true,
          media_showcase_features_visible: savedSettings.media_showcase_features_visible !== undefined ? savedSettings.media_showcase_features_visible : true,
          media_showcase_images_visible: savedSettings.media_showcase_images_visible !== undefined ? savedSettings.media_showcase_images_visible : true,
          media_showcase_video_visible: savedSettings.media_showcase_video_visible !== undefined ? savedSettings.media_showcase_video_visible : true,
          // Value Package Section
          value_package_title_visible: savedSettings.value_package_title_visible !== undefined ? savedSettings.value_package_title_visible : true,
          value_package_image_visible: savedSettings.value_package_image_visible !== undefined ? savedSettings.value_package_image_visible : true,
          value_package_items_visible: savedSettings.value_package_items_visible !== undefined ? savedSettings.value_package_items_visible : true,
          value_package_prices_visible: savedSettings.value_package_prices_visible !== undefined ? savedSettings.value_package_prices_visible : true,
          value_package_button_visible: savedSettings.value_package_button_visible !== undefined ? savedSettings.value_package_button_visible : true,
          value_package_timer_visible: savedSettings.value_package_timer_visible !== undefined ? savedSettings.value_package_timer_visible : true,
          // Social Proof Section
          social_proof_title_visible: savedSettings.social_proof_title_visible !== undefined ? savedSettings.social_proof_title_visible : true,
          social_proof_reviews_visible: savedSettings.social_proof_reviews_visible !== undefined ? savedSettings.social_proof_reviews_visible : true,
          // Story Section
          story_title_visible: savedSettings.story_title_visible !== undefined ? savedSettings.story_title_visible : true,
          story_content_visible: savedSettings.story_content_visible !== undefined ? savedSettings.story_content_visible : true,
          story_images_visible: savedSettings.story_images_visible !== undefined ? savedSettings.story_images_visible : true,
          // About Us Section
          about_us_title_visible: savedSettings.about_us_title_visible !== undefined ? savedSettings.about_us_title_visible : true,
          about_us_description_visible: savedSettings.about_us_description_visible !== undefined ? savedSettings.about_us_description_visible : true,
          about_us_images_visible: savedSettings.about_us_images_visible !== undefined ? savedSettings.about_us_images_visible : true,
          about_us_location_visible: savedSettings.about_us_location_visible !== undefined ? savedSettings.about_us_location_visible : true,
          // FAQ Section
          faq_title_visible: savedSettings.faq_title_visible !== undefined ? savedSettings.faq_title_visible : true,
          // Ordem dos elementos
          hero_element_order: Array.isArray(savedSettings.hero_element_order) && savedSettings.hero_element_order.length > 0 
            ? savedSettings.hero_element_order 
            : ['hero_banner_visible', 'hero_badge_visible', 'hero_title_visible', 'hero_subtitle_visible', 'hero_viewer_count', 'hero_timer_visible', 'hero_button_visible'],
          media_showcase_element_order: Array.isArray(savedSettings.media_showcase_element_order) && savedSettings.media_showcase_element_order.length > 0
            ? savedSettings.media_showcase_element_order
            : ['media_showcase_title_visible', 'media_showcase_features_visible', 'media_showcase_images_visible', 'media_showcase_video_visible'],
          value_package_element_order: Array.isArray(savedSettings.value_package_element_order) && savedSettings.value_package_element_order.length > 0
            ? savedSettings.value_package_element_order
            : ['value_package_title_visible', 'value_package_image_visible', 'value_package_items_visible', 'value_package_prices_visible', 'value_package_timer_visible', 'value_package_button_visible'],
          social_proof_element_order: Array.isArray(savedSettings.social_proof_element_order) && savedSettings.social_proof_element_order.length > 0
            ? savedSettings.social_proof_element_order
            : ['social_proof_title_visible', 'social_proof_reviews_visible'],
          story_element_order: Array.isArray(savedSettings.story_element_order) && savedSettings.story_element_order.length > 0
            ? savedSettings.story_element_order
            : ['story_title_visible', 'story_content_visible', 'story_images_visible'],
          about_us_element_order: Array.isArray(savedSettings.about_us_element_order) && savedSettings.about_us_element_order.length > 0
            ? savedSettings.about_us_element_order
            : ['about_us_title_visible', 'about_us_description_visible', 'about_us_images_visible', 'about_us_location_visible'],
          contact_element_order: Array.isArray(savedSettings.contact_element_order) && savedSettings.contact_element_order.length > 0
            ? savedSettings.contact_element_order
            : ['contact_title_visible', 'contact_description_visible', 'contact_whatsapp_visible', 'contact_email_visible', 'contact_schedule_visible', 'contact_location_visible'],
          faq_element_order: Array.isArray(savedSettings.faq_element_order) && savedSettings.faq_element_order.length > 0
            ? savedSettings.faq_element_order
            : ['faq_title_visible'],
          // About antigo (compatibilidade)
          about_title: savedSettings.about_title || savedSettings.about_us_title || '',
          about_description: savedSettings.about_description || savedSettings.about_us_description || '',
          about_image: savedSettings.about_image || savedSettings.about_us_store_image || '',
          // Theme
          theme_colors: savedSettings.theme_colors || {
            primary: '#000000',
            secondary: '#666666',
            accent: '#FFD700',
            background: '#FFFFFF',
            text: '#000000',
            button: '#000000',
            buttonText: '#ffffff'
          }
        })
      } else {
        // Se não há dados no banco, os valores padrão já estão no useState inicial
        // Não precisa duplicar aqui
      }

    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Primeiro, verificar se existe
      const { data: existing, error: fetchError } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'general')
        .maybeSingle()

      // Preparar configurações para salvar (converter timer_end_date para ISO string)
      // O input datetime-local retorna formato "YYYY-MM-DDTHH:mm" sem timezone (horário local)
      let timerEndDateISO: string | null = null
      if (settings.timer_end_date) {
        try {
          // Se já está no formato ISO completo, usar diretamente
          if (settings.timer_end_date.includes('T') && settings.timer_end_date.includes('Z')) {
            timerEndDateISO = settings.timer_end_date
          } else {
            // Converter do formato datetime-local para ISO
            // datetime-local retorna "YYYY-MM-DDTHH:mm" no horário local do navegador
            // Parsear manualmente para garantir precisão
            const localDateStr = settings.timer_end_date
            const [datePart, timePart] = localDateStr.split('T')
            const [year, month, day] = datePart.split('-').map(Number)
            const [hours, minutes] = timePart.split(':').map(Number)
            
            // Criar Date no horário local (JavaScript interpreta isso corretamente)
            const localDate = new Date(year, month - 1, day, hours, minutes)
            
            // Converter para ISO string (UTC)
            // O JavaScript automaticamente ajusta para UTC ao converter
            timerEndDateISO = localDate.toISOString()
            
            if (isNaN(localDate.getTime())) {
              console.error('Data inválida:', settings.timer_end_date)
              toast.error('Data de término do cronômetro inválida')
              setSaving(false)
              return
            }
          }
        } catch (error) {
          console.error('Erro ao converter data:', error)
          toast.error('Erro ao converter data do cronômetro')
          setSaving(false)
          return
        }
      }

      // Preparar todos os campos de settings para salvar
      const fieldsToSave: any = {
        ...settings,
        timer_end_date: timerEndDateISO, // Usar a data convertida
        section_order: sectionOrder, // Incluir ordem das seções
        section_colors: sectionColors, // Incluir cores das seções
      }

      // Se estamos editando uma versão, salvar na tabela landing_versions
      if (versionId && currentVersion) {
        const { error: updateError } = await supabase
          .from('landing_versions')
          .update({
            sections_config: fieldsToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', versionId)

        if (updateError) throw updateError
        
        toast.success('Versão salva com sucesso!')
        setSaving(false)
        return
      }

      // Usar o helper seguro que faz merge inteligente preservando todos os dados (site_settings)
      const result = await saveSiteSettings({ fieldsToUpdate: fieldsToSave })
      
      if (!result.success) {
        throw result.error || new Error('Erro ao salvar configurações')
      }

      // LOG DE SEGURANÇA: Verificar se arrays importantes foram preservados
      // Buscar novamente para verificar
      const { data: verifyData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'general')
        .maybeSingle()
      
      if (verifyData?.value) {
        console.log('🔒 Verificação de segurança - Arrays preservados APÓS SALVAR:', {
          hero_banners_count: Array.isArray(verifyData.value.hero_banners) ? verifyData.value.hero_banners.length : 0,
          showcase_images_count: Array.isArray(verifyData.value.showcase_images) ? verifyData.value.showcase_images.length : 0,
          story_images_count: Array.isArray(verifyData.value.story_images) ? verifyData.value.story_images.length : 0,
          value_package_items_count: Array.isArray(verifyData.value.value_package_items) ? verifyData.value.value_package_items.length : 0,
          showcase_video_url: verifyData.value.showcase_video_url ? 'presente' : 'ausente',
          hero_title: verifyData.value.hero_title ? 'presente' : 'ausente',
        })
      }

      // Salvar ordem das seções
      await saveSectionOrder(sectionOrder)

      toast.success('Configurações salvas! Recarregue a página inicial para ver as mudanças.')
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error)
      toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        {/* Header customizado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={currentVersion ? `/dashboard/layouts?selected=${layoutId}` : '/dashboard'}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentVersion ? `Editar: ${currentVersion.name}` : 'Editar Landing Page'}
              </h1>
              <p className="text-gray-600">
                {currentVersion && currentLayout 
                  ? `Layout: ${currentLayout.name} • /lp/${currentLayout.slug}/${currentVersion.slug}`
                  : 'Personalize os textos da página inicial'
                }
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

        {/* Layout Grid igual ao Apple Editor */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Seções Editáveis - Coluna Esquerda (2 colunas) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Dica */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Use as setas ↑↓ para reordenar na página. Clique na 🎨 paleta para editar cores. Use o 👁️ olho para ocultar/mostrar. <strong>Clique em "Salvar Alterações" para aplicar as mudanças!</strong>
              </p>
            </div>

            {/* Cronômetros Centralizados */}
            <SectionWrapper 
              section="timer" 
              icon="⏰" 
              title="Cronômetros (Centralizado)" 
              expandedSection={expandedSection} 
              setExpandedSection={setExpandedSection} 
              toggleSectionVisibility={toggleSectionVisibility} 
              settings={settings}
              showColorEditor={showColorEditor}
              setShowColorEditor={setShowColorEditor}
              index={0}
              moveSection={moveSectionInOrder}
              sectionOrder={sectionOrder}
              totalSections={12}
              sectionColors={sectionColors}
              updateSectionColor={updateSectionColor}
            >
            <p className="text-sm text-gray-600 mb-6">
              Esta configuração controla TODOS os cronômetros da página (Fixed Timer, Hero Section, Value Package e Exit Popup).
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Esta configuração controla TODOS os cronômetros da página (Fixed Timer, Hero Section, Value Package e Exit Popup).
            </p>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.timer_enabled}
                  onChange={(e) => setSettings({ ...settings, timer_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="font-semibold">Ativar Cronômetros</span>
                <span className="text-sm text-gray-500">(Quando desativado, todos os cronômetros desaparecem da página)</span>
              </label>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data e Hora de Finalização *
                </label>
                <input
                  type="datetime-local"
                  value={settings.timer_end_date}
                  onChange={(e) => setSettings({ ...settings, timer_end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta data será usada em todos os cronômetros da página (Fixed Timer, Hero Section, Value Package e Exit Popup).
                </p>
              </div>
            </div>
          </SectionWrapper>

          {/* Exit Popup */}
          <SectionWrapper 
            section="exit_popup" 
            icon="⚠️" 
            title="Pop-up de Saída (Exit Popup)" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={1}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.exit_popup_enabled}
                  onChange={(e) => setSettings({ ...settings, exit_popup_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="font-semibold">Ativar Pop-up de Saída</span>
                <span className="text-sm text-gray-500">(Aparece ao chegar no final da página ou tentar sair)</span>
              </label>

              <Input
                label="Título do Pop-up"
                value={settings.exit_popup_title}
                onChange={(e) => setSettings({ ...settings, exit_popup_title: e.target.value })}
                placeholder="⚠️ Espere!"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Mensagem do Pop-up</label>
                <textarea
                  value={settings.exit_popup_message}
                  onChange={(e) => setSettings({ ...settings, exit_popup_message: e.target.value })}
                  placeholder="Ainda dá tempo de garantir seu Smartwatch Série 11 com 4 brindes grátis."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <Input
                label="Texto do Botão"
                value={settings.exit_popup_button_text}
                onChange={(e) => setSettings({ ...settings, exit_popup_button_text: e.target.value })}
                placeholder="💬 FALAR AGORA NO WHATSAPP"
              />

              <Input
                label="Número WhatsApp"
                value={settings.exit_popup_whatsapp_number}
                onChange={(e) => setSettings({ ...settings, exit_popup_whatsapp_number: e.target.value })}
                placeholder="5534984136291"
              />
              <p className="text-xs text-gray-500 -mt-2">
                Formato: 5534984136291 (sem espaços, com código do país e DDD)
              </p>
            </div>
          </SectionWrapper>

          {/* Hero Section */}
            <SectionWrapper 
              section="hero" 
              icon="🏠" 
              title="Seção Principal (Hero)" 
              expandedSection={expandedSection} 
              setExpandedSection={setExpandedSection} 
              toggleSectionVisibility={toggleSectionVisibility} 
              settings={settings}
              showColorEditor={showColorEditor}
              setShowColorEditor={setShowColorEditor}
              index={sectionOrder.indexOf('hero') >= 0 ? sectionOrder.indexOf('hero') : 2}
              moveSection={moveSectionInOrder}
              sectionOrder={sectionOrder}
              totalSections={12}
              sectionColors={sectionColors}
              updateSectionColor={updateSectionColor}
            >
            
            <div className="space-y-4">
              {/* Visibilidade de elementos individuais */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionMap.hero.elements.map((element) => (
                    <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[element.key] ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, [element.key]: e.target.checked } as any)
                        }
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span>{element.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Título Principal"
                value={settings.hero_title}
                onChange={(e) =>
                  setSettings({ ...settings, hero_title: e.target.value })
                }
                placeholder="🚀 MV COMPANY — SERVIÇOS DIGITAIS"
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subtítulo (use \n para quebras de linha)
                </label>
                <textarea
                  value={settings.hero_subtitle}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_subtitle: e.target.value })
                  }
                  placeholder="🚨 A BLACK FRIDAY CHEGOU!..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <Input
                label="Texto do Badge (opcional)"
                value={settings.hero_badge_text}
                onChange={(e) =>
                  setSettings({ ...settings, hero_badge_text: e.target.value })
                }
                placeholder="🚨 A BLACK FRIDAY CHEGOU!"
              />

              <Input
                label="Texto do Botão (Hero)"
                value={settings.hero_button_text}
                onChange={(e) =>
                  setSettings({ ...settings, hero_button_text: e.target.value })
                }
                placeholder="Ex: Saiba Mais"
              />

              <Input
                label="Link do Botão (Hero)"
                value={settings.hero_button_link}
                onChange={(e) =>
                  setSettings({ ...settings, hero_button_link: e.target.value })
                }
                placeholder="Ex: /produtos ou https://exemplo.com"
              />

              {/* Status de Pessoas Vendo */}
              <div className="pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={settings.hero_viewer_count_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_viewer_count_enabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="font-semibold">Ativar Status de Pessoas Vendo</span>
                </label>

                <Input
                  label="Texto do Status (ex: 'pessoas vendo agora')"
                  value={settings.hero_viewer_count_text}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_viewer_count_text: e.target.value })
                  }
                  placeholder="pessoas vendo agora"
                  disabled={!settings.hero_viewer_count_enabled}
                />
              </div>

              {/* Cronômetro Fixo */}
              <div className="pt-4 border-t">
                <Input
                  label="Texto do Cronômetro (ex: 'Oferta termina em:')"
                  value={settings.hero_timer_text}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_timer_text: e.target.value })
                  }
                  placeholder="Oferta termina em:"
                />
              </div>

              {/* Banners Carrossel (1920x650) */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium mb-2">
                  Banners Carrossel (1920x650)
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  📸 Banners que aparecem acima do texto do início. Dimensões recomendadas: 1920x650px.
                  <br />• 1 banner = estático
                  <br />• Múltiplos banners = carrossel automático
                </p>
                <ArrayImageManager
                  value={settings.hero_banners || []}
                  onChange={(images: string[]) => setSettings({ ...settings, hero_banners: images })}
                  label="Banners"
                  placeholder="Clique para fazer upload de um banner (1920x650)"
                  cropType="banner"
                  aspectRatio={1920/650}
                  targetSize={{ width: 1920, height: 650 }}
                  recommendedDimensions="Banners: 1920 x 650px (Formato Horizontal/Banner)"
                />
              </div>
            </div>
          </SectionWrapper>

          {/* Contact Section */}
            <SectionWrapper 
            section="contact" 
            icon="📞" 
            title="Entre em Contato" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={sectionOrder.indexOf('contact') >= 0 ? sectionOrder.indexOf('contact') : 3}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            
            <div className="space-y-4">
              {/* Visibilidade de elementos individuais */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionMap.contact.elements.map((element) => (
                    <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[element.key] ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, [element.key]: e.target.checked } as any)
                        }
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span>{element.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Título da Seção"
                value={settings.contact_title}
                onChange={(e) =>
                  setSettings({ ...settings, contact_title: e.target.value })
                }
                placeholder="Entre em Contato"
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição da Seção
                </label>
                <textarea
                  value={settings.contact_description}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_description: e.target.value })
                  }
                  placeholder="Estamos aqui para ajudar você!"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_email: e.target.value })
                  }
                  placeholder="contato@smarttimeprime.com.br"
                />

                <Input
                  label="WhatsApp"
                  value={settings.contact_whatsapp}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_whatsapp: e.target.value })
                  }
                  placeholder="+55 34 8413-6291"
                />
              </div>

              {/* Horário de Funcionamento */}
              <div className="space-y-3">
                <h4 className="text-md font-medium">Horário de Funcionamento</h4>
                <Input
                  label="Segunda a Sexta"
                  value={settings.contact_schedule_weekdays}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_schedule_weekdays: e.target.value })
                  }
                  placeholder="09:00 - 20:00"
                />
                <Input
                  label="Sábado"
                  value={settings.contact_schedule_saturday}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_schedule_saturday: e.target.value })
                  }
                  placeholder="09:00 - 19:00"
                />
                <Input
                  label="Domingo"
                  value={settings.contact_schedule_sunday}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_schedule_sunday: e.target.value })
                  }
                  placeholder="Fechado"
                />
              </div>

              {/* Localização */}
              <div className="space-y-3">
                <h4 className="text-md font-medium">Localização</h4>
                <Input
                  label="Endereço"
                  value={settings.contact_location_street}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_location_street: e.target.value })
                  }
                  placeholder="Av. Imbaúba, 1676"
                />
                <Input
                  label="Bairro"
                  value={settings.contact_location_neighborhood}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_location_neighborhood: e.target.value })
                  }
                  placeholder="Chácaras Tubalina e Quartel"
                />
                <Input
                  label="Cidade - Estado"
                  value={settings.contact_location_city_state}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_location_city_state: e.target.value })
                  }
                  placeholder="Uberlândia - MG"
                />
                <Input
                  label="CEP"
                  value={settings.contact_location_zip}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_location_zip: e.target.value })
                  }
                  placeholder="CEP: 38413-109"
                />
                <Input
                  label="Link do Google Maps"
                  value={settings.contact_maps_link}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_maps_link: e.target.value })
                  }
                  placeholder="https://maps.app.goo.gl/..."
                />
                <p className="text-xs text-gray-500 -mt-2">
                  Link que será usado no botão "Ver no Mapa" da seção "Entre em Contato".
                </p>
              </div>
            </div>
          </SectionWrapper>

          {/* FAQ Section */}
            <SectionWrapper 
            section="faq" 
            icon="❓" 
            title="Perguntas Frequentes (FAQ)" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={sectionOrder.indexOf('faq') >= 0 ? sectionOrder.indexOf('faq') : 4}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            
            <div className="space-y-6">
              {/* Configurações da Seção */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">Configurações da Seção</h3>
                <div className="space-y-4">
                  <Input
                    label="Título da Seção"
                    value={settings.faq_title}
                    onChange={(e) =>
                      setSettings({ ...settings, faq_title: e.target.value })
                    }
                    placeholder="Ex: Perguntas Frequentes"
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cor de Fundo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.faq_bg_color || '#ffffff'}
                        onChange={(e) =>
                          setSettings({ ...settings, faq_bg_color: e.target.value })
                        }
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <Input
                        value={settings.faq_bg_color || '#ffffff'}
                        onChange={(e) =>
                          setSettings({ ...settings, faq_bg_color: e.target.value })
                        }
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Visibilidade de elementos individuais */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                    <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                    <div className="grid grid-cols-2 gap-2">
                      {sectionMap.faq.elements.map((element) => (
                        <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={(settings as any)[element.key] ?? true}
                            onChange={(e) =>
                              setSettings({ ...settings, [element.key]: e.target.checked } as any)
                            }
                            className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                          />
                          <span>{element.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gerenciamento de FAQs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Gerenciar FAQs</h3>
                  <Button size="sm" onClick={() => handleOpenFaqModal()}>
                    <Plus size={18} className="mr-2" />
                    Nova FAQ
                  </Button>
                </div>

                <div className="space-y-3">
                  {faqs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-4xl mb-3">❓</div>
                      <h4 className="text-lg font-semibold mb-2">Nenhuma FAQ cadastrada</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Comece adicionando sua primeira pergunta frequente
                      </p>
                      <Button size="sm" onClick={() => handleOpenFaqModal()}>
                        <Plus size={16} className="mr-2" />
                        Adicionar FAQ
                      </Button>
                    </div>
                  ) : (
                    faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                              <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={faq.is_active}
                                    onChange={() =>
                                      toggleFaqStatus(faq.id, faq.is_active)
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                </label>
                                <button
                                  onClick={() => handleOpenFaqModal(faq)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaq(faq.id)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </SectionWrapper>

          {/* Media Showcase Section */}
            <SectionWrapper 
            section="media_showcase" 
            icon="📸" 
            title="Galeria de Destaques" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={sectionOrder.indexOf('media_showcase') >= 0 ? sectionOrder.indexOf('media_showcase') : 5}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            <p className="text-sm text-gray-600 mb-6">
              📸 Envie imagens no formato Instagram Post (1080x1080px) para o carrossel + 1 vídeo vertical tipo Reels
            </p>
            
            <div className="space-y-4 mb-6">
              {/* Visibilidade de elementos individuais */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionMap.media_showcase.elements.map((element) => (
                    <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[element.key] ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, [element.key]: e.target.checked } as any)
                        }
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span>{element.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Título da Seção"
                value={settings.media_showcase_title}
                onChange={(e) =>
                  setSettings({ ...settings, media_showcase_title: e.target.value })
                }
                placeholder="💡 TECNOLOGIA, ESTILO E PRATICIDADE — TUDO NO SEU PULSO"
              />

              {/* Features Editor */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Recursos/Features (editar lista)
                </label>
                <div className="space-y-2">
                  {settings.media_showcase_features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={feature.icon}
                        onChange={(e) => {
                          const features = [...settings.media_showcase_features]
                          features[idx].icon = e.target.value
                          setSettings({ ...settings, media_showcase_features: features })
                        }}
                        placeholder="📱"
                        className="w-20"
                      />
                      <Input
                        value={feature.text}
                        onChange={(e) => {
                          const features = [...settings.media_showcase_features]
                          features[idx].text = e.target.value
                          setSettings({ ...settings, media_showcase_features: features })
                        }}
                        placeholder="Responda mensagens..."
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const features = settings.media_showcase_features.filter((_, i) => i !== idx)
                          setSettings({ ...settings, media_showcase_features: features })
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        media_showcase_features: [...settings.media_showcase_features, { icon: '', text: '' }]
                      })
                    }}
                  >
                    + Adicionar Feature
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Imagens do Carrossel */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Imagens do Carrossel
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    (Formato Instagram Post: 1080x1080px)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  📸 Imagens que aparecem no carrossel ao lado do vídeo. Adicione quantas imagens quiser.
                </p>
                <ArrayImageManager
                  value={settings.showcase_images || []}
                  onChange={(images: string[]) => {
                    // Atualizar showcase_images e manter compatibilidade com showcase_image_1-4
                    const updatedSettings: LandingSettings = { 
                      ...settings, 
                      showcase_images: images,
                      showcase_image_1: images[0] || '',
                      showcase_image_2: images[1] || '',
                      showcase_image_3: images[2] || '',
                      showcase_image_4: images[3] || '',
                    }
                    setSettings(updatedSettings)
                  }}
                  label="Imagens do Carrossel"
                  placeholder="Clique para fazer upload de uma imagem"
                  cropType="square"
                  aspectRatio={1}
                  targetSize={{ width: 1080, height: 1080 }}
                  recommendedDimensions="Imagens: 1080 x 1080px (Formato Instagram Post)"
                />
              </div>

              {/* Vídeo */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium mb-2">
                  Vídeo Vertical (Reels/Stories)
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    (Formato Instagram Reels: 1080x1920px, até 50MB)
                  </span>
                </label>
                <VideoUploader
                  value={settings.showcase_video_url}
                  orientation={settings.showcase_video_orientation || 'vertical'}
                  onOrientationChange={async (orientation) => {
                    // Salvar orientação diretamente no banco
                    try {
                      const supabase = createClient()
                      const { data: existing } = await supabase
                        .from('site_settings')
                        .select('value')
                        .eq('key', 'general')
                        .maybeSingle()

                      let currentValue: any = {}
                      if (existing?.value) {
                        if (typeof existing.value === 'string') {
                          try {
                            currentValue = JSON.parse(existing.value)
                          } catch (e) {
                            currentValue = {}
                          }
                        } else if (typeof existing.value === 'object' && existing.value !== null) {
                          currentValue = existing.value
                        }
                      }
                      
                      const updatedValue = {
                        ...currentValue,
                        showcase_video_orientation: orientation,
                      }
                      
                      if (existing) {
                        await supabase
                          .from('site_settings')
                          .update({
                            value: updatedValue,
                            updated_at: new Date().toISOString(),
                          })
                          .eq('key', 'general')
                      } else {
                        await supabase
                          .from('site_settings')
                          .insert({
                            key: 'general',
                            value: updatedValue,
                            description: 'Configurações gerais do site',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          })
                      }
                      
                      setSettings((prev) => ({ ...prev, showcase_video_orientation: orientation }))
                    } catch (error) {
                      console.error('Erro ao salvar orientação:', error)
                    }
                  }}
                  onChange={async (url) => {
                    console.log('VideoUploader onChange:', url)
                    // Salvar vídeo diretamente no banco ao mudar
                    try {
                      const supabase = createClient()
                      const { data: existing } = await supabase
                        .from('site_settings')
                        .select('value')
                        .eq('key', 'general')
                        .maybeSingle()

                      // Sempre fazer merge com dados existentes
                      let currentValue: any = {}
                      if (existing?.value) {
                        if (typeof existing.value === 'string') {
                          try {
                            currentValue = JSON.parse(existing.value)
                          } catch (e) {
                            currentValue = {}
                          }
                        } else if (typeof existing.value === 'object' && existing.value !== null) {
                          currentValue = existing.value
                        }
                      }
                      
                      // Fazer merge preservando todos os dados existentes
                      const updatedValue = {
                        ...currentValue, // Preservar todos os dados existentes
                        showcase_video_url: url, // Atualizar apenas o campo do vídeo
                      }
                      
                      if (existing) {
                        // Atualizar registro existente
                        const { error } = await supabase
                          .from('site_settings')
                          .update({
                            value: updatedValue,
                            updated_at: new Date().toISOString(),
                          })
                          .eq('key', 'general')
                        
                        if (error) {
                          console.error('Erro ao salvar vídeo:', error)
                          toast.error('Erro ao salvar vídeo')
                        } else {
                          toast.success('Vídeo salvo!')
                        }
                      } else {
                        // Criar novo registro fazendo merge com dados padrão
                        const { error } = await supabase
                          .from('site_settings')
                          .insert({
                            key: 'general',
                            value: updatedValue,
                            description: 'Configurações gerais do site',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          })
                        
                        if (error) {
                          console.error('Erro ao salvar vídeo:', error)
                          toast.error('Erro ao salvar vídeo')
                        } else {
                          toast.success('Vídeo salvo!')
                        }
                      }
                    } catch (error) {
                      console.error('Erro ao salvar vídeo:', error)
                      toast.error('Erro ao salvar vídeo')
                    }
                    
                    setSettings((prev) => ({ ...prev, showcase_video_url: url }))
                  }}
                  showMediaManager={false}
                />
                
                <Input
                  label="Texto abaixo do vídeo (ex: '🔥 Confira nossos lançamentos')"
                  value={settings.showcase_video_caption}
                  onChange={(e) =>
                    setSettings({ ...settings, showcase_video_caption: e.target.value })
                  }
                  placeholder="🔥 Confira nossos lançamentos"
                  className="mt-4"
                />
              </div>
            </div>
          </SectionWrapper>

          {/* Value Package Section */}
            <SectionWrapper 
            section="value_package" 
            icon="💎" 
            title="Pacote de Valor" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={sectionOrder.indexOf('value_package') >= 0 ? sectionOrder.indexOf('value_package') : 6}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            
            <div className="space-y-4">
              {/* Visibilidade de elementos individuais */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionMap.value_package.elements.map((element) => (
                    <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[element.key] ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, [element.key]: e.target.checked } as any)
                        }
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span>{element.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Título"
                value={settings.value_package_title}
                onChange={(e) =>
                  setSettings({ ...settings, value_package_title: e.target.value })
                }
                placeholder="🎁 VOCÊ LEVA TUDO ISSO"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Imagem do Pacote</label>
                <ImageUploader
                  value={settings.value_package_image}
                  onChange={(url) => setSettings({ ...settings, value_package_image: url })}
                />
              </div>

              {/* Items Array */}
              <div>
                <label className="block text-sm font-medium mb-2">Itens do Pacote</label>
                <div className="space-y-2">
                  {settings.value_package_items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const items = [...settings.value_package_items]
                          items[idx].name = e.target.value
                          setSettings({ ...settings, value_package_items: items })
                        }}
                        placeholder="Nome do item"
                        className="flex-1"
                      />
                      <Input
                        value={item.price}
                        onChange={(e) => {
                          const items = [...settings.value_package_items]
                          items[idx].price = e.target.value
                          setSettings({ ...settings, value_package_items: items })
                        }}
                        placeholder="R$ 79"
                        className="w-32"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const items = settings.value_package_items.filter((_, i) => i !== idx)
                          setSettings({ ...settings, value_package_items: items })
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        value_package_items: [...settings.value_package_items, { name: '', price: '' }]
                      })
                    }}
                  >
                    + Adicionar Item
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Preço Total"
                  value={settings.value_package_total_price}
                  onChange={(e) =>
                    setSettings({ ...settings, value_package_total_price: e.target.value })
                  }
                  placeholder="R$ 447"
                />

                <Input
                  label="Preço de Venda"
                  value={settings.value_package_sale_price}
                  onChange={(e) =>
                    setSettings({ ...settings, value_package_sale_price: e.target.value })
                  }
                  placeholder="R$ 299"
                />
              </div>

              <Input
                label="Texto de Entrega"
                value={settings.value_package_delivery_text}
                onChange={(e) =>
                  setSettings({ ...settings, value_package_delivery_text: e.target.value })
                }
                placeholder="📍 Entrega em até 24h para Uberlândia"
              />

              <Input
                label="Texto do Botão"
                value={settings.value_package_button_text}
                onChange={(e) =>
                  setSettings({ ...settings, value_package_button_text: e.target.value })
                }
                placeholder="💬 GARANTIR MEU DESCONTO AGORA!"
              />
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.value_package_use_custom_link}
                    onChange={(e) =>
                      setSettings({ ...settings, value_package_use_custom_link: e.target.checked })
                    }
                    className="w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium">Usar link customizado (em vez de rolar para WhatsApp VIP)</span>
                </label>
                
                {settings.value_package_use_custom_link && (
                  <Input
                    label="Link de Redirecionamento"
                    value={settings.value_package_button_link}
                    onChange={(e) =>
                      setSettings({ ...settings, value_package_button_link: e.target.value })
                    }
                    placeholder="Ex: /produtos/serie-11 ou https://exemplo.com"
                  />
                )}
                
                {!settings.value_package_use_custom_link && (
                  <p className="text-xs text-gray-500">
                    O botão redireciona automaticamente para a seção de cadastro do WhatsApp VIP.
                  </p>
                )}
              </div>
            </div>
          </SectionWrapper>

          {/* Story Section */}
            <SectionWrapper 
            section="story" 
            icon="📖" 
            title="Nossa História" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={sectionOrder.indexOf('story') >= 0 ? sectionOrder.indexOf('story') : 7}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            
            <div className="space-y-4">
              {/* Visibilidade de elementos individuais */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionMap.story.elements.map((element) => (
                    <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[element.key] ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, [element.key]: e.target.checked } as any)
                        }
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span>{element.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Título"
                value={settings.story_title}
                onChange={(e) =>
                  setSettings({ ...settings, story_title: e.target.value })
                }
                placeholder="✍️ NOSSA HISTÓRIA"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo (use \n para quebras de linha)</label>
                <textarea
                  value={settings.story_content}
                  onChange={(e) =>
                    setSettings({ ...settings, story_content: e.target.value })
                  }
                  placeholder="A MV Company nasceu com o propósito de transformar negócios..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <Input
                label="Nomes dos Donos/Fundadores"
                value={settings.story_founders_names}
                onChange={(e) =>
                  setSettings({ ...settings, story_founders_names: e.target.value })
                }
                placeholder="Guilherme e Letícia"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Fotos dos Donos na Loja</label>
                <ArrayImageManager
                  value={settings.story_images}
                  onChange={(images) => setSettings({ ...settings, story_images: images })}
                />
              </div>
            </div>
          </SectionWrapper>

          {/* About Us Section */}
            <SectionWrapper 
            section="about_us" 
            icon="ℹ️" 
            title="Quem Somos" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={sectionOrder.indexOf('about_us') >= 0 ? sectionOrder.indexOf('about_us') : 8}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            
            <div className="space-y-4">
              {/* Visibilidade de elementos individuais */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionMap.about_us.elements.map((element) => (
                    <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[element.key] ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, [element.key]: e.target.checked } as any)
                        }
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span>{element.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Título"
                value={settings.about_us_title}
                onChange={(e) =>
                  setSettings({ ...settings, about_us_title: e.target.value })
                }
                placeholder="🏢 SOBRE A MV COMPANY"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Descrição (use \n para quebras de linha)</label>
                <textarea
                  value={settings.about_us_description}
                  onChange={(e) =>
                    setSettings({ ...settings, about_us_description: e.target.value })
                  }
                  placeholder="A MV Company é uma prestadora de serviços digitais..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fotos da Loja</label>
                <ArrayImageManager
                  value={settings.about_us_store_images}
                  onChange={(images) => setSettings({ ...settings, about_us_store_images: images })}
                  cropType="custom"
                  aspectRatio={4/3}
                  targetSize={{ width: 1920, height: 1440 }}
                  recommendedDimensions="Recomendado: 1920x1440px ou maior. A imagem será mantida em alta qualidade."
                />
              </div>

              <Input
                label="Localização"
                value={settings.about_us_location}
                onChange={(e) =>
                  setSettings({ ...settings, about_us_location: e.target.value })
                }
                placeholder="Shopping Planalto, Uberlândia/MG"
              />
              <p className="text-xs text-gray-500 -mt-2">
                Localização que aparecerá no botão de endereço da loja
              </p>
            </div>
          </SectionWrapper>

          {/* Controles de Visibilidade das Seções */}
            <SectionWrapper 
            section="visibility" 
            icon="👁️" 
            title="Visibilidade e Ordem das Seções" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={10}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            <p className="text-sm text-gray-600 mb-6">
              Controle quais seções da página inicial devem ser exibidas. Use os números para definir a ordem das seções e elementos (1 = primeiro, 2 = segundo, etc.).
            </p>
            
            <div className="space-y-4">
              {sectionOrder.map((sectionId) => {
                const section = sectionMap[sectionId]
                if (!section) return null
                
                const orderKey = `${sectionId}_element_order` as keyof LandingSettings
                const elementOrder = (settings[orderKey] as string[]) || []
                const sectionNumber = sectionOrderNumbers[sectionId] || sectionOrder.indexOf(sectionId) + 1
                
                return (
                  <div
                    key={sectionId}
                    className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 w-16">Ordem:</label>
                        <input
                          type="number"
                          min="1"
                          max={sectionOrder.length}
                          value={sectionNumber}
                          onChange={(e) => {
                            const num = parseInt(e.target.value) || 1
                            handleSectionOrderChange(sectionId, num)
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={(settings as any)[section.key] ?? true}
                          onChange={(e) =>
                            setSettings({ ...settings, [section.key]: e.target.checked } as any)
                          }
                          className="w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="text-sm font-bold">{section.label}</span>
                      </label>
                    </div>
                    {(settings as any)[section.key] && section.elements.length > 0 && (
                      <div className="ml-8 mt-3 pl-4 border-l-2 border-gray-200">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Elementos (defina a ordem com números):</p>
                        <div className="space-y-2">
                          {elementOrder.map((elementKey) => {
                            const element = section.elements.find(e => e.key === elementKey)
                            if (!element) return null
                            
                            const elementNumber = elementOrderNumbers[sectionId]?.[elementKey] || elementOrder.indexOf(elementKey) + 1
                            
                            return (
                              <div
                                key={element.key}
                                className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-gray-600 w-12">Ordem:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={elementOrder.length}
                                    value={elementNumber}
                                    onChange={(e) => {
                                      const num = parseInt(e.target.value) || 1
                                      handleElementOrderChange(sectionId, elementKey, num)
                                    }}
                                    className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-2 focus:ring-black"
                                  />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={(settings as any)[element.key] ?? true}
                                    onChange={(e) =>
                                      setSettings({ ...settings, [element.key]: e.target.checked } as any)
                                    }
                                    className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                                  />
                                  <span className="text-sm">{element.label}</span>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </SectionWrapper>

          {/* Social Proof Section */}
            <SectionWrapper
            section="social_proof"
            icon="⭐" 
            title="Avaliações (Social Proof)" 
            expandedSection={expandedSection} 
            setExpandedSection={setExpandedSection} 
            toggleSectionVisibility={toggleSectionVisibility} 
            settings={settings}
            showColorEditor={showColorEditor}
            setShowColorEditor={setShowColorEditor}
            index={sectionOrder.indexOf('social_proof') >= 0 ? sectionOrder.indexOf('social_proof') : 11}
            moveSection={moveSectionInOrder}
            sectionOrder={sectionOrder}
            totalSections={12}
            sectionColors={sectionColors}
            updateSectionColor={updateSectionColor}
          >
            
            <div className="space-y-4">
              {/* Visibilidade de elementos individuais */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Visibilidade de elementos:</p>
                <p className="text-xs text-gray-600 mb-3">Para reordenar os elementos, use a aba "Visibilidade e Ordem das Seções"</p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionMap.social_proof.elements.map((element) => (
                    <label key={element.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[element.key] ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, [element.key]: e.target.checked } as any)
                        }
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span>{element.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Título"
                value={settings.social_proof_title}
                onChange={(e) =>
                  setSettings({ ...settings, social_proof_title: e.target.value })
                }
                placeholder="⭐ CLIENTES DE UBERLÂNDIA QUE JÁ ESTÃO USANDO"
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.social_proof_google_icon}
                    onChange={(e) =>
                      setSettings({ ...settings, social_proof_google_icon: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Mostrar ícone do Google</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.social_proof_allow_photos}
                    onChange={(e) =>
                      setSettings({ ...settings, social_proof_allow_photos: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Permitir fotos nas avaliações</span>
                </label>
              </div>

              <Input
                label="Texto de Contagem de Testimonials"
                value={settings.social_proof_testimonial_count}
                onChange={(e) =>
                  setSettings({ ...settings, social_proof_testimonial_count: e.target.value })
                }
                placeholder="💬 Mais de 1.000 smartwatches entregues em Uberlândia."
              />

              {/* Lista de Avaliações */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Avaliações dos Clientes
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newReview = {
                        id: Date.now().toString(),
                        customer_name: '',
                        comment: '',
                        rating: 5,
                        photo: '',
                        google_review_link: '',
                      }
                      setSettings({
                        ...settings,
                        social_proof_reviews: [...(settings.social_proof_reviews || []), newReview]
                      })
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar Avaliação
                  </Button>
                </div>

                <div className="space-y-4">
                  {(settings.social_proof_reviews || []).map((review, index) => (
                    <div key={review.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Avaliação {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newReviews = settings.social_proof_reviews?.filter((_, i) => i !== index) || []
                            setSettings({ ...settings, social_proof_reviews: newReviews })
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Nome do Cliente"
                          value={review.customer_name}
                          onChange={(e) => {
                            const newReviews = [...(settings.social_proof_reviews || [])]
                            newReviews[index].customer_name = e.target.value
                            setSettings({ ...settings, social_proof_reviews: newReviews })
                          }}
                          placeholder="Maria C., Planalto"
                        />

                        <div>
                          <label className="block text-sm font-medium mb-2">Avaliação (1-5)</label>
                          <select
                            value={review.rating}
                            onChange={(e) => {
                              const newReviews = [...(settings.social_proof_reviews || [])]
                              newReviews[index].rating = parseInt(e.target.value)
                              setSettings({ ...settings, social_proof_reviews: newReviews })
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          >
                            <option value={5}>5 ⭐⭐⭐⭐⭐</option>
                            <option value={4}>4 ⭐⭐⭐⭐</option>
                            <option value={3}>3 ⭐⭐⭐</option>
                            <option value={2}>2 ⭐⭐</option>
                            <option value={1}>1 ⭐</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Comentário</label>
                        <textarea
                          value={review.comment}
                          onChange={(e) => {
                            const newReviews = [...(settings.social_proof_reviews || [])]
                            newReviews[index].comment = e.target.value
                            setSettings({ ...settings, social_proof_reviews: newReviews })
                          }}
                          placeholder="Chegou em menos de 1 dia! Atendimento excelente."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Foto do Cliente (opcional)</label>
                          <ImageUploader
                            value={review.photo || ''}
                            onChange={(url) => {
                              const newReviews = [...(settings.social_proof_reviews || [])]
                              newReviews[index].photo = url
                              setSettings({ ...settings, social_proof_reviews: newReviews })
                            }}
                            placeholder="Clique para fazer upload da foto"
                          />
                        </div>

                        <Input
                          label="Link da Avaliação no Google (opcional)"
                          value={review.google_review_link || ''}
                          onChange={(e) => {
                            const newReviews = [...(settings.social_proof_reviews || [])]
                            newReviews[index].google_review_link = e.target.value
                            setSettings({ ...settings, social_proof_reviews: newReviews })
                          }}
                          placeholder="https://g.page/r/..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionWrapper>

          </div>

          {/* Sidebar Direito - WhatsApp e Ações */}
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
                  value={settings.whatsapp_float_number || ''}
                  onChange={(e) => setSettings({ ...settings, whatsapp_float_number: e.target.value })}
                  placeholder="5534999999999"
                />
                <p className="text-xs text-gray-500">
                  Formato: código do país + DDD + número (ex: 5534999999999)
                </p>
                
                <div className="pt-3 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.section_whatsapp_vip_visible ?? true}
                      onChange={(e) => setSettings({ ...settings, section_whatsapp_vip_visible: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium">Mostrar botão flutuante</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    {settings.section_whatsapp_vip_visible !== false ? '✅ Botão visível na landing page' : '❌ Botão oculto na landing page'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link
                  href={currentVersion && currentLayout ? `/lp/${currentLayout.slug}/${currentVersion.slug}` : '/lp'}
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

      {/* Modal de FAQ */}
      <Modal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        title={editingFaq ? 'Editar FAQ' : 'Nova FAQ'}
      >
        <div className="space-y-4">
          <Input
            label="Pergunta"
            value={faqFormData.question}
            onChange={(e) =>
              setFaqFormData({ ...faqFormData, question: e.target.value })
            }
            placeholder="Ex: Como funciona a garantia?"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resposta
            </label>
            <textarea
              value={faqFormData.answer}
              onChange={(e) =>
                setFaqFormData({ ...faqFormData, answer: e.target.value })
              }
              placeholder="Digite a resposta..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSaveFaq} className="flex-1">
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsFaqModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Wrapper com Suspense para useSearchParams
export default function EditLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <EditLandingPageContent />
    </Suspense>
  )
}
