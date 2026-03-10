import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { eq, desc, like, and, sql } from "drizzle-orm";

const fallbackBlogs = [
  {
    id: "fallback-blog-1",
    title: "欢迎访问我的技术博客",
    slug: "welcome",
    excerpt: "服务正在恢复中，稍后将展示完整博客内容。",
    coverImage: null,
    category: "公告",
    tags: ["公告"],
    status: "published",
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date(),
    publishedAt: new Date(),
  },
];

function toBlogListFallback(item: any) {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt || "",
    coverImage: item.coverImage || null,
    category: item.category || "未分类",
    tags: Array.isArray(item.tags) ? item.tags : [],
    status: item.status || "published",
    viewCount: Number(item.viewCount || 0),
    likeCount: Number(item.likeCount || 0),
    createdAt: item.createdAt || new Date(),
    publishedAt: item.publishedAt || item.createdAt || new Date(),
  };
}

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

    try {
      const response = await fetch("https://admin.fzvtbi.cn/api/blog?page=1&limit=100&status=published", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.data)) {
        const mapped = data.data.map(toBlogListFallback);
        return NextResponse.json({
          success: true,
          data: mapped,
          pagination: {
            page: 1,
            limit: mapped.length,
            total: mapped.length,
            totalPages: 1,
          },
          degraded: true,
        });
      }
    } catch {
      // ignore remote fallback failure
    }

    return NextResponse.json({
      success: true,
      data: fallbackBlogs,
      pagination: {
        page: 1,
        limit: fallbackBlogs.length,
        total: fallbackBlogs.length,
        totalPages: 1,
      },
      degraded: true,
    });
  }
}
