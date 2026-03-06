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
      target_user_id text,
      audience text NOT NULL DEFAULT 'admin',
      read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS title text`);
  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS content text`);
  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS link text`);
  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS target_user_id text`);
  await db.execute(sql`ALTER TABLE admin_notification ADD COLUMN IF NOT EXISTS audience text`);
  await db.execute(sql`ALTER TABLE admin_notification ALTER COLUMN audience SET DEFAULT 'admin'`);
}

export async function createAdminNotification(input: {
  eventType: string;
  title: string;
  content?: string;
  link?: string | null;
  userName?: string;
  userEmail?: string;
}) {
  await ensureNotificationTable();

  const title = String(input.title || "").trim();
  if (!title) return;

  await db.insert(adminNotification).values({
    id: nanoid(),
    userName: String(input.userName || "系统通知").trim() || "系统通知",
    userEmail: String(input.userEmail || "no-reply@local").trim() || "no-reply@local",
    eventType: String(input.eventType || "system_event").trim() || "system_event",
    title,
    content: String(input.content || "").trim() || null,
    link: String(input.link || "").trim() || null,
    audience: "admin",
    read: false,
  });
}
