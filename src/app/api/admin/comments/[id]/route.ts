import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogComment } from "@/db/schema/blog";
import { eq } from "drizzle-orm";

// PATCH /api/admin/comments/[id] - 更新评论状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // 验证状态值
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "无效的状态值" },
        { status: 400 }
      );
    }

    // 检查评论是否存在
    const [existingComment] = await db
      .select()
      .from(blogComment)
      .where(eq(blogComment.id, id));

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: "评论不存在" },
        { status: 404 }
      );
    }

    // 更新评论状态
    const [updatedComment] = await db
      .update(blogComment)
      .set({ status })
      .where(eq(blogComment.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedComment });
  } catch (error) {
    console.error("更新评论状态失败:", error);
    return NextResponse.json(
      { success: false, error: "更新评论状态失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/comments/[id] - 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查评论是否存在
    const [existingComment] = await db
      .select()
      .from(blogComment)
      .where(eq(blogComment.id, id));

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: "评论不存在" },
        { status: 404 }
      );
    }

    // 删除评论
    await db.delete(blogComment).where(eq(blogComment.id, id));

    return NextResponse.json({ success: true, message: "评论已删除" });
  } catch (error) {
    console.error("删除评论失败:", error);
    return NextResponse.json(
      { success: false, error: "删除评论失败" },
      { status: 500 }
    );
  }
}
