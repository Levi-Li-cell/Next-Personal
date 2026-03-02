import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { eq, desc, like, and, sql } from "drizzle-orm";

// GET /api/blog - 获取博客列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "published";

    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    if (status !== "all") {
      conditions.push(eq(blog.status, status));
    }
    if (category) {
      conditions.push(eq(blog.category, category));
    }
    if (search) {
      conditions.push(like(blog.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询博客列表
    const blogs = await db
      .select({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        coverImage: blog.coverImage,
        category: blog.category,
        tags: blog.tags,
        status: blog.status,
        viewCount: blog.viewCount,
        likeCount: blog.likeCount,
        createdAt: blog.createdAt,
        publishedAt: blog.publishedAt,
      })
      .from(blog)
      .where(whereClause)
      .orderBy(desc(blog.createdAt))
      .limit(limit)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blog)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取博客列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取博客列表失败" },
      { status: 500 }
    );
  }
}
