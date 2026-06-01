import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  const [item] = await db
    .select()
    .from(wardrobeItems)
    .where(eq(wardrobeItems.id, id))

  if (!item || item.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  const body = await readBody(event)
  const isArchived = body?.isArchived === true

  const [updated] = await db
    .update(wardrobeItems)
    .set({ isArchived })
    .where(eq(wardrobeItems.id, id))
    .returning()

  return updated
})