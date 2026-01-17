'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MemberDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página de agentes
    router.replace('/membro/agentes')
  }, [router])

  return null
}

