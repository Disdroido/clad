import { useDb } from '~~/server/db'
import { outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const body = await readBody(event)
  const { itemIds, explanation, occasion } = body ?? {}

  if (!itemIds?.length || !explanation || !occasion) {
    throw createError({
      statusCode: 400,
      message: 'itemIds, explanation and occasion are required',
    })
  }

  const [saved] = await db
    .insert(outfits)
    .values({
      userId,
      itemIds,
      explanation,
      occasion,
    })
    .returning()

  return saved
})
