import { eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { trips } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  const [existing] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, userId)))

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Trip not found' })
  }

  await db
    .delete(trips)
    .where(eq(trips.id, id))

  return { success: true }
})