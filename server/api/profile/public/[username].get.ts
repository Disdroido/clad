import { eq, and, desc, count } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { publicProfiles, sharedOutfits, outfits, likes, follows } from '~~/server/db/schema'
import { getOptionalUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const username = getRouterParam(event, 'username')
  const viewerId = await getOptionalUserId(event)

  // Fetch public profile by username
  const [profile] = await db
    .select()
    .from(publicProfiles)
    .where(eq(publicProfiles.username, username))

  if (!profile || !profile.isPublic) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  // Fetch shared outfits by this user
  const shared = await db
    .select({
      id: sharedOutfits.id,
      shortId: sharedOutfits.shortId,
      outfitId: sharedOutfits.outfitId,
      outfitName: outfits.name,
      outfitOccasion: outfits.occasion,
      outfitItemIds: outfits.itemIds,
      createdAt: sharedOutfits.createdAt,
    })
    .from(sharedOutfits)
    .leftJoin(outfits, eq(sharedOutfits.outfitId, outfits.id))
    .where(eq(sharedOutfits.userId, profile.userId))
    .orderBy(desc(sharedOutfits.createdAt))

  // Get like counts for each shared outfit
  const outfitsWithLikes = await Promise.all(
    shared.map(async (s) => {
      const [likeCountRow] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.outfitId, s.id))
      return { ...s, likeCount: (likeCountRow as any)?.count ?? 0 }
    })
  )

  // Check if viewer is following
  let viewerFollowing = false
  if (viewerId) {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, profile.id)))
    viewerFollowing = !!follow
  }

  return {
    ...profile,
    sharedCount: shared.length,
    outfits: outfitsWithLikes,
    viewerFollowing,
  }
})
