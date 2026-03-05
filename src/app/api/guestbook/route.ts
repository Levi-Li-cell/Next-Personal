import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestbookMessage } from "@/db/schema/guestbook";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendAdminNotificationEmail } from "@/lib/admin/email";

export async function GET(request: NextRequest) {
  try {
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
    const body = await request.json();
    const name = String(body.name || "").trim();
    const content = String(body.content || "").trim();
    const contact = String(body.contact || "").trim();

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
        userEmail: contact || "guestbook@anonymous.local",
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
