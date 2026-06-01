import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wishlistItems, clothingTypeEnum } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

const VALID_CATEGORIES = clothingTypeEnum.enumValues

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

  const body = await readBody(event)
  const { name, category, priority, notes, url, isPurchased } = body ?? {}

  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    throw createError({
      statusCode: 400,
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    })
  }

  const setData: Record<string, any> = {}

  if (name !== undefined) setData.name = name
  if (category !== undefined) setData.category = category
  if (priority !== undefined) setData.priority = priority
  if (notes !== undefined) setData.notes = notes
  if (url !== undefined) setData.url = url
  if (isPurchased !== undefined) {
    setData.isPurchased = isPurchased
    if (isPurchased === true) {
      setData.purchasedAt = new Date()
    }
  }

  const [updated] = await db
    .update(wishlistItems)
    .set(setData)
    .where(eq(wishlistItems.id, id))
    .returning()

  const response: any = { ...updated }

  // If marking as purchased, include suggestion for adding to wardrobe
  if (isPurchased === true && !existing.isPurchased) {
    response.purchasedItem = {
      suggestedName: updated.name,
      suggestedCategory: updated.category,
    }
  }

  return response
})
