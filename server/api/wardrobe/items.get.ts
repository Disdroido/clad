export default defineEventHandler(async (event) => {
  // TODO: Get user ID from auth session and filter
  // const items = await db.select().from(wardrobeItems).where(eq(wardrobeItems.userId, userId))

  return { items: [] }
})
