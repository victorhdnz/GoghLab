'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { OnboardingTourProvider } from '@/contexts/OnboardingTourContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <OnboardingTourProvider>
        {children}
      </OnboardingTourProvider>
    </AuthProvider>
  )
}

