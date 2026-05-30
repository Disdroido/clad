/**
 * One-shot DB reset. Drops everything in the public schema so `db:push` can
 * recreate from the current Drizzle schema with no conflicts.
 *
 * Run with:  npm run db:reset
 *
 * Safe to delete after launch — only meant for pre-prod resets.
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadDotenv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  }
  catch {
    // .env optional
  }
}

async function main() {
  loadDotenv()
  const url = process.env.NEON_DATABASE_URL
  if (!url) {
    console.error('NEON_DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = neon(url)
  console.log('Dropping public schema…')
  await sql`DROP SCHEMA IF EXISTS public CASCADE`
  await sql`CREATE SCHEMA public`
  await sql`GRANT ALL ON SCHEMA public TO public`
  console.log('Done. Now run: npm run db:push')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
