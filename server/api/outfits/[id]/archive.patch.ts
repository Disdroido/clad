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
  const isArchived = body?.isArchived === true

  const [updated] = await db
    .update(outfits)
    .set({ isArchived })
    .where(eq(outfits.id, id))
    .returning()

  return updated
})