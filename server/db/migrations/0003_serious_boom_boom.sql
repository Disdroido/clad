CREATE TABLE "outfit_wear_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outfit_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"worn_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_outfits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"outfit_id" uuid NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"purpose" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outfits" ADD COLUMN "wear_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "outfits" ADD COLUMN "last_worn_at" timestamp;--> statement-breakpoint
ALTER TABLE "outfit_wear_events" ADD CONSTRAINT "outfit_wear_events_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_wear_events" ADD CONSTRAINT "outfit_wear_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_outfits" ADD CONSTRAINT "scheduled_outfits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_outfits" ADD CONSTRAINT "scheduled_outfits_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;