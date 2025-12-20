import { createServerClient } from '@/lib/supabase/server'
import { ServiceCard } from '@/components/portfolio/ServiceCard'
import { Service } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, GitCompare } from 'lucide-react'

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

async function getHomepageSettings() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'general')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar configurações:', error)
    }

    return data?.value?.homepage || null
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return null
  }
}

export default async function Home() {
  const services = await getServices()
  const homepageSettings = await getHomepageSettings()
  
  // Valores padrão
  const hero = {
    title: homepageSettings?.hero_title || 'MV Company',
    subtitle: homepageSettings?.hero_subtitle || 'Transformamos sua presença digital com serviços de alta qualidade',
    description: homepageSettings?.hero_description || 'Criação de sites, tráfego pago, criação de conteúdo e gestão de redes sociais',
    buttonText: homepageSettings?.hero_button_text || 'Ver Serviços',
    backgroundImage: homepageSettings?.hero_background_image || '',
  }
  
  const servicesSection = {
    title: homepageSettings?.services_title || 'Nossos Serviços',
    description: homepageSettings?.services_description || 'Soluções completas para impulsionar seu negócio no mundo digital',
  }
  
  const comparison = {
    title: homepageSettings?.comparison_title || 'Compare a MV Company com outras empresas',
    description: homepageSettings?.comparison_description || 'Veja por que somos a melhor escolha para transformar sua presença digital',
    buttonText: homepageSettings?.comparison_button_text || 'Comparar Agora',
  }
  
  const contact = {
    title: homepageSettings?.contact_title || 'Pronto para transformar seu negócio?',
    description: homepageSettings?.contact_description || 'Entre em contato e descubra como podemos ajudar você',
    whatsapp: homepageSettings?.contact_whatsapp || '5534999999999',
    instagram: homepageSettings?.contact_instagram || 'https://instagram.com/mvcompany',
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 px-4 overflow-hidden">
        {hero.backgroundImage && (
          <div className="absolute inset-0 z-0 opacity-20">
            <Image
              src={hero.backgroundImage}
              alt="Background"
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              {hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              {hero.subtitle}
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {hero.description}
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <a
                href="#servicos"
                className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                {hero.buttonText}
              </a>
              <Link
                href="/comparar"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors flex items-center gap-2"
              >
                <GitCompare size={20} />
                Comparar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="servicos" className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {servicesSection.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {servicesSection.description}
            </p>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhum serviço disponível no momento.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Os serviços serão exibidos aqui quando forem adicionados.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Comparison Card */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-8 md:p-12 text-white text-center">
            <div className="space-y-6">
              <div className="inline-block bg-white/10 rounded-full p-3">
                <GitCompare size={32} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                {comparison.title}
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                {comparison.description}
              </p>
              <Link
                href="/comparar"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                {comparison.buttonText}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {contact.title}
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            {contact.description}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
