import { promises as fs } from 'fs'
import path from 'path'

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
 * Resolve a relative image URL to a local file path on disk (for uploads).
 * Returns null if the image is not a local file (e.g. an external https URL).
 */
function resolveLocalImagePath(imageUrl: string): string | null {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return null // external URL — Meta will fetch it directly
  }
  // Relative path like /uploads/abc.jpg → /home/z/my-project/public/uploads/abc.jpg
  const publicDir = path.join(process.cwd(), 'public')
  return path.join(publicDir, imageUrl)
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
 * Uses multipart file upload when the image is a local file (more reliable —
 * Meta doesn't need to fetch the image from a public URL).
 * Falls back to URL-based upload for external https image URLs.
 *
 * Endpoint: POST /{page-id}/photos
 * Docs: https://developers.facebook.com/docs/graph-api/reference/page/photos/
 */
export async function publishToFacebook(
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const { pageId, pageAccessToken, appBaseUrl } = getConfig()
  const url = `${META_API_BASE}/${pageId}/photos`

  try {
    const localPath = resolveLocalImagePath(imageUrl)

    if (localPath) {
      // Multipart file upload — read the file and send it directly
      const fileBuffer = await fs.readFile(localPath)
      const filename = path.basename(localPath)
      const ext = path.extname(localPath).toLowerCase()
      const mimeType =
        ext === '.png' ? 'image/png'
        : ext === '.webp' ? 'image/webp'
        : ext === '.gif' ? 'image/gif'
        : 'image/jpeg'

      const formData = new FormData()
      formData.append('access_token', pageAccessToken)
      formData.append('caption', caption)
      formData.append('published', 'true')
      formData.append('source', new Blob([fileBuffer], { type: mimeType }), filename)

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      })

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
    } else {
      // External URL — Meta fetches it directly
      const absoluteImageUrl = imageUrl // already absolute

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: absoluteImageUrl,
          caption,
          access_token: pageAccessToken,
          published: true,
        }),
      })

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
 * NOTE: IG requires a publicly-accessible image URL. If the image is a local
 * file, you must host it publicly before passing to this function.
 *
 * Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */
export async function publishToInstagram(
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const { igUserId, pageAccessToken, appBaseUrl } = getConfig()

  if (!igUserId) {
    return {
      ok: false,
      platform: 'instagram',
      error: 'META_IG_USER_ID is not configured.',
    }
  }

  // IG requires a public URL — convert relative paths to absolute
  const absoluteImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `${appBaseUrl}${imageUrl}`

  try {
    // Step 1: Create the media container
    const createUrl = `${META_API_BASE}/${igUserId}/media`
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: absoluteImageUrl,
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

/**
 * Save an uploaded image (already on disk) and return its public URL.
 * Used by the publish flow to ensure Meta can fetch the image.
 */
export async function getPublicImageUrl(relativePath: string): Promise<string> {
  const { appBaseUrl } = getConfig()
  return `${appBaseUrl}${relativePath}`
}
