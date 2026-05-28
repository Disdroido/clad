export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes that don't require auth
  const publicRoutes = ['/', '/login']
  if (publicRoutes.includes(to.path)) return

  // TODO: Check auth session via better-auth
  // const session = await auth.api.getSession({ headers: event.headers })
  // if (!session) return navigateTo('/login')

  // For now, allow all routes (full auth implementation in Week 2)
})
