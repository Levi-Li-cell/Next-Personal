CREATE TABLE "interactive_work" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text,
	"description" text NOT NULL,
	"author_name" text DEFAULT '李伟' NOT NULL,
	"author_link" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"cover_image" text,
	"cover_gradient" text,
	"scene_type" DEFAULT 'crystal-cluster' NOT NULL,
	"scene_config" jsonb DEFAULT '{}'::jsonb,
	"controls_hint" jsonb DEFAULT '[]'::jsonb,
	"status" DEFAULT 'published' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp DEFAULT now(),
	CONSTRAINT "interactive_work_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "interactive_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"voter_key" text NOT NULL,
	"user_id" text,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactive_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"user_id" text,
	"guest_name" text,
	"parent_id" text,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"status" DEFAULT 'approved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactive_comment_like" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"voter_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "interactive_rating_work_voter_unique" ON "interactive_rating" ("work_id","voter_key");--> statement-breakpoint
CREATE UNIQUE INDEX "interactive_comment_like_unique" ON "interactive_comment_like" ("comment_id","voter_key");--> statement-breakpoint
CREATE INDEX "interactive_comment_work_idx" ON "interactive_comment" ("work_id");--> statement-breakpoint
CREATE INDEX "interactive_comment_parent_idx" ON "interactive_comment" ("parent_id");--> statement-breakpoint
ALTER TABLE "interactive_rating" ADD CONSTRAINT "interactive_rating_work_id_interactive_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."interactive_work"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "interactive_rating" ADD CONSTRAINT "interactive_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "interactive_comment" ADD CONSTRAINT "interactive_comment_work_id_interactive_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."interactive_work"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "interactive_comment" ADD CONSTRAINT "interactive_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "interactive_comment" ADD CONSTRAINT "interactive_comment_parent_id_interactive_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."interactive_comment"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "interactive_comment_like" ADD CONSTRAINT "interactive_comment_like_comment_id_interactive_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."interactive_comment"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "interactive_work" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "interactive_rating" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "interactive_comment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "interactive_comment_like" ENABLE ROW LEVEL SECURITY;
