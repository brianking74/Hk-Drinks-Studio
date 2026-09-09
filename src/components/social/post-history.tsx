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
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: <CheckCircle2 className="size-3" />,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    icon: <Calendar className="size-3" />,
  },
  draft: {
    label: 'Draft',
    color: 'bg-muted text-muted-foreground',
    icon: <Clock3 className="size-3" />,
  },
  failed: {
    label: 'Failed',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Post history</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No posts yet. Generate a caption and publish to see it here.
          </div>
        ) : (
          <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {posts.map((p) => {
              const platforms = p.platforms.split(',')
              const sb = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft
              return (
                <div
                  key={p.id}
                  className="flex gap-3 rounded-lg border p-3 hover:bg-muted/30"
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="size-16 shrink-0 rounded-md object-cover bg-muted"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={sb.color} variant="secondary">
                        {sb.icon} {sb.label}
                      </Badge>
                      {platforms.map((pl) =>
                        pl === 'facebook' ? (
                          <Facebook key="fb" className="size-3.5 text-blue-600" />
                        ) : pl === 'instagram' ? (
                          <Instagram key="ig" className="size-3.5 text-pink-600" />
                        ) : null
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          p.publishedAt || p.scheduledAt || p.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
                      {p.caption}
                    </p>
                    {p.hashtags && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {p.hashtags}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      {p.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryPost(p.id)}
                        >
                          Post now
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePost(p.id)}
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
