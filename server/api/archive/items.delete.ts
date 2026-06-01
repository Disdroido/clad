import { inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
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
    .delete(wardrobeItems)
    .where(inArray(wardrobeItems.id, ids))
    .where(eq(wardrobeItems.userId, userId))
    .returning({ id: wardrobeItems.id })

  return { deleted: deleted.map(d => d.id) }
})