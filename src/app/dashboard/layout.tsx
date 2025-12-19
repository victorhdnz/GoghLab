import { ReactNode } from 'react'

// Forçar renderização dinâmica sem cache
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

