import { authClient } from '~/lib/auth-client'

const PUBLIC_ROUTES = new Set(['/', '/login', '/signup'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_ROUTES.has(to.path)) return

  // useFetch forwards cookies during SSR and caches the result for hydration.
  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value) {
    return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`)
  }
})
