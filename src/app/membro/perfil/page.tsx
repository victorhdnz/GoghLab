'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  User, 
  Briefcase, 
  Target, 
  MessageSquare, 
  Lightbulb,
  Save,
  CheckCircle2,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NicheProfile {
  business_name: string
  niche: string
  target_audience: string
  brand_voice: string
  content_pillars: string[]
  goals: string
  platforms: string[]
  additional_context: string
}

const platformOptions = [
  'Instagram',
  'TikTok',
  'YouTube',
  'LinkedIn',
  'Twitter/X',
  'Facebook',
  'Pinterest',
  'Blog'
]

const brandVoiceOptions = [
  { value: 'profissional', label: 'Profissional', description: 'Formal, técnico, corporativo' },
  { value: 'casual', label: 'Casual', description: 'Descontraído, amigável, acessível' },
  { value: 'inspirador', label: 'Inspirador', description: 'Motivacional, energético, positivo' },
  { value: 'educativo', label: 'Educativo', description: 'Didático, informativo, detalhado' },
  { value: 'humoristico', label: 'Humorístico', description: 'Divertido, leve, com humor' },
  { value: 'autoridade', label: 'Autoridade', description: 'Expert, confiante, referência' },
]

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [nicheProfile, setNicheProfile] = useState<NicheProfile>({
    business_name: '',
    niche: '',
    target_audience: '',
    brand_voice: '',
    content_pillars: [],
    goals: '',
    platforms: [],
    additional_context: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPillar, setNewPillar] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await (supabase as any)
          .from('user_niche_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          setNicheProfile({
            business_name: data.business_name || '',
            niche: data.niche || '',
            target_audience: data.target_audience || '',
            brand_voice: data.brand_voice || '',
            content_pillars: (data.content_pillars as string[]) || [],
            goals: data.goals || '',
            platforms: (data.platforms as string[]) || [],
            additional_context: data.additional_context || ''
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return

    // Validação de campos obrigatórios
    const errors: string[] = []
    
    if (!nicheProfile.business_name?.trim()) {
      errors.push('Nome do Negócio/Marca é obrigatório')
    }
    
    if (!nicheProfile.niche?.trim()) {
      errors.push('Nicho/Área de Atuação é obrigatório')
    }
    
    if (!nicheProfile.target_audience?.trim()) {
      errors.push('Público-alvo é obrigatório')
    }
    
    if (!nicheProfile.brand_voice?.trim()) {
      errors.push('Tom de Voz da Marca é obrigatório')
    }
    
    if (!nicheProfile.goals?.trim()) {
      errors.push('Objetivos são obrigatórios')
    }
    
    if (!nicheProfile.content_pillars || nicheProfile.content_pillars.length === 0) {
      errors.push('Adicione pelo menos um Pilar de Conteúdo')
    }
    
    if (!nicheProfile.platforms || nicheProfile.platforms.length === 0) {
      errors.push('Selecione pelo menos uma Plataforma')
    }

    if (errors.length > 0) {
      toast.error(`Por favor, preencha todos os campos obrigatórios:\n${errors.join('\n')}`, {
        duration: 5000
      })
      return
    }

    setSaving(true)

    try {
      const { error } = await (supabase as any)
        .from('user_niche_profiles')
        .upsert({
          user_id: user.id,
          ...nicheProfile
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
      toast.success('Perfil salvo com sucesso!')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const addPillar = () => {
    if (newPillar.trim() && !nicheProfile.content_pillars.includes(newPillar.trim())) {
      setNicheProfile(prev => ({
        ...prev,
        content_pillars: [...prev.content_pillars, newPillar.trim()]
      }))
      setNewPillar('')
    }
  }

  const removePillar = (pillar: string) => {
    setNicheProfile(prev => ({
      ...prev,
      content_pillars: prev.content_pillars.filter(p => p !== pillar)
    }))
  }

  const togglePlatform = (platform: string) => {
    setNicheProfile(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gogh-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
          Meu Perfil de Nicho
        </h1>
        <p className="text-gogh-grayDark">
          Configure seu perfil para personalizar as respostas dos agentes de IA de acordo com seu negócio.
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Info className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Por que preencher isso?</h3>
            <p className="text-sm text-purple-700 mb-2">
              Ao configurar seu perfil, os agentes de IA terão contexto sobre seu negócio e criarão 
              conteúdos mais relevantes e personalizados para você. Quanto mais detalhes, melhores as sugestões!
            </p>
            <p className="text-xs text-purple-600 font-medium">
              <span className="text-red-500">*</span> Campos obrigatórios devem ser preenchidos para salvar o perfil.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <div className="space-y-6">
        {/* Business Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gogh-grayLight shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gogh-yellow/20 rounded-lg">
              <Briefcase className="w-5 h-5 text-gogh-black" />
            </div>
            <h2 className="text-lg font-semibold text-gogh-black">Sobre seu Negócio</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gogh-black mb-2">
                Nome do Negócio/Marca <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nicheProfile.business_name}
                onChange={(e) => setNicheProfile(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Ex: Studio Fitness, Dra. Ana Nutrição, etc."
                className="w-full px-4 py-3 border border-gogh-grayLight rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gogh-black mb-2">
                Nicho/Área de Atuação <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nicheProfile.niche}
                onChange={(e) => setNicheProfile(prev => ({ ...prev, niche: e.target.value }))}
                placeholder="Ex: Personal Trainer, Nutricionista, Coach de Carreira, etc."
                className="w-full px-4 py-3 border border-gogh-grayLight rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow"
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Target Audience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gogh-grayLight shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gogh-yellow/20 rounded-lg">
              <Target className="w-5 h-5 text-gogh-black" />
            </div>
            <h2 className="text-lg font-semibold text-gogh-black">Público-alvo</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gogh-black mb-2">
              Descreva seu público ideal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={nicheProfile.target_audience}
              onChange={(e) => setNicheProfile(prev => ({ ...prev, target_audience: e.target.value }))}
              placeholder="Ex: Mulheres de 25-40 anos, mães que querem emagrecer, profissionais ocupados que buscam saúde, etc."
              rows={3}
              className="w-full px-4 py-3 border border-gogh-grayLight rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow resize-none"
              required
            />
          </div>
        </motion.div>

        {/* Brand Voice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gogh-grayLight shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gogh-yellow/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-gogh-black" />
            </div>
            <h2 className="text-lg font-semibold text-gogh-black">
              Tom de Voz da Marca <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {brandVoiceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setNicheProfile(prev => ({ ...prev, brand_voice: option.value }))}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${nicheProfile.brand_voice === option.value
                    ? 'border-gogh-yellow bg-gogh-yellow/10'
                    : 'border-gogh-grayLight hover:border-gogh-yellow/50'
                  }
                `}
              >
                <p className="font-medium text-gogh-black text-sm">{option.label}</p>
                <p className="text-xs text-gogh-grayDark mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gogh-grayLight shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gogh-yellow/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-gogh-black" />
            </div>
            <h2 className="text-lg font-semibold text-gogh-black">Pilares de Conteúdo</h2>
          </div>

          <p className="text-sm text-gogh-grayDark mb-4">
            Adicione os principais temas que você aborda em seu conteúdo. <span className="text-red-500">*</span>
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPillar()}
              placeholder="Ex: Treinos em casa, Receitas fit, Mindset..."
              className="flex-1 px-4 py-2 border border-gogh-grayLight rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow"
            />
            <button
              type="button"
              onClick={addPillar}
              className="px-4 py-2 bg-gogh-yellow text-gogh-black rounded-lg font-medium hover:bg-gogh-yellow/80 transition-colors"
            >
              Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {nicheProfile.content_pillars.map((pillar, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gogh-grayLight rounded-full text-sm"
              >
                {pillar}
                <button
                  type="button"
                  onClick={() => removePillar(pillar)}
                  className="text-gogh-grayDark hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
            {nicheProfile.content_pillars.length === 0 && (
              <span className="text-sm text-gogh-grayDark italic">
                Nenhum pilar adicionado
              </span>
            )}
          </div>
        </motion.div>

        {/* Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gogh-grayLight shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gogh-yellow/20 rounded-lg">
              <User className="w-5 h-5 text-gogh-black" />
            </div>
            <h2 className="text-lg font-semibold text-gogh-black">
              Plataformas que Você Usa <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {platformOptions.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`
                  px-4 py-2 rounded-full border-2 text-sm font-medium transition-all
                  ${nicheProfile.platforms.includes(platform)
                    ? 'border-gogh-yellow bg-gogh-yellow text-gogh-black'
                    : 'border-gogh-grayLight text-gogh-grayDark hover:border-gogh-yellow/50'
                  }
                `}
              >
                {nicheProfile.platforms.includes(platform) && (
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                )}
                {platform}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Goals & Additional Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 border border-gogh-grayLight shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gogh-black mb-6">Objetivos e Contexto Adicional</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gogh-black mb-2">
                Quais são seus principais objetivos? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={nicheProfile.goals}
                onChange={(e) => setNicheProfile(prev => ({ ...prev, goals: e.target.value }))}
                placeholder="Ex: Aumentar engajamento, conseguir mais clientes, educar meu público, construir autoridade..."
                rows={2}
                className="w-full px-4 py-3 border border-gogh-grayLight rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gogh-black mb-2">
                Algo mais que os agentes devem saber?
              </label>
              <textarea
                value={nicheProfile.additional_context}
                onChange={(e) => setNicheProfile(prev => ({ ...prev, additional_context: e.target.value }))}
                placeholder="Ex: Concorrentes, diferenciais do seu negócio, estilo de comunicação preferido, etc."
                rows={3}
                className="w-full px-4 py-3 border border-gogh-grayLight rounded-lg focus:outline-none focus:ring-2 focus:ring-gogh-yellow resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-end"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${saving
                ? 'bg-gogh-grayLight text-gogh-grayDark cursor-not-allowed'
                : 'bg-gogh-black text-white hover:bg-gogh-black/90'
              }
            `}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-gogh-grayDark border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Perfil
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

