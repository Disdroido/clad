import type { H3Event } from 'h3'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDb } from '~~/server/db'
import { getServerEnv, getTrustedOrigins } from '~~/server/utils/runtime-env'

/**
 * Per-request Better Auth factory. Pass the H3 event so baseURL/trustedOrigins
 * match the live request origin on Cloudflare Workers (where build-time config
 * is often still localhost).
 */
export function useAuth(event?: H3Event) {
  const { authSecret, appUrl, isProduction } = getServerEnv(event)
  if (!authSecret) {
    throw new Error('AUTH_SECRET is not set')
  }

  const db = useDb()
  const trustedOrigins = getTrustedOrigins(event)

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
    trustedOrigins,
    advanced: {
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
