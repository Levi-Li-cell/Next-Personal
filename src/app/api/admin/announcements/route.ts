import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { createPublicNotification } from "@/lib/notifications/public-notify";

const ANNOUNCEMENT_CATEGORY = "公告";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);
    const search = String(searchParams.get("search") || "").trim();
    const status = String(searchParams.get("status") || "all").trim();
    const offset = (page - 1) * limit;

    const conditions = [eq(blog.category, ANNOUNCEMENT_CATEGORY)];
    if (status !== "all") {
      conditions.push(eq(blog.status, status));
    }
    if (search) {
      conditions.push(like(blog.title, `%${search}%`));
    }
    const whereClause = and(...conditions);

    const rows = await db
      .select()
      .from(blog)
      .where(whereClause)
      .orderBy(desc(blog.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blog)
      .where(whereClause);

    const total = Number(totalResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取公告列表失败:", error);
    return NextResponse.json({ success: false, error: "获取公告列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const excerpt = String(body.excerpt || "").trim();
    const content = String(body.content || "").trim();
    const status = String(body.status || "draft").trim() || "draft";
    const authorId = String(body.authorId || "").trim();
    const coverImage = String(body.coverImage || "").trim() || null;

    if (!title || !content || !authorId) {
      return NextResponse.json({ success: false, error: "标题、内容和作者不能为空" }, { status: 400 });
    }

    let slug = normalizeSlug(String(body.slug || "").trim() || title);
    if (!slug) {
      slug = `announcement-${Date.now()}`;
    }

    const [existing] = await db.select({ id: blog.id }).from(blog).where(eq(blog.slug, slug));
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const [created] = await db
      .insert(blog)
      .values({
        id: randomUUID(),
        title,
        slug,
        excerpt,
        content,
        coverImage,
        imageLinks: coverImage ? [coverImage] : [],
        category: ANNOUNCEMENT_CATEGORY,
        tags: [ANNOUNCEMENT_CATEGORY],
        authorId,
        status,
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();

    if (created.status === "published") {
      await createPublicNotification({
        eventType: "announcement",
        title: `站点公告：${created.title}`,
        content: created.excerpt || "点击查看公告详情",
        link: `/blog/${created.slug}`,
      });
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("创建公告失败:", error);
    return NextResponse.json({ success: false, error: "创建公告失败" }, { status: 500 });
  }
}
