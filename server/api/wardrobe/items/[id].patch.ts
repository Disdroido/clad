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
  const {
    clothingType,
    clothingSubType,
    colour,
    pattern,
    material,
    formalityLevel,
    season,
  } = body ?? {}

  const [updated] = await db
    .update(wardrobeItems)
    .set({
      ...(clothingType && { clothingType }),
      ...(clothingSubType !== undefined && { clothingSubType }),
      ...(colour && { colour }),
      ...(pattern && { pattern }),
      ...(material !== undefined && { material }),
      ...(formalityLevel && { formalityLevel }),
      ...(season && { season }),
    })
    .where(eq(wardrobeItems.id, id))
    .returning()

  return updated
})
