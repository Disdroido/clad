import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { outfits, outfitWearEvents } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  const [outfit] = await db
    .select()
    .from(outfits)
    .where(eq(outfits.id, id))

  if (!outfit || outfit.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Outfit not found' })
  }

  const body = await readBody(event)
  const wornDate = body?.wornDate ? new Date(body.wornDate) : new Date()
  const notes = body?.notes ?? null

  const [event_created] = await db.transaction(async (tx) => {
    const [wearEvent] = await tx
      .insert(outfitWearEvents)
      .values({
        outfitId: id,
        userId,
        wornDate,
        notes,
      })
      .returning()

    await tx
      .update(outfits)
      .set({
        wearCount: (outfit.wearCount ?? 0) + 1,
        lastWornAt: wornDate,
      })
      .where(eq(outfits.id, id))

    return [wearEvent]
  })

  setResponseStatus(event, 201)
  return event_created
})
