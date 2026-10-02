import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishToFacebook, publishToInstagram } from '@/lib/meta'

export const runtime = 'nodejs'
export const maxDuration = 60

// Re-publish a previously scheduled/draft/failed post immediately.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await db.post.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    const platforms = post.platforms.split(',')
    const fullCaption = post.caption + (post.hashtags ? `\n\n${post.hashtags}` : '')

    // If the post's imageUrl is a placeholder (e.g. from a data-URL upload),
    // we can't retry — the original image is gone.
    if (post.imageUrl === '(uploaded image — not stored)' || post.imageUrl.startsWith('data:')) {
      return NextResponse.json(
        {
          error:
            'Cannot retry — original image was uploaded as a data URL and is not stored. Please publish a new post with the image re-uploaded.',
        },
        { status: 400 }
      )
    }

    let fbPostId = post.fbPostId
    let igPostId = post.igPostId
    const errors: string[] = []

    const publishPromises: Promise<void>[] = []

    if (platforms.includes('facebook') && !fbPostId) {
      publishPromises.push(
        publishToFacebook(post.imageUrl, fullCaption).then((res) => {
          if (res.ok && res.postId) {
            fbPostId = res.postId
          } else {
            errors.push(`Facebook: ${res.error}`)
          }
        })
      )
    }
    if (platforms.includes('instagram') && !igPostId) {
      publishPromises.push(
        publishToInstagram(post.imageUrl, fullCaption).then((res) => {
          if (res.ok && res.postId) {
            igPostId = res.postId
          } else {
            errors.push(`Instagram: ${res.error}`)
          }
        })
      )
    }

    await Promise.all(publishPromises)

    const anyOk = (fbPostId !== null && platforms.includes('facebook')) ||
                  (igPostId !== null && platforms.includes('instagram'))
    const status = anyOk ? 'published' : 'failed'

    const updated = await db.post.update({
      where: { id },
      data: {
        status,
        fbPostId,
        igPostId,
        publishedAt: status === 'published' ? new Date() : post.publishedAt,
        errorMessage: errors.length ? errors.join(' | ') : null,
      },
    })

    return NextResponse.json({ ok: anyOk, post: updated, errors })
  } catch (err) {
    console.error('[posts/retry] error', err)
    return NextResponse.json(
      { error: 'Could not retry publish.' },
      { status: 500 }
    )
  }
}
