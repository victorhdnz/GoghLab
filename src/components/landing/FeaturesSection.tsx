'use client'

import { motion } from 'framer-motion'
import MagicBento from '@/components/ui/MagicBento/MagicBento'

interface FeaturesSectionProps {
  title?: string
  backgroundColor?: string
  elementVisibility?: {
    title?: boolean
  }
}

export const FeaturesSection = ({
  title = 'Por que escolher a MV Company?',
  backgroundColor = 'transparent',
  elementVisibility = {
    title: true,
  },
}: FeaturesSectionProps) => {
  return (
    <section className="py-20" style={{ backgroundColor }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {elementVisibility.title !== false && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">{title}</h2>
            <div className="w-24 h-1 bg-white mx-auto" />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <MagicBento
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={300}
            particleCount={12}
            glowColor="132, 0, 255"
          />
        </motion.div>
      </div>
    </section>
  )
}

