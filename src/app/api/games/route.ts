import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";
import { ensureGamesSeededOnce, ensureGameTablesOnce, toWorkSummary } from "@/lib/games";

export const dynamic = "force-dynamic";

/** 互动作品瀑布流列表：支持 tag 过滤与 latest/popular/rating 排序 */
export async function GET(request: NextRequest) {
  try {
    await ensureGameTablesOnce();
    await ensureGamesSeededOnce();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 60);
    const tag = (searchParams.get("tag") || "").trim();
    const sort = searchParams.get("sort") || "latest";
    const offset = (page - 1) * limit;

    const conditions = [eq(interactiveWork.status, "published")];
    if (tag) {
      conditions.push(sql`${interactiveWork.tags} @> ${JSON.stringify([tag])}::jsonb`);
    }
    const whereClause = and(...conditions);

    const orderBy =
      sort === "popular"
        ? [desc(interactiveWork.viewCount)]
        : sort === "rating"
          ? [desc(sql`CASE WHEN ${interactiveWork.ratingCount} > 0 THEN ${interactiveWork.ratingSum}::numeric / ${interactiveWork.ratingCount} ELSE 0 END`), desc(interactiveWork.ratingCount)]
          : [desc(interactiveWork.publishedAt), desc(interactiveWork.createdAt)];

    const [works, countResult] = await Promise.all([
      db
        .select()
        .from(interactiveWork)
        .where(whereClause)
        .orderBy(...orderBy, asc(interactiveWork.slug))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(interactiveWork).where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    // 列表为公开数据且更新低频：放行 CDN/边缘缓存，命中后绕过整条数据库链路
    return NextResponse.json(
      {
        success: true,
        data: works.map(toWorkSummary),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("获取互动作品列表失败:", error);
    return NextResponse.json({ success: false, error: "获取互动作品列表失败" }, { status: 500 });
  }
}
