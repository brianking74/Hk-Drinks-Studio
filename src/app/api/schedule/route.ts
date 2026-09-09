import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface ScheduleBody {
  imageUrl: string
  caption: string
  hashtags?: string
  platforms: string[]
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

    const post = await db.post.create({
      data: {
        imageUrl: body.imageUrl,
        caption: body.caption,
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
