import { inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const body = await readBody(event)
  const ids: string[] = body?.ids ?? []

  if (!ids.length) {
    throw createError({ statusCode: 400, message: 'No IDs provided' })
  }

  const deleted = await db
    .delete(outfits)
    .where(inArray(outfits.id, ids))
    .where(eq(outfits.userId, userId))
    .returning({ id: outfits.id })

  return { deleted: deleted.map(d => d.id) }
})