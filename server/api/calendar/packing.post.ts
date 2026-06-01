import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '~~/server/db'
import { trips, wardrobeItems, profiles } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'
import { generatePackingList } from '~~/server/utils/openrouter'

const bodySchema = z.object({
  tripId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const body = await readBody(event)

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request', data: parsed.error.issues })
  }

  // 1. Get trip with ownership check
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, parsed.data.tripId), eq(trips.userId, userId)))

  if (!trip) {
    throw createError({ statusCode: 404, statusMessage: 'Trip not found' })
  }

  // 2. Get wardrobe items (non-archived)
  const wardrobe = await db
    .select()
    .from(wardrobeItems)
    .where(and(eq(wardrobeItems.userId, userId), eq(wardrobeItems.isArchived, false)))

  if (wardrobe.length === 0) {
    return {
      success: true,
      data: {
        recommendations: [],
        additionalNotes: 'Your wardrobe is empty. Add clothing items before generating a packing list.',
        weatherNote: '',
      },
      wardrobeEmpty: true,
    }
  }

  // 3. Get user profile for style preferences
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))

  // 4. Generate AI packing list (with fallback)
  try {
    const packingList = await generatePackingList(
      {
        stylePreferences: profile?.stylePreferences ?? [],
        preferredColours: profile?.preferredColours ?? [],
        formalityDefault: profile?.formalityDefault ?? 'smart_casual',
        climate: profile?.climate ?? undefined,
      },
      wardrobe,
      {
        destination: trip.destination,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        purpose: trip.purpose,
      }
    )

    // Enrich recommendations with full item details from DB
    const recommendationsWithDetails = packingList.recommendations.map((rec: { itemId: string; reason: string }) => {
      const item = wardrobe.find(w => w.id === rec.itemId)
      return {
        ...rec,
        clothingType: item?.clothingType ?? 'unknown',
        colour: item?.colour ?? 'unknown',
        imageUrl: item?.thumbnailUrl ?? item?.imageUrl ?? null,
      }
    })

    // Group by clothingType for UI display
    const grouped = recommendationsWithDetails.reduce((acc: Record<string, any[]>, rec: any) => {
      const cat = rec.clothingType
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(rec)
      return acc
    }, {})

    return {
      success: true,
      data: {
        recommendations: recommendationsWithDetails,
        grouped,
        additionalNotes: packingList.additionalNotes,
        weatherNote: packingList.weatherNote,
      },
    }
  } catch (err) {
    console.error('Packing AI failed:', err)
    return {
      success: false,
      data: {
        recommendations: [],
        grouped: {},
        additionalNotes: 'AI is currently unavailable. Pack based on your best judgment.',
        weatherNote: '',
      },
    }
  }
})