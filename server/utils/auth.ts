import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDb } from '~~/server/db'

/**
 * Per-request Better Auth factory. We intentionally do NOT cache the instance
 * at module scope: the Better Auth maintainers explicitly warn against
 * singletons on Cloudflare Workers, since module state is reused across
 * isolates and can leak between requests. Constructing per request is also
 * the only way runtime config is reliably available.
 *
 * The cost is small — Better Auth's config object is lightweight; the
 * expensive bits (DB calls, password hashing) happen lazily.
 */
export function useAuth() {
  const config = useRuntimeConfig()
  const db = useDb()

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: config.authSecret as string,
    baseURL: config.public.appUrl as string,
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
    trustedOrigins: [config.public.appUrl as string].filter(Boolean),
  })
}
