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
  try {
    const session = await getServerSession(event)
    if (!session?.user?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    return session.user.id
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
