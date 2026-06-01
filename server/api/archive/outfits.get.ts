import { desc, eq, inArray, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits, wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const rows = await db
    .select()
    .from(outfits)
    .where(and(eq(outfits.isArchived, true), eq(outfits.userId, userId)))
    .orderBy(desc(outfits.createdAt))

  const allItemIds = [...new Set(rows.flatMap(o => o.itemIds ?? []))]
  let itemsMap: Record<string, any> = {}
  if (allItemIds.length > 0) {
    const items = await db
      .select()
      .from(wardrobeItems)
      .where(inArray(wardrobeItems.id, allItemIds))
    for (const item of items) {
      itemsMap[item.id] = item
    }
  }

  const outfitsWithItems = rows.map(o => ({
    ...o,
    items: (o.itemIds ?? []).map(id => itemsMap[id]).filter(Boolean),
  }))

  return { outfits: outfitsWithItems }
})