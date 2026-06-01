import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  const [outfit] = await db
    .select()
    .from(outfits)
    .where(eq(outfits.id, id))

  if (!outfit || outfit.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Outfit not found' })
  }

  const body = await readBody(event)
  const rating = Number(body?.rating)

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw createError({
      statusCode: 400,
      message: 'Rating must be a number between 1 and 5',
    })
  }

  const [updated] = await db
    .update(outfits)
    .set({ rating })
    .where(eq(outfits.id, id))
    .returning({ id: outfits.id, rating: outfits.rating })

  return updated
})
