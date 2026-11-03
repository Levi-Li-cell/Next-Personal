import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";
import { requireGameAdmin } from "@/lib/admin/game-auth";
import { gameInputSchema } from "@/lib/game-input";
import { isUploadedGameHtmlUrl } from "@/lib/game-assets";
import { ensureGameTablesOnce } from "@/lib/games";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireGameAdmin();
    if (denied) return denied;
    await ensureGameTablesOnce();
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
    const denied = await requireGameAdmin();
    if (denied) return denied;
    await ensureGameTablesOnce();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "请求格式不正确" }, { status: 400 });
    }
    const [existing] = await db.select().from(interactiveWork).where(eq(interactiveWork.id, id)).limit(1);
    if (!existing) return NextResponse.json({ success: false, error: "游戏不存在" }, { status: 404 });
    for (const key of Object.keys(gameInputSchema.shape) as Array<keyof typeof gameInputSchema.shape>) {
      if (body[key] === undefined) continue;
      const validation = gameInputSchema.shape[key].safeParse(body[key]);
      if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
      }
      body[key] = validation.data;
    }
    const sceneType = body.sceneType ?? existing.sceneType;
    const sceneConfig = body.sceneConfig ?? existing.sceneConfig;
    if (sceneType === "html-game" && !isUploadedGameHtmlUrl(sceneConfig?.htmlUrl)) {
      return NextResponse.json({ success: false, error: "请先上传 HTML 游戏文件" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined && body.slug !== existing.slug) {
      // Slug 变更时做唯一性校验（排除自身），避免与其它作品冲突
      const [conflict] = await db
        .select({ id: interactiveWork.id })
        .from(interactiveWork)
        .where(eq(interactiveWork.slug, body.slug))
        .limit(1);
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ success: false, error: "URL Slug 已存在，请更换后重试" }, { status: 400 });
      }
      updateData.slug = body.slug;
    }
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
    if (body.createdAt) updateData.createdAt = new Date(body.createdAt);
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // 仅在 草稿 → 发布 的转变时刷新发布时间；编辑已发布作品或转草稿都不改写历史发布时间
      if (body.status === "published" && existing.status !== "published") {
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
    const denied = await requireGameAdmin();
    if (denied) return denied;
    await ensureGameTablesOnce();
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
