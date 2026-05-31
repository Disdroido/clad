/**
 * Resolve runtime config on Cloudflare Workers.
 *
 * Nuxt bakes runtimeConfig defaults at build time. Wrangler vars/secrets are
 * only available at runtime via process.env — and Nuxt expects NUXT_* names
 * for automatic override. This helper merges both so auth/DB work in prod.
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
  const raw = (url || 'http://localhost:3000').trim().replace(/\/$/, '')
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  // workers.dev and custom domains are always HTTPS in production
  return `https://${raw}`
}

export function getServerEnv() {
  const config = useRuntimeConfig()

  const appUrl = normalizeAppUrl(
    (config.public.appUrl as string | undefined)
      || env('NUXT_PUBLIC_APP_URL', 'PUBLIC_APP_URL'),
  )

  const authSecret =
    (config.authSecret as string | undefined)
    || env('NUXT_AUTH_SECRET', 'AUTH_SECRET')

  const neonDatabaseUrl =
    (config.neonDatabaseUrl as string | undefined)
    || env('NUXT_NEON_DATABASE_URL', 'NEON_DATABASE_URL')

  const openrouterApiKey =
    (config.openrouterApiKey as string | undefined)
    || env('NUXT_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY')

  const r2AccountId =
    (config.r2AccountId as string | undefined)
    || env('NUXT_R2_ACCOUNT_ID', 'R2_ACCOUNT_ID')

  const r2ApiToken =
    (config.r2ApiToken as string | undefined)
    || env('NUXT_R2_API_TOKEN', 'R2_API_TOKEN')

  const r2BucketName =
    (config.r2BucketName as string | undefined)
    || env('NUXT_R2_BUCKET_NAME', 'R2_BUCKET_NAME')

  const r2PublicUrl =
    (config.r2PublicUrl as string | undefined)
    || env('NUXT_R2_PUBLIC_URL', 'R2_PUBLIC_URL')

  return {
    appUrl,
    authSecret,
    neonDatabaseUrl,
    openrouterApiKey,
    r2AccountId,
    r2ApiToken,
    r2BucketName,
    r2PublicUrl,
    isProduction: !appUrl.includes('localhost'),
  }
}

export function requireServerEnv<K extends keyof ReturnType<typeof getServerEnv>>(
  key: K,
): NonNullable<ReturnType<typeof getServerEnv>[K]> {
  const envVars = getServerEnv()
  const value = envVars[key]
  if (!value) {
    throw new Error(`Missing required config: ${String(key)}`)
  }
  return value as NonNullable<ReturnType<typeof getServerEnv>[K]>
}
