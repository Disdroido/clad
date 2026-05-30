import { createAuthClient } from 'better-auth/vue'

/**
 * Browser-side auth client. Talks to `/api/auth/*` on the same origin.
 *
 * Usage:
 *   const { data: session } = await authClient.useSession(useFetch)
 *   await authClient.signIn.email({ email, password })
 *   await authClient.signUp.email({ email, password, name })
 *   await authClient.signOut()
 */
export const authClient = createAuthClient()
