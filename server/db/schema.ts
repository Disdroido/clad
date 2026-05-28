import { pgTable, uuid, text, timestamp, varchar, real, jsonb, pgEnum } from 'drizzle-orm/pg-core'

// Enums
export const clothingTypeEnum = pgEnum('clothing_type', [
  't-shirt', 'shirt', 'blouse', 'sweater', 'hoodie',
  'jacket', 'coat', 'jeans', 'trousers', 'shorts',
  'skirt', 'dress', 'shoes', 'accessory', 'other'
])

export const formalityEnum = pgEnum('formality_level', [
  'casual', 'smart_casual', 'business_casual', 'formal', 'black_tie'
])

export const seasonEnum = pgEnum('season', [
  'spring', 'summer', 'autumn', 'winter', 'all_season'
])

export const patternEnum = pgEnum('pattern', [
  'solid', 'striped', 'checked', 'floral', 'graphic', 'abstract'
])

// Users table (managed by better-auth, but we add profile fields)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// User profile from onboarding
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stylePreferences: jsonb('style_preferences').$type<string[]>(),
  skinTone: varchar('skin_tone', { length: 50 }),
  bodyType: varchar('body_type', { length: 50 }),
  preferredColours: jsonb('preferred_colours').$type<string[]>(),
  dislikedColours: jsonb('disliked_colours').$type<string[]>(),
  formalityDefault: formalityEnum('formality_default').default('smart_casual'),
  climate: varchar('climate', { length: 50 }),
  wardrobeGoal: varchar('wardrobe_goal', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Wardrobe items
export const wardrobeItems = pgTable('wardrobe_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  clothingType: clothingTypeEnum('clothing_type').notNull(),
  colour: varchar('colour', { length: 100 }).notNull(),
  pattern: patternEnum('pattern').default('solid'),
  material: varchar('material', { length: 100 }),
  formalityLevel: formalityEnum('formality_level').default('casual'),
  season: seasonEnum('season').default('all_season'),
  isFavorite: text('is_favorite').default('false'),
  aiConfidence: real('ai_confidence'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Generated outfits
export const outfits = pgTable('outfits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }),
  occasion: varchar('occasion', { length: 100 }),
  itemIds: jsonb('item_ids').$type<string[]>().notNull(),
  explanation: text('explanation'),
  rating: real('rating'),
  wornDates: jsonb('worn_dates').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
