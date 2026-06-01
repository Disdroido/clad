import { desc, eq, inArray, count } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits, outfitWearEvents, wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const offset = Math.max(Number(query.offset) || 0, 0)

  // Fetch total count of wear events for this user
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(outfitWearEvents)
    .where(eq(outfitWearEvents.userId, userId))

  // Fetch wear events with outfit data, paginated
  const rows = await db
    .select({
      id: outfitWearEvents.id,
      outfitId: outfitWearEvents.outfitId,
      wornDate: outfitWearEvents.wornDate,
      notes: outfitWearEvents.notes,
      rating: outfits.rating,
      outfit: {
        id: outfits.id,
        occasion: outfits.occasion,
        explanation: outfits.explanation,
        itemIds: outfits.itemIds,
      },
    })
    .from(outfitWearEvents)
    .leftJoin(outfits, eq(outfitWearEvents.outfitId, outfits.id))
    .where(eq(outfitWearEvents.userId, userId))
    .orderBy(desc(outfitWearEvents.wornDate), desc(outfitWearEvents.createdAt))
    .limit(limit)
    .offset(offset)

  // Collect all unique item IDs from the fetched outfits
  const allItemIds = [...new Set(rows.flatMap(r => r.outfit?.itemIds ?? []))]

  // Fetch wardrobe items in batch
  let itemsMap: Record<string, typeof wardrobeItems.$inferSelect> = {}
  if (allItemIds.length > 0) {
    const items = await db
      .select()
      .from(wardrobeItems)
      .where(inArray(wardrobeItems.id, allItemIds))
    for (const item of items) {
      itemsMap[item.id] = item
    }
  }

  // Build response events array
  const events = rows.map((r) => ({
    id: r.id,
    outfitId: r.outfitId,
    wornDate: r.wornDate.toISOString(),
    notes: r.notes,
    rating: r.rating,
    outfit: r.outfit
      ? {
          id: r.outfit.id,
          occasion: r.outfit.occasion,
          explanation: r.outfit.explanation,
          items: (r.outfit.itemIds ?? [])
            .map((itemId: string) => {
              const item = itemsMap[itemId]
              if (!item) return null
              return {
                id: item.id,
                imageUrl: item.imageUrl,
                clothingType: item.clothingType,
                colour: item.colour,
              }
            })
            .filter(Boolean),
        }
      : null,
  }))

  return { events, total }
})
