-- Sync schema: add missing columns to match frontend schemas

-- blog table: add target_audience, cta_type, featured
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "target_audience" text NOT NULL DEFAULT 'both';
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "cta_type" text NOT NULL DEFAULT 'both';
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;

-- project table: add target_audience, cta_type, featured, image_links
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "target_audience" text NOT NULL DEFAULT 'both';
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "cta_type" text NOT NULL DEFAULT 'both';
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "image_links" jsonb DEFAULT '[]';

-- user table: add image_links, register_ip, register_user_agent, register_risk_level
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "image_links" json DEFAULT '[]';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "register_ip" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "register_user_agent" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "register_risk_level" text;

-- lead table: create if not exists
CREATE TABLE IF NOT EXISTS "lead" (
  "id" text PRIMARY KEY,
  "type" text NOT NULL DEFAULT 'client',
  "status" text NOT NULL DEFAULT 'new',
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
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Enable RLS on lead table
ALTER TABLE "lead" ENABLE ROW LEVEL SECURITY;
