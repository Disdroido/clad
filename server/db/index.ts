import { neon } from '@neondatabase/serverless'

const config = useRuntimeConfig()

export function useDb() {
  const sql = neon(config.neonDatabaseUrl)
  return sql
}

// Typed query wrappers
export async function query<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  const db = useDb()
  return db(strings, ...values) as Promise<T[]>
}
