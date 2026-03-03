import { NextResponse } from "next/server";
import { db } from "@/db";
import { blog, blogLike } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/get-session";
import { nanoid } from "nanoid";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 获取博客文章
    const { slug } = await params;
    const blogPost = await db.query.blog.findFirst({
      where: eq(blog.slug, slug),
    });

    if (!blogPost) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 检查是否已经点赞
    const existingLike = await db.query.blogLike.findFirst({
      where: and(
        eq(blogLike.blogId, blogPost.id),
        eq(blogLike.userId, session.user.id)
      ),
    });

    if (existingLike) {
      // 已点赞，取消点赞
      await db.delete(blogLike).where(eq(blogLike.id, existingLike.id));
      
      // 更新点赞数
      const likeCountResult = await db.select({ count: count() }).from(blogLike).where(eq(blogLike.blogId, blogPost.id));
      const likeCount = likeCountResult[0]?.count || 0;
      
      await db.update(blog).set({ likeCount }).where(eq(blog.id, blogPost.id));

      return NextResponse.json({ success: true, liked: false, likeCount });
    } else {
      // 未点赞，添加点赞
      await db.insert(blogLike).values({
        id: nanoid(),
        blogId: blogPost.id,
        userId: session.user.id,
      });
      
      // 更新点赞数
      const likeCountResult = await db.select({ count: count() }).from(blogLike).where(eq(blogLike.blogId, blogPost.id));
      const likeCount = likeCountResult[0]?.count || 0;
      
      await db.update(blog).set({ likeCount }).where(eq(blog.id, blogPost.id));

      return NextResponse.json({ success: true, liked: true, likeCount });
    }
  } catch (error) {
    console.error("点赞操作失败:", error);
    return NextResponse.json({ error: "点赞操作失败" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();

    // 获取博客文章
    const { slug } = await params;
    const blogPost = await db.query.blog.findFirst({
      where: eq(blog.slug, slug),
    });

    if (!blogPost) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 检查是否已经点赞
    let liked = false;
    if (session) {
      const existingLike = await db.query.blogLike.findFirst({
        where: and(
          eq(blogLike.blogId, blogPost.id),
          eq(blogLike.userId, session.user.id)
        ),
      });
      liked = !!existingLike;
    }

    return NextResponse.json({ success: true, liked, likeCount: blogPost.likeCount });
  } catch (error) {
    console.error("获取点赞状态失败:", error);
    return NextResponse.json({ error: "获取点赞状态失败" }, { status: 500 });
  }
}