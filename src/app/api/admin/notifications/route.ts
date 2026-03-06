import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminNotification } from "@/db/schema/notification";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendAdminNotificationEmail } from "@/lib/admin/email";

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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const conditions = [eq(adminNotification.audience, "admin")];
    if (unreadOnly) {
      conditions.push(eq(adminNotification.read, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminNotification)
      .where(and(eq(adminNotification.read, false), eq(adminNotification.audience, "admin")));

    return NextResponse.json({
      success: true,
      data: rows,
      unreadCount: Number(unreadResult[0]?.count || 0),
      pagination: {
        page,
        limit,
        total: Number(totalResult[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    return NextResponse.json({ success: false, error: "获取通知列表失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureNotificationTable();
    const body = await request.json();

    if (body.markAll === true) {
      await db
        .update(adminNotification)
        .set({ read: true, updatedAt: new Date() })
        .where(and(eq(adminNotification.read, false), eq(adminNotification.audience, "admin")));
      return NextResponse.json({ success: true });
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      await db
        .update(adminNotification)
        .set({ read: true, updatedAt: new Date() })
        .where(and(inArray(adminNotification.id, body.ids), eq(adminNotification.audience, "admin")));
      return NextResponse.json({ success: true });
    }

    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, error: "缺少通知ID" }, { status: 400 });
    }

    await db
      .update(adminNotification)
      .set({ read: true, updatedAt: new Date() })
      .where(and(eq(adminNotification.id, id), eq(adminNotification.audience, "admin")));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新通知状态失败:", error);
    return NextResponse.json({ success: false, error: "更新通知状态失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureNotificationTable();
    const { searchParams } = new URL(request.url);
    const idsStr = searchParams.get("ids");
    const id = searchParams.get("id");

    if (idsStr) {
      const ids = idsStr.split(",").map((v) => v.trim()).filter(Boolean);
      if (ids.length > 0) {
        await db.delete(adminNotification).where(and(inArray(adminNotification.id, ids), eq(adminNotification.audience, "admin")));
      }
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少通知ID" }, { status: 400 });
    }

    await db.delete(adminNotification).where(and(eq(adminNotification.id, id), eq(adminNotification.audience, "admin")));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除通知失败:", error);
    return NextResponse.json({ success: false, error: "删除通知失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureNotificationTable();
    const body = await request.json();
    const userName = String(body.userName || "").trim();
    const userEmail = String(body.userEmail || "").trim();
    const eventType = String(body.eventType || "user_signup").trim();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const link = String(body.link || "").trim();
    const targetUserId = String(body.targetUserId || "").trim();
    const audience = String(body.audience || "admin").trim() || "admin";

    if (!userName || !userEmail) {
      return NextResponse.json({ success: false, error: "缺少用户名或邮箱" }, { status: 400 });
    }

    const [created] = await db
      .insert(adminNotification)
      .values({
        id: nanoid(),
        userName,
        userEmail,
        eventType,
        title: title || null,
        content: content || null,
        link: link || null,
        targetUserId: targetUserId || null,
        audience,
        read: false,
      })
      .returning();

    try {
      await sendAdminNotificationEmail({
        eventType,
        userName,
        userEmail,
      });
    } catch (emailError) {
      console.error("发送管理员邮件通知失败:", emailError);
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("创建通知失败:", error);
    return NextResponse.json({ success: false, error: "创建通知失败" }, { status: 500 });
  }
}
