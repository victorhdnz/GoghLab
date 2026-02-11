'use client'

import { ReactNode } from 'react'
import { DashboardPasswordProtection } from '@/components/dashboard/DashboardPasswordProtection'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardPasswordProtection>
      <div className="max-w-5xl mx-auto w-full">
        {children}
      </div>
    </DashboardPasswordProtection>
  )
}

