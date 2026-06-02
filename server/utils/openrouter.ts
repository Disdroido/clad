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

// Vision model for clothing image analysis
export async function analyzeClothingImage(imageUrl: string) {
  const client = getOpenRouterClient()

  const response = await client.chat.completions.create({
    model: 'google/gemini-2.0-flash-lite-001', // strong vision + json mode
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze the clothing item in this image. The item may be on any background — ignore the background completely.
Focus ONLY on the clothing itself: its type, colour, pattern, material, formality, and season.

IMPORTANT — Colour analysis rules:
- Identify the TRUE colour of the clothing fabric, NOT the background colour.
- If the background is a solid colour (e.g., teal, white, pink), it is NOT part of the clothing. Ignore it.
- Consider lighting: bright light can wash out colours, shadows can darken them. Adjust for this.
- Common colours to consider: black, white, navy, grey, brown, tan, beige, cream, red, pink, blue, light blue, green, olive, teal, yellow, orange, purple, lavender, burgundy, maroon, coral, denim, charcoal, silver, gold.
- If the item is black, say "black" — do NOT guess brown/dark blue/grey unless the fabric is clearly not black.
- Be specific but not overly precise: "navy blue" not "dark blue", "cream" not "off-white", "olive" not "greenish brown".

Return a JSON object with these exact fields:
{
  "clothing_type": "one of: t-shirt, shirt, blouse, sweater, hoodie, jacket, coat, jeans, trousers, shorts, skirt, dress, shoes, accessory, other",
  "clothing_sub_type": "specific subtype if identifiable (e.g., henley, polo, crewneck, V-neck, button-down, bomber, blazer, cardigan, chinos, joggers, tank top, flannel, denim jacket, puffer, windbreaker, trench coat, peacoat, hoodie, quarter-zip, turtleneck, bodysuit, romper, jumpsuit, vest, mini skirt, midi skirt, maxi skirt, A-line, pencil skirt, pleated, wrap dress, shift dress, maxi dress, sundress, slip dress, sneakers, boots, loafers, sandals, heels, flats, oxfords, mules) or null",
  "colour": "the actual fabric colour of the clothing item",
  "pattern": "one of: solid, striped, checked, floral, graphic, abstract",
  "material": "apparent fabric material (e.g., cotton, denim, wool, silk, linen, polyester, leather, suede, knit, fleece, nylon, chiffon, velvet, corduroy, lace)",
  "formality_level": "one of: casual, smart_casual, business_casual, formal, black_tie",
  "season": "one of: spring, summer, autumn, winter, all_season",
  "confidence": "number from 0 to 1"
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
    max_tokens: 1000,
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
    model: 'google/gemini-2.0-flash-lite-001',
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
