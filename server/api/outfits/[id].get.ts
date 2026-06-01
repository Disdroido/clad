import { eq, inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits, wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  const [outfit] = await db
    .select()
    .from(outfits)
    .where(eq(outfits.id, id))

  if (!outfit) {
    throw createError({ statusCode: 404, message: 'Outfit not found' })
  }

  if (outfit.userId !== userId) {
    throw createError({ statusCode: 403, message: 'Not your outfit' })
  }

  const itemIds = outfit.itemIds ?? []
  let items: any[] = []
  if (itemIds.length > 0) {
    items = await db
      .select()
      .from(wardrobeItems)
      .where(inArray(wardrobeItems.id, itemIds))
  }

  return { ...outfit, items }
})