import OpenAI from 'openai'
import { getServerEnv, requireServerEnv } from './runtime-env'

export function getOpenRouterClient() {
  const { appUrl } = getServerEnv()
  const apiKey = requireServerEnv('openrouterApiKey')
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': appUrl,
      'X-Title': 'Clad',
    },
  })
}

// Vision model (Gemini Flash for image analysis)
export async function analyzeClothingImage(imageUrl: string) {
  const client = getOpenRouterClient()

  const response = await client.chat.completions.create({
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // cheap vision-capable model
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this clothing item image and return a JSON object with these exact fields:
{
  "clothing_type": "one of: t-shirt, shirt, blouse, sweater, hoodie, jacket, coat, jeans, trousers, shorts, skirt, dress, shoes, accessory, other",
  "clothing_sub_type": "a specific subtype if known (e.g., henley, polo, button-down, crewneck, V-neck, bomber, blazer, cardigan, chinos, leggings, joggers, cargo, crop top, tank top, cami, flannel, denim jacket, puffer, windbreaker, trench coat, peacoat, hoodie, zip-up, quarter-zip, turtleneck, tube top, bodysuit, romper, jumpsuit, overalls, vest, waistcoat, sarong, kilt, mini skirt, midi skirt, maxi skirt, A-line, pencil skirt, pleated, wrap dress, shift dress, maxi dress, sundress, slip dress, sneakers, boots, loafers, sandals, heels, flats, oxfords, mules, slippers, or set to null if unsure)",
  "colour": "the dominant colour name (e.g., navy blue, burgundy, cream, black, white)",
  "pattern": "one of: solid, striped, checked, floral, graphic, abstract",
  "material": "the apparent fabric material (e.g., cotton, denim, wool, silk, linen, polyester)",
  "formality_level": "one of: casual, smart_casual, business_casual, formal, black_tie",
  "season": "one of: spring, summer, autumn, winter, all_season",
  "confidence": "a number from 0 to 1 how confident you are in this analysis"
}
Return ONLY the JSON object, no other text.`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from vision model')

  return JSON.parse(content)
}

// Text model (for outfit reasoning)
export async function generateOutfitReasoning(
  userProfile: any,
  candidateOutfits: any[],
  occasion: string
) {
  const client = getOpenRouterClient()

  const response = await client.chat.completions.create({
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // same model works fine for text too
    messages: [
      {
        role: 'system',
        content: `You are a fashion stylist AI. Given a user's style preferences and a list of valid outfit combinations, pick the single best one and explain why in one sentence.

Consider:
- Colour harmony (complementary or analogous colours)
- Style coherence (all items should work together)
- The user's stated preferences (preferred colours, style vibes)
- The occasion (what's appropriate?)
- Pattern mixing (solid + pattern is fine, pattern + pattern needs care)

Return JSON: { "outfitIndex": <number>, "explanation": "<one sentence>" }`
      },
      {
        role: 'user',
        text: `User profile: ${JSON.stringify(userProfile)}
Occasion: ${occasion}
Candidate outfits: ${JSON.stringify(candidateOutfits)}`
      }
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from text model')

  return JSON.parse(content)
}

export async function generatePackingList(
  userProfile: {
    stylePreferences?: string[]
    preferredColours?: string[]
    formalityDefault?: string
    climate?: string
  },
  wardrobeItems: Array<{
    id: string
    clothingType: string
    colour: string
    pattern: string
    formalityLevel: string
    season: string
    imageUrl?: string
  }>,
  trip: {
    destination: string
    startDate: string
    endDate: string
    purpose: string
  }
) {
  const client = getOpenRouterClient()

  const response = await client.chat.completions.create({
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    messages: [
      {
        role: 'system',
        content: `You are a fashion stylist AI assistant. Given a user's wardrobe, a trip destination and purpose, recommend a packing list.

Consider:
- Destination climate and weather (inferred from destination)
- Trip purpose (business, vacation, wedding, etc.) — different occasions need different looks
- Trip duration (calculate from start/end date) — avoid over-packing
- Colour coordination — recommended items should mix and match easily
- Season-appropriate clothing
- The user's style preferences and preferred colours

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "itemId": "uuid-of-the-wardrobe-item",
      "reason": "Why this item works for this trip (one sentence)"
    }
  ],
  "additionalNotes": "General styling advice or suggested outfit combinations (2-3 sentences)",
  "weatherNote": "Brief note about expected weather at destination during these dates"
}

Prioritize items with high versatility. Include items for both day and evening if trip purpose requires both.`
      },
      {
        role: 'user',
        content: JSON.stringify({
          trip: {
            destination: trip.destination,
            dates: `${trip.startDate} to ${trip.endDate}`,
            purpose: trip.purpose,
            duration: Math.ceil(
              (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime())
              / (1000 * 60 * 60 * 24)
            ) + 1,
          },
          userProfile: {
            stylePreferences: userProfile.stylePreferences,
            preferredColours: userProfile.preferredColours,
            formalityDefault: userProfile.formalityDefault,
          },
          availableItems: wardrobeItems.map(item => ({
            id: item.id,
            type: item.clothingType,
            colour: item.colour,
            pattern: item.pattern,
            formality: item.formalityLevel,
            season: item.season,
          })),
        })
      }
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from packing list model')

  return JSON.parse(content)
}
