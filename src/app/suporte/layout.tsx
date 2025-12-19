import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

// Layout específico para páginas de suporte - sem Header/Footer do e-commerce
export default function SupportLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#000',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

