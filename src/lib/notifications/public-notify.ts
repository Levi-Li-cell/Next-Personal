import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { adminNotification } from "@/db/schema/notification";

async function ensureNotificationTable() {
  await db.execute(sql`
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
    )
  `);

  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS title text`);
  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS content text`);
  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS link text`);
  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS audience text`);
  await db.execute(sql`ALTER TABLE admin_notification ALTER COLUMN audience SET DEFAULT 'admin'`);
}

export async function createPublicNotification(input: {
  eventType: "announcement" | "blog_published" | "project_published";
  title: string;
  content?: string;
  link?: string | null;
}) {
  await ensureNotificationTable();

  const title = String(input.title || "").trim();
  if (!title) return;

  await db.insert(adminNotification).values({
    id: nanoid(),
    userName: "系统通知",
    userEmail: "no-reply@local",
    eventType: input.eventType,
    title,
    content: String(input.content || "").trim() || null,
    link: String(input.link || "").trim() || null,
    audience: "public",
    read: false,
  });
}
