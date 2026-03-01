'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { OnboardingTourProvider } from '@/contexts/OnboardingTourContext'
import { TourBannerVisibleProvider } from '@/contexts/TourBannerVisibleContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <OnboardingTourProvider>
        <TourBannerVisibleProvider>
          {children}
        </TourBannerVisibleProvider>
      </OnboardingTourProvider>
    </AuthProvider>
  )
}

