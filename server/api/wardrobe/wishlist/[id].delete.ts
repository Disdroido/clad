import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wishlistItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  const [existing] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, id))
    .limit(1)

  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Wishlist item not found' })
  }

  await db.delete(wishlistItems).where(eq(wishlistItems.id, id))

  return { success: true }
})
