CREATE TYPE "public"."condition" AS ENUM('new', 'good', 'worn', 'needs_repair');--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "clothing_type" NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"notes" text,
	"url" text,
	"is_purchased" boolean DEFAULT false NOT NULL,
	"purchased_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "is_clean" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "condition" "condition" DEFAULT 'good';--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "brand" varchar(200);--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "price_paid" integer;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "purchase_date" timestamp;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;