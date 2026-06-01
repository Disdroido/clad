import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '~~/server/db'
import { scheduledOutfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'
import { and } from 'drizzle-orm'

const bodySchema = z.object({
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date').optional(),
  notes: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request', data: parsed.error.issues })
  }

  // Verify ownership
  const [existing] = await db
    .select()
    .from(scheduledOutfits)
    .where(and(eq(scheduledOutfits.id, id), eq(scheduledOutfits.userId, userId)))

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Scheduled outfit not found' })
  }

  const updateData: Record<string, any> = {}
  if (parsed.data.scheduledDate !== undefined) updateData.scheduledDate = new Date(parsed.data.scheduledDate)
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

  const [updated] = await db
    .update(scheduledOutfits)
    .set(updateData)
    .where(eq(scheduledOutfits.id, id))
    .returning()

  return updated
})