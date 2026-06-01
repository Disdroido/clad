import { useDb } from '~~/server/db'
import { wishlistItems, clothingTypeEnum } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

const VALID_CATEGORIES = clothingTypeEnum.enumValues

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const body = await readBody(event)
  const { name, category, priority, notes, url } = body ?? {}

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Name is required' })
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw createError({
      statusCode: 400,
      message: `Category is required and must be one of: ${VALID_CATEGORIES.join(', ')}`,
    })
  }

  const [item] = await db
    .insert(wishlistItems)
    .values({
      userId,
      name: name.trim(),
      category,
      priority: priority || 'medium',
      notes: notes ?? null,
      url: url ?? null,
    })
    .returning()

  return item
})
