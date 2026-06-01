import { eq } from 'drizzle-orm'
import { generateValidOutfits } from '../../utils/outfit-engine'
import { generateOutfitReasoning } from '../../utils/openrouter'
import { wardrobeItems, profiles } from '../../db/schema'
import { useDb } from '../../db'
import { requireUserId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const body = await readBody(event)
  const { occasion } = body

  if (!occasion) {
    throw createError({ statusCode: 400, message: 'occasion is required' })
  }

  const db = useDb()

  // 1. Fetch user's wardrobe items
  const items = await db
    .select()
    .from(wardrobeItems)
    .where(eq(wardrobeItems.userId, userId))

  if (items.length < 2) {
    throw createError({
      statusCode: 400,
      message: 'Add at least 2 items to your wardrobe before generating outfits',
    })
  }

  // 2. Fetch user profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  // 3. Stage 1: Deterministic pre-filter
  const candidates = generateValidOutfits(items, profile || {}, occasion)

  if (candidates.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No valid outfit combinations found. Add more variety to your wardrobe!',
    })
  }

  // 4. Stage 2: AI selects best outfit
  const candidateForAI = candidates.map((combo, idx) => ({
    index: idx,
    items: combo.map(i => ({ id: i.id, clothingType: i.clothingType, colour: i.colour, pattern: i.pattern })),
  }))

  let aiResult: { outfitIndex: number; explanation: string } | null = null
  try {
    aiResult = await generateOutfitReasoning(profile, candidateForAI, occasion)
  } catch {
    // AI call failed — fall back to first candidate
  }

  const outfitIndex = (typeof aiResult?.outfitIndex === 'number' && candidates[aiResult.outfitIndex])
    ? aiResult.outfitIndex
    : 0

  const explanation = (typeof aiResult?.explanation === 'string' && aiResult.explanation.trim().length > 0)
    ? aiResult.explanation
    : `A ${occasion} outfit put together from your wardrobe.`

  return {
    items: candidates[outfitIndex],
    occasion,
    explanation,
  }
})
