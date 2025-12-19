'use client'

import { useEffect, useState, Suspense, useCallback, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { ProductSupportPage } from '@/types'
import { Save, ArrowLeft, Home, Eye, BookOpen, ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { ArrayImageManager } from '@/components/ui/ArrayImageManager'
import { VideoUploader } from '@/components/ui/VideoUploader'

interface SupportSection {
  id: string
  type: 'hero' | 'feature-card' | 'steps' | 'text' | 'image' | 'video' | 'list' | 'accordion'
  title?: string
  subtitle?: string
  content?: string
  image?: string
  video?: string
  link?: string
  linkText?: string
  items?: Array<{
    title: string
    description: string
    image?: string
    link?: string
    detailed_content?: {
      full_description?: string
      additional_images?: string[]
      video?: string
      video_orientation?: 'horizontal' | 'vertical'
      steps?: Array<{ title: string; description: string; image?: string }>
    }
  }>
}

function EditSupportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()

  const versionId = searchParams.get('version')
  const [supportPage, setSupportPage] = useState<ProductSupportPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null)

  const [sections, setSections] = useState<SupportSection[]>([])
  const [contactLink, setContactLink] = useState<string>('')

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !isEditor) {
      router.push('/dashboard')
      return
    }

    if (!versionId) {
      toast.error('Página não especificada')
      router.push('/dashboard/suporte')
      return
    }

    loadSupportPage()
  }, [versionId, isAuthenticated, isEditor, authLoading, router])

  const loadSupportPage = async () => {
    try {
      const { data, error } = await supabase
        .from('product_support_pages')
        .select('*')
        .eq('id', versionId)
        .single()

      if (error) throw error
      if (!data) {
        toast.error('Página não encontrada')
        router.push('/dashboard/suporte')
        return
      }

      setSupportPage(data as ProductSupportPage)
      const content = (data.content as any) || {}
      let sectionsToLoad = content.sections || []
      setContactLink(content.contact_link || content.contact_whatsapp || '')
      
      // Sempre garantir estrutura mínima pré-definida
      if (sectionsToLoad.length === 0) {
        sectionsToLoad = [
          {
            id: 'hero-1',
            type: 'hero',
            title: data.title || 'Bem-vindo',
            subtitle: `Tudo o que você precisa saber sobre o ${(data as any).product?.name || 'produto'}.`,
            content: '',
            image: '',
          },
          {
            id: 'steps-1',
            type: 'steps',
            title: 'Como Configurar',
            subtitle: 'Siga estes passos',
            items: [
              {
                title: 'Passo 1',
                description: 'Descrição completa do passo 1 aparecerá aqui na página individual.',
                image: '',
                link: '',
              },
            ],
          },
        ]
        // Salvar automaticamente a estrutura pré-definida
        await supabase
          .from('product_support_pages')
          .update({
            content: { sections: sectionsToLoad },
          })
          .eq('id', versionId)
      } else {
        // Garantir que seções de steps sempre tenham pelo menos um item
        sectionsToLoad = sectionsToLoad.map((section: SupportSection) => {
          if (section.type === 'steps' && (!section.items || section.items.length === 0)) {
            return {
              ...section,
              items: [
                {
                  title: 'Passo 1',
                  description: 'Descrição completa do passo 1 aparecerá aqui na página individual.',
                  image: '',
                },
              ],
            }
          }
          // Remover link dos items (será gerado automaticamente)
          if (section.type === 'steps' && section.items) {
            section.items = section.items.map((item: any) => {
              const { link, ...itemWithoutLink } = item
              return itemWithoutLink
            })
          }
          return section
        })
      }
      
      setSections(sectionsToLoad)
    } catch (error: any) {
      console.error('Erro ao carregar página:', error)
      toast.error('Erro ao carregar página')
      router.push('/dashboard/suporte')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const content = {
        sections: sections,
        contact_link: contactLink,
      }

      const { error } = await supabase
        .from('product_support_pages')
        .update({
          content: content,
        })
        .eq('id', versionId)

      if (error) throw error
      toast.success('Página salva com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar página:', error)
      toast.error('Erro ao salvar página')
    } finally {
      setSaving(false)
    }
  }

  const addSection = (type: SupportSection['type']) => {
    const newSection: SupportSection = {
      id: Date.now().toString(),
      type,
      title: '',
      subtitle: '',
      content: '',
      image: '',
      video: '',
      link: '',
      linkText: '',
      items: [],
    }
    setSections([...sections, newSection])
    setEditingSectionIndex(sections.length)
  }

  const updateSection = useCallback((index: number, updates: Partial<SupportSection>) => {
    // Prevenir scroll automático durante atualização
    const activeElement = document.activeElement as HTMLElement
    const scrollPosition = window.scrollY
    
    setSections(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
    
    // Restaurar scroll e foco após atualização
    requestAnimationFrame(() => {
      if (activeElement && activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
        activeElement.focus()
        // Manter a posição de scroll
        window.scrollTo({ top: scrollPosition, behavior: 'instant' })
      }
    })
  }, [])

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
    if (editingSectionIndex === index) {
      setEditingSectionIndex(null)
    }
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return
    
    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setSections(updated)
    toast.success('Seção movida!')
  }

  const addItemToSection = (sectionIndex: number) => {
    const updated = [...sections]
    if (!updated[sectionIndex].items) {
      updated[sectionIndex].items = []
    }
    updated[sectionIndex].items!.push({ title: '', description: '' })
    setSections(updated)
  }

  const updateItemInSection = useCallback((sectionIndex: number, itemIndex: number, updates: any) => {
    // Prevenir scroll automático durante atualização
    const activeElement = document.activeElement as HTMLElement
    const scrollPosition = window.scrollY
    
    setSections(prev => {
      const updated = [...prev]
      if (!updated[sectionIndex].items) return prev
      
      const items = [...updated[sectionIndex].items!]
      items[itemIndex] = { ...items[itemIndex], ...updates }
      updated[sectionIndex].items = items
      return updated
    })
    
    // Restaurar scroll e foco após atualização
    requestAnimationFrame(() => {
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.focus()
        // Manter a posição de scroll
        window.scrollTo({ top: scrollPosition, behavior: 'instant' })
      }
    })
  }, [])

  const removeItemFromSection = (sectionIndex: number, itemIndex: number) => {
    const updated = [...sections]
    if (!updated[sectionIndex].items) return
    
    updated[sectionIndex].items = updated[sectionIndex].items!.filter((_, i) => i !== itemIndex)
    setSections(updated)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!supportPage) {
    return null
  }

  // Mapeamento de tipos de seção com ícones emoji
  const sectionTypeIcons: Record<string, string> = {
    steps: '📋',
  }

  const SectionEditor = memo(({ section, index, isExpanded, onToggleExpand }: { section: SupportSection; index: number; isExpanded: boolean; onToggleExpand: (index: number | null) => void }) => {
    const emojiIcon = sectionTypeIcons[section.type] || '📄'
    const sectionLabel = section.type === 'steps' ? 'Tópico' : section.type
    
    const handleToggleExpand = useCallback(() => {
      onToggleExpand(isExpanded ? null : index)
    }, [isExpanded, index, onToggleExpand])
    
    return (
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden mb-4"
        key={section.id || `section-${index}`}
      >
        {/* Header da Seção - Estilo Apple */}
        <div
          className="p-4 flex items-center justify-between bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handleToggleExpand}
        >
          <div className="flex items-center gap-3 flex-1">
            <GripVertical size={18} className="text-gray-400" />
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
              {index + 1}
            </span>
            <span className="text-xl">{emojiIcon}</span>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-sm">{sectionLabel}</span>
              {section.title && (
                <span className="text-xs text-gray-500">- {section.title}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); moveSection(index, 'up') }}
              disabled={index === 0}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30"
              title="Mover para cima"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveSection(index, 'down') }}
              disabled={index === sections.length - 1}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30"
              title="Mover para baixo"
            >
              <ChevronDown size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeSection(index) }}
              className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
              title="Remover seção"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div
            className="p-6 border-t space-y-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
          >
            {/* Tipo de seção */}
            <div>
              <label htmlFor={`section-type-${index}`} className="block text-sm font-medium mb-2">Tipo de Seção</label>
              <select
                id={`section-type-${index}`}
                name={`section-type-${index}`}
                value={section.type}
                onChange={(e) => updateSection(index, { type: e.target.value as SupportSection['type'] })}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full border rounded-lg px-4 py-2.5"
              >
                <option value="steps">Steps (Passos)</option>
              </select>
            </div>

            {/* Campos comuns */}
            <Input
              label="Título"
              id={`section-title-${index}`}
              name={`section-title-${index}`}
              value={section.title || ''}
              onChange={(e) => {
                const newValue = e.target.value
                updateSection(index, { title: newValue })
              }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />

            {section.type === 'steps' && (
              <Input
                label="Subtítulo (opcional)"
                id={`section-subtitle-${index}`}
                name={`section-subtitle-${index}`}
                value={section.subtitle || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  updateSection(index, { subtitle: newValue })
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}

            {/* Campos específicos por tipo */}
            {(section.type === 'text' || section.type === 'feature-card') && (
              <div>
                <label htmlFor={`section-content-${index}`} className="block text-sm font-medium mb-2">Conteúdo</label>
                <textarea
                  id={`section-content-${index}`}
                  name={`section-content-${index}`}
                  value={section.content || ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                    updateSection(index, { content: newValue })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full border rounded-lg px-4 py-2.5"
                  rows={4}
                  placeholder="Digite o conteúdo..."
                />
              </div>
            )}

            {(section.type === 'hero' || section.type === 'image' || section.type === 'feature-card') && (
              <div>
                <label id={`section-image-label-${index}`} className="block text-sm font-medium mb-2">Imagem</label>
                <ImageUploader
                  aria-labelledby={`section-image-label-${index}`}
                  value={section.image || ''}
                  onChange={(url) => updateSection(index, { image: url })}
                  placeholder="Clique para fazer upload da imagem"
                  recommendedDimensions="1920 x 1080px"
                  cropType="banner"
                />
              </div>
            )}

            {section.type === 'video' && (
              <Input
                label="URL do Vídeo (YouTube, Vimeo)"
                id={`section-video-${index}`}
                name={`section-video-${index}`}
                value={section.video || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  updateSection(index, { video: newValue })
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="https://..."
              />
            )}

            {section.type === 'feature-card' && (
              <>
                <Input
                  label="URL do Link"
                  id={`section-link-${index}`}
                  name={`section-link-${index}`}
                  value={section.link || ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                    updateSection(index, { link: newValue })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="https://..."
                />
                <Input
                  label="Texto do Link"
                  id={`section-link-text-${index}`}
                  name={`section-link-text-${index}`}
                  value={section.linkText || ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                    updateSection(index, { linkText: newValue })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Saiba mais"
                />
              </>
            )}

            {/* Itens para list, accordion, steps */}
            {(section.type === 'list' || section.type === 'accordion' || section.type === 'steps') && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label id={`section-items-label-${index}`} className="block text-sm font-medium">Itens ({section.items?.length || 0})</label>
                  <button
                    onClick={() => addItemToSection(index)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Adicionar Item
                  </button>
                </div>
                <div className="space-y-3">
                  {(section.items || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500">Item {itemIndex + 1}</span>
                        <button
                          onClick={() => removeItemFromSection(index, itemIndex)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          label="Título"
                          id={`item-title-${index}-${itemIndex}`}
                          name={`item-title-${index}-${itemIndex}`}
                          value={item.title}
                          onChange={(e) => {
                            const newValue = e.target.value
                            updateItemInSection(index, itemIndex, { title: newValue })
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        <div>
                          <label className="block text-sm font-medium mb-1">Descrição</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              const newValue = e.target.value
                              updateItemInSection(index, itemIndex, { description: newValue })
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            rows={2}
                          />
                        </div>
                        {section.type === 'steps' && (
                          <>
                            <div>
                              <label id={`item-image-label-${index}-${itemIndex}`} className="block text-sm font-medium mb-2">Imagem (opcional)</label>
                              <ImageUploader
                                aria-labelledby={`item-image-label-${index}-${itemIndex}`}
                                value={item.image || ''}
                                onChange={(url) => updateItemInSection(index, itemIndex, { image: url })}
                                placeholder="Clique para fazer upload da imagem"
                                recommendedDimensions="800 x 600px"
                                cropType="square"
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                O link para a página completa será gerado automaticamente baseado no título do passo.
                              </p>
                            </div>
                            
                            {/* Editor de Conteúdo Detalhado */}
                            <div className="border-t pt-4 mt-4 space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900">Conteúdo Detalhado da Página</h4>
                              
                              {/* Descrição Completa */}
                              <div>
                                <label htmlFor={`item-full-description-${index}-${itemIndex}`} className="block text-sm font-medium mb-2">Descrição Completa</label>
                                <textarea
                                  id={`item-full-description-${index}-${itemIndex}`}
                                  name={`item-full-description-${index}-${itemIndex}`}
                                  value={item.detailed_content?.full_description || ''}
                                  onChange={(e) => {
                                    const newValue = e.target.value
                                    updateItemInSection(index, itemIndex, {
                                      detailed_content: {
                                        ...item.detailed_content,
                                        full_description: newValue
                                      }
                                    })
                                  }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                  rows={6}
                                  placeholder="Descrição completa e detalhada do passo..."
                                />
                              </div>

                              {/* Vídeo */}
                              <div>
                                <label id={`item-video-label-${index}-${itemIndex}`} className="block text-sm font-medium mb-2">Vídeo Explicativo (YouTube ou Upload)</label>
                                <div className="space-y-2" aria-labelledby={`item-video-label-${index}-${itemIndex}`}>
                                  <Input
                                    type="url"
                                    id={`item-video-url-${index}-${itemIndex}`}
                                    name={`item-video-url-${index}-${itemIndex}`}
                                    value={item.detailed_content?.video || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value
                                      updateItemInSection(index, itemIndex, {
                                        detailed_content: {
                                          ...item.detailed_content,
                                          video: newValue
                                        }
                                      })
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    placeholder="https://www.youtube.com/watch?v=... ou faça upload abaixo"
                                  />
                                  <VideoUploader
                                    aria-labelledby={`item-video-label-${index}-${itemIndex}`}
                                    value={item.detailed_content?.video || ''}
                                    orientation={item.detailed_content?.video_orientation || 'horizontal'}
                                    onOrientationChange={(orientation) => {
                                      updateItemInSection(index, itemIndex, {
                                        detailed_content: {
                                          ...item.detailed_content,
                                          video_orientation: orientation,
                                          video: item.detailed_content?.video || ''
                                        }
                                      })
                                    }}
                                    onChange={(url) => {
                                      updateItemInSection(index, itemIndex, {
                                        detailed_content: {
                                          ...item.detailed_content,
                                          video: url,
                                          video_orientation: item.detailed_content?.video_orientation || 'horizontal'
                                        }
                                      })
                                    }}
                                    placeholder="Ou faça upload de um vídeo"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Adicione um vídeo explicativo para este passo. Pode ser um link do YouTube ou fazer upload de um vídeo.
                                </p>
                              </div>

                              {/* Imagens Adicionais */}
                              <div>
                                <label id={`item-additional-images-label-${index}-${itemIndex}`} className="block text-sm font-medium mb-2">Imagens Adicionais</label>
                                <ArrayImageManager
                                  aria-labelledby={`item-additional-images-label-${index}-${itemIndex}`}
                                  value={item.detailed_content?.additional_images || []}
                                  onChange={(images) => {
                                    updateItemInSection(index, itemIndex, {
                                      detailed_content: {
                                        ...item.detailed_content,
                                        additional_images: images
                                      }
                                    })
                                  }}
                                  maxImages={6}
                                  label=""
                                  placeholder="Clique para fazer upload de imagens adicionais"
                                  cropType="square"
                                  aspectRatio={16/9}
                                  targetSize={{ width: 1200, height: 675 }}
                                  recommendedDimensions="1200 x 675px"
                                />
                              </div>

                              {/* Sub-passos */}
                              <div>
                                <label id={`item-steps-label-${index}-${itemIndex}`} className="block text-sm font-medium mb-2">Sub-passos Detalhados</label>
                                <div className="space-y-3">
                                  {(item.detailed_content?.steps || []).map((subStep: any, subIdx: number) => (
                                    <div key={subIdx} className="border rounded-lg p-3 bg-gray-50">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-medium text-gray-500">Sub-passo {subIdx + 1}</span>
                                        <button
                                          onClick={() => {
                                            const currentSteps = item.detailed_content?.steps || []
                                            updateItemInSection(index, itemIndex, {
                                              detailed_content: {
                                                ...item.detailed_content,
                                                steps: currentSteps.filter((_: any, i: number) => i !== subIdx)
                                              }
                                            })
                                          }}
                                          className="text-red-600 hover:text-red-800 p-1"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <Input
                                        label="Título"
                                        id={`substep-title-${index}-${itemIndex}-${subIdx}`}
                                        name={`substep-title-${index}-${itemIndex}-${subIdx}`}
                                        value={subStep.title || ''}
                                        onChange={(e) => {
                                          const currentSteps = item.detailed_content?.steps || []
                                          const updatedSteps = [...currentSteps]
                                          updatedSteps[subIdx] = { ...updatedSteps[subIdx], title: e.target.value }
                                          updateItemInSection(index, itemIndex, {
                                            detailed_content: {
                                              ...item.detailed_content,
                                              steps: updatedSteps
                                            }
                                          })
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      />
                                      <div className="mt-2">
                                        <label htmlFor={`substep-description-${index}-${itemIndex}-${subIdx}`} className="block text-sm font-medium mb-1">Descrição</label>
                                        <textarea
                                          id={`substep-description-${index}-${itemIndex}-${subIdx}`}
                                          name={`substep-description-${index}-${itemIndex}-${subIdx}`}
                                          value={subStep.description || ''}
                                          onChange={(e) => {
                                            const currentSteps = item.detailed_content?.steps || []
                                            const updatedSteps = [...currentSteps]
                                            updatedSteps[subIdx] = { ...updatedSteps[subIdx], description: e.target.value }
                                            updateItemInSection(index, itemIndex, {
                                              detailed_content: {
                                                ...item.detailed_content,
                                                steps: updatedSteps
                                              }
                                            })
                                          }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                          rows={2}
                                        />
                                      </div>
                                      <div className="mt-2">
                                        <label id={`substep-image-label-${index}-${itemIndex}-${subIdx}`} className="block text-sm font-medium mb-2">Imagem (opcional)</label>
                                        <ImageUploader
                                          aria-labelledby={`substep-image-label-${index}-${itemIndex}-${subIdx}`}
                                          value={subStep.image || ''}
                                          onChange={(url) => {
                                            const currentSteps = item.detailed_content?.steps || []
                                            const updatedSteps = [...currentSteps]
                                            updatedSteps[subIdx] = { ...updatedSteps[subIdx], image: url }
                                            updateItemInSection(index, itemIndex, {
                                              detailed_content: {
                                                ...item.detailed_content,
                                                steps: updatedSteps
                                              }
                                            })
                                          }}
                                          placeholder="Clique para fazer upload da imagem"
                                          recommendedDimensions="800 x 600px"
                                          cropType="square"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const currentSteps = item.detailed_content?.steps || []
                                      updateItemInSection(index, itemIndex, {
                                        detailed_content: {
                                          ...item.detailed_content,
                                          steps: [...currentSteps, { title: '', description: '', image: '' }]
                                        }
                                      })
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <Plus size={14} />
                                    Adicionar Sub-passo
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }, (prevProps, nextProps) => {
    // Comparação customizada: só re-renderiza se realmente necessário
    // Inclui isExpanded para evitar re-renders quando outras seções são expandidas
    if (prevProps.isExpanded !== nextProps.isExpanded) return false
    if (prevProps.index !== nextProps.index) return false
    if (prevProps.section.id !== nextProps.section.id) return false
    if (prevProps.section.type !== nextProps.section.type) return false
    // Se a seção está expandida, comparar todo o conteúdo
    if (prevProps.isExpanded) {
      return JSON.stringify(prevProps.section) === JSON.stringify(nextProps.section)
    }
    // Se não está expandida, só comparar campos básicos
    return (
      prevProps.section.title === nextProps.section.title &&
      prevProps.section.subtitle === nextProps.section.subtitle
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/suporte"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Editar: {supportPage.title}</h1>
                <p className="text-sm text-gray-500">Manual Apple Guide /suporte/{supportPage.model_slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Home size={18} />
                Dashboard
              </Link>
              <Link
                href={`/suporte/${supportPage.model_slug}`}
                target="_blank"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye size={18} />
                Ver Prévia
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Seções do Manual</h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => addSection('steps')}
                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    + Adicionar Tópico
                  </button>
                </div>
              </div>
              
              {/* Dica */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Use as setas ↑↓ para reordenar as seções. Clique em cada seção para expandir e editar.
                </p>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Adicione seções para criar o conteúdo do manual</p>
                </div>
              ) : (
                <div>
                  {sections.map((section, index) => (
                    <SectionEditor 
                      key={section.id || index} 
                      section={section} 
                      index={index}
                      isExpanded={editingSectionIndex === index}
                      onToggleExpand={setEditingSectionIndex}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Dicas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BookOpen size={20} />
                Dicas
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <strong className="text-gray-900">Tópicos:</strong> Crie tópicos com foto, título, subtítulo e link automático para página detalhada
                </div>
                <div className="pt-3 border-t">
                  <strong className="text-gray-900">💡 Dica:</strong> Use as setas ↑↓ para reordenar as seções
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditSupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    }>
      <EditSupportContent />
    </Suspense>
  )
}

