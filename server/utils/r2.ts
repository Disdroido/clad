/**
 * Cloudflare R2 helpers using the REST API with a Bearer token (cfat_...).
 *
 * We deliberately avoid the AWS SDK: the bundle is large and Cloudflare's
 * REST API works directly with the API token the user already has.
 *
 * Reference: https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/upload
 * The REST upload endpoint has a 300 MB cap per object, which is fine for
 * clothing photos. For larger files, switch to the S3 multipart API.
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

export type R2UploadBody = ArrayBuffer | Uint8Array | Buffer | Blob

export interface UploadToR2Options {
  contentType?: string
  cacheControl?: string
}

export interface UploadToR2Result {
  key: string
  url: string
}

function encodeKey(key: string): string {
  // Slashes in the key MUST be sent literally (not percent-encoded) per
  // Cloudflare's spec; everything else gets URL-encoded normally.
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function getR2Config() {
  const config = useRuntimeConfig()
  const accountId = config.r2AccountId as string | undefined
  const apiToken = config.r2ApiToken as string | undefined
  const bucket = config.r2BucketName as string | undefined
  const publicUrl = config.r2PublicUrl as string | undefined

  if (!accountId || !apiToken || !bucket) {
    throw new Error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_API_TOKEN and R2_BUCKET_NAME in your environment.',
    )
  }

  return { accountId, apiToken, bucket, publicUrl }
}

export function r2PublicUrl(key: string): string {
  const { publicUrl } = getR2Config()
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL is not set. Add your r2.dev or custom-domain URL.')
  }
  return `${publicUrl.replace(/\/$/, '')}/${encodeKey(key)}`
}

export async function uploadToR2(
  key: string,
  body: R2UploadBody,
  options: UploadToR2Options = {},
): Promise<UploadToR2Result> {
  const { accountId, apiToken, bucket } = getR2Config()

  const url = `${CF_API_BASE}/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeKey(key)}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': options.contentType ?? 'application/octet-stream',
  }
  if (options.cacheControl) {
    headers['Cache-Control'] = options.cacheControl
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: body as BodyInit,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`R2 upload failed (${res.status} ${res.statusText}): ${detail}`)
  }

  return { key, url: r2PublicUrl(key) }
}

export async function deleteFromR2(key: string): Promise<void> {
  const { accountId, apiToken, bucket } = getR2Config()

  const url = `${CF_API_BASE}/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeKey(key)}`

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  })

  // 404 is fine — object was already gone.
  if (!res.ok && res.status !== 404) {
    const detail = await res.text().catch(() => '')
    throw new Error(`R2 delete failed (${res.status} ${res.statusText}): ${detail}`)
  }
}

/**
 * Build a deterministic object key for a user's clothing item.
 * Example: users/abc123/items/2026-05-30T06-12-44-xyz.jpg
 */
export function buildClothingItemKey(userId: string, extension: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const rand = Math.random().toString(36).slice(2, 10)
  const ext = extension.replace(/^\./, '').toLowerCase() || 'jpg'
  return `users/${userId}/items/${ts}-${rand}.${ext}`
}
