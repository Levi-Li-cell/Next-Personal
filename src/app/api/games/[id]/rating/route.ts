import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveRating, interactiveWork } from "@/db/schema/game";
import { computeRatingSummary, ensureGameTablesOnce, resolveVoterKey } from "@/lib/games";
import { getServerSession } from "@/lib/auth/get-session";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

/**
 * 提交评分（1-5 星）：同一 voterKey 仅一条记录，重复提交视为改分。
 * 以 interactive_rating 明细为准重算分布，并同步作品表的反范式 ratingSum/ratingCount。
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureGameTablesOnce();

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const score = Math.round(Number(body.score));

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ success: false, error: "评分必须为 1-5 的整数" }, { status: 400 });
    }

    const [work] = await db.select().from(interactiveWork).where(eq(interactiveWork.id, id)).limit(1);
    if (!work || work.status !== "published") {
      return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });
    }

    const session = await getServerSession();
    const { voterKey, userId } = resolveVoterKey(session?.user?.id, body.voterKey);

    const [existing] = await db
      .select()
      .from(interactiveRating)
      .where(and(eq(interactiveRating.workId, id), eq(interactiveRating.voterKey, voterKey)))
      .limit(1);

    if (existing) {
      await db.update(interactiveRating).set({ score }).where(eq(interactiveRating.id, existing.id));
      if (existing.score !== score) {
        await db
          .update(interactiveWork)
          .set({ ratingSum: sql`${interactiveWork.ratingSum} - ${existing.score} + ${score}` })
          .where(eq(interactiveWork.id, id));
      }
    } else {
      await db.insert(interactiveRating).values({ id: nanoid(), workId: id, voterKey, userId, score });
      await db
        .update(interactiveWork)
        .set({
          ratingSum: sql`${interactiveWork.ratingSum} + ${score}`,
          ratingCount: sql`${interactiveWork.ratingCount} + 1`,
        })
        .where(eq(interactiveWork.id, id));
    }

    // 以明细表为准返回最新统计（避免并发下反范式字段漂移）
    const rating = await computeRatingSummary(id, voterKey);

    return NextResponse.json({
      success: true,
      data: {
        rating,
        commentCount: work.commentCount,
      },
    });
  } catch (error) {
    console.error("提交评分失败:", error);
    return NextResponse.json({ success: false, error: "提交评分失败" }, { status: 500 });
  }
}
