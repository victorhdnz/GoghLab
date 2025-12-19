'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FilterState {
  categories: string[]
  priceRange: [number, number]
  sortBy: string
  search: string
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  categories: string[]
}

export const ProductFilters = ({ onFilterChange, categories }: ProductFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 2000],
    sortBy: 'all',
    search: '',
  })

  const sortOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'featured', label: 'Em Destaque' },
    { value: 'price_asc', label: 'Menor Preço' },
    { value: 'price_desc', label: 'Maior Preço' },
    { value: 'name_asc', label: 'Nome A-Z' },
    { value: 'name_desc', label: 'Nome Z-A' },
    { value: 'newest', label: 'Mais Recentes' },
    { value: 'favorites', label: 'Favoritos' },
  ]

  const priceRanges = [
    { min: 0, max: 200, label: 'Até R$ 200' },
    { min: 200, max: 500, label: 'R$ 200 - R$ 500' },
    { min: 500, max: 1000, label: 'R$ 500 - R$ 1000' },
    { min: 1000, max: 2000, label: 'Acima de R$ 1000' },
  ]

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    
    const newFilters = { ...filters, categories: newCategories }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePriceRange = (min: number, max: number) => {
    const newFilters = { ...filters, priceRange: [min, max] as [number, number] }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSortChange = (sortBy: string) => {
    const newFilters = { ...filters, sortBy }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const newFilters = {
      categories: [],
      priceRange: [0, 2000] as [number, number],
      sortBy: 'all',
      search: '',
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const activeFiltersCount = 
    filters.categories.length + 
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 2000 ? 1 : 0)

  return (
    <div className="sticky top-4">
      {/* Barra de Busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-black focus:outline-none transition-colors"
        />
      </div>

      {/* Ordenação */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Ordenar por</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-black focus:outline-none transition-colors bg-white cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Painel de Filtros */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-6">
        {/* Categorias */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center justify-between">
            Categorias
            {filters.categories.length > 0 && (
              <button
                onClick={() => {
                  const newFilters = { ...filters, categories: [] }
                  setFilters(newFilters)
                  onFilterChange(newFilters)
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Limpar
              </button>
            )}
          </h3>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-left ${
                  filters.categories.includes(category)
                    ? 'bg-black text-white'
                    : 'bg-gray-50 border border-gray-300 hover:border-black hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Faixa de Preço */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Faixa de Preço</h3>
          <div className="flex flex-col gap-2">
            {priceRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => handlePriceRange(range.min, range.max)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-left ${
                  filters.priceRange[0] === range.min &&
                  filters.priceRange[1] === range.max
                    ? 'bg-black text-white'
                    : 'bg-gray-50 border border-gray-300 hover:border-black hover:bg-gray-100'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

