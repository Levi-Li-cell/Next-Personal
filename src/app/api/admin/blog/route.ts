import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { eq, desc, like, and, sql, or } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET /api/admin/blog - 获取博客列表（包含草稿）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category");

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
      conditions.push(
        or(
          like(blog.title, `%${search}%`),
          like(blog.excerpt, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询博客列表
    const blogs = await db
      .select()
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
        page: page - 1,
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

// POST /api/admin/blog - 创建博客
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      category,
      tags,
      status,
      authorId,
    } = body;

    // 检查 slug 是否已存在
    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.slug, slug));

    if (existingBlog) {
      return NextResponse.json(
        { success: false, error: "URL Slug 已存在" },
        { status: 400 }
      );
    }

    // 创建博客
    const [newBlog] = await db
      .insert(blog)
      .values({
        id: randomUUID(),
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category: category || "未分类",
        tags: tags || [],
        status: status || "draft",
        authorId,
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newBlog });
  } catch (error) {
    console.error("创建博客失败:", error);
    return NextResponse.json(
      { success: false, error: "创建博客失败" },
      { status: 500 }
    );
  }
}
