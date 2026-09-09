'use client'

import { useEffect, useState, useCallback } from 'react'
import { Facebook, Instagram, RefreshCw, Trash2, Calendar, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Post {
  id: string
  imageUrl: string
  caption: string
  hashtags: string | null
  platforms: string
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  published: {
    label: 'Published',
    color: 'bg-[rgba(201,168,76,0.15)] text-[var(--gold)] border border-[rgba(201,168,76,0.3)]',
    icon: <CheckCircle2 className="size-3" />,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-[rgba(201,168,76,0.08)] text-[var(--cream)] border border-[rgba(201,168,76,0.25)]',
    icon: <Calendar className="size-3" />,
  },
  draft: {
    label: 'Draft',
    color: 'bg-[#222] text-muted-foreground border border-[rgba(255,255,255,0.1)]',
    icon: <Clock3 className="size-3" />,
  },
  failed: {
    label: 'Failed',
    color: 'bg-[rgba(179,38,30,0.15)] text-[#f87171] border border-[rgba(179,38,30,0.3)]',
    icon: <XCircle className="size-3" />,
  },
}

export function PostHistory() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/posts?limit=50')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener('post-history:refresh', handler)
    return () => window.removeEventListener('post-history:refresh', handler)
  }, [load])

  const retryPost = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Published', description: 'Post is now live.' })
      load()
    } catch (err) {
      toast({
        title: 'Retry failed',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      })
    }
  }

  const deletePost = async (id: string) => {
    try {
      await fetch(`/api/posts?id=${id}`, { method: 'DELETE' })
      load()
    } catch {
      // silent
    }
  }

  return (
    <Card className="border-[rgba(201,168,76,0.2)] bg-[#1a1a1a] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-[0.65rem] mb-1">Archive</p>
            <CardTitle
              className="text-white"
              style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400, fontSize: '1.6rem', lineHeight: 1.2 }}
            >
              Post history
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
            className="text-muted-foreground hover:text-[var(--gold)] hover:bg-transparent"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p
              className="text-[var(--cream)]"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '1.05rem' }}
            >
              No posts yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Generate a caption and publish to see it appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {posts.map((p) => {
              const platforms = p.platforms.split(',')
              const sb = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft
              return (
                <div
                  key={p.id}
                  className="flex gap-3 rounded-md border border-[rgba(201,168,76,0.15)] p-3 hover:border-[rgba(201,168,76,0.35)] hover:bg-[rgba(201,168,76,0.03)] transition-all"
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="size-16 shrink-0 rounded-sm object-cover bg-black border border-[rgba(201,168,76,0.2)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={sb.color} variant="secondary">
                        {sb.icon} {sb.label}
                      </Badge>
                      {platforms.map((pl) =>
                        pl === 'facebook' ? (
                          <Facebook key="fb" className="size-3.5 text-[#1877F2]" />
                        ) : pl === 'instagram' ? (
                          <Instagram key="ig" className="size-3.5 text-[#DD2A7B]" />
                        ) : null
                      )}
                      <span className="text-xs text-muted-foreground font-sans">
                        {new Date(
                          p.publishedAt || p.scheduledAt || p.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>
                    <p
                      className="mt-1.5 line-clamp-2 text-[var(--off-white)]"
                      style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.95rem', lineHeight: 1.5 }}
                    >
                      {p.caption}
                    </p>
                    {p.hashtags && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground font-mono">
                        {p.hashtags}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      {p.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryPost(p.id)}
                          className="btn-lux h-7 border-[var(--gold)] text-[var(--gold)] hover:bg-[rgba(201,168,76,0.08)] hover:text-[var(--gold)]"
                        >
                          Post now
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePost(p.id)}
                        className="size-7 p-0 text-muted-foreground hover:text-[#f87171] hover:bg-transparent"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
