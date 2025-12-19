import { createServerClient } from '@/lib/supabase/server'
import { Service, ServiceTestimonial } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Star, Clock, DollarSign, MessageCircle } from 'lucide-react'
import { ServiceCard } from '@/components/portfolio/ServiceCard'

async function getService(slug: string): Promise<Service | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar serviço:', error)
    return null
  }
}

async function getTestimonials(serviceId: string): Promise<ServiceTestimonial[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('service_testimonials')
      .select('*')
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Erro ao buscar depoimentos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar depoimentos:', error)
    return []
  }
}

async function getRelatedServices(currentServiceId: string, category?: string): Promise<Service[]> {
  try {
    const supabase = createServerClient()
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .neq('id', currentServiceId)
      .limit(3)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar serviços relacionados:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar serviços relacionados:', error)
    return []
  }
}

export default async function ServicePage({ params }: { params: { slug: string } }) {
  const service = await getService(params.slug)

  if (!service) {
    notFound()
  }

  const [testimonials, relatedServices] = await Promise.all([
    getTestimonials(service.id),
    getRelatedServices(service.id, service.category),
  ])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {service.category && (
                <span className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {service.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold">
                {service.name}
              </h1>
              {service.short_description && (
                <p className="text-xl text-gray-300">
                  {service.short_description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 pt-4">
                {service.price_range && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                    <DollarSign size={20} />
                    <span>{service.price_range}</span>
                  </div>
                )}
                {service.delivery_time && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                    <Clock size={20} />
                    <span>{service.delivery_time}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-4">
                <a
                  href="https://wa.me/5534999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  Falar no WhatsApp
                </a>
                <a
                  href="#contato"
                  className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Solicitar Orçamento
                </a>
              </div>
            </div>
            {service.cover_image && (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={service.cover_image}
                  alt={service.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Description Section */}
      {service.full_description && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-line text-gray-700">
                {service.full_description}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {service.images && service.images.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Galeria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.images.map((image, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt={`${service.name} - Imagem ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Section */}
      {service.video_url && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Vídeo Explicativo</h2>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={service.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">O que nossos clientes dizem</h2>
              <p className="text-gray-600">Depoimentos reais de quem já contratou nossos serviços</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-4">
                    {testimonial.rating && (
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < testimonial.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.testimonial_text}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.client_photo && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.client_photo}
                          alt={testimonial.client_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{testimonial.client_name}</p>
                      {testimonial.client_company && (
                        <p className="text-sm text-gray-500">{testimonial.client_company}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Serviços Relacionados</h2>
              <p className="text-gray-600">Confira outros serviços que podem interessar você</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedServices.map((relatedService) => (
                <ServiceCard key={relatedService.id} service={relatedService} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section id="contato" className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Entre em contato e solicite um orçamento personalizado
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://wa.me/5534999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>
            <a
              href="https://instagram.com/mvcompany"
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

