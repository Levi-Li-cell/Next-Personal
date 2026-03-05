import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function ensureAdminNotifySettingTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_notify_setting (
      user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      notify_email text NOT NULL,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

export async function getAdminNotifyReceivers() {
  await ensureAdminNotifySettingTable();

  const result = await db.execute(sql`
    SELECT
      u.id,
      u.email AS user_email,
      COALESCE(s.notify_email, u.email) AS notify_email,
      COALESCE(s.enabled, true) AS enabled
    FROM "user" u
    LEFT JOIN admin_notify_setting s ON s.user_id = u.id
    WHERE lower(u.role) = 'admin'
  `);

  const rows = (result as unknown as {
    rows?: Array<{ id: string; user_email: string; notify_email: string; enabled: boolean }>;
  }).rows || [];

  const adminReceivers = rows.filter((item) => item.enabled).map((item) => item.notify_email);
  if (adminReceivers.length > 0) {
    return adminReceivers;
  }

  const fallbackResult = await db.execute(sql`
    SELECT notify_email
    FROM admin_notify_setting
    WHERE enabled = true
  `);

  const fallbackRows = (fallbackResult as unknown as {
    rows?: Array<{ notify_email: string }>;
  }).rows || [];

  return fallbackRows.map((item) => item.notify_email).filter(Boolean);
}
