import { useAuth } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  const auth = useAuth(event)
  return auth.handler(toWebRequest(event))
})
