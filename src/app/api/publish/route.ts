import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishToFacebook, publishToInstagram } from '@/lib/meta'

export const runtime = 'nodejs'
// Real Meta Graph API calls can take a few seconds each
export const maxDuration = 60

interface PublishBody {
  imageUrl: string
  caption: string
  hashtags?: string
  platforms: string[] // ['facebook', 'instagram']
  scheduledAt?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PublishBody

    if (!body?.imageUrl || !body?.caption) {
      return NextResponse.json(
        { error: 'imageUrl and caption are required.' },
        { status: 400 }
      )
    }
    if (!body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        { error: 'Pick at least one platform (Facebook / Instagram).' },
        { status: 400 }
      )
    }

    const fullCaption =
      body.caption + (body.hashtags ? `\n\n${body.hashtags}` : '')

    const platformsStr = body.platforms.join(',')
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null

    // If user scheduled, persist as scheduled (no API call yet).
    if (scheduledAt && scheduledAt.getTime() > Date.now() + 60_000) {
      // Scheduled posts can't use data URLs (too large for DB storage).
      // User must provide a public URL for scheduled posts.
      if (body.imageUrl.startsWith('data:')) {
        return NextResponse.json(
          {
            error:
              'Scheduled posts require a public image URL (https://...). Data URLs from uploads are only supported for immediate publishing. Either publish now, or upload the image to a public host (e.g. hkdrinks.shop) and use that URL.',
          },
          { status: 400 }
        )
      }
      const post = await db.post.create({
        data: {
          imageUrl: body.imageUrl,
          caption: body.caption,
          hashtags: body.hashtags || null,
          platforms: platformsStr,
          status: 'scheduled',
          scheduledAt,
        },
      })
      return NextResponse.json({
        ok: true,
        mode: 'scheduled',
        postId: post.id,
        scheduledAt: post.scheduledAt,
      })
    }

    // Immediate publish — fan out per platform
    let fbPostId: string | null = null
    let igPostId: string | null = null
    let fbPostUrl: string | null = null
    let igPostUrl: string | null = null
    const errors: string[] = []

    // Run publishes in parallel for speed
    const publishPromises: Promise<void>[] = []

    if (body.platforms.includes('facebook')) {
      publishPromises.push(
        publishToFacebook(body.imageUrl, fullCaption).then((res) => {
          if (res.ok && res.postId) {
            fbPostId = res.postId
            fbPostUrl = res.postUrl || null
          } else {
            errors.push(`Facebook: ${res.error}`)
          }
        })
      )
    }
    if (body.platforms.includes('instagram')) {
      publishPromises.push(
        publishToInstagram(body.imageUrl, fullCaption).then((res) => {
          if (res.ok && res.postId) {
            igPostId = res.postId
            igPostUrl = res.postUrl || null
          } else {
            errors.push(`Instagram: ${res.error}`)
          }
        })
      )
    }

    await Promise.all(publishPromises)

    // Determine overall status: published if at least one platform succeeded
    const anyOk = (fbPostId !== null) || (igPostId !== null)
    const status = errors.length === 0
      ? 'published'
      : anyOk
        ? 'published' // partial success still counts as published
        : 'failed'

    // For the DB record, we don't want to store huge data URLs.
    // Use a placeholder if it's a data URL.
    const dbImageUrl = body.imageUrl.startsWith('data:')
      ? '(uploaded image — not stored)'
      : body.imageUrl

    const post = await db.post.create({
      data: {
        imageUrl: dbImageUrl,
        caption: body.caption,
        hashtags: body.hashtags || null,
        platforms: platformsStr,
        status,
        fbPostId,
        igPostId,
        publishedAt: status === 'published' ? new Date() : null,
        errorMessage: errors.length ? errors.join(' | ') : null,
      },
    })

    return NextResponse.json({
      ok: anyOk,
      mode: 'published',
      postId: post.id,
      fbPostId,
      igPostId,
      fbPostUrl,
      igPostUrl,
      errors,
    })
  } catch (err) {
    console.error('[publish] error', err)
    return NextResponse.json(
      { error: 'Publishing failed unexpectedly. Please try again.' },
      { status: 500 }
    )
  }
}
