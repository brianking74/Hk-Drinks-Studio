import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_SIZE = 12 * 1024 * 1024 // 12 MB

/**
 * Image upload route — serverless-friendly.
 *
 * Instead of saving to /public/uploads (which is read-only on Vercel),
 * we return the image as a data URL. The client keeps it in memory
 * and passes it directly to /api/publish, which forwards it to Meta
 * via multipart upload.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum 12 MB.' },
        { status: 413 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are supported.' },
        { status: 415 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (err) {
    console.error('[upload] error', err)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
