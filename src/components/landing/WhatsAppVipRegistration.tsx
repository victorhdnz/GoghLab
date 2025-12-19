'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface WhatsAppVipRegistrationProps {
  whatsappGroupLink?: string
  requireRegistration?: boolean
}

// Link do Grupo VIP do WhatsApp (configurado diretamente no código)
const DEFAULT_WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/EVPNbUpwsjW7FMlerVRDqo?mode=wwt'

export function WhatsAppVipRegistration({ whatsappGroupLink, requireRegistration = true }: WhatsAppVipRegistrationProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Usar link do banco ou o link padrão do código
  const groupLink = whatsappGroupLink || DEFAULT_WHATSAPP_GROUP_LINK

  // Verificar se todos os campos estão preenchidos
  const isFormComplete = name.trim() && email.trim() && phone.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormComplete) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/whatsapp-vip/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro na resposta da API:', data)
        throw new Error(data.error || 'Erro ao registrar')
      }

      toast.success('Registro realizado com sucesso!')
      setSuccess(true)
      
      // Não redirecionar - manter o usuário na página para ver a mensagem de sucesso
      // O link do grupo pode ser acessado pelo usuário quando quiser
    } catch (error: any) {
      console.error('Erro ao registrar:', error)
      toast.error(error.message || 'Erro ao registrar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success && groupLink) {
    return (
      <section className="py-20 bg-gradient-to-br from-green-50 to-green-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <CheckCircle size={64} className="text-green-500 mx-auto" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Parabéns! 🎉
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Seu cadastro foi realizado com sucesso! Agora você pode acessar nosso Grupo VIP do WhatsApp.
            </p>
            <a
              href={groupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-lg"
            >
              <MessageCircle size={24} />
              Entrar no Grupo VIP do WhatsApp
            </a>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="whatsapp-vip" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle size={40} className="text-white" />
                </div>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Entre para o Grupo VIP do WhatsApp! 🎯
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Preencha seus dados abaixo para fazer o cadastro e ter acesso ao nosso Grupo VIP do WhatsApp!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone/WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(34) 99999-9999"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                />
              </div>

              {/* Botão de Entrar no Grupo VIP */}
              {!success && (
                <>
                  {requireRegistration ? (
                    <button
                      type="submit"
                      disabled={submitting || !isFormComplete}
                      className={`w-full inline-flex items-center justify-center gap-3 py-4 rounded-lg font-semibold text-lg transition-colors ${
                        submitting || !isFormComplete
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Registrando...
                        </>
                      ) : (
                        <>
                          <MessageCircle size={24} />
                          Entrar no Grupo VIP do WhatsApp
                        </>
                      )}
                    </button>
                  ) : (
                    <a
                      href={groupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-lg font-semibold text-lg bg-green-500 hover:bg-green-600 text-white shadow-lg transition-colors"
                    >
                      <MessageCircle size={24} />
                      Entrar no Grupo VIP do WhatsApp
                    </a>
                  )}
                </>
              )}


              <p className="text-xs text-gray-500 text-center">
                Ao se cadastrar, você concorda em receber mensagens do nosso grupo VIP no WhatsApp
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

