CREATE TABLE "lead" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'client' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"job_title" text,
	"project_type" text,
	"budget_range" text,
	"timeline" text,
	"source_page" text,
	"message" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "lead" ENABLE ROW LEVEL SECURITY;
