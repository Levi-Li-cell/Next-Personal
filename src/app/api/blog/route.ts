import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";

const fallbackBlogs = [
  {
    id: "fallback-blog-1",
    title: "欢迎访问我的技术博客",
    slug: "welcome",
    excerpt: "服务正在恢复中，稍后将展示完整博客内容。",
    coverImage: null,
    category: "公告",
    targetAudience: "both",
    ctaType: "both",
    featured: true,
    tags: ["公告"],
    status: "published",
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date(),
    publishedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "published";
    const audience = searchParams.get("audience");
    const featured = searchParams.get("featured");

    const offset = (page - 1) * limit;

    const conditions = [];
    if (status !== "all") conditions.push(eq(blog.status, status));
    if (category) conditions.push(eq(blog.category, category));
    if (search) conditions.push(or(like(blog.title, `%${search}%`), like(blog.excerpt, `%${search}%`)));
    if (audience && audience !== "all") conditions.push(or(eq(blog.targetAudience, audience), eq(blog.targetAudience, "both")));
    if (featured === "true") conditions.push(eq(blog.featured, true));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const blogs = await db
      .select({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        coverImage: blog.coverImage,
        category: blog.category,
        targetAudience: blog.targetAudience,
        ctaType: blog.ctaType,
        featured: blog.featured,
        tags: blog.tags,
        status: blog.status,
        viewCount: blog.viewCount,
        likeCount: blog.likeCount,
        createdAt: blog.createdAt,
        publishedAt: blog.publishedAt,
      })
      .from(blog)
      .where(whereClause)
      .orderBy(desc(blog.featured), desc(blog.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(blog).where(whereClause);
    const categoriesResult = await db
      .selectDistinct({ category: blog.category })
      .from(blog)
      .where(status !== "all" ? eq(blog.status, status) : undefined)
      .orderBy(blog.category);

    return NextResponse.json({
      success: true,
      data: blogs,
      categories: categoriesResult.map((item) => item.category).filter(Boolean),
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count || 0),
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch blogs:", error);

    return NextResponse.json({
      success: true,
      data: fallbackBlogs,
      categories: ["公告"],
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
