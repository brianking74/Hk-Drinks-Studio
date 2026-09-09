'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { usePostStore } from '@/store/post-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export function CaptionGenerator() {
  const {
    draft,
    setCaption,
    setHashtags,
    isGenerating,
    setGenerating,
  } = usePostStore()
  const { toast } = useToast()

  const generate = async () => {
    if (!draft.imageUrl) {
      toast({
        title: 'Upload an image first',
        description: 'You need an image to generate a caption.',
        variant: 'destructive',
      })
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: draft.imageUrl,
          brandVoice: draft.brandVoice,
          extraContext: draft.extraContext,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setCaption(data.caption || '')
      setHashtags(data.hashtags || '')
      toast({
        title: 'Caption ready',
        description: 'Edit below or publish as-is.',
      })
    } catch (err) {
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="brand-voice">Brand voice (optional)</Label>
        <Input
          id="brand-voice"
          placeholder="e.g. witty, Cantonese-Chinglish, Cha Chaan Teng vibes"
          value={draft.brandVoice}
          onChange={(e) =>
            usePostStore.getState().setBrandVoice(e.target.value)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="extra-context">Extra context (optional)</Label>
        <Input
          id="extra-context"
          placeholder="e.g. promo for Tsingtao beer collab, Wed special"
          value={draft.extraContext}
          onChange={(e) =>
            usePostStore.getState().setExtraContext(e.target.value)
          }
        />
      </div>

      <Button
        type="button"
        onClick={generate}
        disabled={isGenerating || !draft.imageUrl}
        className="w-full bg-rose-600 text-white hover:bg-rose-700"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Analyzing image…
          </>
        ) : (
          <>
            <Sparkles className="size-4" /> Generate caption with AI
          </>
        )}
      </Button>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="caption">Caption</Label>
          <span className="text-xs text-muted-foreground">
            {draft.caption.length} chars
          </span>
        </div>
        <Textarea
          id="caption"
          placeholder="The AI caption will appear here. Feel free to edit."
          value={draft.caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          className="resize-y"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="hashtags">Hashtags</Label>
        <Textarea
          id="hashtags"
          placeholder="#hkdrinks #hkfoodie ..."
          value={draft.hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          rows={2}
          className="resize-y"
        />
      </div>
    </div>
  )
}
