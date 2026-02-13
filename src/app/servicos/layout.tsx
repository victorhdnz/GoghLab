'use client'

import { RequireAuth } from '@/components/auth/RequireAuth'

export default function ServicosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RequireAuth>{children}</RequireAuth>
}
