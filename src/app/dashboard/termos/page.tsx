'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { createClient } from '@/lib/supabase/client'
import { Save, FileText, Shield, Truck, RotateCcw, Plus, Trash2, Edit, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { slugify } from '@/lib/utils/format'

interface Term {
  id: string
  key: string
  title: string
  content: string
  icon: string
  updated_at?: string
}

interface TermSection {
  id: string
  title: string
  content: string
  level: number // 1, 2 ou 3 (para #, ##, ###)
}

const TERMS_CONFIG = [
  {
    key: 'politica-privacidade',
    title: 'Política de Privacidade',
    icon: 'shield',
    defaultContent: `# Política de Privacidade

## 1. Aceitação dos Termos

Ao acessar e utilizar este site, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concorda com alguma parte destes termos, não deve utilizar nosso site.

## 2. Uso do Site

Você concorda em usar este site apenas para fins legais e de acordo com estes termos:

- Não utilizar o site de forma fraudulenta ou enganosa
- Não realizar atividades que possam danificar, desabilitar ou sobrecarregar o site
- Não tentar obter acesso não autorizado a áreas restritas do site
- Não usar o site para transmitir qualquer material malicioso ou prejudicial

## 3. Informações Coletadas

Coletamos informações que você nos fornece diretamente, como:

- Nome e informações de contato
- Informações de endereço
- Informações de pagamento
- Outras informações que você escolhe fornecer

## 4. Uso das Informações

Utilizamos as informações coletadas para:

- Processar e entregar seus pedidos
- Comunicar-nos com você sobre seu pedido
- Enviar atualizações sobre nossos produtos e serviços
- Melhorar nossos serviços e experiência do usuário

## 5. Proteção dos Dados

Implementamos medidas de segurança adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.`,
  },
  {
    key: 'termos-uso',
    title: 'Termos de Uso',
    icon: 'file-text',
    defaultContent: `# Termos de Uso

## 1. Aceitação dos Termos

Ao acessar e utilizar este site, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concorda com alguma parte destes termos, não deve utilizar nosso site.

## 2. Uso do Site

Você concorda em usar este site apenas para fins legais e de acordo com estes termos:

- Não utilizar o site de forma fraudulenta ou enganosa
- Não realizar atividades que possam danificar, desabilitar ou sobrecarregar o site
- Não tentar obter acesso não autorizado a áreas restritas do site
- Não usar o site para transmitir qualquer material malicioso ou prejudicial

## 3. Conta do Usuário

Ao criar uma conta, você é responsável por manter a segurança de sua senha e por todas as atividades que ocorram sob sua conta. Você concorda em:

- Fornecer informações precisas e atualizadas
- Manter a confidencialidade de sua senha
- Notificar-nos imediatamente sobre qualquer uso não autorizado
- Ser responsável por todas as atividades em sua conta

## 4. Produtos e Preços

Nos esforços para fornecer informações precisas sobre produtos e preços. No entanto:

- Os preços estão sujeitos a alterações sem aviso prévio
- Reservamo-nos o direito de corrigir erros de preços
- As imagens dos produtos são apenas ilustrativas`,
  },
  {
    key: 'politica-entrega',
    title: 'Política de Entrega',
    icon: 'truck',
    defaultContent: `# Política de Entrega

## 1. Prazos de Entrega

Os prazos de entrega são calculados a partir da confirmação do pagamento e podem variar de acordo com a localidade:

- **Uberlândia/MG**: Até 24 horas
- **Outras cidades**: 3 a 10 dias úteis

## 2. Custos de Entrega

Os custos de entrega são calculados no momento da finalização da compra e variam de acordo com:

- Local de entrega
- Peso e dimensões do produto
- Forma de envio escolhida

## 3. Formas de Entrega

Oferecemos as seguintes formas de entrega:

- Entrega expressa (disponível para Uberlândia)
- Entrega padrão (correios)
- Retirada na loja (gratuita)

## 4. Rastreamento

Após a postagem, você receberá um código de rastreamento por e-mail para acompanhar seu pedido.`,
  },
  {
    key: 'trocas-devolucoes',
    title: 'Trocas e Devoluções',
    icon: 'rotate-ccw',
    defaultContent: `# Trocas e Devoluções

## 1. Prazo para Troca/Devolução

Você tem até **7 dias corridos** a partir da data de recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.

## 2. Condições para Troca/Devolução

O produto deve estar:

- Nas condições originais de venda
- Com todas as etiquetas e embalagens originais
- Sem sinais de uso ou danos
- Acompanhado da nota fiscal

## 3. Processo de Troca/Devolução

Para solicitar troca ou devolução:

1. Entre em contato conosco através do WhatsApp ou e-mail
2. Informe o motivo da troca/devolução
3. Aguarde nossa resposta com as instruções
4. Envie o produto conforme as instruções recebidas

## 4. Reembolso

Em caso de devolução, o reembolso será processado no mesmo método de pagamento utilizado na compra, em até 10 dias úteis após o recebimento do produto em nossa loja.`,
  },
]

export default function DashboardTermsPage() {
  const router = useRouter()
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [sections, setSections] = useState<TermSection[]>([])
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showNewTermModal, setShowNewTermModal] = useState(false)
  const [newTerm, setNewTerm] = useState({ title: '', icon: 'file-text' })
  const [newTermSections, setNewTermSections] = useState<TermSection[]>([
    {
      id: `section-${Date.now()}-0`,
      title: 'Primeira Seção',
      content: '',
      level: 2
    }
  ])

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isEditor) {
        router.push('/dashboard')
        return
      }
      loadTerms()
    }
  }, [isAuthenticated, isEditor, authLoading])

  // Parsear conteúdo em seções quando termo é selecionado
  useEffect(() => {
    if (selectedTerm) {
      const term = terms.find(t => t.key === selectedTerm)
      if (term) {
        parseSections(term.content)
      }
    }
  }, [selectedTerm, terms])

  const parseSections = (content: string) => {
    if (!content) {
      setSections([])
      return
    }

    const lines = content.split('\n')
    const parsedSections: TermSection[] = []
    let currentSection: TermSection | null = null
    let foundFirstTitle = false
    let contentAfterFirstTitle = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Verificar se é um título
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0]?.length || 1
        const title = line.replace(/^#+\s*/, '').trim()
        
        // Ignorar o primeiro título principal (# Título) - ele é apenas o título do termo
        if (level === 1 && !foundFirstTitle) {
          foundFirstTitle = true
          // Se havia conteúdo após o título principal, criar uma seção inicial
          if (contentAfterFirstTitle.trim()) {
            currentSection = {
              id: `section-${Date.now()}-0`,
              title: 'Introdução',
              content: contentAfterFirstTitle.trim(),
              level: 2
            }
            contentAfterFirstTitle = ''
          }
          continue
        }
        
        // Salvar seção anterior se existir
        if (currentSection) {
          parsedSections.push(currentSection)
        }
        
        currentSection = {
          id: `section-${Date.now()}-${parsedSections.length}`,
          title,
          content: '',
          level: Math.min(level, 3) // Limitar a 3 níveis
        }
      } else if (currentSection && line) {
        // Adicionar conteúdo à seção atual
        currentSection.content += (currentSection.content ? '\n' : '') + line
      } else if (!foundFirstTitle && line) {
        // Conteúdo antes da primeira seção (após o título principal)
        contentAfterFirstTitle += (contentAfterFirstTitle ? '\n' : '') + line
      }
    }

    // Adicionar última seção
    if (currentSection) {
      parsedSections.push(currentSection)
    } else if (contentAfterFirstTitle.trim() && !foundFirstTitle) {
      // Se não encontrou título principal mas há conteúdo, criar seção inicial
      parsedSections.push({
        id: `section-${Date.now()}-0`,
        title: 'Introdução',
        content: contentAfterFirstTitle.trim(),
        level: 2
      })
    }

    setSections(parsedSections)
  }

  const buildContentFromSections = (sections: TermSection[]): string => {
    const mainTitle = terms.find(t => t.key === selectedTerm)?.title || 'Título'
    let content = `# ${mainTitle}\n\n`

    sections.forEach((section) => {
      // O nível já está correto (1 = #, 2 = ##, 3 = ###)
      const prefix = '#'.repeat(section.level)
      content += `${prefix} ${section.title}\n\n`
      
      if (section.content.trim()) {
        content += `${section.content.trim()}\n\n`
      }
    })

    return content.trim()
  }

  const loadTerms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('site_terms')
        .select('*')
        .order('key')

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data || data.length === 0) {
        const defaultTerms = TERMS_CONFIG.map(config => ({
          key: config.key,
          title: config.title,
          content: config.defaultContent,
          icon: config.icon,
        }))

        const { error: insertError } = await supabase
          .from('site_terms')
          .insert(defaultTerms)

        if (insertError && insertError.code !== '42P01') {
          console.error('Erro ao criar termos padrão:', insertError)
        } else {
          const { data: newData } = await supabase
            .from('site_terms')
            .select('*')
            .order('key')
          
          setTerms(newData as Term[] || [])
          if (newData && newData.length > 0) {
            setSelectedTerm(newData[0].key)
          }
        }
      } else {
        // Verificar se todos os termos padrão existem
        const existingKeys = data.map(t => t.key)
        const missingTerms = TERMS_CONFIG.filter(config => !existingKeys.includes(config.key))
        
        if (missingTerms.length > 0) {
          // Inserir termos faltantes
          const termsToInsert = missingTerms.map(config => ({
            key: config.key,
            title: config.title,
            content: config.defaultContent,
            icon: config.icon,
          }))

          const { error: insertError } = await supabase
            .from('site_terms')
            .insert(termsToInsert)

          if (insertError && insertError.code !== '42P01') {
            console.error('Erro ao criar termos faltantes:', insertError)
          } else {
            // Recarregar termos após inserir os faltantes
            const { data: updatedData } = await supabase
              .from('site_terms')
              .select('*')
              .order('key')
            
            setTerms(updatedData as Term[] || data)
            if (updatedData && updatedData.length > 0 && !selectedTerm) {
              setSelectedTerm(updatedData[0].key)
            } else if (data.length > 0 && !selectedTerm) {
              setSelectedTerm(data[0].key)
            }
            return // Sair aqui para evitar duplicar o código abaixo
          }
        }
        
        setTerms(data as Term[])
        if (data.length > 0 && !selectedTerm) {
          setSelectedTerm(data[0].key)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar termos:', error)
      if (error.code === '42P01' || error.code === 'PGRST116') {
        toast.error('Tabela de termos não existe. Execute o SQL de criação no Supabase.')
      } else {
        toast.error('Erro ao carregar termos')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTerm) return

    const term = terms.find(t => t.key === selectedTerm)
    if (!term) return

    try {
      setSaving(true)
      const content = buildContentFromSections(sections)
      
      const { error } = await supabase
        .from('site_terms')
        .update({
          title: term.title,
          content: content,
          updated_at: new Date().toISOString(),
        })
        .eq('key', selectedTerm)

      if (error) throw error

      // Atualizar termo local
      setTerms(prev => prev.map(t => 
        t.key === selectedTerm ? { ...t, content, title: term.title } : t
      ))

      toast.success('Termo salvo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar termo:', error)
      toast.error('Erro ao salvar termo')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSection = () => {
    const newSection: TermSection = {
      id: `section-${Date.now()}`,
      title: 'Nova Seção',
      content: '',
      level: 2 // ## por padrão
    }
    setSections([...sections, newSection])
    setEditingSection(newSection.id)
  }

  const handleRemoveSection = (sectionId: string) => {
    if (!confirm('Tem certeza que deseja remover esta seção?')) return
    setSections(sections.filter(s => s.id !== sectionId))
    if (editingSection === sectionId) {
      setEditingSection(null)
    }
  }

  const handleUpdateSection = (sectionId: string, updates: Partial<TermSection>) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ))
  }

  const buildContentFromNewTermSections = (sections: TermSection[], title: string): string => {
    let content = `# ${title}\n\n`

    sections.forEach((section) => {
      const prefix = '#'.repeat(section.level)
      content += `${prefix} ${section.title}\n\n`
      
      if (section.content.trim()) {
        content += `${section.content.trim()}\n\n`
      }
    })

    return content.trim()
  }

  const handleCreateNewTerm = async () => {
    if (!newTerm.title || newTerm.title.trim() === '') {
      toast.error('Preencha o título do termo')
      return
    }

    try {
      setSaving(true)
      // Gerar chave automaticamente a partir do título
      const key = slugify(newTerm.title)
      
      if (!key || key.length === 0) {
        toast.error('O título precisa ter pelo menos um caractere válido')
        return
      }
      
      // Verificar se já existe
      const { data: existing, error: checkError } = await supabase
        .from('site_terms')
        .select('key')
        .eq('key', key)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        toast.error('Já existe um termo com este título. Tente outro título.')
        return
      }

      // Construir conteúdo a partir das seções criadas
      const content = buildContentFromNewTermSections(newTermSections, newTerm.title)

      const { error } = await supabase
        .from('site_terms')
        .insert({
          key,
          title: newTerm.title.trim(),
          content,
          icon: newTerm.icon,
        })

      if (error) {
        console.error('Erro detalhado ao criar termo:', error)
        throw error
      }

      toast.success('Termo criado com sucesso!')
      setShowNewTermModal(false)
      setNewTerm({ title: '', icon: 'file-text' })
      setNewTermSections([{
        id: `section-${Date.now()}-0`,
        title: 'Primeira Seção',
        content: '',
        level: 2
      }])
      await loadTerms()
      // Aguardar um pouco para garantir que o termo foi carregado
      setTimeout(() => {
        setSelectedTerm(key)
        // Parsear as seções do conteúdo criado
        parseSections(content)
      }, 300)
    } catch (error: any) {
      console.error('Erro ao criar termo:', error)
      toast.error(error.message || 'Erro ao criar termo. Verifique o console para mais detalhes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTerm = async (termKey: string) => {
    if (!confirm('Tem certeza que deseja excluir este termo? Esta ação não pode ser desfeita.')) return

    try {
      const { error } = await supabase
        .from('site_terms')
        .delete()
        .eq('key', termKey)

      if (error) throw error

      toast.success('Termo excluído com sucesso!')
      setTerms(terms.filter(t => t.key !== termKey))
      
      if (selectedTerm === termKey) {
        const remaining = terms.filter(t => t.key !== termKey)
        setSelectedTerm(remaining.length > 0 ? remaining[0].key : null)
      }
    } catch (error: any) {
      console.error('Erro ao excluir termo:', error)
      toast.error('Erro ao excluir termo')
    }
  }

  const handleTitleChange = (key: string, title: string) => {
    setTerms(prev => prev.map(t => 
      t.key === key ? { ...t, title } : t
    ))
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <Shield className="w-5 h-5" />
      case 'file-text':
        return <FileText className="w-5 h-5" />
      case 'truck':
        return <Truck className="w-5 h-5" />
      case 'rotate-ccw':
        return <RotateCcw className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  const currentTerm = terms.find(t => t.key === selectedTerm)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DashboardNavigation
          title="Gerenciar Termos"
          subtitle="Edite os termos e políticas do site"
          backUrl="/dashboard"
          backLabel="Dashboard"
        />

        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowNewTermModal(true)} size="lg">
            <Plus size={18} className="mr-2" />
            Criar Novo Termo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          {/* Lista de Termos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-lg mb-4">Termos Disponíveis</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {terms.map((term) => (
                  <div
                    key={term.key}
                    className={`group flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedTerm === term.key
                        ? 'bg-black text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedTerm(term.key)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {getIcon(term.icon || 'file-text')}
                      <span className="font-medium text-sm">{term.title}</span>
                    </button>
                    {selectedTerm !== term.key && (
                      <button
                        onClick={() => handleDeleteTerm(term.key)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 transition-opacity"
                        title="Excluir termo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor de Termo */}
          <div className="lg:col-span-3">
            {currentTerm ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    {getIcon(currentTerm.icon || 'file-text')}
                    <h2 className="text-2xl font-bold">{currentTerm.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} isLoading={saving} size="lg">
                      <Save size={18} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <Input
                    label="Título do Termo"
                    value={currentTerm.title}
                    onChange={(e) => handleTitleChange(currentTerm.key, e.target.value)}
                    placeholder="Título do termo"
                  />
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Seções do Termo</h3>
                    <Button onClick={handleAddSection} size="sm" variant="outline">
                      <Plus size={16} className="mr-2" />
                      Adicionar Seção
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {sections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Nenhuma seção encontrada. Clique em "Adicionar Seção" para começar.</p>
                      </div>
                    ) : (
                      sections.map((section, index) => (
                        <div
                          key={section.id}
                          className="border rounded-lg p-4 hover:border-black transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                value={section.level}
                                onChange={(e) => handleUpdateSection(section.id, { level: parseInt(e.target.value) })}
                                className="text-xs border rounded px-2 py-1"
                              >
                                <option value={1}>Título Principal (#)</option>
                                <option value={2}>Seção (##)</option>
                                <option value={3}>Subseção (###)</option>
                              </select>
                              {editingSection === section.id ? (
                                <Input
                                  value={section.title}
                                  onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                                  placeholder="Título da seção"
                                  className="flex-1"
                                />
                              ) : (
                                <h4
                                  className={`font-bold cursor-pointer flex-1 ${
                                    section.level === 1 ? 'text-xl' :
                                    section.level === 2 ? 'text-lg' : 'text-base'
                                  }`}
                                  onClick={() => setEditingSection(section.id)}
                                >
                                  {section.title || 'Sem título'}
                                </h4>
                              )}
                              {editingSection === section.id && (
                                <Button
                                  onClick={() => setEditingSection(null)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <X size={14} />
                                </Button>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveSection(section.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover seção"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <textarea
                            value={section.content}
                            onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                            placeholder="Conteúdo da seção (suporta Markdown: listas com -, negrito com **texto**)..."
                            rows={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">Selecione um termo para editar ou crie um novo termo</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para criar novo termo */}
        {showNewTermModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowNewTermModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
            >
              <button
                onClick={() => setShowNewTermModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>

              <h3 className="text-2xl font-bold mb-6">Criar Novo Termo</h3>

              <div className="space-y-4">
                <Input
                  label="Título do Termo *"
                  value={newTerm.title}
                  onChange={(e) => setNewTerm({ ...newTerm, title: e.target.value })}
                  placeholder="Ex: Política de Reembolso"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Ícone</label>
                  <select
                    value={newTerm.icon}
                    onChange={(e) => setNewTerm({ ...newTerm, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="file-text">📄 Documento</option>
                    <option value="shield">🛡️ Escudo</option>
                    <option value="truck">🚚 Caminhão</option>
                    <option value="rotate-ccw">🔄 Troca</option>
                  </select>
                </div>

                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Seções do Termo</h3>
                    <Button 
                      onClick={() => {
                        const newSection: TermSection = {
                          id: `section-${Date.now()}`,
                          title: 'Nova Seção',
                          content: '',
                          level: 2
                        }
                        setNewTermSections([...newTermSections, newSection])
                      }} 
                      size="sm" 
                      variant="outline"
                    >
                      <Plus size={16} className="mr-2" />
                      Adicionar Seção
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {newTermSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={section.level}
                              onChange={(e) => {
                                const updated = newTermSections.map(s => 
                                  s.id === section.id ? { ...s, level: parseInt(e.target.value) } : s
                                )
                                setNewTermSections(updated)
                              }}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value={1}>Título Principal (#)</option>
                              <option value={2}>Seção (##)</option>
                              <option value={3}>Subseção (###)</option>
                            </select>
                            <Input
                              value={section.title}
                              onChange={(e) => {
                                const updated = newTermSections.map(s => 
                                  s.id === section.id ? { ...s, title: e.target.value } : s
                                )
                                setNewTermSections(updated)
                              }}
                              placeholder="Título da seção"
                              className="flex-1"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (newTermSections.length > 1) {
                                setNewTermSections(newTermSections.filter(s => s.id !== section.id))
                              } else {
                                toast.error('É necessário ter pelo menos uma seção')
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover seção"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <textarea
                          value={section.content}
                          onChange={(e) => {
                            const updated = newTermSections.map(s => 
                              s.id === section.id ? { ...s, content: e.target.value } : s
                            )
                            setNewTermSections(updated)
                          }}
                          placeholder="Conteúdo da seção (suporta Markdown: listas com -, negrito com **texto**)..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleCreateNewTerm} isLoading={saving} className="flex-1" size="lg">
                    <Plus size={18} className="mr-2" />
                    Criar Termo
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewTermModal(false)
                      setNewTerm({ title: '', icon: 'file-text' })
                      setNewTermSections([{
                        id: `section-${Date.now()}-0`,
                        title: 'Primeira Seção',
                        content: '',
                        level: 2
                      }])
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
