import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestbookMessage } from "@/db/schema/guestbook";
import { and, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendAdminNotificationEmail } from "@/lib/admin/email";
import { getServerSession } from "@/lib/auth/get-session";

async function ensureGuestbookTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS guestbook_message (
      id text PRIMARY KEY,
      user_id text,
      user_name text,
      user_email text,
      user_image text,
      ip_address text,
      user_agent text,
      name text NOT NULL,
      content text NOT NULL,
      contact text,
      status text NOT NULL DEFAULT 'approved',
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS user_id text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS user_name text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS user_email text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS user_image text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS ip_address text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS user_agent text`);

  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE "guestbook_message"
      ADD CONSTRAINT "guestbook_message_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureGuestbookTable();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "approved";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const conditions = [];
    if (status !== "all") {
      conditions.push(eq(guestbookMessage.status, status));
    }

    const messages = await db
      .select()
      .from(guestbookMessage)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(guestbookMessage.createdAt))
      .limit(limit);

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("获取留言列表失败:", error);
    return NextResponse.json({ success: false, error: "获取留言列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureGuestbookTable();
    const session = await getServerSession();
    const body = await request.json();
    const nameInput = String(body.name || "").trim();
    const content = String(body.content || "").trim();
    const contact = String(body.contact || "").trim();

    const name = nameInput || String(session?.user?.name || "").trim();
    const userAgent = String(request.headers.get("user-agent") || "").trim() || null;
    const forwardedFor = String(request.headers.get("x-forwarded-for") || "").trim();
    const ipAddress = (forwardedFor.split(",")[0] || request.headers.get("x-real-ip") || "").trim() || null;

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: "昵称至少 2 个字符" }, { status: 400 });
    }
    if (!content || content.length < 3) {
      return NextResponse.json({ success: false, error: "留言内容至少 3 个字符" }, { status: 400 });
    }

    const [message] = await db
      .insert(guestbookMessage)
      .values({
        id: nanoid(),
        userId: session?.user?.id || null,
        userName: session?.user?.name || null,
        userEmail: session?.user?.email || null,
        userImage: session?.user?.image || null,
        ipAddress,
        userAgent,
        name,
        content,
        contact: contact || null,
        status: "approved",
      })
      .returning();

    try {
      await sendAdminNotificationEmail({
        eventType: "guestbook_message",
        userName: name,
        userEmail: session?.user?.email || contact || "guestbook@anonymous.local",
        content,
      });
    } catch (emailError) {
      console.error("发送留言通知邮件失败:", emailError);
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("创建留言失败:", error);
    return NextResponse.json({ success: false, error: "创建留言失败" }, { status: 500 });
  }
}
