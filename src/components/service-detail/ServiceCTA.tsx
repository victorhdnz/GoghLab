'use client'

import { ServiceDetailContent } from '@/types/service-detail'
import { SocialButton } from '@/components/ui/SocialButton'
import { FadeInSection } from '@/components/ui/FadeInSection'

interface ServiceCTAProps {
  content: ServiceDetailContent
  siteSettings?: any
}

export function ServiceCTA({ content, siteSettings }: ServiceCTAProps) {
  // Usar dados da homepage se disponíveis, senão usar dados do content
  const homepageContent = siteSettings?.homepage_content || {}
  
  // Verificar se deve mostrar (usa contact_enabled da homepage ou cta_enabled do content)
  const shouldShow = homepageContent.contact_enabled !== false && content.cta_enabled !== false
  
  if (!shouldShow) return null

  // Priorizar dados da homepage, com fallback para content
  const contactTitle = homepageContent.contact_title || content.cta_title || 'Fale Conosco'
  const contactDescription = homepageContent.contact_description || content.cta_description
  const whatsappNumber = (homepageContent.contact_whatsapp_number || siteSettings?.contact_whatsapp || content.cta_whatsapp_number || '').replace(/\D/g, '')
  const whatsappText = homepageContent.contact_whatsapp_text || content.cta_whatsapp_text || 'WhatsApp'
  const whatsappEnabled = homepageContent.contact_whatsapp_enabled !== false && content.cta_whatsapp_enabled !== false
  
  const emailAddress = homepageContent.contact_email_address || siteSettings?.contact_email || content.cta_email_address
  const emailText = homepageContent.contact_email_text || content.cta_email_text || 'E-mail'
  const emailEnabled = homepageContent.contact_email_enabled !== false && content.cta_email_enabled !== false
  
  const instagramUrl = homepageContent.contact_instagram_url || siteSettings?.instagram_url || content.cta_instagram_url
  const instagramText = homepageContent.contact_instagram_text || content.cta_instagram_text || 'Instagram'
  const instagramEnabled = homepageContent.contact_instagram_enabled !== false && content.cta_instagram_enabled !== false

  return (
    <FadeInSection>
      <section id="contact-section" className="py-16 md:py-24 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
            {contactTitle}
          </h2>
          {contactDescription && (
            <p className="text-gray-400 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
              {contactDescription}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {whatsappEnabled && whatsappNumber && (
              <SocialButton
                type="whatsapp"
                href={`https://wa.me/${whatsappNumber}`}
                text={whatsappText}
              />
            )}
            {emailEnabled && emailAddress && (
              <SocialButton
                type="email"
                href={`mailto:${emailAddress}`}
                text={emailText}
              />
            )}
            {instagramEnabled && instagramUrl && (
              <SocialButton
                type="instagram"
                href={instagramUrl || '#'}
                text={instagramText}
              />
            )}
          </div>
        </div>
      </section>
    </FadeInSection>
  )
}

