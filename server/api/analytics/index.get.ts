import { count, desc, eq, and, inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems, outfits, outfitWearEvents } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const baseWhere = and(
    eq(wardrobeItems.userId, userId),
    eq(wardrobeItems.isArchived, false),
  )

  // 1. Composition by clothing type
  const composition = await db
    .select({ label: wardrobeItems.clothingType, value: count() })
    .from(wardrobeItems)
    .where(baseWhere)
    .groupBy(wardrobeItems.clothingType)
    .orderBy(desc(count()))

  // 2. Colour palette — count the colour string field
  const colourPalette = await db
    .select({ colour: wardrobeItems.colour, count: count() })
    .from(wardrobeItems)
    .where(baseWhere)
    .groupBy(wardrobeItems.colour)
    .orderBy(desc(count()))

  // 3. Season breakdown
  const seasonBreakdown = await db
    .select({ season: wardrobeItems.season, count: count() })
    .from(wardrobeItems)
    .where(baseWhere)
    .groupBy(wardrobeItems.season)
    .orderBy(desc(count()))

  // 4. Most-worn items — application-level aggregation for reliability
  // (avoids raw SQL type casting issues with Neon HTTP driver)
  const wearEvents = await db
    .select({ outfitId: outfitWearEvents.outfitId, itemIds: outfits.itemIds })
    .from(outfitWearEvents)
    .innerJoin(outfits, eq(outfitWearEvents.outfitId, outfits.id))
    .where(eq(outfitWearEvents.userId, userId))

  // Count per item ID
  const wearCounts = new Map<string, number>()
  for (const event of wearEvents) {
    for (const itemId of event.itemIds ?? []) {
      wearCounts.set(itemId, (wearCounts.get(itemId) ?? 0) + 1)
    }
  }

  // Sort and take top 10
  const topEntries = [...wearCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([itemId, wearCount]) => ({ itemId, wearCount }))

  // Fetch full item details
  const itemIds = topEntries.map(e => e.itemId)
  const items = itemIds.length > 0
    ? await db.select().from(wardrobeItems).where(inArray(wardrobeItems.id, itemIds))
    : []
  const itemsMap = Object.fromEntries(items.map(i => [i.id, i]))

  const mostWorn = topEntries
    .map(e => ({ ...itemsMap[e.itemId], wearCount: e.wearCount }))
    .filter(r => r.id) // only include items that still exist

  return {
    composition,
    colourPalette,
    mostWorn,
    seasonBreakdown,
  }
})
