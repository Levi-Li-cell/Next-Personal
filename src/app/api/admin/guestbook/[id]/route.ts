import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestbookMessage } from "@/db/schema/guestbook";
import { eq } from "drizzle-orm";
import { sendGuestbookReplyEmail } from "@/lib/admin/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "");
    const validStatuses = ["pending", "approved", "rejected"];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "无效状态" }, { status: 400 });
    }

    const [existing] = await db.select().from(guestbookMessage).where(eq(guestbookMessage.id, id));
    if (!existing) {
      return NextResponse.json({ success: false, error: "留言不存在" }, { status: 404 });
    }

    const [updated] = await db
      .update(guestbookMessage)
      .set({ status })
      .where(eq(guestbookMessage.id, id))
      .returning();

    try {
      const contact = String(existing.contact || "").trim();
      if (contact.includes("@")) {
        await sendGuestbookReplyEmail({
          to: contact,
          guestName: existing.name,
          status,
          replyContent: status === "approved" ? "您的留言已通过审核并展示在留言板。" : "很抱歉，您的留言暂未通过审核。",
        });
      }
    } catch (emailError) {
      console.error("发送留言回复通知失败:", emailError);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新留言状态失败:", error);
    return NextResponse.json({ success: false, error: "更新留言状态失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [existing] = await db.select().from(guestbookMessage).where(eq(guestbookMessage.id, id));
    if (!existing) {
      return NextResponse.json({ success: false, error: "留言不存在" }, { status: 404 });
    }

    await db.delete(guestbookMessage).where(eq(guestbookMessage.id, id));
    return NextResponse.json({ success: true, message: "留言已删除" });
  } catch (error) {
    console.error("删除留言失败:", error);
    return NextResponse.json({ success: false, error: "删除留言失败" }, { status: 500 });
  }
}
