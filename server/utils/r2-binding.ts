import type { H3Event } from 'h3'

/** Minimal R2 bucket surface used by this app. */
export interface R2BucketBinding {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob | null,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string }
    },
  ): Promise<unknown>
  delete(key: string): Promise<void>
}

const BINDING_NAME = 'R2_IMAGES'

/**
 * Resolve the Workers R2 binding when running on Cloudflare (or local Wrangler emulation).
 * Nitro exposes bindings on `event.context.cloudflare.env` and, on newer runtimes,
 * `event.req.runtime.cloudflare.env`.
 */
export function getR2Binding(event?: H3Event): R2BucketBinding | undefined {
  if (!event) return undefined

  const ctx = event.context as {
    cloudflare?: { env?: Record<string, R2BucketBinding> }
  }
  const fromContext = ctx.cloudflare?.env?.[BINDING_NAME]
  if (fromContext) return fromContext

  const req = (event as { req?: { runtime?: { cloudflare?: { env?: Record<string, R2BucketBinding> } } } }).req
  const fromRuntime = req?.runtime?.cloudflare?.env?.[BINDING_NAME]
  if (fromRuntime) return fromRuntime

  return undefined
}
