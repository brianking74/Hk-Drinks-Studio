import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const status = searchParams.get('status') // optional filter

    const posts = await db.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      where: status ? { status } : undefined,
    })

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('[posts] error', err)
    return NextResponse.json(
      { error: 'Could not load post history.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    await db.post.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[posts delete] error', err)
    return NextResponse.json(
      { error: 'Could not delete post.' },
      { status: 500 }
    )
  }
}
