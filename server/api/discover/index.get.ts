import { eq, desc, count } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { sharedOutfits, publicProfiles, outfits, likes } from '~~/server/db/schema'
import { getOptionalUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0
  const viewerId = await getOptionalUserId(event)

  // Fetch shared outfits from public profiles only, ordered newest first
  const shared = await db
    .select({
      id: sharedOutfits.id,
      shortId: sharedOutfits.shortId,
      outfitId: sharedOutfits.outfitId,
      outfitName: outfits.name,
      outfitOccasion: outfits.occasion,
      outfitItemIds: outfits.itemIds,
      sharerUsername: publicProfiles.username,
      sharerDisplayName: publicProfiles.displayName,
      createdAt: sharedOutfits.createdAt,
    })
    .from(sharedOutfits)
    .leftJoin(outfits, eq(sharedOutfits.outfitId, outfits.id))
    .leftJoin(publicProfiles, eq(sharedOutfits.userId, publicProfiles.userId))
    .where(eq(publicProfiles.isPublic, true))
    .orderBy(desc(sharedOutfits.createdAt))
    .limit(limit)
    .offset(offset)

  // Get like counts for each shared outfit
  const feedItems = await Promise.all(
    shared.map(async (s) => {
      const [likeCountRow] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.outfitId, s.id))
      return { ...s, likeCount: (likeCountRow as any)?.count ?? 0 }
    })
  )

  return { items: feedItems, limit, offset }
})
