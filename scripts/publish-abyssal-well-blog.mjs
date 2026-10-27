import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { nanoid } from "nanoid";

const BLOG_TITLE = "深渊之井：一个单文件原生 WebGL2 像素洞穴引擎的技术剖析";
const BLOG_SLUG = "abyssal-well-webgl2-deep-dive";
const BLOG_EXCERPT =
  "零依赖的单 HTML 文件里跑完整游戏级渲染管线：MRT 延迟渲染、程序化双纹理资产、Ping-Pong GPU 流体，以及一套把引擎变成仪器的 postMessage 宿主协议（AWP/1）。";
const BLOG_COVER = "/liwei/images/abyssal-well-cover.png";
const BLOG_CATEGORY = "技术";
const BLOG_TAGS = ["WebGL2", "游戏引擎", "图形学", "渲染管线"];
const NOTIF_TITLE = `新博客上线：${BLOG_TITLE}`;

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL");
}

const sql = postgres(conn);

async function publishBlog() {
  const markdownPath = path.join(process.cwd(), "docs", "abyssal-well-deep-dive.md");
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
        category = ${BLOG_CATEGORY},
        tags = ${JSON.stringify(BLOG_TAGS)}::json,
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
        ${BLOG_CATEGORY}, ${JSON.stringify(BLOG_TAGS)}::json,
        ${author.id}, ${"published"}, 0, 0, now(), now(), now()
      )
    `;
  }

  return { blogId, slug: BLOG_SLUG, authorId: author.id };
}

async function notifyAdmin() {
  const [existing] = await sql`
    SELECT id FROM admin_notification
    WHERE event_type = 'blog_published' AND title = ${NOTIF_TITLE}
    LIMIT 1
  `;
  if (existing) return "already-notified";

  await sql`
    INSERT INTO admin_notification (
      id, user_name, user_email, event_type, title, content, link, audience, read, created_at, updated_at
    ) VALUES (
      ${nanoid()}, ${"系统通知"}, ${"no-reply@local"}, ${"blog_published"},
      ${NOTIF_TITLE}, ${BLOG_EXCERPT}, ${`/blog/${BLOG_SLUG}`}, ${"admin"}, false, now(), now()
    )
  `;
  return "created";
}

async function main() {
  const blogInfo = await publishBlog();
  const notification = await notifyAdmin();
  console.log("DONE", { ...blogInfo, notification });
}

main()
  .catch((error) => {
    console.error("Failed to publish abyssal-well blog:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
