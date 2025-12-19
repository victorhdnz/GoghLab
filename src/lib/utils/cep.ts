// Utilitário para buscar CEP via API

export interface CEPData {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
}

export async function fetchCEP(cep: string): Promise<CEPData | null> {
  try {
    // Remove formatação
    const cleanCEP = cep.replace(/\D/g, '')
    
    if (cleanCEP.length !== 8) {
      return null
    }

    // Tenta buscar via ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.erro) {
      return null
    }

    return {
      cep: data.cep || '',
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return null
  }
}

