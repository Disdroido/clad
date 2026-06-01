import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

const conditionEnum = z.enum(['new', 'good', 'worn', 'needs_repair'])

const lifecycleSchema = z.object({
  condition: conditionEnum.optional(),
  brand: z.string().max(200).nullable().optional(),
  pricePaid: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
})

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

  const result = lifecycleSchema.safeParse(body ?? {})
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors.map(e => e.message).join(', '),
    })
  }

  const { condition, brand, pricePaid, purchaseDate } = result.data

  // Convert pricePaid from dollars to cents for integer storage
  const pricePaidCents = pricePaid !== undefined && pricePaid !== null
    ? Math.round(pricePaid * 100)
    : undefined

  const updateData: Record<string, unknown> = {}
  if (condition !== undefined) updateData.condition = condition
  if (brand !== undefined) updateData.brand = brand
  if (pricePaidCents !== undefined) updateData.pricePaid = pricePaidCents
  if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null

  if (Object.keys(updateData).length === 0) {
    return existing
  }

  const [updated] = await db
    .update(wardrobeItems)
    .set(updateData)
    .where(eq(wardrobeItems.id, id))
    .returning()

  return updated
})
