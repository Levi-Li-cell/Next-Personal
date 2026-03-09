import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminNotification } from "@/db/schema/notification";
import { and, desc, eq, sql } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/get-session";

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

export async function GET(request: NextRequest) {
  try {
    await ensureNotificationTable();
    const session = await getServerSession();
    const userId = session?.user?.id || null;

    if (!userId) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 30);
    const unreadOnly = searchParams.get("unreadOnly") !== "false";
    const eventType = String(searchParams.get("eventType") || "").trim();
    const offset = (page - 1) * limit;

    const conditions = [
      eq(adminNotification.audience, "public"),
      sql`(${adminNotification.targetUserId} IS NULL OR ${adminNotification.targetUserId} = ${userId})`,
    ];
    if (unreadOnly) {
      conditions.push(eq(adminNotification.read, false));
    }
    if (eventType && eventType !== "all") {
      conditions.push(eq(adminNotification.eventType, eventType));
    }

    const whereClause = and(...conditions);

    const rows = await db
      .select()
      .from(adminNotification)
      .where(whereClause)
      .orderBy(desc(adminNotification.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminNotification)
      .where(whereClause);

    const total = Number(totalResult[0]?.count || 0);

    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminNotification)
      .where(
        and(
          eq(adminNotification.audience, "public"),
          eq(adminNotification.read, false),
          sql`(${adminNotification.targetUserId} IS NULL OR ${adminNotification.targetUserId} = ${userId})`
        )
      );

    return NextResponse.json({
      success: true,
      data: rows,
      unreadCount: Number(unreadResult[0]?.count || 0),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取前台通知失败:", error);
    return NextResponse.json({ success: false, error: "获取前台通知失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureNotificationTable();
    const session = await getServerSession();
    const userId = session?.user?.id || null;

    if (!userId) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    const body = await request.json();
    if (body.markAll === true) {
      await db
        .update(adminNotification)
        .set({ read: true, updatedAt: new Date() })
        .where(
          and(
            eq(adminNotification.audience, "public"),
            eq(adminNotification.read, false),
            sql`(${adminNotification.targetUserId} IS NULL OR ${adminNotification.targetUserId} = ${userId})`
          )
        );
      return NextResponse.json({ success: true });
    }

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少通知ID" }, { status: 400 });
    }

    await db
      .update(adminNotification)
      .set({ read: true, updatedAt: new Date() })
      .where(
        and(
          eq(adminNotification.id, id),
          eq(adminNotification.audience, "public"),
          sql`(${adminNotification.targetUserId} IS NULL OR ${adminNotification.targetUserId} = ${userId})`
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("标记前台通知已读失败:", error);
    return NextResponse.json({ success: false, error: "标记前台通知已读失败" }, { status: 500 });
  }
}
