import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
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
    const body = await request.json();
    const slug =
      body.slug?.trim() ||
      (body.title || "work")
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) ||
      nanoid(8);

    const [newWork] = await db
      .insert(interactiveWork)
      .values({
        id: nanoid(),
        slug,
        title: body.title,
        tagline: body.tagline || null,
        description: body.description || "",
        authorName: body.authorName || "李伟",
        authorLink: body.authorLink || null,
        tags: body.tags || [],
        coverImage: body.coverImage || null,
        coverGradient: body.coverGradient || null,
        sceneType: body.sceneType || "crystal-cluster",
        sceneConfig: body.sceneConfig || {},
        controlsHint: body.controlsHint || [],
        status: body.status || "draft",
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        ratingSum: 0,
        ratingCount: 0,
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newWork });
  } catch (error) {
    console.error("Failed to create admin game:", error);
    return NextResponse.json({ success: false, error: "创建游戏失败" }, { status: 500 });
  }
}
