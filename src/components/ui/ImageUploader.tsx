'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ImagePlus, X, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageEditor } from './ImageEditor'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  showMediaManager?: boolean
  cropType?: 'banner' | 'square' | 'custom'
  aspectRatio?: number
  targetSize?: { width: number; height: number }
  recommendedDimensions?: string
}

export function ImageUploader({
  value,
  onChange,
  placeholder = 'Clique para selecionar',
  className = '',
  showMediaManager = true,
  cropType = 'square',
  aspectRatio,
  targetSize,
  recommendedDimensions,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleThumbnailClick = useCallback(() => {
    if (uploading) return
    fileInputRef.current?.click()
  }, [uploading])

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      const isValidImage = imageTypes.includes(file.type) || file.type.startsWith('image/')
      const fileNameLower = file.name.toLowerCase()
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      const hasValidExtension = validExtensions.some((ext) => fileNameLower.endsWith(ext))

      if (!isValidImage && !hasValidExtension) {
        toast.error('Selecione apenas imagens (JPG, PNG, GIF, WEBP, SVG).')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB')
        return
      }

      setFileName(file.name)
      setSelectedFile(file)
      setShowEditor(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    []
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploading) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (uploading) return
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        const fakeEvent = { target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>
        handleFileSelect(fakeEvent)
      } else {
        toast.error('Arraste apenas arquivos de imagem.')
      }
    },
    [uploading, handleFileSelect]
  )

  const handleEditorSave = (url: string) => {
    setPreview(url)
    onChange(url)
    setShowEditor(false)
    setSelectedFile(null)
  }

  const handleEditorCancel = () => {
    setShowEditor(false)
    setSelectedFile(null)
    setFileName(null)
  }

  const handleRemove = () => {
    setPreview(null)
    setFileName(null)
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={cn('w-full space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      {recommendedDimensions && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Dimensões recomendadas</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">{recommendedDimensions}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        <div
          onClick={handleThumbnailClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex h-52 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted',
            isDragging && 'border-primary/50 bg-primary/5',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          <div className="rounded-full bg-background p-3 shadow-sm">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{placeholder}</p>
            <p className="text-xs text-muted-foreground">ou arraste uma imagem aqui</p>
          </div>
          {uploading && (
            <p className="text-xs text-muted-foreground">Enviando...</p>
          )}
        </div>
      ) : (
        <div className="relative space-y-2">
          <div className="group relative h-52 overflow-hidden rounded-lg border border-border">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleThumbnailClick}
                className="h-9 w-9 p-0"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                className="h-9 w-9 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {(fileName || preview) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{fileName || 'Imagem enviada'}</span>
              <button
                type="button"
                onClick={handleRemove}
                className="ml-auto rounded-full p-1 hover:bg-muted"
                aria-label="Remover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {showEditor && selectedFile && (
        <ImageEditor
          file={selectedFile}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
          cropType={cropType}
          aspectRatio={aspectRatio}
          targetSize={targetSize}
        />
      )}
    </div>
  )
}
