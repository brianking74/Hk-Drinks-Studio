import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Re-publish a previously scheduled/draft post immediately.
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

    // Simulate immediate publish
    const platforms = post.platforms.split(',')
    let fbPostId = post.fbPostId
    let igPostId = post.igPostId

    await new Promise((r) => setTimeout(r, 600))
    if (platforms.includes('facebook') && !fbPostId) {
      fbPostId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    }
    if (platforms.includes('instagram') && !igPostId) {
      igPostId = `ig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        status: 'published',
        fbPostId,
        igPostId,
        publishedAt: new Date(),
        errorMessage: null,
      },
    })

    return NextResponse.json({ ok: true, post: updated })
  } catch (err) {
    console.error('[posts/retry] error', err)
    return NextResponse.json(
      { error: 'Could not retry publish.' },
      { status: 500 }
    )
  }
}
