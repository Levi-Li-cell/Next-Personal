import { NextResponse } from "next/server";
import { db } from "@/db";
import { blog, blogComment } from "@/db/schema/blog";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/get-session";
import { nanoid } from "nanoid";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 获取博客文章
    const { slug } = await params;
    const blogPost = await db.query.blog.findFirst({
      where: eq(blog.slug, slug),
    });

    if (!blogPost) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 获取评论列表，按创建时间倒序
    const comments = await db.query.blogComment.findMany({
      where: and(
        eq(blogComment.blogId, blogPost.id),
        eq(blogComment.status, "approved"),
        eq(blogComment.parentId, null)
      ),
      orderBy: (blogComment, { desc }) => [desc(blogComment.createdAt)],
      with: {
        replies: {
          orderBy: (blogComment, { asc }) => [asc(blogComment.createdAt)],
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("获取评论失败:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { content, parentId } = await request.json();

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
      userId: session.user.id,
      parentId: parentId || null,
      content: content.trim(),
      status: "approved", // 默认为已批准
    }).returning();

    return NextResponse.json({ comment: comment[0] });
  } catch (error) {
    console.error("创建评论失败:", error);
    return NextResponse.json({ error: "创建评论失败" }, { status: 500 });
  }
}