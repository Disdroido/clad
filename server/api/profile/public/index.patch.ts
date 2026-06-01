import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { publicProfiles } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

const bodySchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).nullable().optional(),
  isPublic: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const body = await readBody(event)

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request', data: parsed.error.issues })
  }

  const { username, displayName, bio, isPublic } = parsed.data

  // Check username uniqueness (exclude current user if they already have a profile)
  const [existing] = await db
    .select()
    .from(publicProfiles)
    .where(eq(publicProfiles.username, username))

  if (existing && existing.userId !== userId) {
    throw createError({ statusCode: 409, statusMessage: 'Username is already taken' })
  }

  // Upsert: if user already has a profile, update it; otherwise insert
  const [currentProfile] = await db
    .select()
    .from(publicProfiles)
    .where(eq(publicProfiles.userId, userId))

  if (currentProfile) {
    const [updated] = await db
      .update(publicProfiles)
      .set({ username, displayName, bio: bio ?? null, isPublic, updatedAt: new Date() })
      .where(eq(publicProfiles.userId, userId))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(publicProfiles)
    .values({ userId, username, displayName, bio: bio ?? null, isPublic })
    .returning()

  return created
})
