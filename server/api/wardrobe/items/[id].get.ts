import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || id === 'undefined') {
    throw createError({ statusCode: 400, message: 'Invalid item ID' })
  }

  const [item] = await db
    .select()
    .from(wardrobeItems)
    .where(eq(wardrobeItems.id, id))
    .limit(1)

  if (!item || item.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  return item
})
