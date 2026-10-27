/**
 * 互动小游戏模块 · Supabase 表结构同步脚本
 *
 * 用法：node scripts/sync-games-tables.mjs
 * 说明：执行 drizzle/0005_interactive_games.sql 的幂等版本（CREATE IF NOT EXISTS），
 *       与 API 路由内的 ensureGameTables() 使用同一套语句，可重复执行。
 */
import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL, {
  prepare: false,
});

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS interactive_work (
    id text PRIMARY KEY,
    slug text NOT NULL,
    title text NOT NULL,
    tagline text,
    description text NOT NULL,
    author_name text NOT NULL DEFAULT '李伟',
    author_link text,
    tags jsonb DEFAULT '[]'::jsonb,
    cover_image text,
    cover_gradient text,
    scene_type text NOT NULL DEFAULT 'crystal-cluster',
    scene_config jsonb DEFAULT '{}'::jsonb,
    controls_hint jsonb DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'published',
    view_count integer NOT NULL DEFAULT 0,
    download_count integer NOT NULL DEFAULT 0,
    comment_count integer NOT NULL DEFAULT 0,
    rating_sum integer NOT NULL DEFAULT 0,
    rating_count integer NOT NULL DEFAULT 0,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    published_at timestamp DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS interactive_work_slug_unique ON interactive_work (slug)`,
  `CREATE INDEX IF NOT EXISTS interactive_work_status_idx ON interactive_work (status)`,
  `CREATE TABLE IF NOT EXISTS interactive_rating (
    id text PRIMARY KEY,
    work_id text NOT NULL,
    voter_key text NOT NULL,
    user_id text,
    score integer NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS interactive_rating_work_voter_unique ON interactive_rating (work_id, voter_key)`,
  `CREATE INDEX IF NOT EXISTS interactive_rating_work_id_idx ON interactive_rating (work_id)`,
  `CREATE TABLE IF NOT EXISTS interactive_comment (
    id text PRIMARY KEY,
    work_id text NOT NULL,
    user_id text,
    guest_name text,
    parent_id text,
    content text NOT NULL,
    like_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'approved',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS interactive_comment_work_idx ON interactive_comment (work_id)`,
  `CREATE INDEX IF NOT EXISTS interactive_comment_parent_idx ON interactive_comment (parent_id)`,
  `CREATE TABLE IF NOT EXISTS interactive_comment_like (
    id text PRIMARY KEY,
    comment_id text NOT NULL,
    voter_key text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS interactive_comment_like_unique ON interactive_comment_like (comment_id, voter_key)`,
  `DO $$ BEGIN
    ALTER TABLE interactive_rating
    ADD CONSTRAINT interactive_rating_work_id_interactive_work_id_fk
    FOREIGN KEY (work_id) REFERENCES public.interactive_work(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_rating
    ADD CONSTRAINT interactive_rating_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE set null;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment
    ADD CONSTRAINT interactive_comment_work_id_interactive_work_id_fk
    FOREIGN KEY (work_id) REFERENCES public.interactive_work(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment
    ADD CONSTRAINT interactive_comment_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE set null;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment
    ADD CONSTRAINT interactive_comment_parent_id_interactive_comment_id_fk
    FOREIGN KEY (parent_id) REFERENCES public.interactive_comment(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment_like
    ADD CONSTRAINT interactive_comment_like_comment_id_interactive_comment_id_fk
    FOREIGN KEY (comment_id) REFERENCES public.interactive_comment(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `ALTER TABLE interactive_work ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE interactive_rating ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE interactive_comment ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE interactive_comment_like ENABLE ROW LEVEL SECURITY`,
];

async function main() {
  try {
    console.log("→ 同步互动小游戏模块数据表到 Supabase…");
    for (const statement of STATEMENTS) {
      await sql.unsafe(statement);
    }
    console.log("✓ 表结构同步完成，验证结果：");

    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('interactive_work', 'interactive_rating', 'interactive_comment', 'interactive_comment_like')
      ORDER BY table_name
    `;
    for (const row of tables) {
      const [{ count }] = await sql.unsafe(`SELECT count(*)::int AS count FROM ${row.table_name}`);
      console.log(`  · ${row.table_name}（${count} 行）`);
    }

    const missing = ["interactive_work", "interactive_rating", "interactive_comment", "interactive_comment_like"].filter(
      (name) => !tables.some((row) => row.table_name === name),
    );
    if (missing.length > 0) {
      console.error(`✗ 缺少表：${missing.join(", ")}`);
      process.exitCode = 1;
    } else {
      console.log("✓ 四张表全部就绪");
    }
  } catch (error) {
    console.error("✗ 同步失败：", error.message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
