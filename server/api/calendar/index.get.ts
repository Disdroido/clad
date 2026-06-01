import { eq, and, gte, lte } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { scheduledOutfits, outfits, wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const query = getQuery(event)

  // Parse date range — accept month/year or raw start/end
  let startDate: Date, endDate: Date
  if (query.month && query.year) {
    const year = Number(query.year)
    const month = Number(query.month) - 1 // JS months are 0-indexed
    startDate = new Date(year, month, 1)
    endDate = new Date(year, month + 1, 0) // Last day of month (23:59:59)
    // Set endDate to end of day
    endDate.setHours(23, 59, 59, 999)
  } else {
    startDate = new Date(query.start as string)
    endDate = new Date(query.end as string)
    endDate.setHours(23, 59, 59, 999)
  }

  // Fetch all scheduled outfits within date range, joined with outfit + items details
  const rows = await db
    .select({
      id: scheduledOutfits.id,
      scheduledDate: scheduledOutfits.scheduledDate,
      notes: scheduledOutfits.notes,
      outfitId: scheduledOutfits.outfitId,
      outfitName: outfits.name,
      outfitOccasion: outfits.occasion,
      outfitItemIds: outfits.itemIds,
      outfitExplanation: outfits.explanation,
    })
    .from(scheduledOutfits)
    .leftJoin(outfits, eq(scheduledOutfits.outfitId, outfits.id))
    .where(
      and(
        eq(scheduledOutfits.userId, userId),
        gte(scheduledOutfits.scheduledDate, startDate),
        lte(scheduledOutfits.scheduledDate, endDate),
      )
    )
    .orderBy(scheduledOutfits.scheduledDate)

  // Fetch item thumbnails for all referenced items
  const allItemIds = [...new Set(rows.flatMap(r => r.outfitItemIds ?? []))]
  let items: any[] = []
  if (allItemIds.length > 0) {
    const { inArray } = await import('drizzle-orm')
    items = await db
      .select({ id: wardrobeItems.id, imageUrl: wardrobeItems.imageUrl, clothingType: wardrobeItems.clothingType, colour: wardrobeItems.colour })
      .from(wardrobeItems)
      .where(inArray(wardrobeItems.id, allItemIds))
  }
  const itemsMap = Object.fromEntries(items.map(i => [i.id, i]))

  // Group by date for the calendar grid
  const grouped: Record<string, typeof rows> = {}
  for (const row of rows) {
    const dateKey = row.scheduledDate.toISOString().split('T')[0]
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push({
      ...row,
      items: (row.outfitItemIds ?? []).map((id: string) => itemsMap[id]).filter(Boolean),
    })
  }

  return {
    dates: Object.entries(grouped).map(([date, outfits]) => ({
      date,
      count: outfits.length,
      outfits,
    })),
  }
})