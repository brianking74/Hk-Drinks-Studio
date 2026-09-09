import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface PublishBody {
  imageUrl: string
  caption: string
  hashtags?: string
  platforms: string[] // ['facebook', 'instagram']
  scheduledAt?: string | null
}

/**
 * MOCK Meta Graph API publisher.
 *
 * In real production this function would:
 *   - For Facebook: POST to
 *     https://graph.facebook.com/v19.0/{page-id}/photos
 *     with params: url, caption, access_token
 *   - For Instagram: 2-step
 *     1) POST /v19.0/{ig-user-id}/media with image_url, caption → returns creation_id
 *     2) POST /v19.0/{ig-user-id}/media_publish with creation_id
 *
 * For now we simulate both calls and store deterministic-looking IDs.
 */
async function publishToFacebook(imageUrl: string, caption: string): Promise<{ ok: boolean; postId: string; error?: string }> {
  await new Promise((r) => setTimeout(r, 700))
  // Mock response shape mirrors the real API
  return {
    ok: true,
    postId: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
  }
}

async function publishToInstagram(imageUrl: string, caption: string): Promise<{ ok: boolean; postId: string; error?: string }> {
  // Simulate 2-step container-create + publish
  await new Promise((r) => setTimeout(r, 1000))
  return {
    ok: true,
    postId: `ig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
  }
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

    // If user scheduled, just persist as scheduled (no API call yet).
    if (scheduledAt && scheduledAt.getTime() > Date.now() + 60_000) {
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
    const errors: string[] = []

    if (body.platforms.includes('facebook')) {
      const res = await publishToFacebook(body.imageUrl, fullCaption)
      if (res.ok) fbPostId = res.postId
      else errors.push(`Facebook: ${res.error}`)
    }
    if (body.platforms.includes('instagram')) {
      const res = await publishToInstagram(body.imageUrl, fullCaption)
      if (res.ok) igPostId = res.postId
      else errors.push(`Instagram: ${res.error}`)
    }

    const status = errors.length === 0 ? 'published' : 'failed'

    const post = await db.post.create({
      data: {
        imageUrl: body.imageUrl,
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
      ok: status === 'published',
      mode: 'published',
      postId: post.id,
      fbPostId,
      igPostId,
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
