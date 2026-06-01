import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { scheduledOutfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'
import { and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  // Verify ownership
  const [existing] = await db
    .select()
    .from(scheduledOutfits)
    .where(and(eq(scheduledOutfits.id, id), eq(scheduledOutfits.userId, userId)))

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Scheduled outfit not found' })
  }

  await db
    .delete(scheduledOutfits)
    .where(eq(scheduledOutfits.id, id))

  return { success: true }
})