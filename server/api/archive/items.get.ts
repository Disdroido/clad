import { desc, eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const items = await db
    .select()
    .from(wardrobeItems)
    .where(and(eq(wardrobeItems.isArchived, true), eq(wardrobeItems.userId, userId)))
    .orderBy(desc(wardrobeItems.createdAt))

  return { items }
})