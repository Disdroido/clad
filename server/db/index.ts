import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Drizzle ORM instance, lazily constructed per-request so Cloudflare Pages
 * Workers (which init modules once per isolate) pick up runtime config
 * correctly. Better Auth's drizzle adapter, and all app queries, go through
 * this.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (_db) return _db
  const { neonDatabaseUrl } = useRuntimeConfig()
  if (!neonDatabaseUrl) {
    throw new Error('NEON_DATABASE_URL is not set')
  }
  const sql = neon(neonDatabaseUrl as string)
  _db = drizzle(sql, { schema })
  return _db
}

export { schema }
