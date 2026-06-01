/**
 * Cloudflare R2 helpers.
 *
 * On Workers we prefer the native R2 binding (no API token required).
 * Locally, or when no binding is configured, we fall back to the REST API
 * with a Bearer token (cfat_... or Account API token with R2 Edit).
 */

import type { H3Event } from 'h3'
import { getR2Binding } from './r2-binding'
import { getServerEnv, requireServerEnv } from './runtime-env'

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
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function getR2RestConfig() {
  const { r2PublicUrl } = getServerEnv()
  const accountId = requireServerEnv('r2AccountId')
  const apiToken = requireServerEnv('r2ApiToken')
  const bucket = requireServerEnv('r2BucketName')

  return { accountId, apiToken, bucket, publicUrl: r2PublicUrl }
}

export function r2PublicUrl(key: string): string {
  const { r2PublicUrl: publicUrl } = getServerEnv()
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL is not set. Add your r2.dev or custom-domain URL.')
  }
  return `${publicUrl.replace(/\/$/, '')}/${encodeKey(key)}`
}

async function uploadViaBinding(
  bucket: ReturnType<typeof getR2Binding>,
  key: string,
  body: R2UploadBody,
  options: UploadToR2Options,
): Promise<UploadToR2Result> {
  await bucket!.put(key, body as BodyInit, {
    httpMetadata: {
      contentType: options.contentType ?? 'application/octet-stream',
      cacheControl: options.cacheControl,
    },
  })
  return { key, url: r2PublicUrl(key) }
}

async function uploadViaRestApi(
  key: string,
  body: R2UploadBody,
  options: UploadToR2Options,
): Promise<UploadToR2Result> {
  const { accountId, apiToken, bucket } = getR2RestConfig()

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
    if (res.status === 401) {
      throw new Error(
        'R2 authentication failed. On Cloudflare Workers, add an R2 bucket binding in wrangler.jsonc. '
        + 'For local dev, use an Account API token (not an R2 S3 key) with Account → R2 → Edit permission.',
      )
    }
    throw new Error(`R2 upload failed (${res.status} ${res.statusText}): ${detail}`)
  }

  return { key, url: r2PublicUrl(key) }
}

export async function uploadToR2(
  key: string,
  body: R2UploadBody,
  options: UploadToR2Options = {},
  event?: H3Event,
): Promise<UploadToR2Result> {
  const binding = getR2Binding(event)
  if (binding) {
    return uploadViaBinding(binding, key, body, options)
  }
  return uploadViaRestApi(key, body, options)
}

async function deleteViaBinding(
  bucket: ReturnType<typeof getR2Binding>,
  key: string,
): Promise<void> {
  await bucket!.delete(key)
}

async function deleteViaRestApi(key: string): Promise<void> {
  const { accountId, apiToken, bucket } = getR2RestConfig()

  const url = `${CF_API_BASE}/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeKey(key)}`

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  })

  if (!res.ok && res.status !== 404) {
    const detail = await res.text().catch(() => '')
    throw new Error(`R2 delete failed (${res.status} ${res.statusText}): ${detail}`)
  }
}

export async function deleteFromR2(key: string, event?: H3Event): Promise<void> {
  const binding = getR2Binding(event)
  if (binding) {
    await deleteViaBinding(binding, key)
    return
  }
  await deleteViaRestApi(key)
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
