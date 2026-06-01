import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '~~/server/db'
import { trips } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

const bodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  destination: z.string().min(1).max(255).optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid start date').optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid end date').optional(),
  purpose: z.string().min(1).max(100).optional(),
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
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, userId)))

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Trip not found' })
  }

  const updateData: Record<string, any> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.destination !== undefined) updateData.destination = parsed.data.destination
  if (parsed.data.startDate !== undefined) updateData.startDate = new Date(parsed.data.startDate)
  if (parsed.data.endDate !== undefined) updateData.endDate = new Date(parsed.data.endDate)
  if (parsed.data.purpose !== undefined) updateData.purpose = parsed.data.purpose

  const [updated] = await db
    .update(trips)
    .set(updateData)
    .where(eq(trips.id, id))
    .returning()

  return updated
})