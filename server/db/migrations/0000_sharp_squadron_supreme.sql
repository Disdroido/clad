CREATE TYPE "public"."clothing_type" AS ENUM('t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie', 'jacket', 'coat', 'jeans', 'trousers', 'shorts', 'skirt', 'dress', 'shoes', 'accessory', 'other');--> statement-breakpoint
CREATE TYPE "public"."formality_level" AS ENUM('casual', 'smart_casual', 'business_casual', 'formal', 'black_tie');--> statement-breakpoint
CREATE TYPE "public"."pattern" AS ENUM('solid', 'striped', 'checked', 'floral', 'graphic', 'abstract');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('spring', 'summer', 'autumn', 'winter', 'all_season');--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255),
	"occasion" varchar(100),
	"item_ids" jsonb NOT NULL,
	"explanation" text,
	"rating" real,
	"worn_dates" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"style_preferences" jsonb,
	"skin_tone" varchar(50),
	"body_type" varchar(50),
	"preferred_colours" jsonb,
	"disliked_colours" jsonb,
	"formality_default" "formality_level" DEFAULT 'smart_casual',
	"climate" varchar(50),
	"wardrobe_goal" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wardrobe_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"clothing_type" "clothing_type" NOT NULL,
	"colour" varchar(100) NOT NULL,
	"pattern" "pattern" DEFAULT 'solid',
	"material" varchar(100),
	"formality_level" "formality_level" DEFAULT 'casual',
	"season" "season" DEFAULT 'all_season',
	"is_favorite" text DEFAULT 'false',
	"ai_confidence" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD CONSTRAINT "wardrobe_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;