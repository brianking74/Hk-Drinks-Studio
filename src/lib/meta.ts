const META_API_VERSION = 'v19.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

interface MetaConfig {
  appId: string
  appSecret: string
  pageId: string
  igUserId: string
  pageAccessToken: string
  appBaseUrl: string
}

function getConfig(): MetaConfig {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const pageId = process.env.META_PAGE_ID
  const igUserId = process.env.META_IG_USER_ID
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!appId || !appSecret || !pageId || !pageAccessToken) {
    throw new Error(
      'Meta credentials are not configured. Set META_APP_ID, META_APP_SECRET, META_PAGE_ID, and META_PAGE_ACCESS_TOKEN in .env'
    )
  }

  return { appId, appSecret, pageId, igUserId: igUserId || '', pageAccessToken, appBaseUrl }
}

/**
 * Try to resolve an image reference to a Buffer + filename + mimeType that we can
 * pass directly to Meta. Supports:
 *   - Absolute https URL  → fetch it from origin
 *   - Local file path (relative to /public, e.g. /uploads/abc.jpg) → read from disk
 *   - Data URL (data:image/...;base64,...) → decode
 *
 * Returns null if the image is already a public URL that Meta can fetch on its own
 * (we just pass the URL through in that case).
 */
async function resolveImageForUpload(
  imageRef: string
): Promise<{ buffer: Buffer; filename: string; mimeType: string } | { publicUrl: string }> {
  // Data URL → decode to buffer
  if (imageRef.startsWith('data:')) {
    const match = imageRef.match(/^data:(image\/[a-z]+);base64,(.+)$/i)
    if (!match) throw new Error('Invalid data URL')
    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/gif' ? 'gif' : 'jpg'
    return { buffer, filename: `upload.${ext}`, mimeType }
  }

  // External URL → let Meta fetch it directly (no need to download on our side)
  if (imageRef.startsWith('http://') || imageRef.startsWith('https://')) {
    return { publicUrl: imageRef }
  }

  // Local file path → read from disk (works on local dev, not on Vercel serverless)
  // On Vercel, /public is read-only at runtime — but our upload flow now uses data URLs
  // (uploaded by the user, kept in memory on the server, passed as data URL to publish).
  // So this branch is mainly for local dev / preview environments.
  const fs = await import('fs/promises')
  const path = await import('path')
  const publicDir = path.join(process.cwd(), 'public')
  const localPath = path.join(publicDir, imageRef)
  const buffer = await fs.readFile(localPath)
  const filename = path.basename(localPath)
  const ext = path.extname(localPath).toLowerCase()
  const mimeType =
    ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.gif' ? 'image/gif'
    : 'image/jpeg'
  return { buffer, filename, mimeType }
}

export interface PublishResult {
  ok: boolean
  platform: 'facebook' | 'instagram'
  postId?: string
  postUrl?: string
  error?: string
}

/**
 * Publish a photo to a Facebook Page using the Graph API.
 *
 * Strategy:
 *   - If image is a local file or data URL → multipart file upload (no public URL needed)
 *   - If image is an external https URL → URL-based upload (Meta fetches it directly)
 *
 * Endpoint: POST /{page-id}/photos
 * Docs: https://developers.facebook.com/docs/graph-api/reference/page/photos/
 */
