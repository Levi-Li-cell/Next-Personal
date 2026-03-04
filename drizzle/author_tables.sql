-- Author Profile Table
CREATE TABLE IF NOT EXISTS "author_profile" (
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
ALTER TABLE "author_profile" ENABLE ROW LEVEL SECURITY;

-- Author Skill Table
CREATE TABLE IF NOT EXISTS "author_skill" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"level" text DEFAULT '80' NOT NULL,
	"category" text DEFAULT 'frontend',
	"sort_order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
ALTER TABLE "author_skill" ENABLE ROW LEVEL SECURITY;

-- Author Experience Table
CREATE TABLE IF NOT EXISTS "author_experience" (
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
ALTER TABLE "author_experience" ENABLE ROW LEVEL SECURITY;

-- Author Education Table
CREATE TABLE IF NOT EXISTS "author_education" (
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
ALTER TABLE "author_education" ENABLE ROW LEVEL SECURITY;

-- Author Honor Table
CREATE TABLE IF NOT EXISTS "author_honor" (
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
ALTER TABLE "author_honor" ENABLE ROW LEVEL SECURITY;
