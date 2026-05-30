import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  real,
  jsonb,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core'

// ----------------------------------------------------------------------------
// Better Auth tables (matches `npx @better-auth/cli generate` output for the
// drizzle/pg adapter). IDs are `text` to match Better Auth's defaults.
// ----------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ----------------------------------------------------------------------------
// App enums
// ----------------------------------------------------------------------------

export const clothingTypeEnum = pgEnum('clothing_type', [
  't-shirt', 'shirt', 'blouse', 'sweater', 'hoodie',
  'jacket', 'coat', 'jeans', 'trousers', 'shorts',
  'skirt', 'dress', 'shoes', 'accessory', 'other',
])

export const formalityEnum = pgEnum('formality_level', [
  'casual', 'smart_casual', 'business_casual', 'formal', 'black_tie',
])

export const seasonEnum = pgEnum('season', [
  'spring', 'summer', 'autumn', 'winter', 'all_season',
])

export const patternEnum = pgEnum('pattern', [
  'solid', 'striped', 'checked', 'floral', 'graphic', 'abstract',
])

// ----------------------------------------------------------------------------
// App tables. user_id is `text` to match the Better Auth `user.id` column.
// ----------------------------------------------------------------------------

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
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

export const wardrobeItems = pgTable('wardrobe_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  clothingType: clothingTypeEnum('clothing_type').notNull(),
  colour: varchar('colour', { length: 100 }).notNull(),
  pattern: patternEnum('pattern').default('solid'),
  material: varchar('material', { length: 100 }),
  formalityLevel: formalityEnum('formality_level').default('casual'),
  season: seasonEnum('season').default('all_season'),
  isFavorite: boolean('is_favorite').default(false),
  aiConfidence: real('ai_confidence'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const outfits = pgTable('outfits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }),
  occasion: varchar('occasion', { length: 100 }),
  itemIds: jsonb('item_ids').$type<string[]>().notNull(),
  explanation: text('explanation'),
  rating: real('rating'),
  wornDates: jsonb('worn_dates').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
