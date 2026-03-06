import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";
import { db } from "@/db";

function getClientIp(headers: Headers) {
  const forwarded = String(headers.get("x-forwarded-for") || "").trim();
  const realIp = String(headers.get("x-real-ip") || "").trim();
  return (forwarded.split(",")[0] || realIp || "unknown").trim() || "unknown";
}

async function ensureRegistrationAuditTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS registration_audit (
      id text PRIMARY KEY,
      ip_address text NOT NULL,
      user_agent text,
      email text,
      blocked boolean NOT NULL DEFAULT false,
      reason text,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

export async function ensureUserRegisterColumns() {
  await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "register_ip" text`);
  await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "register_user_agent" text`);
  await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "register_risk_level" text`);
}

export async function guardRegistration(
  request: Request,
  email?: string,
  options?: { persistAttempt?: boolean }
) {
  await ensureRegistrationAuditTable();

  const ip = getClientIp(request.headers);
  const userAgent = String(request.headers.get("user-agent") || "").trim() || null;
  const safeEmail = String(email || "").trim() || null;

  const shortResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM registration_audit
    WHERE ip_address = ${ip}
      AND created_at > now() - interval '10 minutes'
  `);

  const dayResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM registration_audit
    WHERE ip_address = ${ip}
      AND created_at > now() - interval '1 day'
  `);

  const shortCount = Number((shortResult as unknown as { rows?: Array<{ count: number }> }).rows?.[0]?.count || 0);
  const dayCount = Number((dayResult as unknown as { rows?: Array<{ count: number }> }).rows?.[0]?.count || 0);

  let blocked = false;
  let reason: string | null = null;
  let riskLevel = "low";

  if (shortCount >= 3) {
    blocked = true;
    reason = "同一IP短时间注册过于频繁";
    riskLevel = "high";
  } else if (dayCount >= 10) {
    blocked = true;
    reason = "同一IP当日注册次数超限";
    riskLevel = "high";
  } else if (shortCount >= 2 || dayCount >= 6) {
    riskLevel = "medium";
  }

  if (options?.persistAttempt !== false) {
    await db.execute(sql`
      INSERT INTO registration_audit (id, ip_address, user_agent, email, blocked, reason)
      VALUES (${nanoid()}, ${ip}, ${userAgent}, ${safeEmail}, ${blocked}, ${reason})
    `);
  }

  return {
    blocked,
    ip,
    userAgent,
    riskLevel,
    reason,
    shortCount,
    dayCount,
  };
}
