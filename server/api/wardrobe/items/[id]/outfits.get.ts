import { eq, and, sql } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const itemId = getRouterParam(event, 'id')

  if (!itemId || itemId === 'undefined') {
    throw createError({ statusCode: 400, message: 'Item ID is required' })
  }

  const rows = await db
    .select()
    .from(outfits)
    .where(
      and(
        eq(outfits.userId, userId),
        eq(outfits.isArchived, false),
        sql`${outfits.itemIds} @> ${JSON.stringify([itemId])}::jsonb`
      )
    )
    .orderBy(sql`${outfits.createdAt} DESC`)
    .limit(6)

  return { outfits: rows }
})
