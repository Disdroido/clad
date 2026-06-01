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
    model: 'google/gemini-2.0-flash-lite-001', // cheap vision-capable model
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this clothing item image and return a JSON object with these exact fields:
{
  "clothing_type": "one of: t-shirt, shirt, blouse, sweater, hoodie, jacket, coat, jeans, trousers, shorts, skirt, dress, shoes, accessory, other",
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
    model: 'google/gemini-2.0-flash-lite-001', // same model works fine for text too
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
