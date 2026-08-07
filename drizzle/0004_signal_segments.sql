ALTER TABLE "blog"
ADD COLUMN "target_audience" text DEFAULT 'both' NOT NULL,
ADD COLUMN "cta_type" text DEFAULT 'both' NOT NULL,
ADD COLUMN "featured" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "project"
ADD COLUMN "cover_image" text,
ADD COLUMN "target_audience" text DEFAULT 'both' NOT NULL,
ADD COLUMN "cta_type" text DEFAULT 'both' NOT NULL,
ADD COLUMN "featured" boolean DEFAULT false NOT NULL;
