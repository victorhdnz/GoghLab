import { createServerClient } from '@/lib/supabase/server'
import { ServiceCard } from '@/components/portfolio/ServiceCard'
import { Service } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { GitCompare } from 'lucide-react'
import { HomepageTracker } from '@/components/analytics/HomepageTracker'

async function getServices(): Promise<Service[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar serviços:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
    return []
  }
}

async function getSiteSettings() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('site_name, site_description, contact_email, contact_whatsapp, instagram_url, site_logo, homepage_content')
      .eq('key', 'general')
      .maybeSingle()

    if (error) {
      console.error('Error fetching site settings:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return null
  }
}

export default async function Home() {
  const services = await getServices()
  const siteSettings = await getSiteSettings()
  const homepageContent = siteSettings?.homepage_content || {}
  
  // Ordem padrão das seções
  const sectionOrder = homepageContent.section_order || ['hero', 'services', 'comparison', 'contact']
  const sectionVisibility = homepageContent.section_visibility || {
    hero: true,
    services: true,
    comparison: true,
    contact: true,
  }

  // Função para renderizar seção Hero
  const renderHeroSection = () => {
    if (homepageContent.hero_enabled === false || sectionVisibility.hero === false) return null
    
    return (
      <section className="relative bg-black text-white py-16 md:py-24 px-4 overflow-hidden">
        {homepageContent.hero_background_image && (
          <div className="absolute inset-0 z-0 opacity-20">
            <Image
              src={homepageContent.hero_background_image}
              alt="Background"
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          {homepageContent.hero_logo ? (
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src={homepageContent.hero_logo}
                  alt={siteSettings?.site_name || 'MV Company'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          ) : (
            <h1 className="text-4xl md:text-6xl font-semibold mb-6 tracking-tight">
              {homepageContent.hero_title || siteSettings?.site_name || 'MV Company'}
            </h1>
          )}
          {homepageContent.hero_subtitle && (
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-light mb-4">
              {homepageContent.hero_subtitle}
            </p>
          )}
          {homepageContent.hero_description && (
            <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-light">
              {homepageContent.hero_description}
            </p>
          )}
        </div>
      </section>
    )
  }

  // Função para renderizar seção de Serviços
  const renderServicesSection = () => {
    if (homepageContent.services_enabled === false || sectionVisibility.services === false) return null
    
    return (
      <section id="servicos" className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          {homepageContent.services_title && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
                {homepageContent.services_title}
              </h2>
            </div>
          )}

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-block bg-gray-900 rounded-full p-6 mb-4">
                <span className="text-5xl">🚀</span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Nenhum serviço disponível</h2>
              <p className="text-gray-400">
                Os serviços serão exibidos aqui quando forem adicionados.
              </p>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Função para renderizar seção de Comparação
  const renderComparisonSection = () => {
    if (homepageContent.comparison_cta_enabled === false || sectionVisibility.comparison === false) return null
    
    return (
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href={homepageContent.comparison_cta_link || "/comparar"}>
            <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
              <div className="relative h-full flex flex-col justify-center items-center p-8 text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GitCompare size={40} className="text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
                  {homepageContent.comparison_cta_title || 'Compare a MV Company'}
                </h2>
                {homepageContent.comparison_cta_description && (
                  <p className="text-white/80 text-lg md:text-xl font-light max-w-2xl">
                    {homepageContent.comparison_cta_description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </div>
      </section>
    )
  }

  // Função para renderizar seção de Contato
  const renderContactSection = () => {
    if (homepageContent.contact_enabled === false || sectionVisibility.contact === false) return null
    
    return (
      <section className="py-16 md:py-24 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
            {homepageContent.contact_title || 'Fale Conosco'}
          </h2>
          {homepageContent.contact_description && (
            <p className="text-gray-400 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
              {homepageContent.contact_description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {siteSettings?.contact_whatsapp && homepageContent.contact_whatsapp_enabled !== false && (
              <a
                href={`https://wa.me/${siteSettings.contact_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-w-[200px] bg-[#25D366] text-white px-8 py-4 rounded-full font-medium hover:bg-[#20BA5A] transition-all duration-200 text-center"
              >
                {homepageContent.contact_whatsapp_text || 'WhatsApp'}
              </a>
            )}
            {siteSettings?.contact_email && homepageContent.contact_email_enabled !== false && (
              <a
                href={`mailto:${siteSettings.contact_email}`}
                className="w-full sm:w-auto min-w-[200px] bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-medium hover:bg-white/20 transition-all duration-200 text-center"
              >
                {homepageContent.contact_email_text || 'E-mail'}
              </a>
            )}
            {siteSettings?.instagram_url && homepageContent.contact_instagram_enabled !== false && (
              <a
                href={siteSettings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-w-[200px] bg-[#E4405F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#D32E4A] transition-all duration-200 text-center"
              >
                {homepageContent.contact_instagram_text || 'Instagram'}
              </a>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Mapear seções para funções de renderização
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: renderHeroSection,
    services: renderServicesSection,
    comparison: renderComparisonSection,
    contact: renderContactSection,
  }

  return (
    <HomepageTracker>
      <div className="min-h-screen bg-black">
        {/* Renderizar seções na ordem configurada */}
        {sectionOrder.map((sectionId) => {
          const renderer = sectionRenderers[sectionId]
          return renderer ? renderer() : null
        })}
      </div>
    </HomepageTracker>
  )
}
        <section className="relative bg-black text-white py-16 md:py-24 px-4 overflow-hidden">
          {homepageContent.hero_background_image && (
            <div className="absolute inset-0 z-0 opacity-20">
              <Image
                src={homepageContent.hero_background_image}
                alt="Background"
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="container mx-auto max-w-6xl text-center relative z-10">
            {homepageContent.hero_logo ? (
              <div className="flex justify-center mb-8">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <Image
                    src={homepageContent.hero_logo}
                    alt={siteSettings?.site_name || 'MV Company'}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            ) : (
              <h1 className="text-4xl md:text-6xl font-semibold mb-6 tracking-tight">
                {siteSettings?.site_name || 'MV Company'}
              </h1>
            )}
            {homepageContent.hero_subtitle && (
              <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-light mb-4">
                {homepageContent.hero_subtitle}
              </p>
            )}
            {homepageContent.hero_description && (
              <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-light">
                {homepageContent.hero_description}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Services Grid - Dark Theme Cards */}
      {homepageContent.services_enabled !== false && (
        <section id="servicos" className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-7xl">
            {homepageContent.services_title && (
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
                  {homepageContent.services_title}
                </h2>
              </div>
            )}

            {services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-block bg-gray-900 rounded-full p-6 mb-4">
                  <span className="text-5xl">🚀</span>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Nenhum serviço disponível</h2>
                <p className="text-gray-400">
                  Os serviços serão exibidos aqui quando forem adicionados.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Comparison Card - Dark Theme */}
      {homepageContent.comparison_cta_enabled !== false && (
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <Link href={homepageContent.comparison_cta_link || "/comparar"}>
              <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-center items-center p-8 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <GitCompare size={40} className="text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
                    {homepageContent.comparison_cta_title || 'Compare a MV Company'}
                  </h2>
                  {homepageContent.comparison_cta_description && (
                    <p className="text-white/80 text-lg md:text-xl font-light max-w-2xl">
                      {homepageContent.comparison_cta_description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Contact Section - Dark Theme */}
      {homepageContent.contact_enabled !== false && (
        <section className="py-16 md:py-24 px-4 bg-gray-900/50">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
              {homepageContent.contact_title || 'Fale Conosco'}
            </h2>
            {homepageContent.contact_description && (
              <p className="text-gray-400 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
                {homepageContent.contact_description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {siteSettings?.contact_whatsapp && homepageContent.contact_whatsapp_enabled !== false && (
                <a
                  href={`https://wa.me/${siteSettings.contact_whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto min-w-[200px] bg-[#25D366] text-white px-8 py-4 rounded-full font-medium hover:bg-[#20BA5A] transition-all duration-200 text-center"
                >
                  {homepageContent.contact_whatsapp_text || 'WhatsApp'}
                </a>
              )}
              {siteSettings?.contact_email && homepageContent.contact_email_enabled !== false && (
                <a
                  href={`mailto:${siteSettings.contact_email}`}
                  className="w-full sm:w-auto min-w-[200px] bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-medium hover:bg-white/20 transition-all duration-200 text-center"
                >
                  {homepageContent.contact_email_text || 'E-mail'}
                </a>
              )}
              {siteSettings?.instagram_url && homepageContent.contact_instagram_enabled !== false && (
                <a
                  href={siteSettings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto min-w-[200px] bg-[#E4405F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#D32E4A] transition-all duration-200 text-center"
                >
                  {homepageContent.contact_instagram_text || 'Instagram'}
                </a>
              )}
            </div>
          </div>
        </section>
      )}
      </div>
    </HomepageTracker>
  )
}
