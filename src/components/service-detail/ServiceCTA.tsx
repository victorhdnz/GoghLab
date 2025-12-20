'use client'

import { ServiceDetailContent } from '@/types/service-detail'
import { SocialButton } from '@/components/ui/SocialButton'

interface ServiceCTAProps {
  content: ServiceDetailContent
}

export function ServiceCTA({ content }: ServiceCTAProps) {
  if (!content.cta_enabled) return null

  const whatsappNumber = content.cta_whatsapp_number?.replace(/\D/g, '') || ''

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        {content.cta_title && (
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {content.cta_title}
          </h2>
        )}
        {content.cta_description && (
          <p className="text-gray-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            {content.cta_description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {content.cta_whatsapp_enabled && whatsappNumber && (
            <SocialButton
              type="whatsapp"
              href={`https://wa.me/${whatsappNumber}`}
              text={content.cta_whatsapp_text || 'WhatsApp'}
            />
          )}
          {content.cta_email_enabled && content.cta_email_address && (
            <SocialButton
              type="email"
              href={`mailto:${content.cta_email_address}`}
              text={content.cta_email_text || 'E-mail'}
            />
          )}
          {content.cta_instagram_enabled && content.cta_instagram_url && (
            <SocialButton
              type="instagram"
              href={content.cta_instagram_url}
              text={content.cta_instagram_text || 'Instagram'}
            />
          )}
        </div>
      </div>
    </section>
  )
}

