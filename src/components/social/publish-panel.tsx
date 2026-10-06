'use client'

import { Calendar, Clock, Facebook, Instagram, Loader2, Send, Link2 } from 'lucide-react'
import { useState } from 'react'
import { usePostStore, type PlatformId } from '@/store/post-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { buildFooter, normalizeProductLink } from '@/lib/footer'

const PLATFORMS: { id: PlatformId; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: <Facebook className="size-4" />,
    color: 'bg-[#1877F2]',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="size-4" />,
    color: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  },
]

export function PublishPanel() {
  const { draft, isPublishing, setPublishing, reset, togglePlatform, setProductLink } =
    usePostStore()
  const { toast } = useToast()
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>('')

  const canPublish =
    draft.imageUrl &&
    draft.caption.trim().length > 0 &&
    draft.platforms.length > 0 &&
    !isPublishing

  // Preview of the footer that will be appended to the caption at publish time.
  // Recomputed whenever the product link changes.
  const footerPreview = buildFooter(draft.productLink)
  const normalizedLink = normalizeProductLink(draft.productLink)

  const onPublish = async () => {
    if (!canPublish) {
      toast({
        title: 'Missing info',
        description: 'You need an image, a caption, and at least one platform.',
        variant: 'destructive',
      })
      return
    }
    if (scheduleMode && !scheduledAt) {
      toast({
        title: 'Pick a date and time',
        description: 'Scheduling needs a future date/time.',
        variant: 'destructive',
      })
      return
    }
    setPublishing(true)
    try {
      const endpoint = scheduleMode ? '/api/schedule' : '/api/publish'
      const payload = scheduleMode
        ? {
            imageUrl: draft.imageUrl,
            caption: draft.caption,
            hashtags: draft.hashtags,
            platforms: draft.platforms,
            productLink: draft.productLink,
            scheduledAt: new Date(scheduledAt).toISOString(),
          }
        : {
            imageUrl: draft.imageUrl,
            caption: draft.caption,
            hashtags: draft.hashtags,
            platforms: draft.platforms,
            productLink: draft.productLink,
          }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')

      if (scheduleMode) {
        toast({
          title: 'Scheduled!',
          description: `Will post at ${new Date(scheduledAt).toLocaleString()}`,
        })
      } else if (data.errors?.length > 0 && !data.ok) {
        // Both platforms failed
        toast({
          title: 'Publish failed',
          description: data.errors.join(' | '),
          variant: 'destructive',
        })
      } else if (data.errors?.length > 0) {
        // Partial success
        const succeeded = draft.platforms.filter(p => !data.errors.some((e: string) => e.toLowerCase().startsWith(p)))
        toast({
          title: 'Partial publish',
          description: `Posted to ${succeeded.join(' + ')}, but: ${data.errors.join('; ')}`,
          variant: 'default',
        })
      } else {
        toast({
          title: 'Published!',
          description: `Went live on ${draft.platforms.join(' + ')}.`,
        })
      }
      reset()
      setScheduledAt('')
      setScheduleMode(false)
      // Trigger history refresh
      window.dispatchEvent(new CustomEvent('post-history:refresh'))
    } catch (err) {
      toast({
        title: 'Publish failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Label className="eyebrow mb-3 block text-[0.65rem]">Platforms</Label>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map((p) => {
            const active = draft.platforms.includes(p.id)
            const isIgUnavailable = p.id === 'instagram'
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlatform(p.id)}
                title={isIgUnavailable && !active ? 'Currently unavailable — IG account issue. Toggle on to attempt anyway.' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md p-3 text-left transition-all border relative',
                  active
                    ? 'border-[var(--gold)] bg-[rgba(201,168,76,0.08)]'
                    : isIgUnavailable
                      ? 'border-[rgba(179,38,30,0.3)] bg-[rgba(179,38,30,0.03)] hover:bg-[rgba(179,38,30,0.06)]'
                      : 'border-[rgba(201,168,76,0.2)] hover:border-[rgba(201,168,76,0.4)] hover:bg-[rgba(201,168,76,0.03)]'
                )}
              >
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-md text-white',
                    p.color,
                    isIgUnavailable && !active && 'opacity-50'
                  )}
                >
                  {p.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[var(--off-white)]">{p.label}</span>
                  <span className="block text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    {active
                      ? 'Will post'
                      : isIgUnavailable
                        ? 'Unavailable'
                        : 'Off'}
                  </span>
                </span>
                <Switch checked={active} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-[rgba(201,168,76,0.2)] bg-black/30 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm text-[var(--off-white)]">
          <Calendar className="size-4 text-[var(--gold)]" />
          <span className="font-medium">Schedule for later</span>
        </div>
        <Switch
          checked={scheduleMode}
          onCheckedChange={(c) => {
            setScheduleMode(c)
            if (!c) setScheduledAt('')
          }}
        />
      </div>

      {scheduleMode && (
        <div className="grid gap-2 animate-in fade-in-0">
          <Label htmlFor="scheduled-at" className="eyebrow text-[0.65rem]">Post at</Label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="border-[rgba(201,168,76,0.25)] bg-black/40 text-[var(--off-white)] focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30 [color-scheme:dark]"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3" />
            Your local time.
          </p>
        </div>
      )}

      {/* Product link — injected into the footer of every published post */}
      <div className="grid gap-2">
        <Label htmlFor="product-link" className="eyebrow text-[0.65rem] flex items-center gap-1.5">
          <Link2 className="size-3" />
          Product link (optional)
        </Label>
        <Input
          id="product-link"
          placeholder="e.g. /products/cincoro-reposado"
          value={draft.productLink}
          onChange={(e) => setProductLink(e.target.value)}
          className="border-[rgba(201,168,76,0.25)] bg-black/40 text-[var(--off-white)] placeholder:text-muted-foreground/70 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30"
        />
        {draft.productLink.trim() && (
          <p className="text-[0.65rem] text-muted-foreground/80 font-mono">
            → hkdrinks.shop{(normalizedLink.startsWith('hkdrinks.shop') ? normalizedLink.slice('hkdrinks.shop'.length) : '') || normalizedLink}
          </p>
        )}
      </div>

      {/* Footer preview — shown so user knows what gets appended */}
      <details className="rounded-md border border-[rgba(201,168,76,0.15)] bg-black/20 px-3 py-2 group">
        <summary className="cursor-pointer text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground hover:text-[var(--gold)] transition-colors select-none">
          Footer preview (auto-added to every post)
        </summary>
        <pre className="mt-2 text-[0.7rem] leading-relaxed text-[var(--cream)]/80 whitespace-pre-wrap font-sans">{footerPreview.trim()}</pre>
      </details>

      <Button
        type="button"
        onClick={onPublish}
        disabled={!canPublish}
        size="lg"
        className={cn(
          'btn-lux w-full transition-all hover:-translate-y-0.5',
          scheduleMode
            ? 'bg-[#1a1a1a] text-[var(--gold)] border border-[var(--gold)] hover:bg-[rgba(201,168,76,0.08)] hover:shadow-[0_4px_20px_rgba(201,168,76,0.2)]'
            : 'bg-[var(--gold)] text-black hover:bg-[var(--gold-light)] hover:shadow-[0_4px_20px_rgba(201,168,76,0.3)]'
        )}
      >
        {isPublishing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {scheduleMode ? 'Scheduling…' : 'Publishing…'}
          </>
        ) : scheduleMode ? (
          <>
            <Calendar className="size-4" /> Schedule post
          </>
        ) : (
          <>
            <Send className="size-4" /> Publish now
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Posts publish live to Facebook via the Meta Graph API. Instagram is currently unavailable — toggle it on to attempt, or just post to FB.
      </p>
    </div>
  )
}
