ALTER TABLE "outfits" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "clothing_sub_type" varchar(100);--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;