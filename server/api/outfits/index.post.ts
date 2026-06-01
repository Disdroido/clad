import { useDb } from '~~/server/db'
import { outfits } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const body = await readBody(event)
  const { itemIds, explanation, occasion } = body ?? {}

  if (!itemIds?.length) throw createError({ statusCode: 400, message: 'No items in outfit' })
  if (!explanation) throw createError({ statusCode: 400, message: 'Missing outfit explanation' })
  if (!occasion) throw createError({ statusCode: 400, message: 'Missing occasion' })

  const [saved] = await db
    .insert(outfits)
    .values({
      userId,
      itemIds,
      explanation,
      occasion,
    })
    .returning()

  return saved
})
