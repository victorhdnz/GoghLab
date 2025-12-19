'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Globe, Eye, EyeOff, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface PublicationControlsProps {
  isPublished: boolean
  scheduledPublishAt?: string
  lastPublishedAt?: string
  onPublish: () => Promise<void>
  onUnpublish: () => Promise<void>
  onSchedule: (date: string) => Promise<void>
  onCancelSchedule: () => Promise<void>
  loading?: boolean
}

export function PublicationControls({
  isPublished,
  scheduledPublishAt,
  lastPublishedAt,
  onPublish,
  onUnpublish,
  onSchedule,
  onCancelSchedule,
  loading = false
}: PublicationControlsProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const handleScheduleSubmit = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Por favor, selecione data e hora')
      return
    }

    const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`
    const scheduledDate = new Date(scheduledDateTime)
    
    if (scheduledDate <= new Date()) {
      toast.error('A data agendada deve ser no futuro')
      return
    }

    try {
      await onSchedule(scheduledDateTime)
      setShowScheduleModal(false)
      setScheduleDate('')
      setScheduleTime('')
      toast.success('Publicação agendada com sucesso!')
    } catch (error) {
      toast.error('Erro ao agendar publicação')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = () => {
    if (scheduledPublishAt) return 'text-blue-600'
    if (isPublished) return 'text-green-600'
    return 'text-gray-600'
  }

  const getStatusText = () => {
    if (scheduledPublishAt) {
      const scheduledDate = new Date(scheduledPublishAt)
      const now = new Date()
      if (scheduledDate > now) {
        return `Agendado para ${formatDate(scheduledPublishAt)}`
      }
    }
    if (isPublished) return 'Publicado'
    return 'Rascunho'
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Controles de Publicação</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
          
          {isPublished ? (
            <Globe className="text-green-500" size={24} />
          ) : (
            <EyeOff className="text-gray-400" size={24} />
          )}
        </div>

        {/* Informações de Status */}
        <div className="space-y-3 mb-6">
          {lastPublishedAt && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Última publicação: {formatDate(lastPublishedAt)}</span>
            </div>
          )}

          {scheduledPublishAt && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Calendar size={16} />
              <span>Agendado para: {formatDate(scheduledPublishAt)}</span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          {!isPublished && !scheduledPublishAt && (
            <div className="flex gap-3">
              <Button
                onClick={onPublish}
                isLoading={loading}
                className="flex-1"
              >
                <Globe size={16} className="mr-2" />
                Publicar Agora
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(true)}
                className="flex-1"
              >
                <Calendar size={16} className="mr-2" />
                Agendar
              </Button>
            </div>
          )}

          {isPublished && !scheduledPublishAt && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onUnpublish}
                isLoading={loading}
                className="flex-1"
              >
                <EyeOff size={16} className="mr-2" />
                Despublicar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(true)}
                className="flex-1"
              >
                <Calendar size={16} className="mr-2" />
                Reagendar
              </Button>
            </div>
          )}

          {scheduledPublishAt && (
            <div className="flex gap-3">
              <Button
                onClick={onPublish}
                isLoading={loading}
                className="flex-1"
              >
                <Globe size={16} className="mr-2" />
                Publicar Agora
              </Button>
              <Button
                variant="outline"
                onClick={onCancelSchedule}
                isLoading={loading}
                className="flex-1"
              >
                Cancelar Agendamento
              </Button>
            </div>
          )}
        </div>

        {/* Aviso sobre rascunhos */}
        {!isPublished && !scheduledPublishAt && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Modo Rascunho</p>
                <p>As alterações não estão visíveis no site público. Publique para aplicar as mudanças.</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal de Agendamento */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">Agendar Publicação</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Hora</label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                className="flex-1"
              >
                <Save size={16} className="mr-2" />
                Agendar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}