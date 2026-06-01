import { eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { publicProfiles, follows } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const username = getRouterParam(event, 'username')

  // Look up the public profile by username
  const [profile] = await db
    .select()
    .from(publicProfiles)
    .where(eq(publicProfiles.username, username))

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  // Prevent self-follow
  if (profile.userId === userId) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot follow yourself' })
  }

  // Check if already following
  const [existing] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.followingId, profile.id)))

  if (existing) {
    // Unfollow: delete
    await db
      .delete(follows)
      .where(eq(follows.id, existing.id))
  } else {
    // Follow: insert
    await db
      .insert(follows)
      .values({ followerId: userId, followingId: profile.id })
  }

  return { following: !existing }
})
