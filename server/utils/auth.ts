import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDb } from '~~/server/db'

/**
 * Lazy singleton: Better Auth needs the Drizzle instance, which depends on
 * runtime config, so we construct on first call rather than at module load.
 */
let _auth: ReturnType<typeof betterAuth> | null = null

export function useAuth() {
  if (_auth) return _auth
  const config = useRuntimeConfig()
  const db = useDb()

  _auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: config.authSecret as string,
    baseURL: config.public.appUrl as string,
    emailAndPassword: {
      enabled: true,
      // Auto-login after sign-up so the new user lands on /onboarding
      // already authenticated.
      autoSignIn: true,
      // We're not sending verification emails yet; turn on later.
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    // Browser session cookie lasts 30 days, refreshed on use.
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    // Trust the configured app URL when running behind Cloudflare.
    trustedOrigins: [config.public.appUrl as string].filter(Boolean),
  })
  return _auth
}
