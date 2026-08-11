import { NextResponse } from "next/server";
import { db } from "@/db";
import { blog, blogComment } from "@/db/schema/blog";
import { eq, and, inArray, isNull, sql } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/get-session";
import { nanoid } from "nanoid";
import { sendAdminNotificationEmail } from "@/lib/admin/email";
import { createAdminNotification } from "@/lib/notifications/admin-notify";

async function ensureColumns() {
  await db.execute(sql`ALTER TABLE blog_comment ADD COLUMN IF NOT EXISTS guest_name text`);
  await db.execute(sql`ALTER TABLE blog_comment ALTER COLUMN user_id DROP NOT NULL`);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureColumns();
    // 获取博客文章
    const { slug } = await params;
    const blogPost = await db.query.blog.findFirst({
      where: eq(blog.slug, slug),
    });

    if (!blogPost) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const rootComments = await db.query.blogComment.findMany({
      where: and(
        eq(blogComment.blogId, blogPost.id),
        eq(blogComment.status, "approved"),
        isNull(blogComment.parentId)
      ),
      orderBy: (blogComment, { desc }) => [desc(blogComment.createdAt)],
    });

    if (rootComments.length === 0) {
      return NextResponse.json({ comments: [] });
    }

    const rootIds = rootComments.map((comment) => comment.id);
    const replies = await db.query.blogComment.findMany({
      where: and(
        eq(blogComment.blogId, blogPost.id),
        eq(blogComment.status, "approved"),
        inArray(blogComment.parentId, rootIds)
      ),
      orderBy: (blogComment, { asc }) => [asc(blogComment.createdAt)],
    });

    const comments = rootComments.map((comment) => ({
      ...comment,
      replies: replies.filter((reply) => reply.parentId === comment.id),
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("获取评论失败:", error);
    return NextResponse.json({ comments: [], degraded: true });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureColumns();
    const session = await getServerSession();

    const { content, parentId, guestName } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
    }

    // 获取博客文章
    const { slug } = await params;
    const blogPost = await db.query.blog.findFirst({
      where: eq(blog.slug, slug),
    });

    if (!blogPost) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 创建评论
    const comment = await db.insert(blogComment).values({
      id: nanoid(),
      blogId: blogPost.id,
      userId: session?.user?.id || null,
      guestName: !session?.user?.id ? (String(guestName || "").trim() || "匿名访客") : null,
      parentId: parentId || null,
      content: content.trim(),
      status: "approved",
    }).returning();

    try {
      await sendAdminNotificationEmail({
        eventType: parentId ? "comment_reply" : "blog_comment",
        userName: session?.user?.name || String(guestName || "").trim() || "匿名访客",
        userEmail: session?.user?.email || "comment@anonymous.local",
        content: content.trim(),
      });

      await createAdminNotification({
        eventType: parentId ? "comment_reply" : "blog_comment",
        title: parentId ? "评论区收到新回复" : "评论区收到新评论",
        content: content.trim(),
        link: `/blog/${slug}`,
        userName: session?.user?.name || String(guestName || "").trim() || "匿名访客",
        userEmail: session?.user?.email || "comment@anonymous.local",
      });
    } catch (emailError) {
      console.error("发送评论通知邮件失败:", emailError);
    }

    return NextResponse.json({ comment: comment[0] });
  } catch (error) {
    console.error("创建评论失败:", error);
    return NextResponse.json({ error: "创建评论失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { commentId } = await request.json();
    if (!commentId || typeof commentId !== "string") {
      return NextResponse.json({ error: "评论ID无效" }, { status: 400 });
    }

    const comment = await db.query.blogComment.findFirst({
      where: eq(blogComment.id, commentId),
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "只能删除自己的评论" }, { status: 403 });
    }

    await db.delete(blogComment).where(eq(blogComment.id, commentId));

    return NextResponse.json({ success: true, commentId });
  } catch (error) {
    console.error("删除评论失败:", error);
    return NextResponse.json({ error: "删除评论失败" }, { status: 500 });
  }
}
