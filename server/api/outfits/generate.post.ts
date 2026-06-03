import { eq, and, gte, inArray } from 'drizzle-orm'
import { generateValidOutfits } from '../../utils/outfit-engine'
import { generateOutfitReasoning } from '../../utils/openrouter'
import { wardrobeItems, profiles, outfits, outfitWearEvents } from '../../db/schema'
import { useDb } from '../../db'
import { requireUserId } from '../../utils/session'
import { getRequestHeader } from 'h3'
import { fetchCurrentWeather, fetchWeatherByIp } from '../../utils/weather'
import type { WeatherData } from '../../utils/weather'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const body = await readBody(event)
  const { occasion, skipLaundry } = body
  const lat = body.lat as number | undefined
  const lon = body.lon as number | undefined

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

  // 2.5. Fetch recently worn items (last 7 days)
  let recentlyWornItemIds: string[] = []
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentWearEvents = await db
      .select()
      .from(outfitWearEvents)
      .where(
        and(
          eq(outfitWearEvents.userId, userId),
          gte(outfitWearEvents.wornDate, sevenDaysAgo),
        )
      )

    const recentOutfitIds = [...new Set(recentWearEvents.map(e => e.outfitId))]

    if (recentOutfitIds.length > 0) {
      const recentOutfits = await db
        .select()
        .from(outfits)
        .where(inArray(outfits.id, recentOutfitIds))

      recentlyWornItemIds = [
        ...new Set(recentOutfits.flatMap(o => (o.itemIds as string[]) || []))
      ]
    }
  } catch {
    // Wear history not available, proceed without recency data
  }

  // 2.7. Fetch weather data (graceful fallback per D-05)
  let weatherResult: WeatherData | null = null
  try {
    const clientIp = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    if (lat && lon) {
      weatherResult = await fetchCurrentWeather(lat, lon, event)
    } else if (clientIp) {
      // Per research Pitfall 4: pass explicit user IP, not auto:ip
      // auto:ip on Cloudflare Workers resolves the datacenter, not the user
      weatherResult = await fetchWeatherByIp(clientIp, event)
    }
  } catch {
    // Weather unavailable — engine falls back to climate zone
  }

  const enrichedProfile = {
    ...(profile || {}),
    recentlyWornItemIds,
    currentTemperature: weatherResult?.feelsLike ?? undefined,
    // ^ use feelsLike for clothing decisions (per research: "feels-like > actual temp")
  }

  // 3. Fetch existing outfits to prevent duplicates
  let existingCombinations = new Set<string>()
  try {
    const existingOutfits = await db
      .select({ itemIds: outfits.itemIds })
      .from(outfits)
      .where(
        and(
          eq(outfits.userId, userId),
          eq(outfits.isArchived, false),
        )
      )
    for (const o of existingOutfits) {
      if (o.itemIds?.length) {
        existingCombinations.add([...(o.itemIds as string[])].sort().join(','))
      }
    }
  } catch {
    // Non-critical — proceed without dedup
  }

  // 3.5. Stage 1: Deterministic pre-filter
  const candidates = generateValidOutfits(
    items,
    enrichedProfile,
    occasion,
    !skipLaundry,
    existingCombinations,
  )

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
    weather: weatherResult ? {
      temperature: weatherResult.temperature,
      condition: weatherResult.condition,
      iconUrl: weatherResult.iconUrl,
      locationName: weatherResult.locationName,
      feelsLike: weatherResult.feelsLike,
    } : undefined,
    weatherFallback: !weatherResult && !!(lat || lon),
    // weatherFallback = true when user provided coords but weather API failed
  }
})
