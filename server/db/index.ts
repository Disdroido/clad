import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { requireServerEnv } from '../utils/runtime-env'

/**
 * Per-request Drizzle instance. On Cloudflare Workers we deliberately do NOT
 * cache this at module scope: runtime config is bound to the request, and
 * keeping connections at module scope is a footgun on a serverless runtime
 * with isolate reuse.
 */
export function useDb() {
  const neonDatabaseUrl = requireServerEnv('neonDatabaseUrl')
  const sql = neon(neonDatabaseUrl)
  return drizzle(sql, { schema })
}

export { schema }
