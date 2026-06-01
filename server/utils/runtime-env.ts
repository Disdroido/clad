import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

/**
 * Resolve runtime config on Cloudflare Workers.
 *
 * Nuxt bakes runtimeConfig defaults at build time (often localhost). Wrangler
 * vars/secrets are only available at runtime via process.env. Env vars must
 * take precedence, and we fall back to the request URL when the baked default
 * is still localhost in production.
 */
function env(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  return undefined
}

/** Ensure Better Auth baseURL/trustedOrigins always include a protocol. */
export function normalizeAppUrl(url: string | undefined): string {
  const raw = (url || '').trim().replace(/\/$/, '')
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `https://${raw}`
}

function originFromEvent(event: H3Event): string | undefined {
  const headerOrigin = getRequestHeader(event, 'origin')
  if (headerOrigin) return headerOrigin.replace(/\/$/, '')

  const url = getRequestURL(event)
  if (url.host) return `${url.protocol}//${url.host}`.replace(/\/$/, '')
  return undefined
}

export function getAppUrl(event?: H3Event): string {
  const config = useRuntimeConfig()

  // Env vars (Wrangler dashboard / secrets) beat baked build-time config.
  const configured = normalizeAppUrl(
    env('NUXT_PUBLIC_APP_URL', 'PUBLIC_APP_URL')
      || (config.public.appUrl as string | undefined),
  )

  if (configured && !configured.includes('localhost')) {
    return configured
  }

  // Build defaulted to localhost — use the actual browser/worker URL.
  if (event) {
    const requestOrigin = originFromEvent(event)
    if (requestOrigin && !requestOrigin.includes('localhost')) {
      return requestOrigin
    }
  }

  return configured || 'http://localhost:3000'
}

export function getServerEnv(event?: H3Event) {
  const config = useRuntimeConfig()
  const appUrl = getAppUrl(event)

  const authSecret =
    env('NUXT_AUTH_SECRET', 'AUTH_SECRET')
    || (config.authSecret as string | undefined)

  const neonDatabaseUrl =
    env('NUXT_NEON_DATABASE_URL', 'NEON_DATABASE_URL')
    || (config.neonDatabaseUrl as string | undefined)

  const openrouterApiKey =
    env('NUXT_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY')
    || (config.openrouterApiKey as string | undefined)

  const weatherApiKey =
    env('NUXT_WEATHER_API_KEY', 'WEATHER_API_KEY')
    || (config.weatherApiKey as string | undefined)

  const r2AccountId =
    env('NUXT_R2_ACCOUNT_ID', 'R2_ACCOUNT_ID')
    || (config.r2AccountId as string | undefined)

  const r2ApiToken =
    env('NUXT_R2_API_TOKEN', 'R2_API_TOKEN')
    || (config.r2ApiToken as string | undefined)

  const r2BucketName =
    env('NUXT_R2_BUCKET_NAME', 'R2_BUCKET_NAME')
    || (config.r2BucketName as string | undefined)

  const r2PublicUrl =
    env('NUXT_R2_PUBLIC_URL', 'R2_PUBLIC_URL')
    || (config.r2PublicUrl as string | undefined)

  return {
    appUrl,
    authSecret,
    neonDatabaseUrl,
    openrouterApiKey,
    weatherApiKey,
    r2AccountId,
    r2ApiToken,
    r2BucketName,
    r2PublicUrl,
    isProduction: !appUrl.includes('localhost'),
  }
}

export function requireServerEnv<K extends keyof ReturnType<typeof getServerEnv>>(
  key: K,
  event?: H3Event,
): NonNullable<ReturnType<typeof getServerEnv>[K]> {
  const envVars = getServerEnv(event)
  const value = envVars[key]
  if (!value) {
    throw new Error(`Missing required config: ${String(key)}`)
  }
  return value as NonNullable<ReturnType<typeof getServerEnv>[K]>
}

/** Origins Better Auth should accept (configured URL + live request origin). */
export function getTrustedOrigins(event?: H3Event): string[] {
  const origins = new Set<string>()
  const appUrl = getAppUrl(event)
  if (appUrl) origins.add(appUrl)

  if (event) {
    const requestOrigin = originFromEvent(event)
    if (requestOrigin) origins.add(requestOrigin)
  }

  return [...origins]
}
