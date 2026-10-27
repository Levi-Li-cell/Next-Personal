-- 创建sso_token表
CREATE TABLE IF NOT EXISTS "sso_token" (
  "id" text PRIMARY KEY NOT NULL,
  "token" text NOT NULL,
  "user_id" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "sso_token_token_unique" UNIQUE("token")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "sso_token_user_id_idx" ON "sso_token" ("user_id");
CREATE INDEX IF NOT EXISTS "sso_token_expires_at_idx" ON "sso_token" ("expires_at");

-- ========================================
-- 互动小游戏模块（/games）
-- 生成时间：2026-10，与 src/db/schema/game.ts 保持同步
-- ========================================

-- 互动作品表
CREATE TABLE IF NOT EXISTS "interactive_work" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "tagline" text,
  "description" text NOT NULL,
  "author_name" text NOT NULL DEFAULT '李伟',
  "author_link" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "cover_image" text,
  "cover_gradient" text,
  "scene_type" text NOT NULL DEFAULT 'crystal-cluster',
  "scene_config" jsonb DEFAULT '{}'::jsonb,
  "controls_hint" jsonb DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'published',
  "view_count" integer NOT NULL DEFAULT 0,
  "download_count" integer NOT NULL DEFAULT 0,
  "comment_count" integer NOT NULL DEFAULT 0,
  "rating_sum" integer NOT NULL DEFAULT 0,
  "rating_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "published_at" timestamp DEFAULT now(),
  CONSTRAINT "interactive_work_slug_unique" UNIQUE("slug")
);
CREATE INDEX IF NOT EXISTS "interactive_work_status_idx" ON "interactive_work" ("status");

-- 评分表（work_id + voter_key 唯一，重复提交视为改分）
CREATE TABLE IF NOT EXISTS "interactive_rating" (
  "id" text PRIMARY KEY NOT NULL,
  "work_id" text NOT NULL,
  "voter_key" text NOT NULL,
  "user_id" text,
  "score" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "interactive_rating_work_voter_unique" ON "interactive_rating" ("work_id", "voter_key");
CREATE INDEX IF NOT EXISTS "interactive_rating_work_id_idx" ON "interactive_rating" ("work_id");

-- 评论表（parent_id 自关联，一层回复树）
CREATE TABLE IF NOT EXISTS "interactive_comment" (
  "id" text PRIMARY KEY NOT NULL,
  "work_id" text NOT NULL,
  "user_id" text,
  "guest_name" text,
  "parent_id" text,
  "content" text NOT NULL,
  "like_count" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'approved',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "interactive_comment_work_idx" ON "interactive_comment" ("work_id");
CREATE INDEX IF NOT EXISTS "interactive_comment_parent_idx" ON "interactive_comment" ("parent_id");

-- 评论点赞表（comment_id + voter_key 唯一，POST 切换）
CREATE TABLE IF NOT EXISTS "interactive_comment_like" (
  "id" text PRIMARY KEY NOT NULL,
  "comment_id" text NOT NULL,
  "voter_key" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "interactive_comment_like_unique" ON "interactive_comment_like" ("comment_id", "voter_key");

-- 外键（幂等）
DO $$ BEGIN
  ALTER TABLE "interactive_rating"
  ADD CONSTRAINT "interactive_rating_work_id_interactive_work_id_fk"
  FOREIGN KEY ("work_id") REFERENCES "public"."interactive_work"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "interactive_rating"
  ADD CONSTRAINT "interactive_rating_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "interactive_comment"
  ADD CONSTRAINT "interactive_comment_work_id_interactive_work_id_fk"
  FOREIGN KEY ("work_id") REFERENCES "public"."interactive_work"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "interactive_comment"
  ADD CONSTRAINT "interactive_comment_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "interactive_comment"
  ADD CONSTRAINT "interactive_comment_parent_id_interactive_comment_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "public"."interactive_comment"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "interactive_comment_like"
  ADD CONSTRAINT "interactive_comment_like_comment_id_interactive_comment_id_fk"
  FOREIGN KEY ("comment_id") REFERENCES "public"."interactive_comment"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
