import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { blog, blogComment } from "@/db/schema/blog";
import { createPublicNotification } from "@/lib/notifications/public-notify";
import { deleteBlobUrls } from "@/lib/admin/blob";
import { extractImageUrlsFromHtml, htmlToMarkdown } from "@/lib/admin/markdown";

const fallbackBlogDetail = (slug: string) => ({
  id: "fallback-blog-1",
  title: "欢迎访问我的技术博客",
  slug,
  excerpt: "服务正在恢复中，稍后将展示完整博客内容。",
  content: "# 服务维护中\n\n当前数据库连接不可用，已自动切换为降级内容。",
  coverImage: null,
  category: "公告",
  targetAudience: "both",
  ctaType: "both",
  featured: true,
  tags: ["公告"],
  status: "published",
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date(),
  publishedAt: new Date(),
});

function normalizeAudience(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

function normalizeCta(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const blogPost = await db.select().from(blog).where(eq(blog.slug, slug)).limit(1);

    if (!blogPost[0]) {
      return NextResponse.json({ success: false, error: "博客不存在" }, { status: 404 });
    }

    const commentCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogComment)
      .where(and(eq(blogComment.blogId, blogPost[0].id), eq(blogComment.status, "approved")));

    return NextResponse.json({
      success: true,
      data: {
        ...blogPost[0],
        commentCount: Number(commentCountResult[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error("Failed to fetch blog detail:", error);
    const { slug } = await params;
    return NextResponse.json({ success: true, data: fallbackBlogDetail(slug), degraded: true });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const existing = await db.select().from(blog).where(eq(blog.slug, slug)).limit(1);
    if (!existing[0]) {
      return NextResponse.json({ success: false, error: "博客不存在" }, { status: 404 });
    }

    const contentHtml = String(body.content || "");
    const nextContent = htmlToMarkdown(contentHtml);
    const nextImageLinks = [...new Set([...extractImageUrlsFromHtml(contentHtml), body.coverImage].filter(Boolean))];
    const previousImageLinks = Array.isArray(existing[0].imageLinks) ? existing[0].imageLinks : [];
    const removedImageLinks = previousImageLinks.filter((url) => !nextImageLinks.includes(url));
    await deleteBlobUrls(removedImageLinks);

    const updated = await db
      .update(blog)
      .set({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: nextContent,
        coverImage: body.coverImage,
        imageLinks: nextImageLinks,
        category: body.category === "公告" ? "公告" : "生活",
        targetAudience: normalizeAudience(body.targetAudience),
        ctaType: normalizeCta(body.ctaType),
        featured: Boolean(body.featured),
        tags: body.tags || [],
        status: body.status,
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .where(eq(blog.id, existing[0].id))
      .returning();

    const previousStatus = existing[0].status;
    const current = updated[0];
    if (current?.status === "published" && previousStatus !== "published") {
      const isAnnouncement = current.category === "公告";
      await createPublicNotification({
        eventType: isAnnouncement ? "announcement" : "blog_published",
        title: isAnnouncement ? `站点公告：${current.title}` : `新博客上线：${current.title}`,
        content: current.excerpt || (isAnnouncement ? "点击查看公告详情" : "点击查看最新博客内容"),
        link: `/blog/${current.slug}`,
      });
    }

    return NextResponse.json({ success: true, data: current });
  } catch (error) {
    console.error("Failed to update blog:", error);
    return NextResponse.json({ success: false, error: "更新博客失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const existing = await db.select().from(blog).where(eq(blog.slug, slug)).limit(1);
    if (!existing[0]) {
      return NextResponse.json({ success: false, error: "博客不存在" }, { status: 404 });
    }

    const imageLinks = Array.isArray(existing[0].imageLinks) ? existing[0].imageLinks : [];
    await deleteBlobUrls(imageLinks);
    await db.delete(blog).where(eq(blog.id, existing[0].id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog:", error);
    return NextResponse.json({ success: false, error: "删除博客失败" }, { status: 500 });
  }
}
