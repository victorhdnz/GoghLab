'use client'

import { createClient } from '@/lib/supabase/client'
import { ProductSupportPage } from '@/types'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronRight, Book, ArrowLeft, Play } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface StepItem {
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
}

export default function StepPage() {
  const params = useParams()
  const router = useRouter()
  const modeloSlug = params['modelo-slug'] as string
  const passoSlug = params['passo-slug'] as string
  
  const [supportPage, setSupportPage] = useState<(ProductSupportPage & { product: any }) | null>(null)
  const [stepItem, setStepItem] = useState<StepItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState<string>('5511999999999')
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const loadPage = async () => {
      try {
        // Buscar número do WhatsApp das configurações
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('contact_whatsapp')
          .eq('key', 'site_settings')
          .single()
        
        if (settingsData?.contact_whatsapp) {
          setWhatsappNumber(settingsData.contact_whatsapp)
        }

        // Buscar página de suporte
        const { data, error } = await supabase
          .from('product_support_pages')
          .select(`
            *,
            product:products(*)
          `)
          .eq('model_slug', modeloSlug)
          .eq('is_active', true)
          .single()

        if (error || !data) {
          setSupportPage(null)
          return
        }

        setSupportPage(data as any)
        const content = (data.content as any) || {}
        const sections = content.sections || []
        
        // Encontrar o passo correspondente
        let foundStep: StepItem | null = null
        for (const section of sections) {
          if (section.type === 'steps' && section.items) {
            for (const item of section.items) {
              const itemSlug = item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ''
              if (itemSlug === passoSlug || item.link?.includes(passoSlug)) {
                foundStep = item
                break
              }
            }
            if (foundStep) break
          }
        }

        if (!foundStep) {
          setStepItem(null)
        } else {
          setStepItem(foundStep)
        }
      } catch (error) {
        console.error('Erro ao buscar página de passo:', error)
        setSupportPage(null)
        setStepItem(null)
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [modeloSlug, passoSlug, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!supportPage || !stepItem) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header fixo estilo Apple */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book size={20} className="text-gray-600" />
            <span className="font-medium text-gray-900">{supportPage.title}</span>
          </div>
          <Link 
            href={`/suporte/${modeloSlug}`}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Hero Section - Imagem Principal e Título */}
          <section className="space-y-6">
            {/* Imagem do Passo - Sempre mostra, mesmo vazia */}
            <div className="w-full aspect-video bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
              {stepItem.image ? (
                <Image
                  src={stepItem.image}
                  alt={stepItem.title}
                  width={1200}
                  height={675}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <p className="text-lg">Sem imagem</p>
                  <p className="text-sm mt-2">Adicione uma imagem no editor</p>
                </div>
              )}
            </div>
            
            {/* Título */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {stepItem.title || 'Título do Passo'}
            </h1>
            
            {/* Descrição Resumida */}
            {stepItem.description && (
              <p className="text-xl text-gray-600">
                {stepItem.description}
              </p>
            )}
          </section>

          {/* Vídeo - Sempre mostra, mesmo vazio */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Vídeo Explicativo</h2>
            <div className={`relative rounded-2xl overflow-hidden bg-black ${
              stepItem.detailed_content?.video_orientation === 'vertical' 
                ? 'aspect-[9/16] max-w-sm mx-auto' 
                : 'aspect-video'
            }`}>
              {stepItem.detailed_content?.video ? (() => {
                const videoUrl = stepItem.detailed_content.video
                const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
                const match = videoUrl.match(youtubeRegex)
                const youtubeId = match ? match[1] : null

                if (youtubeId) {
                  // YouTube: mostrar iframe diretamente
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="Vídeo Explicativo"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                } else {
                  // Vídeo direto (upload): mostrar preview com botão de play
                  return isVideoPlaying ? (
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                      style={{ backgroundColor: '#000000' }}
                    >
                      Seu navegador não suporta vídeo.
                    </video>
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        style={{ backgroundColor: '#000000' }}
                        muted
                        playsInline
                      />
                      <button
                        onClick={() => setIsVideoPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                      >
                        <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
                          <Play size={32} className="text-black ml-1" fill="currentColor" />
                        </div>
                      </button>
                    </div>
                  )
                }
              })() : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-600">
                  <div className="text-center">
                    <Play size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-lg">Sem vídeo</p>
                    <p className="text-sm mt-2">Adicione um vídeo no editor</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Descrição Completa */}
          {(stepItem.detailed_content?.full_description || !stepItem.detailed_content) && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Descrição Completa</h2>
              {stepItem.detailed_content?.full_description ? (
                <div 
                  className="prose prose-lg max-w-none text-gray-600 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: stepItem.detailed_content.full_description.replace(/\n/g, '<br />') }}
                />
              ) : (
                <div className="prose prose-lg max-w-none text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <p>Descrição completa do passo aparecerá aqui. Adicione o conteúdo no editor.</p>
                </div>
              )}
            </section>
          )}

          {/* Imagens Adicionais */}
          {stepItem.detailed_content?.additional_images && stepItem.detailed_content.additional_images.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Imagens Adicionais</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {stepItem.detailed_content.additional_images.map((img, idx) => (
                  <div key={idx} className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                    <Image
                      src={img}
                      alt={`Imagem adicional ${idx + 1}`}
                      width={600}
                      height={400}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Imagens Adicionais</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">Sem imagem adicional {i}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sub-passos (Steps dentro do passo) */}
          {stepItem.detailed_content?.steps && stepItem.detailed_content.steps.length > 0 ? (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Passos Detalhados</h2>
              <div className="space-y-6">
                {stepItem.detailed_content.steps.map((subStep, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-6 bg-white">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{subStep.title}</h3>
                        <p className="text-gray-600 whitespace-pre-line">{subStep.description}</p>
                        {subStep.image && (
                          <div className="mt-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={subStep.image}
                              alt={subStep.title}
                              width={600}
                              height={400}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Passos Detalhados</h2>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-white opacity-50">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg opacity-50">
                        {i}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 opacity-50">Passo {i}</h3>
                        <p className="text-gray-600 opacity-50">Descrição do passo detalhado</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* WhatsApp no final */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quer saber mais?</h3>
          <div className="flex flex-wrap gap-3">
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Fale conosco <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

