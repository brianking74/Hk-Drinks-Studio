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
        <Label htmlFor="brand-voice" className="eyebrow text-[0.65rem]">Brand voice (optional)</Label>
        <Input
          id="brand-voice"
          placeholder="e.g. moody, editorial, gift-guide tone"
          value={draft.brandVoice}
          onChange={(e) =>
            usePostStore.getState().setBrandVoice(e.target.value)
          }
          className="border-[rgba(201,168,76,0.25)] bg-black/40 text-[var(--off-white)] placeholder:text-muted-foreground/70 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="extra-context" className="eyebrow text-[0.65rem]">Extra context (optional)</Label>
        <Input
          id="extra-context"
          placeholder="e.g. launch of Cincoro Extra Añejo, festive gift set"
          value={draft.extraContext}
          onChange={(e) =>
            usePostStore.getState().setExtraContext(e.target.value)
          }
          className="border-[rgba(201,168,76,0.25)] bg-black/40 text-[var(--off-white)] placeholder:text-muted-foreground/70 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30"
        />
      </div>

      <Button
        type="button"
        onClick={generate}
        disabled={isGenerating || !draft.imageUrl}
        className="btn-lux w-full bg-[var(--gold)] text-black hover:bg-[var(--gold-light)] hover:shadow-[0_4px_20px_rgba(201,168,76,0.3)] hover:-translate-y-0.5 transition-all"
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
          <Label htmlFor="caption" className="eyebrow text-[0.65rem]">Caption</Label>
          <span className="text-xs text-muted-foreground font-sans">
            {draft.caption.length} chars
          </span>
        </div>
        <Textarea
          id="caption"
          placeholder="The AI caption will appear here. Feel free to edit."
          value={draft.caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          className="resize-y border-[rgba(201,168,76,0.25)] bg-black/40 text-[var(--off-white)] placeholder:text-muted-foreground/70 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', lineHeight: 1.6 }}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="hashtags" className="eyebrow text-[0.65rem]">Hashtags</Label>
        <Textarea
          id="hashtags"
          placeholder="#HKDrinks #PremiumSpirits ..."
          value={draft.hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          rows={2}
          className="resize-y border-[rgba(201,168,76,0.25)] bg-black/40 text-[var(--off-white)] placeholder:text-muted-foreground/70 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30 font-mono text-xs"
        />
      </div>
    </div>
  )
}
