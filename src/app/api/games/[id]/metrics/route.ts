import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";
import { ensureGameTablesOnce } from "@/lib/games";

export const dynamic = "force-dynamic";

/**
 * 指标上报：type = view（浏览）。
 * 场景工程包导出与计数解耦：下载包仅返回场景参数 JSON，不再驱动任何统计
 * （统计口径已从“下载”改为“喜欢”，由 /like 开关维护）。
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureGameTablesOnce();

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const type = String(body.type || "");

    if (type !== "view" && type !== "download") {
      return NextResponse.json({ success: false, error: "无效的指标类型" }, { status: 400 });
    }

    const [work] = await db
      .select()
      .from(interactiveWork)
      .where(eq(interactiveWork.id, id))
      .limit(1);
    if (!work) {
      return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });
    }

    let viewCount = work.viewCount;
    if (type === "view") {
      const [updated] = await db
        .update(interactiveWork)
        .set({ viewCount: sql`${interactiveWork.viewCount} + 1` })
        .where(eq(interactiveWork.id, id))
        .returning({ viewCount: interactiveWork.viewCount });
      viewCount = updated.viewCount;
    }

    const payload: Record<string, unknown> = { viewCount };

    if (type === "download") {
      payload.package = {
        title: work.title,
        slug: work.slug,
        author: work.authorName,
        sceneType: work.sceneType,
        sceneConfig: work.sceneConfig,
        controlsHint: work.controlsHint,
        exportedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("更新互动作品指标失败:", error);
    return NextResponse.json({ success: false, error: "更新指标失败" }, { status: 500 });
  }
}
