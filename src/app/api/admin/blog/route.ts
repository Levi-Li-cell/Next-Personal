import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { extractImageUrlsFromHtml, htmlToMarkdown } from "@/lib/admin/markdown";
import { createPublicNotification } from "@/lib/notifications/public-notify";

function normalizeAudience(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

function normalizeCta(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category");
    const audience = searchParams.get("audience");
    const featured = searchParams.get("featured");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status !== "all") conditions.push(eq(blog.status, status));
    if (category) conditions.push(eq(blog.category, category));
    if (audience && audience !== "all") conditions.push(eq(blog.targetAudience, audience));
    if (featured === "true") conditions.push(eq(blog.featured, true));
    if (search) conditions.push(or(like(blog.title, `%${search}%`), like(blog.excerpt, `%${search}%`)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const blogs = await db.select().from(blog).where(whereClause).orderBy(desc(blog.featured), desc(blog.createdAt)).limit(limit).offset(offset);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(blog).where(whereClause);

    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count || 0),
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin blogs:", error);
    return NextResponse.json({ success: false, error: "获取博客列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contentHtml = String(body.content || "");
    const markdownContent = htmlToMarkdown(contentHtml);
    const imageLinks = [...new Set([...extractImageUrlsFromHtml(contentHtml), body.coverImage].filter(Boolean))];
    const category = body.category === "公告" ? "公告" : "生活";

    const [existingBlog] = await db.select().from(blog).where(eq(blog.slug, body.slug));
    if (existingBlog) {
      return NextResponse.json({ success: false, error: "URL Slug 已存在" }, { status: 400 });
    }

    const [newBlog] = await db
      .insert(blog)
      .values({
        id: randomUUID(),
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: markdownContent,
        coverImage: body.coverImage,
        imageLinks,
        category,
        targetAudience: normalizeAudience(body.targetAudience),
        ctaType: normalizeCta(body.ctaType),
        featured: Boolean(body.featured),
        tags: body.tags || [],
        status: body.status || "draft",
        authorId: body.authorId,
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning();

    if (newBlog.status === "published") {
      const isAnnouncement = newBlog.category === "公告";
      await createPublicNotification({
        eventType: isAnnouncement ? "announcement" : "blog_published",
        title: isAnnouncement ? `站点公告：${newBlog.title}` : `新博客上线：${newBlog.title}`,
        content: newBlog.excerpt || (isAnnouncement ? "点击查看公告详情" : "点击查看最新博客内容"),
        link: `/blog/${newBlog.slug}`,
      });
    }

    return NextResponse.json({ success: true, data: newBlog });
  } catch (error) {
    console.error("Failed to create admin blog:", error);
    return NextResponse.json({ success: false, error: "创建博客失败" }, { status: 500 });
  }
}
