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
