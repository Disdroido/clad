import type { H3Event } from 'h3'
import { useAuth } from './auth'

/**
 * Returns the active session for the request, or null if unauthenticated.
 * Use this in any API handler that wants to know who's calling.
 */
export async function getServerSession(event: H3Event) {
  const auth = useAuth(event)
  return auth.api.getSession({ headers: event.headers })
}

/**
 * Same as getServerSession, but throws a 401 if there's no session.
 * Use this in protected API handlers.
 */
export async function requireUserId(event: H3Event): Promise<string> {
  const session = await getServerSession(event).catch(() => null)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session.user.id
}

/**
 * Returns the user ID if a session exists, or null if unauthenticated.
 * Does NOT throw 401 — use this for public pages that want to attach
 * user context (e.g., "has this anonymous viewer liked this outfit?")
 * without blocking unauthenticated access.
 */
export async function getOptionalUserId(event: H3Event): Promise<string | null> {
  const session = await getServerSession(event).catch(() => null)
  return session?.user?.id ?? null
}
