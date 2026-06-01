import { count, eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems, outfits, outfitWearEvents } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'
import { getOpenRouterClient } from '~~/server/utils/openrouter'
import { runGapRules } from '~~/server/utils/gap-analysis'
import type { InventorySummary, DetectedGap } from '~~/server/utils/gap-analysis'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const baseWhere = and(
    eq(wardrobeItems.userId, userId),
    eq(wardrobeItems.isArchived, false),
  )

  // 1. Build inventory summary
  const [byTypeRows, byColourRows, bySeasonRows, byFormalityRows, outfitCount, wearEventCount] =
    await Promise.all([
      db
        .select({ label: wardrobeItems.clothingType, count: count() })
        .from(wardrobeItems).where(baseWhere)
        .groupBy(wardrobeItems.clothingType),

      db
        .select({ label: wardrobeItems.colour, count: count() })
        .from(wardrobeItems).where(baseWhere)
        .groupBy(wardrobeItems.colour),

      db
        .select({ label: wardrobeItems.season, count: count() })
        .from(wardrobeItems).where(baseWhere)
        .groupBy(wardrobeItems.season),

      db
        .select({ label: wardrobeItems.formalityLevel, count: count() })
        .from(wardrobeItems).where(baseWhere)
        .groupBy(wardrobeItems.formalityLevel),

      db
        .select({ count: count() })
        .from(outfits)
        .where(and(eq(outfits.userId, userId), eq(outfits.isArchived, false))),

      db
        .select({ count: count() })
        .from(outfitWearEvents)
        .where(eq(outfitWearEvents.userId, userId)),
    ])

  const toRecord = (rows: { label: string; count: number }[]) =>
    Object.fromEntries(rows.map(r => [r.label, r.count]))

  const inventorySummary: InventorySummary = {
    totalItems: byTypeRows.reduce((s, r) => s + r.count, 0),
    byType: toRecord(byTypeRows),
    byColour: toRecord(byColourRows),
    bySeason: toRecord(bySeasonRows),
    byFormality: toRecord(byFormalityRows),
    totalOutfits: outfitCount[0]?.count ?? 0,
    totalWearEvents: wearEventCount[0]?.count ?? 0,
  }

  // 2. Run gap rules
  const gaps = runGapRules(inventorySummary)

  // 3. AI enrichment (with fallback — per D-04 and existing pattern from openrouter.ts)
  let aiRecommendations = null
  if (gaps.length > 0) {
    try {
      const client = getOpenRouterClient()

      const response = await client.chat.completions.create({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          {
            role: 'system',
            content: `You are a fashion stylist AI. Given a user's wardrobe inventory summary and a list of detected gaps, provide personalized recommendations.

For each detected gap:
1. Acknowledge the gap in a friendly, helpful tone
2. Suggest 1-2 specific items that would fill the gap
3. Recommend colours that would work with the user's existing palette
4. Provide a practical reason why the item would add value

Also provide:
- One "surprise insight" about their wardrobe that they might not have noticed
- One long-term wardrobe goal suggestion based on their collection

Be concise, specific, and actionable. Avoid generic advice like "buy more clothes."

Return JSON:
{
  "recommendations": [
    {
      "gap": "which gap this addresses",
      "suggestion": "natural language suggestion",
      "specificItems": ["1-2 item suggestions"],
      "recommendedColours": ["colours that work with existing palette"],
      "whyItMatters": "practical value statement"
    }
  ],
  "surpriseInsight": "unexpected observation",
  "longTermGoal": "wardrobe development suggestion"
}`
          },
          {
            role: 'user',
            content: `Wardrobe Summary: ${JSON.stringify(inventorySummary)}\nDetected Gaps: ${JSON.stringify(gaps)}`
          }
        ],
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        aiRecommendations = JSON.parse(content)
      }
    } catch (aiError) {
      // Graceful fallback — rules-only results returned
      console.error('Gap analysis AI failed:', aiError)
    }
  }

  return { gaps, aiRecommendations, inventorySummary }
})
