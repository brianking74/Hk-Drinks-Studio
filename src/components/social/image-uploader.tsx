'use client'

import { useCallback, useState, useRef } from 'react'
import { UploadCloud, X, Loader2, ImageIcon } from 'lucide-react'
import { usePostStore } from '@/store/post-store'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function ImageUploader() {
  const {
    imageUrl,
    isUploading,
    setImage,
    setUploading,
    reset,
  } = usePostStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Only images allowed',
          description: 'Please upload JPG, PNG, WEBP or GIF.',
          variant: 'destructive',
        })
        return
      }
      if (file.size > 12 * 1024 * 1024) {
        toast({
          title: 'Image too large',
          description: 'Maximum size is 12 MB.',
          variant: 'destructive',
        })
        return
      }
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        setImage(data.url, data.filename)
      } catch (err) {
        toast({
          title: 'Upload failed',
          description:
            err instanceof Error ? err.message : 'Please try again.',
          variant: 'destructive',
        })
      } finally {
        setUploading(false)
      }
    },
    [setImage, setUploading, toast]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  return (
    <div className="space-y-3">
      {!imageUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group relative cursor-pointer rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors',
            dragActive
              ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
              : 'border-muted-foreground/30 hover:border-rose-400/60 hover:bg-rose-50/30 dark:hover:bg-rose-950/10'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
              e.currentTarget.value = ''
            }}
          />
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
            {isUploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <UploadCloud className="size-6" />
            )}
          </div>
          <p className="font-medium">
            {isUploading ? 'Uploading…' : 'Drop an image or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG / PNG / WEBP / GIF · up to 12 MB
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border bg-muted/20">
          <img
            src={imageUrl}
            alt="Uploaded preview"
            className="mx-auto max-h-[420px] w-full object-contain bg-background"
          />
          <button
            type="button"
            onClick={() => reset()}
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="size-3.5" /> Remove
          </button>
        </div>
      )}

      {!imageUrl && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="size-3.5" />
          <span>
            Tip: clearer drink photos give better captions
          </span>
        </div>
      )}
    </div>
  )
}
