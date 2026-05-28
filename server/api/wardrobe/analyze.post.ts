import { analyzeClothingImage } from '../../utils/openrouter'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { imageUrl } = body

  if (!imageUrl) {
    throw createError({ statusCode: 400, message: 'imageUrl is required' })
  }

  const result = await analyzeClothingImage(imageUrl)

  return {
    clothingType: result.clothing_type || 'other',
    colour: result.colour || 'unknown',
    pattern: result.pattern || 'solid',
    material: result.material || 'unknown',
    formalityLevel: result.formality_level || 'casual',
    season: result.season || 'all_season',
    confidence: result.confidence || 0.5,
  }
})
