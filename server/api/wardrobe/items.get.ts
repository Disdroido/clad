import { desc, eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const rows = await db
    .select()
    .from(wardrobeItems)
    .where(and(eq(wardrobeItems.isArchived, false), eq(wardrobeItems.userId, userId)))
    .orderBy(desc(wardrobeItems.createdAt))

  // Normalize: backfill defaults for columns added in Phase 07 (existing rows may have NULL)
  const items = rows.map(item => ({
    ...item,
    isClean: item.isClean ?? true,
    condition: item.condition ?? 'good',
    brand: item.brand ?? null,
    pricePaid: item.pricePaid ?? null,
    purchaseDate: item.purchaseDate ?? null,
  }))

  return { items }
})
