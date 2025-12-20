'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CompanyComparison } from '@/types'

interface CompanyComparisonStore {
  companies: CompanyComparison[]
  addCompany: (company: CompanyComparison) => void
  removeCompany: (companyId: string) => void
  clearComparison: () => void
  canAddMore: () => boolean
}

export const useCompanyComparison = create<CompanyComparisonStore>()(
  persist(
    (set, get) => ({
      companies: [],
      
      addCompany: (company) => {
        const { companies } = get()
        // Verificar se já está na lista
        if (companies.find(c => c.id === company.id)) {
          return
        }
        // Limitar a quantidade de empresas (pode ser mais que 2)
        if (companies.length >= 5) {
          return
        }
        set({ companies: [...companies, company] })
      },
      
      removeCompany: (companyId) => {
        set({ companies: get().companies.filter(c => c.id !== companyId) })
      },
      
      clearComparison: () => {
        set({ companies: [] })
      },
      
      canAddMore: () => {
        return get().companies.length < 5
      },
    }),
    {
      name: 'company-comparison-storage',
    }
  )
)

