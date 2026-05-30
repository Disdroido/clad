import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Per-request Drizzle instance. On Cloudflare Workers we deliberately do NOT
 * cache this at module scope: runtime config is bound to the request, and
 * keeping connections at module scope is a footgun on a serverless runtime
 * with isolate reuse.
 */
export function useDb() {
  const { neonDatabaseUrl } = useRuntimeConfig()
  if (!neonDatabaseUrl) {
    throw new Error('NEON_DATABASE_URL is not set')
  }
  const sql = neon(neonDatabaseUrl as string)
  return drizzle(sql, { schema })
}

export { schema }
