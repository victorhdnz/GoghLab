'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Service } from '@/types'
import { ArrowRight, Star } from 'lucide-react'

interface ServiceCardProps {
  service: Service
}

export const ServiceCard = ({ service }: ServiceCardProps) => {
  return (
    <Card hover className="group">
      <Link href={`/portfolio/${service.slug}`}>
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          {service.cover_image ? (
            <Image
              src={service.cover_image}
              alt={service.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-6xl">🚀</span>
            </div>
          )}

          {/* Featured Badge */}
          {service.is_featured && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star size={14} />
              Destaque
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                Saber Mais
                <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6">
        <Link href={`/portfolio/${service.slug}`}>
          <h3 className="font-semibold text-xl mb-2 line-clamp-2 hover:text-gray-600 transition-colors">
            {service.name}
          </h3>
        </Link>

        {service.short_description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {service.short_description}
          </p>
        )}

        {/* Category and Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {service.category && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {service.category}
            </span>
          )}
          {service.tags && service.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Price Range and Delivery Time */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {service.price_range && (
            <div className="text-sm">
              <span className="text-gray-500">Investimento:</span>
              <span className="font-semibold ml-1">{service.price_range}</span>
            </div>
          )}
          {service.delivery_time && (
            <div className="text-sm text-gray-500">
              {service.delivery_time}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link href={`/portfolio/${service.slug}`}>
          <button className="w-full mt-4 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2">
            Saber Mais
            <ArrowRight size={16} />
          </button>
        </Link>
      </div>
    </Card>
  )
}

