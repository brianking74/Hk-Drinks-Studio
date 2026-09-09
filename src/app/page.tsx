'use client'

import { Github, HeartPulse, ImageIcon, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ImageUploader } from '@/components/social/image-uploader'
import { CaptionGenerator } from '@/components/social/caption-generator'
import { PublishPanel } from '@/components/social/publish-panel'
import { PostHistory } from '@/components/social/post-history'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/40 via-background to-background dark:from-rose-950/10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-amber-500 text-white shadow-sm">
              <HeartPulse className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">HKDrinks Studio</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI-powered posting for Facebook & Instagram
              </p>
            </div>
          </div>
          <a
            href="https://developers.facebook.com/docs/graph-api"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Github className="size-3.5" /> Meta Graph API docs
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Sparkles className="size-5 text-rose-500" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              From photo to post in three steps
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload a drink photo · let AI draft the caption · publish to Facebook and/or Instagram.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Step 1 — Image */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StepBadge n={1} />
                  <CardTitle className="text-lg">Upload drink image</CardTitle>
                </div>
                <CardDescription>
                  Pick a clear photo of the drink, glass, bar, or café setting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StepBadge n={2} />
                  <CardTitle className="text-lg">Generate caption</CardTitle>
                </div>
                <CardDescription>
                  Our vision-AI reads the image and writes an HKDrinks-flavoured caption.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaptionGenerator />
              </CardContent>
            </Card>
          </div>

          {/* Step 3 — Publish */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StepBadge n={3} />
                  <CardTitle className="text-lg">Publish or schedule</CardTitle>
                </div>
                <CardDescription>
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
        <div className="mt-8">
          <PostHistory />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/60 mt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-3.5" />
            <span>HKDrinks Studio · v1 demo · publishing is currently mocked.</span>
          </div>
          <span>Built with Next.js + VLM vision AI</span>
        </div>
      </footer>
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-sm font-semibold dark:bg-rose-900/40 dark:text-rose-200">
      {n}
    </span>
  )
}
