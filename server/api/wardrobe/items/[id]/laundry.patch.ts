import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  const [existing] = await db
    .select()
    .from(wardrobeItems)
    .where(eq(wardrobeItems.id, id))
    .limit(1)

  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  const body = await readBody(event)
  const { isClean } = body ?? {}

  if (typeof isClean !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'isClean must be a boolean',
    })
  }

  const [updated] = await db
    .update(wardrobeItems)
    .set({ isClean })
    .where(eq(wardrobeItems.id, id))
    .returning()

  return updated
})
