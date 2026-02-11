'use client'

import { useEffect } from 'react'
import { NotFound } from '@/components/ui/ghost-404-page'
import { useNotFound } from '@/contexts/NotFoundContext'

export default function NotFoundPage() {
  const { setIsNotFound } = useNotFound()

  useEffect(() => {
    setIsNotFound(true)
    return () => {
      setIsNotFound(false)
    }
  }, [setIsNotFound])

  return <NotFound />
}
