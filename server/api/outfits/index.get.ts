import { desc, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const rows = await db
    .select()
    .from(outfits)
    .where(eq(outfits.userId, userId))
    .orderBy(desc(outfits.createdAt))

  return { outfits: rows }
})
