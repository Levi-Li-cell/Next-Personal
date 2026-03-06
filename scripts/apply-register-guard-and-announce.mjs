import "dotenv/config";
import postgres from "postgres";
import { nanoid } from "nanoid";

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL");
}

const sql = postgres(conn);

async function ensureSchema() {
  await sql.unsafe(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS register_ip text;`);
  await sql.unsafe(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS register_user_agent text;`);
  await sql.unsafe(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS register_risk_level text;`);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS registration_audit (
      id text PRIMARY KEY,
      ip_address text NOT NULL,
      user_agent text,
      email text,
      blocked boolean NOT NULL DEFAULT false,
      reason text,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await sql.unsafe(`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS target_user_id text;`);
}

async function publishAntiAbuseAnnouncement() {
  const title = "关于恶意批量注册行为的公告";
  const slug = "announcement-anti-bulk-registration";
  const content = "请广大用户不要恶意批量注册，否则将拒绝您的注册以及其他账号的使用。";

  const existing = await sql`SELECT id FROM blog WHERE slug = ${slug} LIMIT 1`;
  if (existing[0]) {
    return;
  }

  const users = await sql`SELECT id FROM "user" ORDER BY "createdAt" ASC LIMIT 1`;
  const author = users[0];
  if (!author?.id) {
    return;
  }

  await sql`
    INSERT INTO blog (
      id, title, slug, excerpt, content, cover_image, image_links,
      category, tags, author_id, status, view_count, like_count,
      created_at, updated_at, published_at
    ) VALUES (
      ${nanoid()}, ${title}, ${slug}, ${content}, ${content}, NULL, '[]'::jsonb,
      ${"公告"}, ${JSON.stringify(["公告"])}::json, ${author.id}, ${"published"}, 0, 0,
      now(), now(), now()
    )
  `;

  await sql`
    INSERT INTO admin_notification (
      id, user_name, user_email, event_type, title, content, link, target_user_id, audience, read, created_at, updated_at
    ) VALUES (
      ${nanoid()}, ${"系统通知"}, ${"no-reply@local"}, ${"announcement"},
      ${`站点公告：${title}`}, ${content}, ${`/blog/${slug}`}, NULL, ${"public"}, false, now(), now()
    )
  `;
}

async function main() {
  await ensureSchema();
  await publishAntiAbuseAnnouncement();
  console.log("REGISTER_GUARD_AND_ANNOUNCEMENT_OK");
}

main()
  .catch((error) => {
    console.error("Failed to apply register guard and announcement:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
