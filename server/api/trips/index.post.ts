import { z } from 'zod'
import { useDb } from '~~/server/db'
import { trips } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

const bodySchema = z.object({
  name: z.string().min(1).max(255),
  destination: z.string().min(1).max(255),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid end date'),
  purpose: z.string().min(1).max(100),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const body = await readBody(event)

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request', data: parsed.error.issues })
  }

  const { name, destination, startDate, endDate, purpose } = parsed.data

  // Validate endDate >= startDate
  if (new Date(endDate) < new Date(startDate)) {
    throw createError({ statusCode: 400, statusMessage: 'End date must be on or after start date' })
  }

  const [trip] = await db
    .insert(trips)
    .values({
      userId,
      name,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      purpose,
    })
    .returning()

  return trip
})