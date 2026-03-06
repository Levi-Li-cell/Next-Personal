import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { nanoid } from "nanoid";

const BLOG_TITLE = "普通人不必要使用 OpenClaw";
const BLOG_SLUG = "ordinary-people-dont-need-openclaw";
const BLOG_EXCERPT = "OpenClaw 爆火背后，普通人更需要稳定工具，而不是为折腾本身付出高昂时间成本。";
const BLOG_COVER = "https://eypphxaje0isjpo6.public.blob.vercel-storage.com/ScreenShot_2026-03-06_122741_970.png";

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL");
}

const sql = postgres(conn);

async function ensureRealtimeAndPolicy() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS admin_notification (
      id text PRIMARY KEY,
      user_name text NOT NULL,
      user_email text NOT NULL,
      event_type text NOT NULL DEFAULT 'user_signup',
      title text,
      content text,
      link text,
      audience text NOT NULL DEFAULT 'admin',
      read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await sql.unsafe(`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS title text;`);
  await sql.unsafe(`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS content text;`);
  await sql.unsafe(`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS link text;`);
  await sql.unsafe(`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS audience text;`);
  await sql.unsafe(`ALTER TABLE admin_notification ALTER COLUMN audience SET DEFAULT 'admin';`);
  await sql.unsafe(`ALTER TABLE admin_notification ENABLE ROW LEVEL SECURITY;`);

  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'admin_notification'
          AND policyname = 'public_can_select_public_notifications'
      ) THEN
        CREATE POLICY public_can_select_public_notifications
        ON public.admin_notification
        FOR SELECT
        TO anon, authenticated
        USING (audience = 'public' AND read = false);
      END IF;
    END $$;
  `);

  await sql.unsafe(`GRANT SELECT ON TABLE public.admin_notification TO anon, authenticated;`);

  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'admin_notification'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notification;
      END IF;
    END $$;
  `);
}

async function publishBlog() {
  const markdownPath = path.join(process.cwd(), "docs", "普通人不必要使用openclaw.md");
  const markdown = fs.readFileSync(markdownPath, "utf8");

  const [author] = await sql`SELECT id, name, email FROM "user" ORDER BY "createdAt" ASC LIMIT 1`;
  if (!author) {
    throw new Error("No user found in table 'user', cannot set blog authorId");
  }

  const [existing] = await sql`SELECT id FROM blog WHERE slug = ${BLOG_SLUG} LIMIT 1`;

  let blogId = existing?.id;
  if (blogId) {
    await sql`
      UPDATE blog
      SET
        title = ${BLOG_TITLE},
        excerpt = ${BLOG_EXCERPT},
        content = ${markdown},
        cover_image = ${BLOG_COVER},
        image_links = ${JSON.stringify([BLOG_COVER])}::jsonb,
        category = ${"观点"},
        tags = ${JSON.stringify(["OpenClaw", "AI", "工具"])}::json,
        author_id = ${author.id},
        status = ${"published"},
        published_at = now(),
        updated_at = now()
      WHERE id = ${blogId}
    `;
  } else {
    blogId = nanoid();
    await sql`
      INSERT INTO blog (
        id, title, slug, excerpt, content, cover_image, image_links,
        category, tags, author_id, status, view_count, like_count,
        created_at, updated_at, published_at
      ) VALUES (
        ${blogId}, ${BLOG_TITLE}, ${BLOG_SLUG}, ${BLOG_EXCERPT}, ${markdown}, ${BLOG_COVER},
        ${JSON.stringify([BLOG_COVER])}::jsonb,
        ${"观点"}, ${JSON.stringify(["OpenClaw", "AI", "工具"])}::json,
        ${author.id}, ${"published"}, 0, 0, now(), now(), now()
      )
    `;
  }

  await sql`
    INSERT INTO admin_notification (
      id, user_name, user_email, event_type, title, content, link, audience, read, created_at, updated_at
    ) VALUES (
      ${nanoid()}, ${"系统通知"}, ${"no-reply@local"}, ${"blog_published"},
      ${`新博客上线：${BLOG_TITLE}`}, ${BLOG_EXCERPT}, ${`/blog/${BLOG_SLUG}`}, ${"public"}, false, now(), now()
    )
  `;

  return { blogId, slug: BLOG_SLUG, authorId: author.id };
}

async function main() {
  await ensureRealtimeAndPolicy();
  const blogInfo = await publishBlog();
  console.log("DONE", { ...blogInfo, realtime: "configured" });
}

main()
  .catch((error) => {
    console.error("Failed to publish blog and configure realtime:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