export async function publishToFacebook(
  imageRef: string,
  caption: string
): Promise<PublishResult> {
  const { pageId, pageAccessToken } = getConfig()
  const url = `${META_API_BASE}/${pageId}/photos`

  try {
    const resolved = await resolveImageForUpload(imageRef)

    let res: Response

    if ('buffer' in resolved) {
      // Multipart file upload
      const formData = new FormData()
      formData.append('access_token', pageAccessToken)
      formData.append('caption', caption)
      formData.append('published', 'true')
      formData.append('source', new Blob([resolved.buffer], { type: resolved.mimeType }), resolved.filename)
      res = await fetch(url, { method: 'POST', body: formData })
    } else {
      // URL-based upload
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: resolved.publicUrl,
          caption,
          access_token: pageAccessToken,
          published: true,
        }),
      })
    }

    const data = await res.json()

    if (!res.ok || data.error) {
      return {
        ok: false,
        platform: 'facebook',
        error: data.error?.message || `HTTP ${res.status}`,
      }
    }

    const postId = data.post_id || data.id
    return {
      ok: true,
      platform: 'facebook',
      postId,
      postUrl: `https://www.facebook.com/${pageId}_posts/${postId}`,
    }
  } catch (err) {
    return {
      ok: false,
      platform: 'facebook',
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

/**
 * Publish an image to Instagram via the 2-step Content Publishing API.
 *
 * Step 1: POST /{ig-user-id}/media — creates a media container
 * Step 2: POST /{ig-user-id}/media_publish — publishes the container
 *
 * NOTE: IG Content Publishing API REQUIRES a publicly-accessible image URL.
 * If the image is local or a data URL, we CANNOT publish to IG without first
 * uploading it to a public host. The app currently returns an error in this case.
 *
 * Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */
export async function publishToInstagram(
  imageRef: string,
  caption: string
): Promise<PublishResult> {
  const { igUserId, pageAccessToken } = getConfig()

  if (!igUserId) {
    return {
      ok: false,
      platform: 'instagram',
      error: 'META_IG_USER_ID is not configured.',
    }
  }

  // IG requires a public URL — data URLs and local paths don't work
  if (!imageRef.startsWith('http://') && !imageRef.startsWith('https://')) {
    return {
      ok: false,
      platform: 'instagram',
      error: 'Instagram publishing requires a publicly-accessible image URL. Upload the image to a public host (e.g. your CDN, Cloudinary, or hkdrinks.shop) and pass that URL.',
    }
  }

  try {
    // Step 1: Create the media container
    const createUrl = `${META_API_BASE}/${igUserId}/media`
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageRef,
        caption,
        access_token: pageAccessToken,
      }),
    })

    const createData = await createRes.json()

    if (!createRes.ok || createData.error) {
      return {
        ok: false,
        platform: 'instagram',
        error: createData.error?.message || `Container creation failed (HTTP ${createRes.status})`,
      }
    }

    const creationId = createData.id

    // Step 2: Publish the container
    const publishUrl = `${META_API_BASE}/${igUserId}/media_publish`
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: pageAccessToken,
      }),
    })

    const publishData = await publishRes.json()

    if (!publishRes.ok || publishData.error) {
      return {
        ok: false,
        platform: 'instagram',
        error: publishData.error?.message || `Publish failed (HTTP ${publishRes.status})`,
      }
    }

    const postId = publishData.id
    return {
      ok: true,
      platform: 'instagram',
      postId,
      postUrl: `https://www.instagram.com/p/${postId}/`,
    }
  } catch (err) {
    return {
      ok: false,
      platform: 'instagram',
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

/**
 * Refresh the long-lived User Access Token (extends to 60 more days).
 * Page Access Tokens derived from it stay valid as long as the user token is valid.
 *
 * Endpoint: GET /oauth/access_token?grant_type=fb_exchange_token
 * Docs: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-exchange-tokens
 *
 * NOTE: This requires a valid long-lived user token (NOT a page token).
 * The page token is non-expiring as long as the user token is valid.
 */
export async function refreshUserToken(longUserToken: string): Promise<{ ok: boolean; newToken?: string; expiresAt?: number; error?: string }> {
  const { appId, appSecret } = getConfig()
  const url = `${META_API_BASE.replace(META_API_VERSION, 'v19.0')}/oauth/access_token`

  try {
    const res = await fetch(
      `${url}?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${longUserToken}`
    )
    const data = await res.json()

    if (!res.ok || data.error) {
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` }
    }

    return {
      ok: true,
      newToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 5184000) * 1000,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

/**
 * Verify the current Page Access Token is still valid.
 */
export async function verifyPageToken(): Promise<{ valid: boolean; scopes?: string[]; error?: string }> {
  const { pageAccessToken } = getConfig()
  const url = `${META_API_BASE}/debug_token`

  try {
    const res = await fetch(
      `${url}?input_token=${pageAccessToken}&access_token=${pageAccessToken}`
    )
    const data = await res.json()

    if (!res.ok || data.error) {
      return { valid: false, error: data.error?.message || `HTTP ${res.status}` }
    }

    return {
      valid: data.data.is_valid === true,
      scopes: data.data.scopes,
    }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
