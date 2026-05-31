import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDb } from '~~/server/db'
import { getServerEnv } from '~~/server/utils/runtime-env'

/**
 * Per-request Better Auth factory. We intentionally do NOT cache the instance
 * at module scope: the Better Auth maintainers explicitly warn against
 * singletons on Cloudflare Workers, since module state is reused across
 * isolates and can leak between requests. Constructing per request is also
 * the only way runtime config is reliably available.
 */
export function useAuth() {
  const { authSecret, appUrl, isProduction } = getServerEnv()
  if (!authSecret) {
    throw new Error('AUTH_SECRET is not set')
  }

  const db = useDb()

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: authSecret,
    baseURL: appUrl,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [appUrl],
    advanced: {
      // Cloudflare Workers expose the client IP via cf-connecting-ip, not
      // x-forwarded-for. Without this, rate limiting logs a warning (and is
      // skipped) on every auth request.
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
      },
      useSecureCookies: isProduction,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
      },
    },
  })
}
