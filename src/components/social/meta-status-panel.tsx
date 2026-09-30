'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlatformStatus {
  platform: 'facebook' | 'instagram'
  ok: boolean
  status: 'live' | 'failed' | 'not_configured'
  message: string
  details?: Record<string, unknown>
}

interface StatusResponse {
  configured: boolean
  statuses: PlatformStatus[]
  checkedAt?: string
  message?: string
}

const PLATFORM_META = {
  facebook: { label: 'Facebook', color: '#1877F2', icon: '📘' },
  instagram: { label: 'Instagram', color: '#DD2A7B', icon: '📸' },
}

export function MetaStatusPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/meta/status')
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus({
        configured: false,
        statuses: [],
        message: 'Could not reach /api/meta/status',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Card className="border-[rgba(201,168,76,0.2)] bg-[#1a1a1a] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-[0.65rem] mb-1">Connection</p>
            <CardTitle
              className="text-white"
              style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400, fontSize: '1.4rem', lineHeight: 1.2 }}
            >
              Meta platform status
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            className="text-muted-foreground hover:text-[var(--gold)] hover:bg-transparent"
            aria-label="Refresh status"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!status?.configured ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Checking…
              </span>
            ) : (
              status?.message || 'Not configured'
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {status.statuses.map((s) => {
              const meta = PLATFORM_META[s.platform]
              return (
                <div
                  key={s.platform}
                  className={cn(
                    'rounded-md border p-3',
                    s.ok
                      ? 'border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.05)]'
                      : 'border-[rgba(179,38,30,0.3)] bg-[rgba(179,38,30,0.05)]'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="flex size-7 items-center justify-center rounded-md text-white text-xs font-semibold"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.label[0]}
                    </span>
                    <span className="text-sm font-medium text-[var(--off-white)]">
                      {meta.label}
                    </span>
                    {s.ok ? (
                      <Badge tone="ok" />
                    ) : (
                      <Badge tone="err" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.message}
                  </p>
                  {s.details && Object.keys(s.details).length > 0 && (
                    <p className="text-[0.65rem] text-muted-foreground/70 mt-1.5 font-mono">
                      {Object.entries(s.details)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(' · ')}
                    </p>
                  )}
                  {!s.ok && s.platform === 'instagram' && (
                    <a
                      href="https://business.facebook.com/settings/security"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] font-medium text-[var(--gold)] hover:underline"
                    >
                      <ExternalLink className="size-3" /> Start free verification
                    </a>
                  )}
                </div>
              )
            })}
            <p className="text-[0.65rem] text-muted-foreground/70 text-center pt-2 border-t border-[rgba(201,168,76,0.15)]">
              Checked {status.checkedAt ? new Date(status.checkedAt).toLocaleString() : 'never'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Badge({ tone }: { tone: 'ok' | 'err' }) {
  if (tone === 'ok') {
    return (
      <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wider font-semibold text-[var(--gold)] border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.1)]">
        <CheckCircle2 className="size-3" /> Live
      </span>
    )
  }
  return (
    <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wider font-semibold text-[#f87171] border border-[rgba(179,38,30,0.4)] bg-[rgba(179,38,30,0.1)]">
      <AlertTriangle className="size-3" /> Issue
    </span>
  )
}
