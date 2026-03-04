CREATE TABLE "blog" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" text,
	"image_links" jsonb DEFAULT '[]'::jsonb,
	"category" text DEFAULT '未分类' NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"author_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp,
	CONSTRAINT "blog_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"blog_id" text NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'approved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "blog_comment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_like" (
	"id" text PRIMARY KEY NOT NULL,
	"blog_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_like" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text,
	"cover_image" text,
	"tech_stack" json DEFAULT '[]'::json,
	"demo_url" text,
	"github_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort_order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "photo" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"album" text DEFAULT '默认相册',
	"tags" text,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "photo" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sso_token" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sso_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "author_education" (
	"id" text PRIMARY KEY NOT NULL,
	"school" text NOT NULL,
	"major" text NOT NULL,
	"degree" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"description" text,
	"achievements" json DEFAULT '[]'::json,
	"sort_order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "author_education" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "author_experience" (
	"id" text PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"position" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"description" text,
	"achievements" json DEFAULT '[]'::json,
	"tech_stack" json DEFAULT '[]'::json,
	"sort_order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "author_experience" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "author_honor" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"issuer" text,
	"date" text,
	"description" text,
	"image_url" text,
	"sort_order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "author_honor" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "author_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '李伟' NOT NULL,
	"title" text DEFAULT '前端开发工程师' NOT NULL,
	"bio" text,
	"gender" text DEFAULT '男',
	"age" text DEFAULT '23岁',
	"phone" text DEFAULT '13043428526',
	"education" text DEFAULT '本科',
	"location" text DEFAULT '江西 · 汉族',
	"preferred_city" text DEFAULT '全国',
	"preferred_position" text DEFAULT '前端开发工程师',
	"expected_salary" text DEFAULT '面议',
	"github_url" text,
	"linkedin_url" text,
	"email" text,
	"hobbies" json DEFAULT '[]'::json,
	"photos" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "author_profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "author_skill" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"level" text DEFAULT '80' NOT NULL,
	"category" text DEFAULT 'frontend',
	"sort_order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "author_skill" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_parent_id_blog_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_like" ADD CONSTRAINT "blog_like_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_like" ADD CONSTRAINT "blog_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blog_like_blog_user_unique" ON "blog_like" USING btree ("blog_id","user_id");