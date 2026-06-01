import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { sharedOutfits, outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

const bodySchema = z.object({
  outfitId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const body = await readBody(event)

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request', data: parsed.error.issues })
  }

  const { outfitId } = parsed.data

  // Verify the outfit belongs to this user
  const [outfit] = await db
    .select({ id: outfits.id })
    .from(outfits)
    .where(and(eq(outfits.id, outfitId), eq(outfits.userId, userId)))

  if (!outfit) {
    throw createError({ statusCode: 404, statusMessage: 'Outfit not found' })
  }

  // Check if already shared — return existing if so
  const [existing] = await db
    .select()
    .from(sharedOutfits)
    .where(and(eq(sharedOutfits.outfitId, outfitId), eq(sharedOutfits.userId, userId)))

  if (existing) {
    const config = useRuntimeConfig()
    return { shareUrl: `${config.public.appUrl}/share/${existing.shortId}`, shortId: existing.shortId }
  }

  // Generate shortId from crypto.randomUUID() — first 8 chars
  const shortId = crypto.randomUUID().replace(/-/g, '').substring(0, 8)

  const [shared] = await db
    .insert(sharedOutfits)
    .values({ userId, outfitId, shortId })
    .returning()

  const config = useRuntimeConfig()
  return { shareUrl: `${config.public.appUrl}/share/${shared.shortId}`, shortId: shared.shortId }
})
