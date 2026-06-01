import { eq, and, count } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { likes, sharedOutfits } from '~~/server/db/schema'
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

  // Check if already liked
  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.outfitId, sharedOutfitId)))

  if (existing) {
    // Unlike: delete the like
    await db
      .delete(likes)
      .where(eq(likes.id, existing.id))
  } else {
    // Like: insert
    await db
      .insert(likes)
      .values({ userId, outfitId: sharedOutfitId })
  }

  // Get updated like count
  const [likeCountRow] = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.outfitId, sharedOutfitId))

  return {
    liked: !existing,
    likeCount: (likeCountRow as any)?.count ?? 0,
  }
})
