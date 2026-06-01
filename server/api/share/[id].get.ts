import { eq, and, inArray, count } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { sharedOutfits, outfits, wardrobeItems, publicProfiles, likes } from '~~/server/db/schema'
import { getOptionalUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const shortId = getRouterParam(event, 'id')
  const viewerId = await getOptionalUserId(event) // optional — for viewer-specific context

  // Fetch shared outfit
  const [shared] = await db
    .select({
      id: sharedOutfits.id,
      shortId: sharedOutfits.shortId,
      createdAt: sharedOutfits.createdAt,
      outfitId: sharedOutfits.outfitId,
      outfitName: outfits.name,
      outfitOccasion: outfits.occasion,
      outfitExplanation: outfits.explanation,
      outfitItemIds: outfits.itemIds,
      sharerUserId: sharedOutfits.userId,
    })
    .from(sharedOutfits)
    .leftJoin(outfits, eq(sharedOutfits.outfitId, outfits.id))
    .where(eq(sharedOutfits.shortId, shortId))

  if (!shared) {
    throw createError({ statusCode: 404, statusMessage: 'Shared outfit not found' })
  }

  // Fetch sharer's public profile
  const [sharerProfile] = await db
    .select()
    .from(publicProfiles)
    .where(eq(publicProfiles.userId, shared.sharerUserId))

  // Fetch item details
  const itemIds = (shared.outfitItemIds ?? []) as string[]
  let items: any[] = []
  if (itemIds.length > 0) {
    items = await db
      .select({
        id: wardrobeItems.id,
        imageUrl: wardrobeItems.imageUrl,
        thumbnailUrl: wardrobeItems.thumbnailUrl,
        clothingType: wardrobeItems.clothingType,
        colour: wardrobeItems.colour,
      })
      .from(wardrobeItems)
      .where(inArray(wardrobeItems.id, itemIds))
  }

  // Get like count
  const [likeCountRow] = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.outfitId, shared.id))

  const likeCount = (likeCountRow as any)?.count ?? 0

  // Check if viewer has liked this
  let viewerLiked = false
  if (viewerId) {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, viewerId), eq(likes.outfitId, shared.id)))
    viewerLiked = !!existingLike
  }

  return {
    ...shared,
    items,
    sharerProfile: sharerProfile && sharerProfile.isPublic ? {
      username: sharerProfile.username,
      displayName: sharerProfile.displayName,
      bio: sharerProfile.bio,
    } : null,
    likeCount,
    viewerLiked,
  }
})
