'use client'

import { ReactNode } from 'react'
import { DashboardPasswordProtection } from '@/components/dashboard/DashboardPasswordProtection'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardPasswordProtection>
      {children}
    </DashboardPasswordProtection>
  )
}

