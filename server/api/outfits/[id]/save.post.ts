import { eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { saves, sharedOutfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const sharedOutfitId = getRouterParam(event, 'id')

  // Verify the shared outfit exists
  const [shared] = await db
    .select({ id: sharedOutfits.id })
    .from(sharedOutfits)
    .where(eq(sharedOutfits.id, sharedOutfitId))

  if (!shared) {
    throw createError({ statusCode: 404, statusMessage: 'Shared outfit not found' })
  }

  // Check if already saved
  const [existing] = await db
    .select()
    .from(saves)
    .where(and(eq(saves.userId, userId), eq(saves.outfitId, sharedOutfitId)))

  if (existing) {
    // Unsave: delete
    await db
      .delete(saves)
      .where(eq(saves.id, existing.id))
  } else {
    // Save: insert
    await db
      .insert(saves)
      .values({ userId, outfitId: sharedOutfitId })
  }

  return { saved: !existing }
})
