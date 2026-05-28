export default defineEventHandler(async (event) => {
  // TODO: Get user ID from auth session
  const userId = 'temp-user-id'

  const body = await readBody(event)
  const { imageUrl, clothingType, colour, pattern, material, formalityLevel, season } = body

  // TODO: Save to Neon via Drizzle
  // const db = useDb()
  // const result = await db.insert(wardrobeItems).values({...})

  return {
    id: crypto.randomUUID(),
    userId,
    imageUrl,
    clothingType,
    colour,
    pattern: pattern || 'solid',
    material,
    formalityLevel: formalityLevel || 'casual',
    season: season || 'all_season',
    createdAt: new Date().toISOString(),
  }
})
