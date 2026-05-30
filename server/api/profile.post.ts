import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { profiles } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

/**
 * Upsert the current user's onboarding profile.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const body = await readBody(event)
  const {
    stylePreferences,
    skinTone,
    bodyType,
    preferredColours,
    dislikedColours,
    formalityDefault,
    climate,
    wardrobeGoal,
  } = body ?? {}

  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  const values = {
    userId,
    stylePreferences: stylePreferences ?? null,
    skinTone: skinTone ?? null,
    bodyType: bodyType ?? null,
    preferredColours: preferredColours ?? null,
    dislikedColours: dislikedColours ?? null,
    formalityDefault: formalityDefault ?? 'smart_casual',
    climate: climate ?? null,
    wardrobeGoal: wardrobeGoal ?? null,
    updatedAt: new Date(),
  }

  if (existing) {
    const [updated] = await db
      .update(profiles)
      .set(values)
      .where(eq(profiles.id, existing.id))
      .returning()
    return updated
  }

  const [created] = await db.insert(profiles).values(values).returning()
  return created
})
