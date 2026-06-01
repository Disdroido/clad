import { eq, desc } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { saves, sharedOutfits, outfits, publicProfiles } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const savedItems = await db
    .select({
      saveId: saves.id,
      savedAt: saves.createdAt,
      shortId: sharedOutfits.shortId,
      outfitName: outfits.name,
      outfitOccasion: outfits.occasion,
      outfitExplanation: outfits.explanation,
      outfitItemIds: outfits.itemIds,
      sharerUsername: publicProfiles.username,
      sharerDisplayName: publicProfiles.displayName,
    })
    .from(saves)
    .innerJoin(sharedOutfits, eq(saves.outfitId, sharedOutfits.id))
    .leftJoin(outfits, eq(sharedOutfits.outfitId, outfits.id))
    .leftJoin(publicProfiles, eq(sharedOutfits.userId, publicProfiles.userId))
    .where(eq(saves.userId, userId))
    .orderBy(desc(saves.createdAt))

  return { items: savedItems }
})
