import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [work] = await db.select().from(interactiveWork).where(eq(interactiveWork.id, id)).limit(1);
    if (!work) {
      return NextResponse.json({ success: false, error: "游戏不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: work });
  } catch (error) {
    console.error("Failed to fetch admin game:", error);
    return NextResponse.json({ success: false, error: "获取游戏详情失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.authorName !== undefined) updateData.authorName = body.authorName;
    if (body.authorLink !== undefined) updateData.authorLink = body.authorLink;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.coverGradient !== undefined) updateData.coverGradient = body.coverGradient;
    if (body.sceneType !== undefined) updateData.sceneType = body.sceneType;
    if (body.sceneConfig !== undefined) updateData.sceneConfig = body.sceneConfig;
    if (body.controlsHint !== undefined) updateData.controlsHint = body.controlsHint;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "published") {
        updateData.publishedAt = new Date();
      }
    }

    const [updated] = await db
      .update(interactiveWork)
      .set(updateData)
      .where(eq(interactiveWork.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "游戏不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update admin game:", error);
    return NextResponse.json({ success: false, error: "更新游戏失败" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 外键 ON DELETE CASCADE 会自动删除关联的评分、评论、评论点赞
    const { id } = await params;
    const [deleted] = await db.delete(interactiveWork).where(eq(interactiveWork.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "游戏不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete admin game:", error);
    return NextResponse.json({ success: false, error: "删除游戏失败" }, { status: 500 });
  }
}
