import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

// Layout específico para catálogos - sem Header/Footer do e-commerce
export default function CatalogLayout({
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

