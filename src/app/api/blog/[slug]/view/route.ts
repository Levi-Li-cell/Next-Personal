import { NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { eq } from "drizzle-orm";

export async function POST(
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

    // 增加阅读量
    await db.update(blog).set({
      viewCount: (blogPost.viewCount || 0) + 1,
    }).where(eq(blog.id, blogPost.id));

    return NextResponse.json({ success: true, viewCount: (blogPost.viewCount || 0) + 1 });
  } catch (error) {
    console.error("增加阅读量失败:", error);
    return NextResponse.json({ success: true, viewCount: 0, degraded: true });
  }
}
