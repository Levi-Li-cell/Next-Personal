import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";
import { nanoid } from "nanoid";
import { requireGameAdmin } from "@/lib/admin/game-auth";
import { gameInputSchema } from "@/lib/game-input";
import { ensureGameTablesOnce } from "@/lib/games";

/** postgres 23505 = unique_violation；drizzle 可能包装为 DrizzleQueryError（原错误在 cause 里） */
function isUniqueViolation(error: unknown): boolean {
  const candidates = [error, (error as { cause?: unknown } | null)?.cause];
  return candidates.some((candidate) => (candidate as { code?: string } | null)?.code === "23505");
}

function normalizeSlug(value: unknown, title: string) {
  const source = typeof value === "string" && value.trim() ? value : title;
  return source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const denied = await requireGameAdmin();
    if (denied) return denied;
    await ensureGameTablesOnce();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "all";
    const sceneType = searchParams.get("sceneType") || "all";
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status !== "all") conditions.push(eq(interactiveWork.status, status));
    if (sceneType !== "all") conditions.push(eq(interactiveWork.sceneType, sceneType));
    if (search)
      conditions.push(
        or(
          like(interactiveWork.title, `%${search}%`),
          like(interactiveWork.tagline ?? "", `%${search}%`),
          like(interactiveWork.description, `%${search}%`),
        ),
      );

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [games, countResult] = await Promise.all([
      db
        .select()
        .from(interactiveWork)
        .where(whereClause)
        .orderBy(desc(interactiveWork.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(interactiveWork).where(whereClause),
    ]);

    return NextResponse.json({
      success: true,
      data: games,
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count || 0),
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin games:", error);
    return NextResponse.json({ success: false, error: "获取游戏列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireGameAdmin();
    if (denied) return denied;
    await ensureGameTablesOnce();
    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ success: false, error: "请求格式不正确" }, { status: 400 });
    }
    const parsed = gameInputSchema.safeParse({ ...raw, slug: normalizeSlug(raw.slug, typeof raw.title === "string" ? raw.title : "") || `game-${nanoid(8).replace(/[^a-z0-9]/gi, "").toLowerCase()}` });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const body = parsed.data;
    const { title, description, slug, sceneType, sceneConfig, status } = body;

    const [existingWork] = await db.select({ id: interactiveWork.id }).from(interactiveWork).where(eq(interactiveWork.slug, slug)).limit(1);
    if (existingWork) {
      return NextResponse.json({ success: false, error: "URL Slug 已存在，请更换后重试" }, { status: 400 });
    }

    try {
      const [newWork] = await db
        .insert(interactiveWork)
        .values({
          id: nanoid(),
          slug,
          title,
          tagline: typeof body.tagline === "string" && body.tagline.trim() ? body.tagline.trim() : null,
          description,
          authorName: typeof body.authorName === "string" && body.authorName.trim() ? body.authorName.trim() : "李伟",
          authorLink: typeof body.authorLink === "string" && body.authorLink.trim() ? body.authorLink.trim() : null,
          tags: body.tags,
          coverImage: typeof body.coverImage === "string" && body.coverImage.trim() ? body.coverImage.trim() : null,
          coverGradient: typeof body.coverGradient === "string" && body.coverGradient.trim() ? body.coverGradient.trim() : null,
          sceneType,
          sceneConfig,
          controlsHint: body.controlsHint,
          status,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          ratingSum: 0,
          ratingCount: 0,
          publishedAt: status === "published" ? new Date() : null,
        })
        .returning();

      return NextResponse.json({ success: true, data: newWork });
    } catch (error) {
      // 并发创建同 slug 时，预检查与插入之间存在竞态，由唯一约束兜底并转为友好 400
      if (isUniqueViolation(error)) {
        return NextResponse.json({ success: false, error: "URL Slug 已存在，请更换后重试" }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to create admin game:", error);
    return NextResponse.json({ success: false, error: "创建游戏失败" }, { status: 500 });
  }
}

/**
 * 批量调整发布状态：{ ids: string[], status: "draft" | "published" }
 * 仅在 draft → published 的转变时刷新发布时间，避免重复发布覆盖历史 publishedAt。
 */
export async function PATCH(request: NextRequest) {
  try {
    const denied = await requireGameAdmin();
    if (denied) return denied;
    await ensureGameTablesOnce();
    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ success: false, error: "请求格式不正确" }, { status: 400 });
    }
    const ids = Array.isArray(raw.ids) ? raw.ids.map((value: unknown) => String(value).trim()).filter(Boolean) : [];
    const status = raw.status === "published" ? "published" : raw.status === "draft" ? "draft" : null;
    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: "请先选择要操作的游戏" }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ success: false, error: "发布状态不正确" }, { status: 400 });
    }

    const updated = await db
      .update(interactiveWork)
      .set({
        status,
        publishedAt:
          status === "published"
            ? sql`CASE WHEN ${interactiveWork.status} <> 'published' THEN now() ELSE ${interactiveWork.publishedAt} END`
            : sql`${interactiveWork.publishedAt}`,
      })
      .where(inArray(interactiveWork.id, ids))
      .returning({ id: interactiveWork.id });

    return NextResponse.json({ success: true, data: { count: updated.length } });
  } catch (error) {
    console.error("Failed to batch update game status:", error);
    return NextResponse.json({ success: false, error: "批量更新发布状态失败" }, { status: 500 });
  }
}
