import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestbookMessage } from "@/db/schema/guestbook";
import { and, desc, eq, or, sql } from "drizzle-orm";
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
      notify_email_status text,
      notify_email_type text,
      notify_email_to text,
      notify_email_subject text,
      notify_email_content text,
      notify_email_message_id text,
      notify_email_error text,
      notify_email_at timestamp,
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
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_status text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_type text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_to text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_subject text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_content text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_message_id text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_error text`);
  await db.execute(sql`ALTER TABLE guestbook_message ADD COLUMN IF NOT EXISTS notify_email_at timestamp`);

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

function detectRiskyMessage(content: string, contact: string) {
  const normalized = `${content} ${contact}`.replace(/\s+/g, "").toLowerCase();
  const riskyPatterns = [
    /缅甸|东南亚|高薪|出国|盘口|代充|刷单|返利|博彩|赌博|贷款|办卡/i,
    /联系方式[:：]?\d{6,}/i,
    /\b1\d{10}\b/,
  ];

  const repeatedChunkPattern = /(.{8,})\1+/;
  const isRisky = riskyPatterns.some((pattern) => pattern.test(normalized)) || repeatedChunkPattern.test(normalized);

  return isRisky;
}

export async function GET(request: NextRequest) {
  try {
    await ensureGuestbookTable();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "public";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status === "public") {
      conditions.push(or(eq(guestbookMessage.status, "approved"), eq(guestbookMessage.status, "flagged")));
    } else if (status !== "all") {
      conditions.push(eq(guestbookMessage.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const messages = await db
      .select()
      .from(guestbookMessage)
      .where(whereClause)
      .orderBy(desc(guestbookMessage.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(guestbookMessage)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const safeData = status === "public"
      ? messages.map((item) => ({ ...item, contact: null }))
      : messages;

    return NextResponse.json({
      success: true,
      data: safeData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
    const isRisky = detectRiskyMessage(content, contact);

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
        status: isRisky ? "flagged" : "approved",
      })
      .returning();

    try {
      const notifyResult = await sendAdminNotificationEmail({
        eventType: isRisky ? "guestbook_warning" : "guestbook_message",
        userName: name,
        userEmail: session?.user?.email || contact || "guestbook@anonymous.local",
        content: isRisky ? `风险留言已拦截标记\n${content}` : content,
      });

      await db
        .update(guestbookMessage)
        .set({
          notifyEmailStatus: notifyResult?.status || "skipped",
          notifyEmailType: notifyResult?.eventType || null,
          notifyEmailTo: notifyResult?.recipients?.join(",") || null,
          notifyEmailSubject: notifyResult?.subject || null,
          notifyEmailContent: notifyResult?.textContent || null,
          notifyEmailMessageId: notifyResult?.messageId || null,
          notifyEmailError: notifyResult?.error || null,
          notifyEmailAt: new Date(),
        })
        .where(eq(guestbookMessage.id, message.id));

      message.notifyEmailStatus = notifyResult?.status || "skipped";
      message.notifyEmailType = notifyResult?.eventType || null;
      message.notifyEmailTo = notifyResult?.recipients?.join(",") || null;
      message.notifyEmailSubject = notifyResult?.subject || null;
      message.notifyEmailContent = notifyResult?.textContent || null;
      message.notifyEmailMessageId = notifyResult?.messageId || null;
      message.notifyEmailError = notifyResult?.error || null;
      message.notifyEmailAt = new Date();
    } catch (emailError) {
      console.error("发送留言通知邮件失败:", emailError);

      await db
        .update(guestbookMessage)
        .set({
          notifyEmailStatus: "failed",
          notifyEmailType: isRisky ? "guestbook_warning" : "guestbook_message",
          notifyEmailTo: null,
          notifyEmailSubject: null,
          notifyEmailContent: null,
          notifyEmailMessageId: null,
          notifyEmailError: emailError instanceof Error ? emailError.message : "邮件发送失败",
          notifyEmailAt: new Date(),
        })
        .where(eq(guestbookMessage.id, message.id));
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("创建留言失败:", error);
    return NextResponse.json({ success: false, error: "创建留言失败" }, { status: 500 });
  }
}
