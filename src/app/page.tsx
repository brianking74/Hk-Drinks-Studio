'use client'

import { Wine, ExternalLink, Camera, Sparkles, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ImageUploader } from '@/components/social/image-uploader'
import { CaptionGenerator } from '@/components/social/caption-generator'
import { PublishPanel } from '@/components/social/publish-panel'
import { PostHistory } from '@/components/social/post-history'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[rgba(201,168,76,0.2)] bg-[rgba(10,10,10,0.97)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(10,10,10,0.85)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/hkdrinks-logo.png"
              alt="HK Drinks"
              className="h-10 sm:h-12 w-auto"
              style={{ filter: 'drop-shadow(0 0 1px rgba(201,168,76,0.3))' }}
            />
            <div className="border-l border-[rgba(201,168,76,0.2)] pl-3 ml-1">
              <p className="eyebrow text-[0.6rem] leading-tight">Studio</p>
              <p className="text-[0.65rem] text-muted-foreground leading-tight mt-0.5">
                Social poster
              </p>
            </div>
          </div>
          <a
            href="https://www.hkdrinks.shop/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] font-medium text-muted-foreground hover:text-[var(--gold)] transition-colors"
          >
            <ExternalLink className="size-3.5" /> Visit shop
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(201,168,76,0.2)] bg-[#0a0a0a]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(201,168,76,0.08) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 text-center">
          <p className="eyebrow">Premium Spirits · Hong Kong</p>
          <h1
            className="mt-5 font-semibold text-white"
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontSize: 'clamp(2.4rem, 5.5vw, 4.6rem)',
              lineHeight: 1.05,
            }}
          >
            From bottle to post,
            <br />
            <em className="text-[var(--gold)] italic">in one pour.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[var(--off-white)] font-light leading-relaxed">
            Upload a bottle or serve photo. HK Drinks' vision-AI reads the spirit, glass, and
            mood — then drafts an editorial caption for your Facebook and Instagram, in the
            voice of Hong Kong's home of premium spirits.
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Step 1 — Image */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[rgba(201,168,76,0.2)] bg-[#1a1a1a] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <StepBadge n={1} />
                  <div>
                    <p className="eyebrow mb-1">Step One</p>
                    <CardTitle
                      className="text-white"
                      style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400, fontSize: '1.6rem', lineHeight: 1.2 }}
                    >
                      Upload bottle or serve photo
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-[var(--cream)] mt-2">
                  A clear photo of the bottle, a pour, a cocktail, or the bar scene works best.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader />
              </CardContent>
            </Card>

            <Card className="border-[rgba(201,168,76,0.2)] bg-[#1a1a1a] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <StepBadge n={2} />
                  <div>
                    <p className="eyebrow mb-1">Step Two</p>
                    <CardTitle
                      className="text-white"
                      style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400, fontSize: '1.6rem', lineHeight: 1.2 }}
                    >
                      Generate editorial caption
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-[var(--cream)] mt-2">
                  Our vision-AI reads the image and writes an HK Drinks-flavoured caption.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaptionGenerator />
              </CardContent>
            </Card>
          </div>

          {/* Step 3 — Publish */}
          <div className="space-y-6">
            <Card className="border-[rgba(201,168,76,0.2)] bg-[#1a1a1a] shadow-[0_8px_40px_rgba(0,0,0,0.5)] lg:sticky lg:top-24">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <StepBadge n={3} />
                  <div>
                    <p className="eyebrow mb-1">Step Three</p>
                    <CardTitle
                      className="text-white"
                      style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400, fontSize: '1.6rem', lineHeight: 1.2 }}
                    >
                      Publish or schedule
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-[var(--cream)] mt-2">
                  Choose platforms and either post now or pick a future time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PublishPanel />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History */}
        <div className="mt-10">
          <PostHistory />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(201,168,76,0.2)] bg-[#0a0a0a] mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img
              src="/hkdrinks-logo.png"
              alt="HK Drinks"
              className="h-12 w-auto"
            />
            <p
              className="text-[var(--cream)] text-center sm:text-right max-w-md"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.9rem' }}
            >
              Hong Kong's home of premium spirits.
            </p>
          </div>

          {/* Statutory notice — bilingual, gold-left-border (legally required) */}
          <div
            className="rounded-sm bg-[#111111] p-4 sm:p-5"
            style={{ borderLeft: '3px solid var(--gold)' }}
          >
            <p className="text-xs text-[var(--cream)] leading-relaxed">
              Under the law of Hong Kong, intoxicating liquor must not be sold or supplied to a
              minor in the course of business.
            </p>
            <p className="mt-2 text-xs text-[var(--cream)] leading-relaxed" lang="zh-Hant">
              根據香港法律，不得在業務過程中，向未成年人售賣或供應令人醺醉的酒類。
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.15em] text-[var(--gold)] font-semibold">
              Please Drink Responsibly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wine className="size-3.5 text-[var(--gold)]" />
              <span>HKDrinks Studio · v1 demo · publishing is currently mocked.</span>
            </div>
            <span>HK Drinks · Authorised Retailer · © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-full border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.08)] text-[var(--gold)] text-sm font-semibold tracking-wider">
      {String(n).padStart(2, '0')}
    </span>
  )
}
