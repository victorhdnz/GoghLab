'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import { createClient } from '@/lib/supabase/client'

function normalizeLegacyMemberPath(path: string) {
  const legacyMap: Record<string, string> = {
    '/membro': '/conta',
    '/membro/conta': '/conta',
    '/membro/cursos': '/cursos',
    '/membro/ferramentas': '/ferramentas',
    '/membro/planejamento': '/planejamento',
    '/membro/agentes': '/criar',
    '/membro/prompts': '/criar',
    '/membro/perfil': '/conta',
    '/membro/servicos': '/servicos',
  }

  if (path.startsWith('/membro/agentes/chat/')) {
    return '/criar'
  }

  if (path.startsWith('/membro')) {
    return legacyMap[path] || '/conta'
  }

  return path
}

export default function LoginPage() {
  const { isAuthenticated, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [siteLogo, setSiteLogo] = useState<string | null>(null)
  const [siteName, setSiteName] = useState('Gogh Lab')

  const redirect = normalizeLegacyMemberPath(searchParams.get('redirect') || '/conta')
  const errorParam = searchParams.get('error')

  // Buscar logo e nome do site
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const supabase = createClient()
        const { data } = await (supabase as any)
          .from('site_settings')
          .select('site_logo, site_name, homepage_content')
          .eq('key', 'general')
          .maybeSingle()

        if (data) {
          // Tentar pegar logo de site_logo ou hero_logo
          const logo = data.site_logo || 
            (data.homepage_content as any)?.hero_logo || null
          setSiteLogo(logo)
          if (data.site_name) setSiteName(data.site_name)
        }
      } catch (err) {
        console.error('Erro ao buscar configurações:', err)
      }
    }
    fetchSiteSettings()
  }, [])

  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'no_code': 'Erro na autenticação. Tente novamente.',
        'session_exchange_failed': 'Falha ao criar sessão. Tente novamente.',
        'no_user': 'Usuário não encontrado.',
        'unexpected_error': 'Erro inesperado. Tente novamente.',
      }
      setError(errorMessages[errorParam] || 'Erro na autenticação.')
    }
  }, [errorParam])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirect)
    }
  }, [loading, isAuthenticated, router, redirect])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      await signInWithGoogle(redirect)
    } catch (err: any) {
      setError('Erro ao conectar com Google. Tente novamente.')
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gogh-beige flex items-center justify-center">
        <div className="text-center">
          <LumaSpin size="lg" className="mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gogh-beige via-white to-gogh-beige flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gogh-grayDark hover:text-gogh-black mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o site
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gogh-grayLight overflow-hidden">
          {/* Header */}
          <div className="bg-[#F5F1E8] p-8 text-center">
            {siteLogo ? (
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <Image
                  src={siteLogo}
                  alt={siteName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gogh-yellow rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gogh-black" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gogh-black mb-2">
              Bem-vindo à {siteName}
            </h1>
            <p className="text-gogh-grayDark text-sm">
              Crie sua conta na plataforma
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Success Message (from auth callback) */}
            {searchParams.get('auth') === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">Login realizado com sucesso!</p>
              </motion.div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className={`
                w-full flex items-center justify-center gap-3 px-6 py-4 
                bg-white border-2 border-gogh-grayLight rounded-xl
                font-medium text-gogh-black
                hover:border-gogh-yellow hover:shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              `}
            >
              {signingIn ? (
                <>
                  <LumaSpin size="sm" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continuar com Google</span>
                </>
              )}
            </button>

          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gogh-grayLight/30 border-t border-gogh-grayLight text-center">
            <p className="text-xs text-gogh-grayDark">
              Ainda não tem uma assinatura?{' '}
              <Link href="/precos" className="text-gogh-yellow hover:underline font-medium">
                Conheça nossos planos
              </Link>
            </p>
          </div>
        </div>

        {/* Terms - Login Google */}
        <div className="mt-6 p-4 bg-gogh-grayLight/30 rounded-lg border border-gogh-grayLight">
          <p className="text-center text-xs text-gogh-grayDark">
            Ao continuar com Google, você concorda com nossos{' '}
            <Link 
              href="/termos-login-google" 
              className="underline hover:text-gogh-black font-medium text-gogh-yellow"
            >
              Termos de Autenticação com Google
            </Link>
            , que incluem informações sobre dados coletados, uso dos serviços e responsabilidades.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

