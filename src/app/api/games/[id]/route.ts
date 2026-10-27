import { NextRequest, NextResponse } from "next/server";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";
import { computeRatingSummary, ensureGamesSeededOnce, ensureGameTablesOnce, resolveVoterKey, toWorkDetail } from "@/lib/games";
import { getServerSession } from "@/lib/auth/get-session";

export const dynamic = "force-dynamic";

/** 作品详情：id 或 slug 均可；voter 用于回显当前访客的评分 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureGameTablesOnce();
    await ensureGamesSeededOnce();

    const { id } = await params;
    const [work] = await db
      .select()
      .from(interactiveWork)
      .where(or(eq(interactiveWork.id, id), eq(interactiveWork.slug, id)))
      .limit(1);

    if (!work || work.status !== "published") {
      return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });
    }

    const session = await getServerSession();
    const voter = (new URL(request.url).searchParams.get("voter") || "");
    const { voterKey } = resolveVoterKey(session?.user?.id, voter);

    const [rating] = await Promise.all([
      computeRatingSummary(work.id, voterKey),
      // 浏览量自增（详情打开即计一次）
      db
        .update(interactiveWork)
        .set({ viewCount: sql`${interactiveWork.viewCount} + 1` })
        .where(eq(interactiveWork.id, work.id)),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        work: toWorkDetail({ ...work, viewCount: work.viewCount + 1 }),
        stats: {
          viewCount: work.viewCount + 1,
          downloadCount: work.downloadCount,
          commentCount: work.commentCount,
          rating,
        },
      },
    });
  } catch (error) {
    console.error("获取互动作品详情失败:", error);
    return NextResponse.json({ success: false, error: "获取互动作品详情失败" }, { status: 500 });
  }
}
