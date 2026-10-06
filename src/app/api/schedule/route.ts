import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { appendFooter } from '@/lib/footer'

export const runtime = 'nodejs'

interface ScheduleBody {
  imageUrl: string
  caption: string
  hashtags?: string
  platforms: string[]
  productLink?: string
  scheduledAt: string // ISO
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScheduleBody

    if (!body?.imageUrl || !body?.caption || !body?.scheduledAt) {
      return NextResponse.json(
        { error: 'imageUrl, caption and scheduledAt are required.' },
        { status: 400 }
      )
    }
    if (!body.platforms?.length) {
      return NextResponse.json(
        { error: 'Pick at least one platform.' },
        { status: 400 }
      )
    }

    const when = new Date(body.scheduledAt)
    if (when.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future.' },
        { status: 400 }
      )
    }

    // Scheduled posts can't use data URLs (too large for DB storage + no way
    // to re-fetch at publish time). User must provide a public URL.
    if (body.imageUrl.startsWith('data:')) {
      return NextResponse.json(
        {
          error:
            'Scheduled posts require a public image URL (https://...). Data URLs from uploads are only supported for immediate publishing. Either publish now, or upload the image to a public host (e.g. hkdrinks.shop) and use that URL.',
        },
        { status: 400 }
      )
    }

    // Bake the footer into the stored caption so the scheduled post
    // publishes with the same CTA block as immediate publishes.
    const captionWithHashtags =
      body.caption + (body.hashtags ? `\n\n${body.hashtags}` : '')
    const fullCaption = appendFooter(captionWithHashtags, body.productLink || '')

    const post = await db.post.create({
      data: {
        imageUrl: body.imageUrl,
        caption: fullCaption,
        hashtags: body.hashtags || null,
        platforms: body.platforms.join(','),
        status: 'scheduled',
        scheduledAt: when,
      },
    })

    return NextResponse.json({ ok: true, post })
  } catch (err) {
    console.error('[schedule] error', err)
    return NextResponse.json(
      { error: 'Scheduling failed. Please try again.' },
      { status: 500 }
    )
  }
}
