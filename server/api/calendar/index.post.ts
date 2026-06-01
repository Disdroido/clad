import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { scheduledOutfits, outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'
import { and } from 'drizzle-orm'

const bodySchema = z.object({
  outfitId: z.string().uuid(),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  notes: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const body = await readBody(event)

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request', data: parsed.error.issues })
  }

  const { outfitId, scheduledDate, notes } = parsed.data

  // Verify the outfit belongs to this user
  const [outfit] = await db
    .select({ id: outfits.id })
    .from(outfits)
    .where(and(eq(outfits.id, outfitId), eq(outfits.userId, userId)))

  if (!outfit) {
    throw createError({ statusCode: 404, statusMessage: 'Outfit not found' })
  }

  const [scheduled] = await db
    .insert(scheduledOutfits)
    .values({
      userId,
      outfitId,
      scheduledDate: new Date(scheduledDate),
      notes: notes ?? null,
    })
    .returning()

  return { ...scheduled, message: 'Outfit scheduled' })
})