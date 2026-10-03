'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
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

  const hasErrors = status?.statuses.some((s) => !s.ok) ?? false

  return (
    <Card className="border-[rgba(201,168,76,0.2)] bg-[#1a1a1a] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {/* Top row: title + platform pills + refresh */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Title block */}
          <div className="flex items-center gap-2 mr-2">
            <p className="eyebrow text-[0.6rem]">Connection</p>
            <span
              className="text-white text-base sm:text-lg"
              style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400, lineHeight: 1.2 }}
            >
              Meta platform status
            </span>
          </div>

          {/* Platform pills — inline, horizontal */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {!status?.configured ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Checking…
                  </>
                ) : (
                  status?.message || 'Not configured'
                )}
              </span>
            ) : (
              status.statuses.map((s) => {
                const meta = PLATFORM_META[s.platform]
                return (
                  <div
                    key={s.platform}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
                      s.ok
                        ? 'border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.1)]'
                        : 'border-[rgba(179,38,30,0.4)] bg-[rgba(179,38,30,0.1)]'
                    )}
                    title={s.message}
                  >
                    <span
                      className="flex size-4 items-center justify-center rounded-sm text-white text-[0.55rem] font-semibold"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.label[0]}
                    </span>
                    <span className="text-[var(--off-white)] font-medium">{meta.label}</span>
                    {s.ok ? (
                      <CheckCircle2 className="size-3.5 text-[var(--gold)]" />
                    ) : (
                      <AlertTriangle className="size-3.5 text-[#f87171]" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            className="text-muted-foreground hover:text-[var(--gold)] hover:bg-transparent h-8 w-8 p-0"
            aria-label="Refresh status"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Error messages row — only shows if there are issues */}
        {status?.configured && hasErrors && (
          <div className="space-y-1.5 pt-2 border-t border-[rgba(201,168,76,0.15)]">
            {status.statuses
              .filter((s) => !s.ok)
              .map((s) => {
                const meta = PLATFORM_META[s.platform]
                return (
                  <div key={s.platform} className="flex flex-wrap items-start gap-x-2 gap-y-1 text-xs">
                    <span className="font-medium text-[#f87171] whitespace-nowrap">
                      {meta.label}:
                    </span>
                    <span className="text-muted-foreground leading-relaxed flex-1 min-w-0">
                      {s.message}
                    </span>
                    {s.platform === 'instagram' && (
                      <a
                        href="https://business.facebook.com/settings/security"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.12em] font-medium text-[var(--gold)] hover:underline whitespace-nowrap"
                      >
                        <ExternalLink className="size-3" /> Verify
                      </a>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {/* Footer — last checked timestamp */}
        {status?.configured && status.checkedAt && (
          <p className="text-[0.6rem] text-muted-foreground/60 text-right">
            Checked {new Date(status.checkedAt).toLocaleString()}
          </p>
        )}
      </div>
    </Card>
  )
}
