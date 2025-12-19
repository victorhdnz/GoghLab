'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Video, File, Trash2, Eye, Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface MediaFile {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'other'
  size: number
  uploadedAt: string
}

interface MediaManagerProps {
  onSelectMedia: (url: string) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
  folder?: string
}

export function MediaManager({ 
  onSelectMedia, 
  acceptedTypes = ['image/*', 'video/*'],
  maxSizeMB = 10,
  folder = 'media'
}: MediaManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        // Validar tamanho
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} é muito grande. Máximo: ${maxSizeMB}MB`)
          continue
        }

        // Simular upload (aqui você integraria com Cloudinary ou Supabase Storage)
        const mockUrl = URL.createObjectURL(file)
        const newFile: MediaFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: mockUrl,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'other',
          size: file.size,
          uploadedAt: new Date().toISOString()
        }

        setMediaFiles(prev => [newFile, ...prev])
        toast.success(`${file.name} enviado com sucesso!`)
      }
    } catch (error) {
      toast.error('Erro ao fazer upload dos arquivos')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteFile = (fileId: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== fileId))
    if (selectedFile?.id === fileId) {
      setSelectedFile(null)
    }
    toast.success('Arquivo removido')
  }

  const handleSelectFile = (file: MediaFile) => {
    onSelectMedia(file.url)
    setIsOpen(false)
    toast.success('Mídia selecionada!')
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copiada para a área de transferência!')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={20} />
      case 'video': return <Video size={20} />
      default: return <File size={20} />
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <ImageIcon size={16} className="mr-2" />
        Gerenciar Mídia
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg w-full max-w-6xl h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold">Gerenciador de Mídia</h2>
                  <p className="text-sm text-gray-600">
                    Faça upload e gerencie suas imagens e vídeos
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'grid' ? 'bg-white shadow' : ''
                      }`}
                    >
                      Grade
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'list' ? 'bg-white shadow' : ''
                      }`}
                    >
                      Lista
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={uploading}
                  >
                    <Upload size={16} className="mr-2" />
                    Upload
                  </Button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex h-full">
                {/* Lista de Arquivos */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {mediaFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma mídia encontrada
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Faça upload de imagens e vídeos para começar
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={uploading}
                      >
                        <Upload size={16} className="mr-2" />
                        Fazer Upload
                      </Button>
                    </div>
                  ) : (
                    <div className={
                      viewMode === 'grid' 
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                        : 'space-y-2'
                    }>
                      {mediaFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`
                            border rounded-lg overflow-hidden cursor-pointer transition-all
                            ${selectedFile?.id === file.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}
                            ${viewMode === 'list' ? 'flex items-center p-3' : 'aspect-square'}
                          `}
                          onClick={() => setSelectedFile(file)}
                        >
                          {viewMode === 'grid' ? (
                            <>
                              {file.type === 'image' ? (
                                <Image
                                  src={file.url}
                                  alt={file.name}
                                  width={200}
                                  height={200}
                                  className="w-full h-32 object-cover"
                                />
                              ) : file.type === 'video' ? (
                                <video
                                  src={file.url}
                                  className="w-full h-32 object-cover"
                                  muted
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                  {getFileIcon(file.type)}
                                </div>
                              )}
                              <div className="p-3">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mr-3">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Painel de Detalhes */}
                {selectedFile && (
                  <div className="w-80 border-l bg-gray-50 p-6">
                    <h3 className="text-lg font-semibold mb-4">Detalhes do Arquivo</h3>
                    
                    {/* Preview */}
                    <div className="mb-4">
                      {selectedFile.type === 'image' ? (
                        <Image
                          src={selectedFile.url}
                          alt={selectedFile.name}
                          width={300}
                          height={200}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : selectedFile.type === 'video' ? (
                        <video
                          src={selectedFile.url}
                          controls
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                          {getFileIcon(selectedFile.type)}
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="space-y-3 mb-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Nome</label>
                        <p className="text-sm text-gray-900">{selectedFile.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tamanho</label>
                        <p className="text-sm text-gray-900">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tipo</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedFile.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Upload</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedFile.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleSelectFile(selectedFile)}
                        className="w-full"
                      >
                        <Eye size={16} className="mr-2" />
                        Selecionar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(selectedFile.url)}
                        className="w-full"
                      >
                        <Copy size={16} className="mr-2" />
                        Copiar URL
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteFile(selectedFile.id)}
                        className="w-full text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Input de Upload Oculto */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}