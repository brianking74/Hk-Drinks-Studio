import { NextResponse } from 'next/server'
import { verifyPageToken } from '@/lib/meta'

export const runtime = 'nodejs'

// GET /api/meta/verify — checks if the Meta Page Access Token is valid
export async function GET() {
  try {
    const result = await verifyPageToken()
    return NextResponse.json({
      configured: {
        hasAppId: !!process.env.META_APP_ID,
        hasAppSecret: !!process.env.META_APP_SECRET,
        hasPageId: !!process.env.META_PAGE_ID,
        hasIgUserId: !!process.env.META_IG_USER_ID,
        hasPageAccessToken: !!process.env.META_PAGE_ACCESS_TOKEN,
        appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      },
      ...result,
    })
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
