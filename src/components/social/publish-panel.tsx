'use client'

import { Calendar, Clock, Facebook, Instagram, Loader2, Send, ToggleLeft } from 'lucide-react'
import { useState } from 'react'
import { usePostStore, type PlatformId } from '@/store/post-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const PLATFORMS: { id: PlatformId; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: <Facebook className="size-4" />,
    color: 'bg-blue-600',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="size-4" />,
    color: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600',
  },
]

export function PublishPanel() {
  const { draft, isPublishing, setPublishing, reset, togglePlatform } =
    usePostStore()
  const { toast } = useToast()
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>('')

  const canPublish =
    draft.imageUrl &&
    draft.caption.trim().length > 0 &&
    draft.platforms.length > 0 &&
    !isPublishing

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
            scheduledAt: new Date(scheduledAt).toISOString(),
          }
        : {
            imageUrl: draft.imageUrl,
            caption: draft.caption,
            hashtags: draft.hashtags,
            platforms: draft.platforms,
          }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      toast({
        title: scheduleMode ? 'Scheduled!' : 'Published!',
        description: scheduleMode
          ? `Will post at ${new Date(scheduledAt).toLocaleString()}`
          : `Went live on ${draft.platforms.join(' + ')}.`,
      })
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
        <Label className="mb-2 block">Platforms</Label>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map((p) => {
            const active = draft.platforms.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  active
                    ? 'border-rose-300 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/30'
                    : 'border-muted-foreground/20 hover:bg-muted/40'
                )}
              >
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg text-white',
                    p.color
                  )}
                >
                  {p.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {active ? 'Will post to this' : 'Off'}
                  </span>
                </span>
                <Switch checked={active} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <ToggleLeft className="size-4" />
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
          <Label htmlFor="scheduled-at">Post at</Label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            Time zone: your local time.
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={onPublish}
        disabled={!canPublish}
        size="lg"
        className={cn(
          'w-full',
          scheduleMode
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
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

      <p className="text-xs text-muted-foreground text-center">
        Demo mode: posts are saved to your local history, not yet pushed to live Meta accounts.
        Wire your Meta credentials when ready to make it live.
      </p>
    </div>
  )
}
