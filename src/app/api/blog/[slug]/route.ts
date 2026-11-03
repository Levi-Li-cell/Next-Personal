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

function normalizeCategory(value: string | undefined) {
  return value === "公告" || value === "技术" ? value : "生活";
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

    // 内容未随请求提供时（如仅编辑时间），跳过 markdown 转换与图片清理，保留原内容
    const contentProvided = body.content !== undefined;
    const contentHtml = contentProvided ? String(body.content || "") : "";
    const previousImageLinks = Array.isArray(existing[0].imageLinks) ? existing[0].imageLinks : [];
    const nextContent = contentProvided ? htmlToMarkdown(contentHtml) : existing[0].content;
    const nextImageLinks = contentProvided
      ? [...new Set([...extractImageUrlsFromHtml(contentHtml), body.coverImage].filter(Boolean))]
      : previousImageLinks;
    if (contentProvided) {
      const removedImageLinks = previousImageLinks.filter((url) => !nextImageLinks.includes(url));
      await deleteBlobUrls(removedImageLinks);
    }

    const updated = await db
      .update(blog)
      .set({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: nextContent,
        coverImage: body.coverImage,
        imageLinks: nextImageLinks,
        category: body.category !== undefined ? normalizeCategory(body.category) : undefined,
        targetAudience: body.targetAudience !== undefined ? normalizeAudience(body.targetAudience) : undefined,
        ctaType: body.ctaType !== undefined ? normalizeCta(body.ctaType) : undefined,
        featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
        tags: body.tags !== undefined ? body.tags || [] : undefined,
        status: body.status,
        createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
        // 显式传入的发布时间优先；未传时仅状态变化才刷新（草稿转发布盖章 now，取消发布清空）
        publishedAt:
          body.publishedAt !== undefined
            ? body.publishedAt
              ? new Date(body.publishedAt)
              : null
            : body.status !== undefined
              ? body.status === "published"
                ? new Date()
                : null
              : existing[0].publishedAt,
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
