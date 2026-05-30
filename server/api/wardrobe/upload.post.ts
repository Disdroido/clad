import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const body = await readBody(event)
  const {
    imageUrl,
    thumbnailUrl,
    clothingType,
    colour,
    pattern,
    material,
    formalityLevel,
    season,
    aiConfidence,
  } = body ?? {}

  if (!imageUrl || !clothingType || !colour) {
    throw createError({
      statusCode: 400,
      message: 'imageUrl, clothingType and colour are required',
    })
  }

  const [item] = await db
    .insert(wardrobeItems)
    .values({
      userId,
      imageUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      clothingType,
      colour,
      pattern: pattern ?? 'solid',
      material: material ?? null,
      formalityLevel: formalityLevel ?? 'casual',
      season: season ?? 'all_season',
      aiConfidence: aiConfidence ?? null,
    })
    .returning()

  return item
})
