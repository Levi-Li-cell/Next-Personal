import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/get-session";
import { isAdminRequest } from "@/lib/require-admin";

const DEFAULT_FLAGS: Record<string, boolean> = {
  showSponsorPage: false,
  showWeatherWidget: false,
  showSnakeGame: false,
  showGeoLab: false,
  showAuthorPage: false,
  allowPublicAuthorPage: false,
  enable3DTools: false,
};

async function ensureTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_setting (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

async function readFlags(): Promise<Record<string, boolean>> {
  await ensureTable();
  const result = await db.execute(sql`
    SELECT value FROM site_setting WHERE key = 'feature_flags'
  `) as { value: string }[];
  if (result.length === 0) {
    return { ...DEFAULT_FLAGS };
  }
  try {
    const parsed = JSON.parse(result[0].value);
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

async function writeFlags(flags: Record<string, boolean>) {
  await ensureTable();
  const value = JSON.stringify(flags);
  await db.execute(sql`
    INSERT INTO site_setting (key, value, updated_at)
    VALUES ('feature_flags', ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now()
  `);
}

export async function GET() {
  try {
    const flags = await readFlags();
    return NextResponse.json({ success: true, data: flags });
  } catch (error) {
    console.error("Failed to read feature flags:", error);
    return NextResponse.json({ success: true, data: DEFAULT_FLAGS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !(await isAdminRequest())) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const current = await readFlags();

    const updated: Record<string, boolean> = { ...current };
    for (const key of Object.keys(DEFAULT_FLAGS)) {
      if (typeof body[key] === "boolean") {
        updated[key] = body[key];
      }
    }

    await writeFlags(updated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update feature flags:", error);
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}
