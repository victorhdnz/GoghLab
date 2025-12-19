'use client'

import { ProductCatalog, Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Play, Star, ShoppingBag, Check } from 'lucide-react'
import { useState } from 'react'

interface CatalogLayoutProps {
  catalog: ProductCatalog
  products: Product[]
}

export function CatalogLayout({ catalog, products }: CatalogLayoutProps) {
  const content = catalog.content as any
  const colors = catalog.theme_colors as any || {}
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({})

  const getProductById = (id: string) => products.find(p => p.id === id)
  const featuredProducts = (content.featured_products || [])
    .map((id: string) => getProductById(id))
    .filter(Boolean) as Product[]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getVideoId = (url: string) => {
    if (!url) return null
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(youtubeRegex)
    return match ? match[1] : null
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background || '#ffffff' }}>
      {/* Hero Section - Sempre mostra, mesmo vazio */}
      {content.hero && (
        <section 
          className="relative py-20 md:py-32 px-4 overflow-hidden"
          style={{ backgroundColor: colors.primary || '#000000' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                {content.hero.badge ? (
                  <span 
                    className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
                    style={{ backgroundColor: colors.accent || '#D4AF37', color: '#000000' }}
                  >
                    {content.hero.badge}
                  </span>
                ) : (
                  <span 
                    className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 opacity-50"
                    style={{ backgroundColor: colors.accent || '#D4AF37', color: '#000000' }}
                  >
                    Badge
                  </span>
                )}
                
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  {content.hero.title || catalog.title || 'Título do Catálogo'}
                </h1>
                
                <p className="text-xl md:text-2xl mb-8 opacity-90">
                  {content.hero.subtitle || 'Subtítulo do catálogo aparecerá aqui'}
                </p>

                {content.hero.cta_text && content.hero.cta_link ? (
                  <Link
                    href={content.hero.cta_link}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: colors.accent || '#D4AF37',
                      color: '#000000'
                    }}
                  >
                    {content.hero.cta_text}
                    <ChevronRight size={20} />
                  </Link>
                ) : (
                  <div
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg opacity-50 cursor-not-allowed"
                    style={{ 
                      backgroundColor: colors.accent || '#D4AF37',
                      color: '#000000'
                    }}
                  >
                    Botão CTA
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="relative aspect-square max-w-lg mx-auto">
                  {content.hero.image ? (
                    <Image
                      src={content.hero.image}
                      alt={content.hero.title || 'Hero'}
                      fill
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-lg">
                      Sem imagem
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Video Section - Sempre mostra, mesmo vazio */}
      {content.video && (
        <section className="py-20 px-4" style={{ backgroundColor: colors.secondary || '#f9fafb' }}>
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-4"
              style={{ color: colors.text || '#000000' }}
            >
              {content.video.title || 'Título do Vídeo'}
            </h2>
            <p 
              className="text-lg text-center mb-12 max-w-2xl mx-auto"
              style={{ color: colors.text ? `${colors.text}99` : '#666666' }}
            >
              {content.video.description || 'Descrição do vídeo aparecerá aqui'}
            </p>
            
            <div className={`relative rounded-2xl overflow-hidden bg-black ${
              content.video?.orientation === 'vertical' 
                ? 'aspect-[9/16] max-w-sm mx-auto' 
                : 'aspect-video'
            }`}>
              {content.video?.url ? (() => {
                const videoId = getVideoId(content.video.url)
                const isYouTube = !!videoId
                const videoOrientation = content.video?.orientation || 'horizontal'

                if (isYouTube) {
                  // YouTube: mostrar iframe diretamente
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={content.video.title || 'Vídeo'}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                } else {
                  // Vídeo direto (upload): mostrar preview com botão de play
                  const videoKey = `catalog-video-${content.video.url}`
                  const isPlaying = playingVideos[videoKey]
                  
                  return isPlaying ? (
                    <video
                      src={content.video.url}
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
                        src={content.video.url}
                        className="w-full h-full object-cover"
                        style={{ backgroundColor: '#000000' }}
                        muted
                        playsInline
                      />
                      <button
                        onClick={() => setPlayingVideos(prev => ({ ...prev, [videoKey]: true }))}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                      >
                        <div 
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: colors.accent || '#D4AF37' }}
                        >
                          <Play size={32} className="text-black ml-1" fill="currentColor" />
                        </div>
                      </button>
                    </div>
                  )
                }
              })() : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400 text-lg">
                  Sem vídeo
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Sempre mostra, mesmo vazio */}
      {content.features && (
        <section className="py-20 px-4" style={{ backgroundColor: colors.background || '#ffffff' }}>
          <div className="max-w-7xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-4"
              style={{ color: colors.text || '#000000' }}
            >
              {content.features_title || 'Recursos Principais'}
            </h2>
            <p 
              className="text-lg text-center mb-16 max-w-2xl mx-auto"
              style={{ color: colors.text ? `${colors.text}99` : '#666666' }}
            >
              {content.features_subtitle || 'Descubra o que torna este produto especial'}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.features && content.features.length > 0 ? (
                content.features.map((feature: any, index: number) => (
                  <div
                    key={index}
                    className="p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all"
                    style={{ backgroundColor: colors.secondary || '#ffffff' }}
                  >
                    {feature.icon ? (
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                        style={{ backgroundColor: colors.accent || '#D4AF37' }}
                      >
                        <span className="text-2xl">{feature.icon}</span>
                      </div>
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-6 opacity-50"
                        style={{ backgroundColor: colors.accent || '#D4AF37' }}
                      >
                        <span className="text-2xl">✨</span>
                      </div>
                    )}
                    <h3 
                      className="text-xl font-bold mb-3"
                      style={{ color: colors.text || '#000000' }}
                    >
                      {feature.title || 'Título da Feature'}
                    </h3>
                    <p 
                      className="text-gray-600"
                      style={{ color: colors.text ? `${colors.text}99` : '#666666' }}
                    >
                      {feature.description || 'Descrição da feature aparecerá aqui'}
                    </p>
                  </div>
                ))
              ) : (
                // Placeholder quando não há features
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-8 rounded-2xl border-2 border-dashed hover:shadow-xl transition-all" style={{ borderColor: colors.text ? `${colors.text}33` : '#e5e7eb', backgroundColor: colors.secondary || '#ffffff' }}>
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-6 opacity-50"
                      style={{ backgroundColor: colors.accent || '#D4AF37' }}
                    >
                      <span className="text-2xl">✨</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 opacity-50" style={{ color: colors.text || '#000000' }}>Feature {i}</h3>
                    <p className="text-sm opacity-50" style={{ color: colors.text ? `${colors.text}99` : '#666666' }}>Descrição da feature</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Image Gallery Section - Sempre mostra, mesmo vazio */}
      {content.gallery && (
        <section className="py-20 px-4" style={{ backgroundColor: colors.secondary || '#f9fafb' }}>
          <div className="max-w-7xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-16"
              style={{ color: colors.text || '#000000' }}
            >
              {content.gallery_title || 'Galeria de Imagens'}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.gallery && content.gallery.length > 0 ? (
                content.gallery.map((image: string, index: number) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                    <Image
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ))
              ) : (
                // Placeholder quando não há imagens
                [1, 2, 3].map((i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed" style={{ borderColor: colors.text ? `${colors.text}33` : '#e5e7eb' }}>
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Product Showcase Section - Sempre mostra, mesmo vazio */}
      {content.product_showcase && (
        <section className="py-20 px-4" style={{ backgroundColor: colors.background || '#ffffff' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative aspect-square">
                {content.product_showcase.image ? (
                  <Image
                    src={content.product_showcase.image}
                    alt={content.product_showcase.title || 'Product'}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-lg">
                    Sem imagem
                  </div>
                )}
              </div>

              <div>
                <h2 
                  className="text-4xl md:text-5xl font-bold mb-6"
                  style={{ color: colors.text || '#000000' }}
                >
                  {content.product_showcase.title || 'Destaque do Produto'}
                </h2>
                <p 
                  className="text-lg mb-8"
                  style={{ color: colors.text ? `${colors.text}99` : '#666666' }}
                >
                  {content.product_showcase.description || 'Descrição do produto aparecerá aqui'}
                </p>

                {content.product_showcase.features && content.product_showcase.features.length > 0 ? (
                  <ul className="space-y-4 mb-8">
                    {content.product_showcase.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check 
                          size={24} 
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: colors.accent || '#D4AF37' }}
                        />
                        <span style={{ color: colors.text || '#000000' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-4 mb-8 opacity-50">
                    {[1, 2, 3].map((i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check 
                          size={24} 
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: colors.accent || '#D4AF37' }}
                        />
                        <span style={{ color: colors.text || '#000000' }}>Recurso {i}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {content.product_showcase.cta_text && content.product_showcase.cta_link ? (
                  <Link
                    href={content.product_showcase.cta_link}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: colors.accent || '#D4AF37',
                      color: '#000000'
                    }}
                  >
                    {content.product_showcase.cta_text}
                    <ChevronRight size={20} />
                  </Link>
                ) : (
                  <div
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold opacity-50 cursor-not-allowed"
                    style={{ 
                      backgroundColor: colors.accent || '#D4AF37',
                      color: '#000000'
                    }}
                  >
                    Botão CTA
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products - Sempre mostra, mesmo vazio */}
      {content.featured_products !== undefined && (
        <section className="py-20 px-4" style={{ backgroundColor: colors.secondary || '#f9fafb' }}>
          <div className="max-w-7xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-4"
              style={{ color: colors.text || '#000000' }}
            >
              Produtos em Destaque
            </h2>
            <p 
              className="text-lg text-center mb-12 max-w-2xl mx-auto"
              style={{ color: colors.text ? `${colors.text}99` : '#666666' }}
            >
              {content.featured_subtitle || 'Veja nossa coleção completa'}
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.length > 0 ? (
                featuredProducts.map(product => {
                  // Usa link customizado se disponível, senão usa ecommerce_url ou slug
                  const customLink = (content.featured_products_links as any)?.[product.id]
                  const productLink = customLink || product.ecommerce_url || `/produto/${product.slug}`
                  const isExternal = customLink ? customLink.startsWith('http') : (product.ecommerce_url ? product.ecommerce_url.startsWith('http') : false)
                  
                  return (
                  <Link
                    key={product.id}
                    href={productLink}
                    target={isExternal ? '_blank' : '_self'}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.images && product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShoppingBag size={48} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 
                        className="font-semibold text-xl mb-2 group-hover:opacity-80 transition-opacity"
                        style={{ color: colors.text || '#000000' }}
                      >
                        {product.name}
                      </h3>
                      
                      {product.short_description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {product.short_description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-2xl font-bold"
                          style={{ color: colors.primary || '#000000' }}
                        >
                          {formatPrice(product.price || 0)}
                        </span>
                        <span 
                          className="text-sm flex items-center gap-1 font-medium"
                          style={{ color: colors.accent || '#D4AF37' }}
                        >
                          Ver produto <ChevronRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                  )
                })
              ) : (
                // Placeholder quando não há produtos
                [1, 2, 3].map((i) => (
                  <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-dashed" style={{ borderColor: colors.text ? `${colors.text}33` : '#e5e7eb' }}>
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag size={48} className="text-gray-300 opacity-50" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-2 opacity-50" style={{ color: colors.text || '#000000' }}>
                        Produto {i}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 opacity-50">
                        Descrição do produto
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold opacity-50" style={{ color: colors.primary || '#000000' }}>
                          R$ 0,00
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final - Sempre mostra, mesmo vazio */}
      <section 
        className="py-20 px-4"
        style={{ backgroundColor: colors.primary || '#000000' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {content.cta_title || 'Pronto para começar?'}
          </h2>
          <p className="text-lg text-white/80 mb-8">
            {content.cta_description || 'Explore nossa coleção completa de produtos.'}
          </p>
          {content.cta_link && content.cta_text ? (
            <Link
              href={content.cta_link}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
              style={{ 
                backgroundColor: colors.accent || '#D4AF37',
                color: '#000000'
              }}
            >
              {content.cta_text}
              <ChevronRight size={20} />
            </Link>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold opacity-50 cursor-not-allowed"
              style={{ 
                backgroundColor: colors.accent || '#D4AF37',
                color: '#000000'
              }}
            >
              Botão CTA
              <ChevronRight size={20} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

