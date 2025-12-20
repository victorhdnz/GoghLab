'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Service } from '@/types'
import { trackClick } from '@/lib/utils/analytics'
import { ArrowRight } from 'lucide-react'

interface ServiceCardProps {
  service: Service
}

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const handleClick = () => {
    trackClick({
      pageType: 'homepage',
      pageSlug: '/',
      element: 'service-card',
      text: service.name,
      url: `/portfolio/${service.slug}`,
    })
  }

  return (
    <Link 
      href={`/portfolio/${service.slug}`} 
      className="block group"
      onClick={handleClick}
    >
      <div className="relative h-[300px] md:h-[350px] rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-700 hover:shadow-2xl transition-all duration-300 cursor-pointer">
        {/* Gradient Background - Similar to Compare section */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        
        {/* Background Image - Optional, subtle */}
        {service.cover_image && (
          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
            <Image
              src={service.cover_image}
              alt={service.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
          {/* Top Section - Icon/Logo */}
          <div className="flex items-start justify-between">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300">
              {service.cover_image ? (
                <Image
                  src={service.cover_image}
                  alt={service.name}
                  width={64}
                  height={64}
                  className="object-contain p-2 rounded-lg"
                />
              ) : (
                <span className="text-3xl md:text-4xl">🚀</span>
              )}
            </div>
            {service.is_featured && (
              <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                <span className="text-white text-xs font-semibold">Destaque</span>
              </div>
            )}
          </div>

          {/* Bottom Section - Text and CTA */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">
                {service.name}
              </h3>
              {service.short_description && (
                <p className="text-white/80 text-sm md:text-base font-light line-clamp-2">
                  {service.short_description}
                </p>
              )}
            </div>
            
            {/* CTA Button - Appears on hover */}
            <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">Ver detalhes</span>
              <ArrowRight 
                size={18} 
                className="group-hover:translate-x-1 transition-transform duration-300" 
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
