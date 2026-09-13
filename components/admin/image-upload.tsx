'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, X, ImageIcon, Link2 } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  description?: string
  aspectRatio?: 'square' | 'card' | 'banner'
}

export function ImageUpload({
  value,
  onChange,
  label = 'Image',
  description = 'Upload a photo or enter an image URL',
  aspectRatio = 'card',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [useUrlMode, setUseUrlMode] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WEBP, or GIF)')
      return
    }

    // Check size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await res.json()
      onChange(data.url)
      toast.success('Image uploaded successfully!')
    } catch (err: unknown) {
      console.error('Upload error:', err)
      toast.error((err as Error)?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    onChange(urlInput.trim())
    setUrlInput('')
    setUseUrlMode(false)
    toast.success('Image URL set!')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <Label>{label}</Label>}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground h-7 px-2"
          onClick={() => setUseUrlMode(!useUrlMode)}
        >
          {useUrlMode ? (
            <>
              <Upload className="w-3 h-3 mr-1" /> Switch to File Upload
            </>
          ) : (
            <>
              <Link2 className="w-3 h-3 mr-1" /> Paste URL Instead
            </>
          )}
        </Button>
      </div>

      {value ? (
        <div className="relative group border rounded-lg overflow-hidden bg-muted/40 p-2">
          <div className="relative w-full h-48 sm:h-64 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="max-h-full max-w-full object-contain rounded-md"
            />
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 shadow-md"
              onClick={() => onChange('')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-2 text-center">
            {value}
          </p>
        </div>
      ) : useUrlMode ? (
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/card.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleUrlSubmit()
              }
            }}
          />
          <Button type="button" onClick={handleUrlSubmit}>
            Set URL
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleUpload(e.target.files[0])
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-sm font-medium">
              {uploading ? 'Uploading to Supabase Storage...' : 'Click or drag & drop image'}
            </div>
            <p className="text-xs text-muted-foreground">
              Supports JPEG, PNG, WEBP, GIF up to 10MB
            </p>
          </div>
        </div>
      )}

      {description && !value && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
